import { Router } from 'express';
import multer from 'multer';
import db from '../db/index.js';
import { importWorkbook } from '../db/importer.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
const router = Router();

router.get('/', async (req, res) => {
  try {
    const rows = await db.prepare(`SELECT * FROM import_batch ORDER BY id DESC`).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const yearLabel = req.body.year_label || null;
  try {
    const summary = await importWorkbook(req.file.buffer, { filename: req.file.originalname, yearLabel });
    res.status(201).json(summary);
  } catch (err) {
    res.status(400).json({ error: 'Could not import file. Please check the file format and try again.' });
  }
});

export default router;
