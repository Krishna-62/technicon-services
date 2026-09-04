import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const row = await db.prepare(`SELECT * FROM company_settings WHERE id = 1`).get();
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.put('/', async (req, res) => {
  try {
    const existing = await db.prepare(`SELECT * FROM company_settings WHERE id = 1`).get();
    const fields = ['company_name', 'address', 'gstin', 'phone', 'email', 'bank_details', 'terms_conditions', 'logo_path', 'quotation_prefix', 'po_prefix', 'pi_prefix'];
    const merged = { ...existing };
    for (const f of fields) {
      if (req.body[f] !== undefined) merged[f] = req.body[f];
    }
    await db.prepare(
      `UPDATE company_settings SET company_name=?, address=?, gstin=?, phone=?, email=?, bank_details=?, terms_conditions=?, logo_path=?, quotation_prefix=?, po_prefix=?, pi_prefix=? WHERE id = 1`
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
      merged.pi_prefix
    );
    res.json(await db.prepare(`SELECT * FROM company_settings WHERE id = 1`).get());
  } catch (err) {
    res.status(500).json({ error: 'Unable to save settings. Please try again.' });
  }
});

export default router;
