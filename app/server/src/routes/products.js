import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

router.get('/', (req, res) => {
  const { q } = req.query;
  let rows;
  if (q) {
    rows = db
      .prepare(`SELECT * FROM product WHERE description LIKE ? OR part_no LIKE ? ORDER BY description`)
      .all(`%${q}%`, `%${q}%`);
  } else {
    rows = db.prepare(`SELECT * FROM product ORDER BY description`).all();
  }
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare(`SELECT * FROM product WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Product not found' });
  res.json(row);
});

router.post('/', (req, res) => {
  const { part_no, hsn_sac, description, unit, default_price } = req.body;
  if (!part_no || !description) return res.status(400).json({ error: 'part_no and description are required' });
  try {
    const info = db
      .prepare(`INSERT INTO product (part_no, hsn_sac, description, unit, default_price) VALUES (?, ?, ?, ?, ?)`)
      .run(part_no.trim(), hsn_sac || null, description.trim(), unit || 'Nos', default_price ?? 0);
    const row = db.prepare(`SELECT * FROM product WHERE id = ?`).get(info.lastInsertRowid);
    res.status(201).json(row);
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'A product with this part number already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const existing = db.prepare(`SELECT * FROM product WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });
  const { part_no, hsn_sac, description, unit, default_price } = req.body;
  db.prepare(
    `UPDATE product SET part_no = ?, hsn_sac = ?, description = ?, unit = ?, default_price = ? WHERE id = ?`
  ).run(
    part_no?.trim() || existing.part_no,
    hsn_sac ?? existing.hsn_sac,
    description?.trim() || existing.description,
    unit ?? existing.unit,
    default_price ?? existing.default_price,
    req.params.id
  );
  const row = db.prepare(`SELECT * FROM product WHERE id = ?`).get(req.params.id);
  res.json(row);
});

export default router;
