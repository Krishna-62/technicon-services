import { Router } from 'express';
import multer from 'multer';
import ExcelJS from 'exceljs';
import db from '../db/index.js';
import { parseProductWorkbook, validateProductRows, MissingColumnError, TooManyRowsError } from '../db/productImporter.js';

const router = Router();

// A plain 3-column catalogue file needs far less headroom than the 25MB sales-record import cap.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function handleUpload(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'The file is too large (max 5MB).' });
      return res.status(400).json({ error: 'Could not read the uploaded file. Please try again.' });
    }
    if (err) return res.status(400).json({ error: 'Could not read the uploaded file. Please try again.' });
    next();
  });
}

router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    let rows;
    if (q) {
      rows = await db
        .prepare(`SELECT * FROM product WHERE description ILIKE ? OR part_no ILIKE ? ORDER BY description`)
        .all(`%${q}%`, `%${q}%`);
    } else {
      rows = await db.prepare(`SELECT * FROM product ORDER BY description`).all();
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Registered before /:id so the literal path "intelligence-summary" can never be swallowed by the
// dynamic :id segment (Express matches routes in registration order).
router.get('/intelligence-summary', async (req, res) => {
  try {
    const products = await getAllProductIntelligence();
    const withSales = products.filter((p) => p.orderCount > 0);
    let topRevenueProduct = null;
    let topUnitsProduct = null;
    for (const p of withSales) {
      if (!topRevenueProduct || p.revenue > topRevenueProduct.revenue) {
        topRevenueProduct = { part_no: p.part_no, description: p.description, revenue: p.revenue };
      }
      if (!topUnitsProduct || p.unitsSold > topUnitsProduct.unitsSold) {
        topUnitsProduct = { part_no: p.part_no, description: p.description, unitsSold: p.unitsSold };
      }
    }
    res.json({
      products,
      summary: {
        totalProducts: products.length,
        productsWithSales: withSales.length,
        topRevenueProduct,
        topUnitsProduct,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Registered before /:id, same reason as /intelligence-summary above.
router.get('/import/template', async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Products');
    sheet.columns = [
      { header: 'Product Name', key: 'productName', width: 32 },
      { header: 'Part No', key: 'partNo', width: 18 },
      { header: 'Price', key: 'price', width: 14 },
    ];
    sheet.addRow({ productName: 'Sample Product - replace or delete this row', partNo: 'SAMPLE-001', price: 100 });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="product-import-template.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Parses + validates + classifies (new vs. update) but writes nothing to the database.
router.post('/import/preview', handleUpload, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  let rawRows;
  try {
    rawRows = await parseProductWorkbook(req.file.buffer);
  } catch (err) {
    if (err instanceof MissingColumnError || err instanceof TooManyRowsError) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(400).json({ error: 'Could not read the file. Please make sure it is a valid Excel workbook.' });
  }

  const { validRows, errorRows } = validateProductRows(rawRows);

  try {
    const partNos = validRows.map((r) => r.partNo);
    const existing = partNos.length
      ? await db.prepare(`SELECT part_no, description, default_price FROM product WHERE part_no = ANY(?)`).all(partNos)
      : [];
    const existingByPartNo = new Map(existing.map((r) => [r.part_no, r]));

    const newRows = [];
    const updateRows = [];
    for (const r of validRows) {
      const current = existingByPartNo.get(r.partNo);
      if (current) {
        updateRows.push({
          rowNumber: r.rowNumber,
          productName: r.productName,
          partNo: r.partNo,
          currentPrice: Number(current.default_price),
          newPrice: r.price,
        });
      } else {
        newRows.push({ rowNumber: r.rowNumber, productName: r.productName, partNo: r.partNo, price: r.price });
      }
    }

    res.json({
      summary: {
        totalRows: rawRows.length,
        newCount: newRows.length,
        updateCount: updateRows.length,
        errorCount: errorRows.length,
      },
      newRows,
      updateRows,
      errorRows,
      validRows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Commit: takes the validRows echoed back from the preview response as JSON (the file itself is
// never persisted or re-uploaded) and fully re-validates from scratch — the preview snapshot is
// never trusted, since the database could have changed in between.
router.post('/import', async (req, res) => {
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : null;
  if (!rows || rows.length === 0) return res.status(400).json({ error: 'No rows to import.' });
  if (rows.length > 2000) return res.status(400).json({ error: 'Too many rows to import at once.' });

  const rawRows = rows.map((r, i) => ({
    rowNumber: r.rowNumber ?? i + 1,
    productName: r.productName,
    partNo: r.partNo,
    price: r.price,
  }));
  const { validRows, errorRows } = validateProductRows(rawRows);
  if (errorRows.length > 0) {
    return res.status(400).json({ error: 'Some rows are invalid. No changes were made.', errorRows });
  }

  try {
    const partNoArr = validRows.map((r) => r.partNo);
    const nameArr = validRows.map((r) => r.productName);
    const priceArr = validRows.map((r) => r.price);

    const result = await db.transaction(async () => {
      return db
        .prepare(
          `INSERT INTO product (part_no, description, default_price)
           SELECT * FROM UNNEST(?::text[], ?::text[], ?::float8[])
           ON CONFLICT (part_no) DO UPDATE SET description = excluded.description, default_price = excluded.default_price
           RETURNING part_no, (xmax = 0) AS inserted`
        )
        .all(partNoArr, nameArr, priceArr);
    });

    const created = result.filter((r) => r.inserted).length;
    const updated = result.length - created;
    res.status(200).json({ created, updated, errors: 0 });
  } catch (err) {
    res.status(500).json({ error: 'Unable to import products. No changes were made. Please try again.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const row = await db.prepare(`SELECT * FROM product WHERE id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Product not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// A trend is only reported as "growing"/"declining" beyond this relative change — smaller swings
// are reported as "stable" rather than implying a signal the data doesn't clearly support. Same
// calendar 6-month-vs-prior-6-month convention as Growth Opportunities (Step 6.3), so the two
// features can never disagree about what "recent" means.
const TREND_STABLE_THRESHOLD = 0.1;

// Bulk version of the /:id/intelligence calculation below, for the Product Intelligence report
// (Updating Step 5) — a few aggregated queries (GROUP BY part_no) instead of one request per
// product, avoiding N+1. Same formulas, same thresholds, same part_no join convention — hoisted
// function declaration, called by the route above (registered earlier in this file).
export async function getAllProductIntelligence() {
  const allProducts = await db.prepare(`SELECT id, part_no, description FROM product ORDER BY description`).all();

  const salesRows = await db
    .prepare(
      `SELECT part_no,
              COUNT(*) AS order_count,
              COALESCE(SUM(total_amount), 0) AS revenue,
              COALESCE(SUM(qty), 0) AS units_sold,
              COUNT(DISTINCT company_name) AS customers,
              MIN(sale_date) AS first_sale_date,
              MAX(sale_date) AS last_sale_date
       FROM sales_record
       WHERE needs_review = 0 AND part_no IS NOT NULL
       GROUP BY part_no`
    )
    .all();
  const salesByPart = new Map(salesRows.map((r) => [r.part_no, r]));

  const trendRows = await db
    .prepare(
      `SELECT part_no,
              SUM(CASE WHEN sale_date >= CURRENT_DATE - INTERVAL '6 months' THEN total_amount ELSE 0 END) AS recent_revenue,
              SUM(CASE WHEN sale_date >= CURRENT_DATE - INTERVAL '12 months' AND sale_date < CURRENT_DATE - INTERVAL '6 months' THEN total_amount ELSE 0 END) AS prior_revenue
       FROM sales_record
       WHERE needs_review = 0 AND part_no IS NOT NULL
       GROUP BY part_no`
    )
    .all();
  const trendByPart = new Map(trendRows.map((r) => [r.part_no, r]));

  // Same OR(product_id, part_no) matching as the single-product endpoint, done once for every
  // product via a LEFT JOIN instead of one query per product.
  const quotedRows = await db
    .prepare(
      `SELECT p.id AS product_id,
              COUNT(qi.id) AS quoted_line_count,
              COALESCE(SUM(qi.qty), 0) AS quoted_qty,
              COUNT(DISTINCT qi.quotation_id) AS quotation_count
       FROM product p
       LEFT JOIN quotation_item qi ON qi.product_id = p.id OR qi.part_no = p.part_no
       GROUP BY p.id`
    )
    .all();
  const quotedByProductId = new Map(quotedRows.map((r) => [r.product_id, r]));

  return allProducts.map((product) => {
    const sales = salesByPart.get(product.part_no);
    const orderCount = sales ? Number(sales.order_count) : 0;
    const revenue = sales ? Number(sales.revenue) : 0;
    const unitsSold = sales ? Number(sales.units_sold) : 0;

    const trend = trendByPart.get(product.part_no);
    const recentRevenue = trend ? Number(trend.recent_revenue) || 0 : 0;
    const priorRevenue = trend ? Number(trend.prior_revenue) || 0 : 0;
    let trendDirection = 'no_data';
    let pctChange = null;
    if (priorRevenue > 0) {
      pctChange = (recentRevenue - priorRevenue) / priorRevenue;
      trendDirection = Math.abs(pctChange) < TREND_STABLE_THRESHOLD ? 'stable' : pctChange > 0 ? 'growing' : 'declining';
    }

    const quoted = quotedByProductId.get(product.id);

    return {
      id: product.id,
      part_no: product.part_no,
      description: product.description,
      revenue,
      unitsSold,
      customers: sales ? Number(sales.customers) : 0,
      avgSellingPrice: unitsSold > 0 ? revenue / unitsSold : 0,
      orderCount,
      firstSaleDate: sales ? sales.first_sale_date : null,
      lastSaleDate: sales ? sales.last_sale_date : null,
      trendDirection,
      pctChange,
      quotedLineCount: quoted ? Number(quoted.quoted_line_count) : 0,
      quotedQty: quoted ? Number(quoted.quoted_qty) : 0,
      quotationCount: quoted ? Number(quoted.quotation_count) : 0,
    };
  });
}

router.get('/:id/intelligence', async (req, res) => {
  try {
    const product = await db.prepare(`SELECT id, part_no, description FROM product WHERE id = ?`).get(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // sales_record has no product_id FK — part_no is the only reliable join key (free text, matched
    // by value against the product catalog's unique part_no), same convention used by every existing
    // product-revenue query (reports.js, dashboard.js).
    const sales = await db
      .prepare(
        `SELECT
           COUNT(*) AS order_count,
           COALESCE(SUM(total_amount), 0) AS revenue,
           COALESCE(SUM(qty), 0) AS units_sold,
           COUNT(DISTINCT company_name) AS customers,
           MIN(sale_date) AS first_sale_date,
           MAX(sale_date) AS last_sale_date
         FROM sales_record
         WHERE needs_review = 0 AND part_no = ?`
      )
      .get(product.part_no);

    const orderCount = Number(sales.order_count);
    const revenue = Number(sales.revenue);
    const unitsSold = Number(sales.units_sold);

    // Trend: revenue in the trailing 6 months vs the prior 6 months, calendar-relative to
    // CURRENT_DATE — same known limitation as Growth Opportunities' AOV trend (will show "no_data"
    // against the current 2024-only sales_record dataset; correct once current sales data exists).
    const trendRow = await db
      .prepare(
        `SELECT
           SUM(CASE WHEN sale_date >= CURRENT_DATE - INTERVAL '6 months' THEN total_amount ELSE 0 END) AS recent_revenue,
           SUM(CASE WHEN sale_date >= CURRENT_DATE - INTERVAL '12 months' AND sale_date < CURRENT_DATE - INTERVAL '6 months' THEN total_amount ELSE 0 END) AS prior_revenue
         FROM sales_record
         WHERE needs_review = 0 AND part_no = ?`
      )
      .get(product.part_no);

    const recentRevenue = Number(trendRow.recent_revenue) || 0;
    const priorRevenue = Number(trendRow.prior_revenue) || 0;
    let trendDirection = 'no_data';
    let pctChange = null;
    if (priorRevenue > 0) {
      pctChange = (recentRevenue - priorRevenue) / priorRevenue;
      trendDirection = Math.abs(pctChange) < TREND_STABLE_THRESHOLD ? 'stable' : pctChange > 0 ? 'growing' : 'declining';
    }

    // Quotation activity — matched by EITHER product_id or part_no, since quotation_item's linkage
    // to the product catalog is sparse/inconsistent in the current data (most line items are
    // freeform text with neither field set). This surfaces whatever real signal exists rather than
    // fabricating quotation activity that isn't there.
    const quoted = await db
      .prepare(
        `SELECT COUNT(*) AS quoted_line_count, COALESCE(SUM(qty), 0) AS quoted_qty, COUNT(DISTINCT quotation_id) AS quotation_count
         FROM quotation_item
         WHERE product_id = ? OR part_no = ?`
      )
      .get(product.id, product.part_no);

    res.json({
      product,
      sales: {
        revenue,
        unitsSold,
        customers: Number(sales.customers),
        avgSellingPrice: unitsSold > 0 ? revenue / unitsSold : 0,
        orderCount,
        firstSaleDate: sales.first_sale_date,
        lastSaleDate: sales.last_sale_date,
      },
      trend: {
        direction: trendDirection,
        pctChange,
        recentRevenue,
        priorRevenue,
      },
      quotationActivity: {
        quotedLineCount: Number(quoted.quoted_line_count),
        quotedQty: Number(quoted.quoted_qty),
        quotationCount: Number(quoted.quotation_count),
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.post('/', async (req, res) => {
  const { part_no, hsn_sac, description, unit, default_price } = req.body;
  if (!part_no || !description) return res.status(400).json({ error: 'part_no and description are required' });
  try {
    const info = await db
      .prepare(`INSERT INTO product (part_no, hsn_sac, description, unit, default_price) VALUES (?, ?, ?, ?, ?) RETURNING id`)
      .run(part_no.trim(), hsn_sac || null, description.trim(), unit || 'Nos', default_price ?? 0);
    const row = await db.prepare(`SELECT * FROM product WHERE id = ?`).get(info.lastInsertRowid);
    res.status(201).json(row);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A product with this part number already exists' });
    }
    res.status(500).json({ error: 'Unable to save the product. Please try again.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await db.prepare(`SELECT * FROM product WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Product not found' });
    const { part_no, hsn_sac, description, unit, default_price } = req.body;
    await db
      .prepare(
        `UPDATE product SET part_no = ?, hsn_sac = ?, description = ?, unit = ?, default_price = ? WHERE id = ?`
      )
      .run(
        part_no?.trim() || existing.part_no,
        hsn_sac ?? existing.hsn_sac,
        description?.trim() || existing.description,
        unit ?? existing.unit,
        default_price ?? existing.default_price,
        req.params.id
      );
    const row = await db.prepare(`SELECT * FROM product WHERE id = ?`).get(req.params.id);
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: 'Unable to save the product. Please try again.' });
  }
});

export default router;
