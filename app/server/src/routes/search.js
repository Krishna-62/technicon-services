import { Router } from 'express';
import { searchGlobal } from '../services/globalSearchService.js';

const router = Router();

/**
 * GET /api/search?q=<query>&limit=<limit>
 * Universal global search endpoint
 */
router.get('/', (req, res) => {
  try {
    const q = req.query.q || '';
    const limit = parseInt(req.query.limit, 10) || 30;

    const userContext = {
      firm_id: req.user?.firm_id,
      branch_id: req.user?.branch_id,
      role: req.user?.role,
    };

    const searchResponse = searchGlobal(userContext, q, { limit });
    return res.json(searchResponse);
  } catch (err) {
    console.error('API /api/search error:', err);
    return res.status(500).json({ error: 'Failed to perform global search' });
  }
});

export default router;
