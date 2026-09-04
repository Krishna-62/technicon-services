import PDFDocument from 'pdfkit';

const MARGIN = 50;
const PAGE_WIDTH = 595.28; // A4 pt

function formatCurrency(n) {
  const num = Number(n) || 0;
  return `Rs. ${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function drawHeader(doc, settings, title, number, date) {
  doc.fontSize(18).font('Helvetica-Bold').text(settings.company_name || 'TECHNICON SERVICES', MARGIN, MARGIN);
  doc.fontSize(9).font('Helvetica');
  let y = doc.y + 2;
  if (settings.address) { doc.text(settings.address, MARGIN, y); y = doc.y; }
  const contactLine = [settings.phone && `Ph: ${settings.phone}`, settings.email, settings.gstin && `GSTIN: ${settings.gstin}`]
    .filter(Boolean)
    .join('  |  ');
  if (contactLine) { doc.text(contactLine, MARGIN, y); y = doc.y; }

  doc.fontSize(14).font('Helvetica-Bold').text(title, MARGIN, MARGIN, { align: 'right', width: PAGE_WIDTH - 2 * MARGIN });
  doc.fontSize(10).font('Helvetica').text(`No: ${number}`, { align: 'right', width: PAGE_WIDTH - 2 * MARGIN });
  doc.text(`Date: ${formatDate(date)}`, { align: 'right', width: PAGE_WIDTH - 2 * MARGIN });

  doc.moveDown(1);
  doc.moveTo(MARGIN, doc.y).lineTo(PAGE_WIDTH - MARGIN, doc.y).strokeColor('#cccccc').stroke();
  doc.moveDown(0.5);
}

function drawBillTo(doc, { company_name, company_address, company_state, company_gstin }) {
  doc.fontSize(10).font('Helvetica-Bold').text('To:', MARGIN, doc.y);
  doc.font('Helvetica-Bold').text(company_name || '');
  doc.font('Helvetica');
  if (company_address) doc.text(company_address);
  if (company_state) doc.text(company_state);
  if (company_gstin) doc.text(`GSTIN: ${company_gstin}`);
  doc.moveDown(1);
}

function drawItemsTable(doc, items) {
  // Column widths sum to 495pt = PAGE_WIDTH (595.28) - 2*MARGIN (50), so the
  // table's right edge lands exactly on the right margin.
  const W = { sno: 25, part: 70, hsn: 55, desc: 150, qty: 40, price: 70, amount: 85 };
  const colX = {
    sno: MARGIN,
    part: MARGIN + W.sno,
    hsn: MARGIN + W.sno + W.part,
    desc: MARGIN + W.sno + W.part + W.hsn,
    qty: MARGIN + W.sno + W.part + W.hsn + W.desc,
    price: MARGIN + W.sno + W.part + W.hsn + W.desc + W.qty,
    amount: MARGIN + W.sno + W.part + W.hsn + W.desc + W.qty + W.price,
  };
  const tableWidth = PAGE_WIDTH - 2 * MARGIN;
  const rowHeight = 20;

  function drawRow(y, cells, opts = {}) {
    doc.fontSize(8.5).font(opts.bold ? 'Helvetica-Bold' : 'Helvetica');
    doc.text(cells.sno, colX.sno, y, { width: W.sno });
    doc.text(cells.part, colX.part, y, { width: W.part });
    doc.text(cells.hsn, colX.hsn, y, { width: W.hsn });
    doc.text(cells.desc, colX.desc, y, { width: W.desc });
    doc.text(cells.qty, colX.qty, y, { width: W.qty, align: 'right' });
    doc.text(cells.price, colX.price, y, { width: W.price, align: 'right' });
    doc.text(cells.amount, colX.amount, y, { width: W.amount, align: 'right' });
  }

  let y = doc.y;
  doc.rect(MARGIN, y - 4, tableWidth, rowHeight).fill('#f0f0f0');
  doc.fillColor('#000000');
  drawRow(y, { sno: '#', part: 'Part No', hsn: 'HSN/SAC', desc: 'Description', qty: 'Qty', price: 'Price', amount: 'Amount' }, { bold: true });
  y += rowHeight;

  items.forEach((it, idx) => {
    if (y > 700) {
      doc.addPage();
      y = MARGIN;
    }
    drawRow(y, {
      sno: String(idx + 1),
      part: it.part_no || '-',
      hsn: it.hsn_sac || '-',
      desc: it.description,
      qty: String(it.qty),
      price: formatCurrency(it.price),
      amount: formatCurrency(it.amount),
    });
    y += rowHeight;
  });

  doc.moveTo(MARGIN, y).lineTo(PAGE_WIDTH - MARGIN, y).strokeColor('#cccccc').stroke();
  doc.y = y + 10;
}

function drawTotals(doc, { subtotal, tax_percent, tax_amount, total }) {
  const labelX = PAGE_WIDTH - MARGIN - 200;
  const valueX = labelX + 120;
  const rowH = 16;
  let y = doc.y;

  function row(label, value, bold) {
    doc.fontSize(9).font(bold ? 'Helvetica-Bold' : 'Helvetica');
    doc.text(label, labelX, y, { width: 120, align: 'left' });
    doc.text(value, valueX, y, { width: 80, align: 'right' });
    y += rowH;
  }

  row('Subtotal:', formatCurrency(subtotal), false);
  row(`Tax (${tax_percent}%):`, formatCurrency(tax_amount), false);
  row('Total:', formatCurrency(total), true);

  doc.y = y + 10;
}

function drawFooter(doc, settings) {
  const fullWidth = PAGE_WIDTH - 2 * MARGIN;
  doc.fontSize(9).font('Helvetica');
  if (settings.bank_details) {
    doc.font('Helvetica-Bold').text('Bank Details:', MARGIN, doc.y, { width: fullWidth });
    doc.font('Helvetica').text(settings.bank_details, MARGIN, doc.y, { width: fullWidth });
    doc.moveDown(0.5);
  }
  if (settings.terms_conditions) {
    doc.font('Helvetica-Bold').text('Terms & Conditions:', MARGIN, doc.y, { width: fullWidth });
    doc.font('Helvetica').text(settings.terms_conditions, MARGIN, doc.y, { width: fullWidth });
  }
}

function buildDocument(res, { title, number, date, billTo, items, totals, settings, extraLines = [] }) {
  const doc = new PDFDocument({ size: 'A4', margin: MARGIN });
  doc.pipe(res);

  drawHeader(doc, settings, title, number, date);
  if (extraLines.length) {
    doc.fontSize(9).font('Helvetica');
    extraLines.forEach((line) => doc.text(line));
    doc.moveDown(0.5);
  }
  drawBillTo(doc, billTo);
  drawItemsTable(doc, items);
  drawTotals(doc, totals);
  drawFooter(doc, settings);

  doc.end();
}

export function streamQuotationPdf(res, { quotation, items, settings }) {
  buildDocument(res, {
    title: 'QUOTATION',
    number: quotation.number,
    date: quotation.date,
    billTo: quotation,
    items,
    totals: quotation,
    settings,
  });
}

export function streamPurchaseOrderPdf(res, { po, items, settings }) {
  buildDocument(res, {
    title: 'PURCHASE ORDER',
    number: po.number,
    date: po.date,
    billTo: po,
    items,
    totals: po,
    settings,
    extraLines: [
      `Against Quotation: ${po.quotation_number}`,
      po.client_po_ref ? `Client PO Reference: ${po.client_po_ref}` : null,
    ].filter(Boolean),
  });
}

export function streamPerformaInvoicePdf(res, { pi, items, settings }) {
  buildDocument(res, {
    title: 'PERFORMA INVOICE',
    number: pi.number,
    date: pi.date,
    billTo: pi,
    items,
    totals: pi,
    settings,
    extraLines: [
      `Against Quotation: ${pi.quotation_number}`,
      pi.po_number ? `Against Purchase Order: ${pi.po_number}` : null,
    ].filter(Boolean),
  });
}
