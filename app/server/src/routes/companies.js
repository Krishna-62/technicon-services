import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

router.get('/', (req, res) => {
  const { q } = req.query;
  let rows;
  if (q) {
    rows = db
      .prepare(`SELECT * FROM company WHERE name LIKE ? ORDER BY name`)
      .all(`%${q}%`);
  } else {
    rows = db.prepare(`SELECT * FROM company ORDER BY name`).all();
  }
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare(`SELECT * FROM company WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Company not found' });
  res.json(row);
});

router.post('/', (req, res) => {
  const { name, address, state, gstin, contact_person, phone, email } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });
  try {
    const info = db
      .prepare(
        `INSERT INTO company (name, address, state, gstin, contact_person, phone, email)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(name.trim(), address || null, state || null, gstin || null, contact_person || null, phone || null, email || null);
    const row = db.prepare(`SELECT * FROM company WHERE id = ?`).get(info.lastInsertRowid);
    res.status(201).json(row);
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'A company with this name already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const existing = db.prepare(`SELECT * FROM company WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Company not found' });
  const { name, address, state, gstin, contact_person, phone, email } = req.body;
  db.prepare(
    `UPDATE company SET name = ?, address = ?, state = ?, gstin = ?, contact_person = ?, phone = ?, email = ? WHERE id = ?`
  ).run(
    name?.trim() || existing.name,
    address ?? existing.address,
    state ?? existing.state,
    gstin ?? existing.gstin,
    contact_person ?? existing.contact_person,
    phone ?? existing.phone,
    email ?? existing.email,
    req.params.id
  );
  const row = db.prepare(`SELECT * FROM company WHERE id = ?`).get(req.params.id);
  res.json(row);
});

export default router;
