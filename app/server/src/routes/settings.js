import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

router.get('/', (req, res) => {
  const row = db.prepare(`SELECT * FROM company_settings WHERE id = 1`).get();
  res.json(row);
});

router.put('/', (req, res) => {
  const existing = db.prepare(`SELECT * FROM company_settings WHERE id = 1`).get();
  const fields = ['company_name', 'address', 'gstin', 'phone', 'email', 'bank_details', 'terms_conditions', 'logo_path', 'quotation_prefix', 'po_prefix', 'pi_prefix', 'stale_quotation_days', 'high_value_threshold'];
  const merged = { ...existing };
  for (const f of fields) {
    if (req.body[f] !== undefined) merged[f] = req.body[f];
  }
  db.prepare(
    `UPDATE company_settings SET company_name=?, address=?, gstin=?, phone=?, email=?, bank_details=?, terms_conditions=?, logo_path=?, quotation_prefix=?, po_prefix=?, pi_prefix=?, stale_quotation_days=?, high_value_threshold=? WHERE id = 1`
  ).run(
    merged.company_name,
    merged.address,
    merged.gstin,
    merged.phone,
    merged.email,
    merged.bank_details,
    merged.terms_conditions,
    merged.logo_path,
    merged.quotation_prefix,
    merged.po_prefix,
    merged.pi_prefix,
    Number(merged.stale_quotation_days || 30),
    Number(merged.high_value_threshold || 500000)
  );
  res.json(db.prepare(`SELECT * FROM company_settings WHERE id = 1`).get());
});

export default router;
