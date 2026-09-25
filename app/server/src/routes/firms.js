import { Router } from 'express';
import {
  getFirms,
  getFirmById,
  createFirm,
  updateFirm,
  getBranches,
  getBranchById,
  createBranch,
  updateBranch,
  updateBranchDocumentSettings,
} from '../services/firmService.js';

const router = Router();

/**
 * GET /api/firms
 * List all Firms
 */
router.get('/', (req, res) => {
  try {
    const { activeOnly } = req.query;
    const firms = getFirms({ activeOnly: activeOnly === 'true' || activeOnly === '1' });
    res.json(firms);
  } catch (err) {
    console.error('Failed to get firms:', err);
    res.status(500).json({ error: err.message || 'Failed to get firms' });
  }
});

/**
 * GET /api/firms/:id
 */
router.get('/:id', (req, res) => {
  try {
    const firm = getFirmById(req.params.id);
    if (!firm) return res.status(404).json({ error: 'Firm not found' });
    res.json(firm);
  } catch (err) {
    console.error('Failed to get firm:', err);
    res.status(500).json({ error: err.message || 'Failed to get firm' });
  }
});

/**
 * POST /api/firms
 */
router.post('/', (req, res) => {
  try {
    const firm = createFirm(req.body);
    res.status(201).json(firm);
  } catch (err) {
    console.error('Failed to create firm:', err);
    res.status(400).json({ error: err.message || 'Failed to create firm' });
  }
});

/**
 * PUT /api/firms/:id
 */
router.put('/:id', (req, res) => {
  try {
    const firm = updateFirm(req.params.id, req.body);
    res.json(firm);
  } catch (err) {
    console.error('Failed to update firm:', err);
    res.status(400).json({ error: err.message || 'Failed to update firm' });
  }
});

/**
 * GET /api/branches
 * List all Branches across firms
 */
router.get('/branches/all', (req, res) => {
  try {
    const { firmId, activeOnly } = req.query;
    const branches = getBranches({
      firmId: firmId ? Number(firmId) : null,
      activeOnly: activeOnly === 'true' || activeOnly === '1',
    });
    res.json(branches);
  } catch (err) {
    console.error('Failed to get branches:', err);
    res.status(500).json({ error: err.message || 'Failed to get branches' });
  }
});

/**
 * GET /api/branches/:id
 */
router.get('/branches/:id', (req, res) => {
  try {
    const branch = getBranchById(req.params.id);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });
    res.json(branch);
  } catch (err) {
    console.error('Failed to get branch:', err);
    res.status(500).json({ error: err.message || 'Failed to get branch' });
  }
});

/**
 * POST /api/branches
 */
router.post('/branches', (req, res) => {
  try {
    const branch = createBranch(req.body);
    res.status(201).json(branch);
  } catch (err) {
    console.error('Failed to create branch:', err);
    res.status(400).json({ error: err.message || 'Failed to create branch' });
  }
});

/**
 * PUT /api/branches/:id
 */
router.put('/branches/:id', (req, res) => {
  try {
    const branch = updateBranch(req.params.id, req.body);
    res.json(branch);
  } catch (err) {
    console.error('Failed to update branch:', err);
    res.status(400).json({ error: err.message || 'Failed to update branch' });
  }
});

/**
 * PUT /api/branches/:id/document-settings
 * Update Branch Document Print Settings
 */
router.put('/branches/:id/document-settings', (req, res) => {
  try {
    const branch = updateBranchDocumentSettings(req.params.id, req.body);
    res.json(branch);
  } catch (err) {
    console.error('Failed to update branch document settings:', err);
    res.status(400).json({ error: err.message || 'Failed to update branch document settings' });
  }
});

export default router;
