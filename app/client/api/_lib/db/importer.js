import ExcelJS from 'exceljs';
import db from './index.js';

const STATE_MAP = {
  'a.p': 'Andhra Pradesh',
  'a.p.': 'Andhra Pradesh',
  'h.p': 'Himachal Pradesh',
  'himachal pradesh': 'Himachal Pradesh',
  telangana: 'Telangana',
  chennai: 'Chennai',
  bangalore: 'Bangalore',
  chandigarh: 'Chandigarh',
  karnataka: 'Karnataka',
  maharashtra: 'Maharashtra',
  gujarat: 'Gujarat',
  delhi: 'Delhi',
};

function normalizeState(raw) {
  if (raw == null) return { value: null, ok: true };
  const s = String(raw).trim();
  if (!s) return { value: null, ok: true };
  const key = s.toLowerCase();
  if (STATE_MAP[key]) return { value: STATE_MAP[key], ok: true };
  // Not a recognizable state name (e.g. stray numbers) -> flag for review, keep raw value visible
  if (!/[a-zA-Z]/.test(s)) return { value: s, ok: false };
  return { value: s, ok: true };
}

// Source files mix "M-D-YYYY" (dash) and ambiguous D/M or M/D (slash) strings
// alongside native Excel date objects. Disambiguate using whichever component is >12.
function buildDateFromParts(aStr, bStr, yStr, kind) {
  const a = parseInt(aStr, 10);
  const b = parseInt(bStr, 10);
  const y = parseInt(yStr, 10);
  let day, month;
  if (kind === 'dash') {
    // dash strings observed as M-D-YYYY, e.g. "1-18-2024"
    if (a <= 12 && b > 12) { month = a; day = b; }
    else if (b <= 12 && a > 12) { month = b; day = a; }
    else { month = a; day = b; } // both <=12: default to M-D-Y
  } else {
    // slash strings observed as D/M/YYYY, e.g. "25/1/2024", but some are M/D/YYYY
    if (a > 12 && b <= 12) { day = a; month = b; }
    else if (b > 12 && a <= 12) { month = a; day = b; }
    else { day = a; month = b; } // both <=12: default to D/M/Y (India convention)
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { iso: `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`, year: y };
}

function normalizeDate(raw) {
  if (raw == null) return { value: null, year: null };

  if (raw instanceof Date) {
    return { value: raw.toISOString().slice(0, 10), year: raw.getFullYear() };
  }

  const s = String(raw).trim();
  let m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (m) {
    const parsed = buildDateFromParts(m[1], m[2], m[3], 'dash');
    return parsed ? { value: parsed.iso, year: parsed.year } : { value: null, year: null };
  }
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const parsed = buildDateFromParts(m[1], m[2], m[3], 'slash');
    return parsed ? { value: parsed.iso, year: parsed.year } : { value: null, year: null };
  }

  const fallback = new Date(s);
  if (Number.isNaN(fallback.getTime())) return { value: null, year: null };
  return { value: fallback.toISOString().slice(0, 10), year: fallback.getFullYear() };
}

function normalizePoNo(raw) {
  if (raw == null) return '';
  return String(raw).trim();
}

function parseWorkbookRows(workbook) {
  const sheet = workbook.worksheets[0];
  const rows = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // header
    const values = row.values; // 1-indexed, values[0] is empty
    const isBlank = values.slice(1, 12).every((v) => v == null || v === '');
    if (isBlank) return;
    rows.push({
      date: values[1],
      invoiceNo: values[2],
      companyName: values[3],
      poNo: values[4],
      state: values[5],
      hsnSac: values[6],
      partNo: values[7],
      description: values[8],
      price: values[9],
      qty: values[10],
      totalAmount: values[11],
    });
  });
  return rows;
}

/**
 * Imports a sales workbook (as a Buffer) into the database.
 * @param {Buffer} buffer
 * @param {{ filename: string, yearLabel?: string }} options
 */
