import { Router } from 'express';
import db from '../db/index.js';
import { nextNumber } from '../db/numbering.js';
import { streamPurchaseOrderPdf } from '../pdf/documents.js';

const router = Router();

function fullPO(id) {
  const po = db
    .prepare(
      `SELECT po.*, q.number AS quotation_number, q.subtotal, q.tax_percent, q.tax_amount, q.total,
              c.name AS company_name, c.address AS company_address, c.state AS company_state, c.gstin AS company_gstin
       FROM purchase_order po
       JOIN quotation q ON q.id = po.quotation_id
       JOIN company c ON c.id = q.company_id
       WHERE po.id = ?`
    )
    .get(id);
  if (!po) return null;
  const items = db.prepare(`SELECT * FROM quotation_item WHERE quotation_id = ? ORDER BY id`).all(po.quotation_id);
  return { po, items };
}

router.get('/', (req, res) => {
  const rows = db
    .prepare(
      `SELECT po.*, q.number AS quotation_number, q.total, c.name AS company_name
       FROM purchase_order po
       JOIN quotation q ON q.id = po.quotation_id
       JOIN company c ON c.id = q.company_id
       ORDER BY po.id DESC`
    )
    .all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const result = fullPO(req.params.id);
  if (!result) return res.status(404).json({ error: 'Purchase order not found' });
  res.json({ ...result.po, items: result.items });
});

router.post('/', (req, res) => {
  const { quotation_id, client_po_ref, date } = req.body;
  if (!quotation_id) return res.status(400).json({ error: 'quotation_id is required' });
  const quotation = db.prepare(`SELECT * FROM quotation WHERE id = ?`).get(quotation_id);
  if (!quotation) return res.status(404).json({ error: 'Quotation not found' });

  const prefix = db.prepare(`SELECT po_prefix FROM company_settings WHERE id = 1`).get().po_prefix;
  const number = nextNumber(prefix, 'purchase_order');
  const info = db
    .prepare(`INSERT INTO purchase_order (number, date, quotation_id, client_po_ref) VALUES (?, ?, ?, ?)`)
    .run(number, date || new Date().toISOString().slice(0, 10), quotation_id, client_po_ref || null);

  db.prepare(`UPDATE quotation SET status = 'accepted' WHERE id = ?`).run(quotation_id);

  const row = db.prepare(`SELECT * FROM purchase_order WHERE id = ?`).get(info.lastInsertRowid);
  res.status(201).json(row);
});

router.get('/:id/pdf', (req, res) => {
  const result = fullPO(req.params.id);
  if (!result) return res.status(404).json({ error: 'Purchase order not found' });
  const settings = db.prepare(`SELECT * FROM company_settings WHERE id = 1`).get();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${result.po.number.replace(/\//g, '-')}.pdf"`);
  streamPurchaseOrderPdf(res, { po: result.po, items: result.items, settings });
});

export default router;
