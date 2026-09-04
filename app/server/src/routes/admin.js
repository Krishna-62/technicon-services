import { Router } from 'express';
import fs from 'node:fs';
import db, { dbPath } from '../db/index.js';
import { requireAdmin } from '../auth/middleware.js';
import { hashPassword } from '../auth/password.js';

const router = Router();
router.use(requireAdmin);

// ---------- Stats ----------

router.get('/stats', (req, res) => {
  const tables = ['company', 'product', 'quotation', 'purchase_order', 'performa_invoice', 'sales_record', 'import_batch', 'user'];
  const counts = {};
  for (const t of tables) counts[t] = db.prepare(`SELECT COUNT(*) c FROM ${t}`).get().c;

  let dbSizeBytes = 0;
  try {
    dbSizeBytes = fs.statSync(dbPath).size;
  } catch {
    // file not found is unexpected once the server is running, but don't crash the endpoint over it
  }

  res.json({ counts, dbSizeBytes });
});

// ---------- Import batches ----------

router.delete('/imports/:id', (req, res) => {
  const batch = db.prepare(`SELECT * FROM import_batch WHERE id = ?`).get(req.params.id);
  if (!batch) return res.status(404).json({ error: 'Import batch not found' });

  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM sales_record WHERE import_batch_id = ?`).run(req.params.id);
    db.prepare(`DELETE FROM import_batch WHERE id = ?`).run(req.params.id);
  });
  tx();
  res.json({ ok: true });
});

// ---------- Companies / Products ----------

router.delete('/companies/:id', (req, res) => {
  const id = req.params.id;
  const salesCount = db.prepare(`SELECT COUNT(*) c FROM sales_record WHERE company_id = ?`).get(id).c;
  const quotationCount = db.prepare(`SELECT COUNT(*) c FROM quotation WHERE company_id = ?`).get(id).c;
  if (salesCount > 0 || quotationCount > 0) {
    return res.status(409).json({
      error: `Cannot delete: still referenced by ${quotationCount} quotation(s) and ${salesCount} sales record(s).`,
    });
  }
  const info = db.prepare(`DELETE FROM company WHERE id = ?`).run(id);
  if (info.changes === 0) return res.status(404).json({ error: 'Company not found' });
  res.json({ ok: true });
});

router.delete('/products/:id', (req, res) => {
  const id = req.params.id;
  const itemCount = db.prepare(`SELECT COUNT(*) c FROM quotation_item WHERE product_id = ?`).get(id).c;
  if (itemCount > 0) {
    return res.status(409).json({ error: `Cannot delete: used in ${itemCount} quotation line item(s).` });
  }
  const info = db.prepare(`DELETE FROM product WHERE id = ?`).run(id);
  if (info.changes === 0) return res.status(404).json({ error: 'Product not found' });
  res.json({ ok: true });
});

// ---------- Review queue ----------

router.post('/review-queue/:id/dismiss', (req, res) => {
  const info = db.prepare(`UPDATE sales_record SET review_dismissed = 1 WHERE id = ?`).run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Row not found' });
  res.json({ ok: true });
});

router.delete('/review-queue/:id', (req, res) => {
  const info = db.prepare(`DELETE FROM sales_record WHERE id = ?`).run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Row not found' });
  res.json({ ok: true });
});

// ---------- Configuration ----------

router.get('/config', (req, res) => {
  const row = db.prepare(`SELECT default_tax_percent, default_lapse_months FROM company_settings WHERE id = 1`).get();
  res.json(row);
});

router.put('/config', (req, res) => {
  const existing = db.prepare(`SELECT default_tax_percent, default_lapse_months FROM company_settings WHERE id = 1`).get();
  const default_tax_percent = req.body.default_tax_percent ?? existing.default_tax_percent;
  const default_lapse_months = req.body.default_lapse_months ?? existing.default_lapse_months;
  db.prepare(`UPDATE company_settings SET default_tax_percent = ?, default_lapse_months = ? WHERE id = 1`).run(
    default_tax_percent,
    default_lapse_months
  );
  res.json({ default_tax_percent, default_lapse_months });
});

// ---------- Backup ----------

router.get('/backup', (req, res) => {
  db.pragma('wal_checkpoint(TRUNCATE)');
  const stamp = new Date().toISOString().slice(0, 10);
  res.download(dbPath, `technicon-backup-${stamp}.db`);
});

// ---------- Users ----------

router.get('/users', (req, res) => {
  const rows = db.prepare(`SELECT id, username, role, created_at FROM user ORDER BY id`).all();
  res.json(rows);
});

router.post('/users', (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !username.trim()) return res.status(400).json({ error: 'Username is required' });
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  const finalRole = role === 'admin' ? 'admin' : 'staff';

  const { salt, hash } = hashPassword(password);
  try {
    const info = db
      .prepare(`INSERT INTO user (username, password_hash, password_salt, role) VALUES (?, ?, ?, ?)`)
      .run(username.trim(), hash, salt, finalRole);
    res.status(201).json({ id: info.lastInsertRowid, username: username.trim(), role: finalRole });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) return res.status(409).json({ error: 'That username is already taken' });
    res.status(500).json({ error: err.message });
  }
});

router.delete('/users/:id', (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: 'You cannot delete your own account' });

  const target = db.prepare(`SELECT * FROM user WHERE id = ?`).get(id);
  if (!target) return res.status(404).json({ error: 'User not found' });

  if (target.role === 'admin') {
    const adminCount = db.prepare(`SELECT COUNT(*) c FROM user WHERE role = 'admin'`).get().c;
    if (adminCount <= 1) return res.status(400).json({ error: 'Cannot delete the last remaining admin' });
  }

  db.prepare(`DELETE FROM user WHERE id = ?`).run(id);
  res.json({ ok: true });
});

router.post('/users/:id/reset-password', (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const target = db.prepare(`SELECT * FROM user WHERE id = ?`).get(req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found' });

  const { salt, hash } = hashPassword(password);
  db.prepare(`UPDATE user SET password_hash = ?, password_salt = ? WHERE id = ?`).run(hash, salt, req.params.id);
  db.prepare(`DELETE FROM session WHERE user_id = ?`).run(req.params.id);
  res.json({ ok: true });
});

export default router;