export async function importWorkbook(buffer, { filename, yearLabel }) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const rows = parseWorkbookRows(workbook);

  const expectedYear = yearLabel && /^\d{4}$/.test(yearLabel) ? Number(yearLabel) : null;

  const companiesBefore = (await db.prepare(`SELECT COUNT(*) c FROM company`).get()).c;
  const productsBefore = (await db.prepare(`SELECT COUNT(*) c FROM product`).get()).c;

  const insertBatch = db.prepare(
    `INSERT INTO import_batch (filename, year_label, row_count) VALUES (?, ?, ?) RETURNING id`
  );
  const batchInfo = await insertBatch.run(filename, yearLabel || null, rows.length);
  const batchId = batchInfo.lastInsertRowid;

  const insertCompany = db.prepare(
    `INSERT INTO company (name, state) VALUES (?, ?) ON CONFLICT (name) DO NOTHING`
  );
  const getCompanyId = db.prepare(`SELECT id FROM company WHERE name = ?`);
  const insertProduct = db.prepare(
    `INSERT INTO product (part_no, hsn_sac, description, default_price) VALUES (?, ?, ?, ?)
     ON CONFLICT (part_no) DO UPDATE SET description = excluded.description, hsn_sac = excluded.hsn_sac`
  );
  // Matches on the full row content (not just invoice_no+part_no) because a meaningful
  // share of rows are missing invoice_no, and matching on invoice_no alone let those
  // slip through as "new" on every re-upload, silently double-counting revenue.
  const findDuplicate = db.prepare(
    `SELECT 1 FROM sales_record
     WHERE COALESCE(invoice_no,'') = ? AND COALESCE(company_name,'') = ? AND COALESCE(sale_date::text,'') = ?
       AND COALESCE(part_no,'') = ? AND COALESCE(qty,0) = ? AND COALESCE(price,0) = ? AND COALESCE(total_amount,0) = ?
     LIMIT 1`
  );
  const insertSale = db.prepare(`
    INSERT INTO sales_record
      (sale_date, invoice_no, company_name, company_id, po_no, state, hsn_sac, part_no, product_description, price, qty, total_amount, needs_review, review_reason, import_batch_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let importedCount = 0;
  let skippedDuplicateCount = 0;
  let flaggedCount = 0;

  await db.transaction(async () => {
    for (const r of rows) {
      const reasons = [];

      const dateRes = normalizeDate(r.date);
      if (!dateRes.value) reasons.push('unparseable date');
      else if (expectedYear && dateRes.year !== expectedYear) {
        reasons.push(`date year ${dateRes.year} does not match declared year ${expectedYear}`);
      }

      const stateRes = normalizeState(r.state);
      if (!stateRes.ok) reasons.push('unrecognized state value');

      const companyName = r.companyName ? String(r.companyName).trim() : null;
      if (!companyName) reasons.push('missing company name');

      const partNo = r.partNo ? String(r.partNo).trim() : null;
      const description = r.description ? String(r.description).trim() : null;
      if (!partNo || !description) reasons.push('missing product info');

      const price = typeof r.price === 'number' ? r.price : Number(r.price);
      const qty = typeof r.qty === 'number' ? r.qty : Number(r.qty);
      const totalAmount = typeof r.totalAmount === 'number' ? r.totalAmount : Number(r.totalAmount);
      if (Number.isNaN(totalAmount)) reasons.push('missing/invalid total amount');

      const invoiceNo = r.invoiceNo != null ? String(r.invoiceNo) : null;

      // Only skip the dedup check when there's nothing distinctive enough to match on
      // (would otherwise treat every barely-populated row as a duplicate of every other).
      const hasEnoughToDedupe = (invoiceNo || partNo) && companyName;
      if (hasEnoughToDedupe) {
        const dup = await findDuplicate.get(
          invoiceNo || '',
          companyName || '',
          dateRes.value || '',
          partNo || '',
          Number.isNaN(qty) ? 0 : qty,
          Number.isNaN(price) ? 0 : price,
          Number.isNaN(totalAmount) ? 0 : totalAmount
        );
        if (dup) {
          skippedDuplicateCount += 1;
          continue;
        }
      }

      let companyId = null;
      if (companyName) {
        await insertCompany.run(companyName, stateRes.value);
        companyId = (await getCompanyId.get(companyName)).id;
      }

      if (partNo && description && !Number.isNaN(price)) {
        await insertProduct.run(partNo, r.hsnSac != null ? String(r.hsnSac) : null, description, price);
      }

      const needsReview = reasons.length > 0 ? 1 : 0;
      if (needsReview) flaggedCount += 1;

      await insertSale.run(
        dateRes.value,
        invoiceNo,
        companyName,
        companyId,
        normalizePoNo(r.poNo),
        stateRes.value,
        r.hsnSac != null ? String(r.hsnSac) : null,
        partNo,
        description,
        Number.isNaN(price) ? null : price,
        Number.isNaN(qty) ? null : qty,
        Number.isNaN(totalAmount) ? null : totalAmount,
        needsReview,
        reasons.join('; ') || null,
        batchId
      );
      importedCount += 1;
    }
  });

  const companiesAdded = (await db.prepare(`SELECT COUNT(*) c FROM company`).get()).c - companiesBefore;
  const productsAdded = (await db.prepare(`SELECT COUNT(*) c FROM product`).get()).c - productsBefore;

  await db.prepare(
    `UPDATE import_batch SET imported_count = ?, skipped_duplicate_count = ?, flagged_count = ?, companies_added = ?, products_added = ? WHERE id = ?`
  ).run(importedCount, skippedDuplicateCount, flaggedCount, companiesAdded, productsAdded, batchId);

  return {
    batchId,
    rowCount: rows.length,
    importedCount,
    skippedDuplicateCount,
    flaggedCount,
    companiesAdded,
    productsAdded,
  };
}
