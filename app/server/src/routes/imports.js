import { Router } from 'express';
import multer from 'multer';
import db from '../db/index.js';
import { importWorkbook } from '../db/importer.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
const router = Router();

router.get('/', (req, res) => {
  const rows = db.prepare(`SELECT * FROM import_batch ORDER BY id DESC`).all();
  res.json(rows);
});

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const yearLabel = req.body.year_label || null;
  try {
    const summary = await importWorkbook(req.file.buffer, { filename: req.file.originalname, yearLabel });
    res.status(201).json(summary);
  } catch (err) {
    res.status(400).json({ error: `Could not import file: ${err.message}` });
  }
});

export default router;
