import { Router } from 'express';
import db from '../db/index.js';
import { nextNumber } from '../db/numbering.js';
import { streamQuotationPdf } from '../pdf/documents.js';

const router = Router();

function computeTotals(items, taxPercent) {
  const subtotal = items.reduce((sum, it) => sum + Number(it.qty) * Number(it.price), 0);
  const taxAmount = subtotal * (Number(taxPercent) / 100);
  return { subtotal, taxAmount, total: subtotal + taxAmount };
}

router.get('/', (req, res) => {
  const rows = db
    .prepare(
      `SELECT q.*, c.name AS company_name
       FROM quotation q JOIN company c ON c.id = q.company_id
       ORDER BY q.id DESC`
    )
    .all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const quotation = db
    .prepare(
      `SELECT q.*, c.name AS company_name, c.address AS company_address, c.state AS company_state, c.gstin AS company_gstin
       FROM quotation q JOIN company c ON c.id = q.company_id WHERE q.id = ?`
    )
    .get(req.params.id);
  if (!quotation) return res.status(404).json({ error: 'Quotation not found' });
  const items = db.prepare(`SELECT * FROM quotation_item WHERE quotation_id = ? ORDER BY id`).all(req.params.id);
  res.json({ ...quotation, items });
});

router.post('/', (req, res) => {
  const { company_id, date, items, tax_percent, notes } = req.body;
  if (!company_id) return res.status(400).json({ error: 'company_id is required' });
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'At least one line item is required' });

  const company = db.prepare(`SELECT id FROM company WHERE id = ?`).get(company_id);
  if (!company) return res.status(404).json({ error: 'Company not found' });

  const taxPercent = tax_percent ?? 18;
  const { subtotal, taxAmount, total } = computeTotals(items, taxPercent);

  const tx = db.transaction(() => {
    const prefix = db.prepare(`SELECT quotation_prefix FROM company_settings WHERE id = 1`).get().quotation_prefix;
    const number = nextNumber(prefix, 'quotation');
    const info = db
      .prepare(
        `INSERT INTO quotation (number, date, company_id, status, subtotal, tax_percent, tax_amount, total, notes)
         VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?)`
      )
      .run(number, date || new Date().toISOString().slice(0, 10), company_id, subtotal, taxPercent, taxAmount, total, notes || '');

    const quotationId = info.lastInsertRowid;
    const insertItem = db.prepare(
      `INSERT INTO quotation_item (quotation_id, product_id, part_no, description, hsn_sac, qty, price, amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const it of items) {
      insertItem.run(
        quotationId,
        it.product_id || null,
        it.part_no || null,
        it.description,
        it.hsn_sac || null,
        it.qty,
        it.price,
        Number(it.qty) * Number(it.price)
      );
    }
    return quotationId;
  });

  const quotationId = tx();
  const row = db.prepare(`SELECT * FROM quotation WHERE id = ?`).get(quotationId);
  res.status(201).json(row);
});

router.put('/:id', (req, res) => {
  const existing = db.prepare(`SELECT * FROM quotation WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Quotation not found' });
  if (existing.status !== 'draft') return res.status(400).json({ error: 'Only draft quotations can be edited' });

  const { company_id, date, items, tax_percent, notes } = req.body;
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'At least one line item is required' });

  const taxPercent = tax_percent ?? existing.tax_percent;
  const { subtotal, taxAmount, total } = computeTotals(items, taxPercent);

  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE quotation SET company_id = ?, date = ?, subtotal = ?, tax_percent = ?, tax_amount = ?, total = ?, notes = ? WHERE id = ?`
    ).run(company_id || existing.company_id, date || existing.date, subtotal, taxPercent, taxAmount, total, notes ?? existing.notes, req.params.id);

    db.prepare(`DELETE FROM quotation_item WHERE quotation_id = ?`).run(req.params.id);
    const insertItem = db.prepare(
      `INSERT INTO quotation_item (quotation_id, product_id, part_no, description, hsn_sac, qty, price, amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const it of items) {
      insertItem.run(req.params.id, it.product_id || null, it.part_no || null, it.description, it.hsn_sac || null, it.qty, it.price, Number(it.qty) * Number(it.price));
    }
  });
  tx();

  const row = db.prepare(`SELECT * FROM quotation WHERE id = ?`).get(req.params.id);
  res.json(row);
});

router.post('/:id/status', (req, res) => {
  const { status } = req.body;
  if (!['draft', 'sent', 'accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const existing = db.prepare(`SELECT * FROM quotation WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Quotation not found' });
  db.prepare(`UPDATE quotation SET status = ? WHERE id = ?`).run(status, req.params.id);
  res.json(db.prepare(`SELECT * FROM quotation WHERE id = ?`).get(req.params.id));
});

router.get('/:id/pdf', (req, res) => {
  const quotation = db
    .prepare(
      `SELECT q.*, c.name AS company_name, c.address AS company_address, c.state AS company_state, c.gstin AS company_gstin
       FROM quotation q JOIN company c ON c.id = q.company_id WHERE q.id = ?`
    )
    .get(req.params.id);
  if (!quotation) return res.status(404).json({ error: 'Quotation not found' });
  const items = db.prepare(`SELECT * FROM quotation_item WHERE quotation_id = ? ORDER BY id`).all(req.params.id);
  const settings = db.prepare(`SELECT * FROM company_settings WHERE id = 1`).get();

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${quotation.number.replace(/\//g, '-')}.pdf"`);
  streamQuotationPdf(res, { quotation, items, settings });
});

export default router;
