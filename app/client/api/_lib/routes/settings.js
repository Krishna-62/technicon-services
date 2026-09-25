import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

const EDITABLE_FIELDS = [
  'company_name', 'address', 'gstin', 'state', 'phone', 'landline', 'email',
  'logo_image', 'signature_image',
  'bank_name', 'bank_account_no', 'bank_ifsc', 'bank_account_holder',
  'quotation_validity_days', 'payment_terms', 'delivery_time',
  'quotation_prefix', 'po_prefix', 'pi_prefix',
];

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
    const merged = { ...existing };
    for (const f of EDITABLE_FIELDS) {
      if (req.body[f] !== undefined) merged[f] = req.body[f];
    }
    const setClause = EDITABLE_FIELDS.map((f) => `${f} = ?`).join(', ');
    await db
      .prepare(`UPDATE company_settings SET ${setClause} WHERE id = 1`)
      .run(...EDITABLE_FIELDS.map((f) => merged[f]));
    res.json(await db.prepare(`SELECT * FROM company_settings WHERE id = 1`).get());
  } catch (err) {
    res.status(500).json({ error: 'Unable to save settings. Please try again.' });
  }
});

export default router;
