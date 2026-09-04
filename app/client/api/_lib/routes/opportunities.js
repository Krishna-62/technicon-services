import { Router } from 'express';
import db from '../db/index.js';
import { detectAllOpportunities } from '../opportunities/detectors.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    res.json(await detectAllOpportunities(db));
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

export default router;
