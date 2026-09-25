import { Router } from 'express';
import {
  getEngineers,
  getEngineerById,
  createEngineer,
  updateEngineer,
  getEngineerPerformance,
  setEngineerTarget,
  getEngineerTargets,
} from '../services/engineerService.js';

const router = Router();

/**
 * GET /api/engineers
 * List all Sales Engineers
 */
router.get('/', (req, res) => {
  try {
    const { branchId, activeOnly, q, limit, offset } = req.query;
    const result = getEngineers({
      branchId: branchId ? Number(branchId) : null,
      activeOnly: activeOnly === 'true' || activeOnly === '1',
      q: q ? String(q).trim() : null,
      limit: limit ? Number(limit) : 100,
      offset: offset ? Number(offset) : 0,
    });
    res.json(result);
  } catch (err) {
    console.error('Failed to get engineers:', err);
    res.status(500).json({ error: err.message || 'Failed to get engineers' });
  }
});

/**
 * GET /api/engineers/performance
 * Aggregate Engineer Performance & Target Metrics
 */
router.get('/performance', (req, res) => {
  try {
    const { financialYear, branchId, engineerId, q } = req.query;
    const performance = getEngineerPerformance({
      financialYear: financialYear ? String(financialYear) : 'FY 2026-27',
      branchId: branchId ? Number(branchId) : null,
      engineerId: engineerId ? Number(engineerId) : null,
      q: q ? String(q).trim() : null,
    });
    res.json(performance);
  } catch (err) {
    console.error('Failed to get engineer performance:', err);
    res.status(500).json({ error: err.message || 'Failed to get engineer performance' });
  }
});

/**
 * GET /api/engineers/targets
 * List Engineer Annual Sales Targets
 */
router.get('/targets', (req, res) => {
  try {
    const { financialYear, branchId, engineerId } = req.query;
    const targets = getEngineerTargets({
      financialYear: financialYear ? String(financialYear) : 'FY 2026-27',
      branchId: branchId ? Number(branchId) : null,
      engineerId: engineerId ? Number(engineerId) : null,
    });
    res.json(targets);
  } catch (err) {
    console.error('Failed to get engineer targets:', err);
    res.status(500).json({ error: err.message || 'Failed to get engineer targets' });
  }
});

/**
 * POST /api/engineers/targets
 * Create or Update Engineer Annual Target
 */
router.post('/targets', (req, res) => {
  try {
    const engineerId = req.body.engineer_id || req.body.engineerId;
    const branchId = req.body.branch_id || req.body.branchId;
    const financialYear = req.body.fiscal_year || req.body.financial_year || req.body.financialYear;
    const targetAmount = req.body.target_amount !== undefined ? req.body.target_amount : req.body.targetAmount;

    const result = setEngineerTarget({
      engineerId: Number(engineerId),
      branchId: branchId ? Number(branchId) : null,
      financialYear: financialYear ? String(financialYear).trim() : 'FY 2026-27',
      targetAmount: Number(targetAmount),
      userId: req.user?.id || null,
    });
    res.status(201).json(result);
  } catch (err) {
    console.error('Failed to set engineer target:', err);
    res.status(400).json({ error: err.message || 'Failed to set engineer target' });
  }
});

/**
 * GET /api/engineers/:id
 * Retrieve single Sales Engineer details
 */
router.get('/:id', (req, res) => {
  try {
    const { financialYear } = req.query;
    const engineer = getEngineerById(req.params.id, {
      financialYear: financialYear ? String(financialYear) : 'FY 2026-27',
    });
    if (!engineer) return res.status(404).json({ error: 'Sales Engineer not found' });
    res.json(engineer);
  } catch (err) {
    console.error('Failed to get engineer detail:', err);
    res.status(500).json({ error: err.message || 'Failed to get engineer detail' });
  }
});

/**
 * POST /api/engineers
 * Create new Sales Engineer
 */
router.post('/', (req, res) => {
  try {
    const engineer = createEngineer(req.body);
    res.status(201).json(engineer);
  } catch (err) {
    console.error('Failed to create engineer:', err);
    res.status(400).json({ error: err.message || 'Failed to create engineer' });
  }
});

/**
 * PUT /api/engineers/:id
 * Update existing Sales Engineer
 */
router.put('/:id', (req, res) => {
  try {
    const engineer = updateEngineer(req.params.id, req.body);
    res.json(engineer);
  } catch (err) {
    console.error('Failed to update engineer:', err);
    res.status(400).json({ error: err.message || 'Failed to update engineer' });
  }
});

export default router;
