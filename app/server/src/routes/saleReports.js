import { Router } from 'express';
import {
  getSaleReports,
  getSaleReportById,
  createSaleReport,
  updateDraftSaleReport,
  confirmSaleReport,
  cancelSaleReport,
  getSourceDocumentItems,
} from '../services/inventoryService.js';

const router = Router();

/**
 * GET /api/sale-reports
 * List sale reports with search, filtering, pagination, and KPI aggregates
 */
router.get('/', (req, res) => {
  try {
    const { warehouseId, status, sourceType, companyId, q, startDate, endDate, limit, offset } = req.query;

    const result = getSaleReports({
      warehouseId: warehouseId ? Number(warehouseId) : null,
      status: status ? String(status) : null,
      sourceType: sourceType ? String(sourceType) : null,
      companyId: companyId ? Number(companyId) : null,
      q: q ? String(q) : null,
      startDate: startDate ? String(startDate) : null,
      endDate: endDate ? String(endDate) : null,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    });

    res.json(result);
  } catch (err) {
    console.error('Failed to list sale reports:', err);
    res.status(500).json({ error: err.message || 'Failed to list sale reports' });
  }
});

/**
 * GET /api/sale-reports/source-doc/:type/:id
 * Retrieve eligible items and previously sold/remaining quantities from Quotation, PO, or PI
 */
router.get('/source-doc/:type/:id', (req, res) => {
  try {
    const { type, id } = req.params;
    const result = getSourceDocumentItems(type, id);
    res.json(result);
  } catch (err) {
    console.error('Failed to get source document items:', err);
    res.status(400).json({ error: err.message || 'Failed to retrieve source document' });
  }
});

/**
 * GET /api/sale-reports/:id
 * Retrieve single sale report details by ID
 */
router.get('/:id', (req, res) => {
  try {
    const report = getSaleReportById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Sale report not found' });
    }
    res.json(report);
  } catch (err) {
    console.error('Failed to get sale report:', err);
    res.status(500).json({ error: err.message || 'Failed to get sale report' });
  }
});

/**
 * POST /api/sale-reports
 * Create a new Sale Report (Draft or Confirmed)
 */
router.post('/', (req, res) => {
  try {
    const {
      companyId,
      companyName,
      invoiceNumber,
      saleDate,
      phoneNumber,
      warehouseId,
      sourceType,
      sourceReference,
      quotationId,
      poId,
      piId,
      notes,
      taxPercent,
      items,
      confirmImmediately,
    } = req.body;

    const report = createSaleReport({
      companyId,
      companyName,
      invoiceNumber,
      saleDate,
      phoneNumber,
      warehouseId,
      sourceType,
      sourceReference,
      quotationId,
      poId,
      piId,
      notes,
      taxPercent,
      items,
      confirmImmediately: Boolean(confirmImmediately),
      userId: req.user?.id || null,
    });

    res.status(201).json(report);
  } catch (err) {
    console.error('Failed to create sale report:', err);
    res.status(400).json({ error: err.message || 'Failed to create sale report' });
  }
});

/**
 * PUT /api/sale-reports/:id
 * Update an existing DRAFT Sale Report
 */
router.put('/:id', (req, res) => {
  try {
    const report = updateDraftSaleReport(req.params.id, req.body, req.user?.id || null);
    res.json(report);
  } catch (err) {
    console.error('Failed to update sale report:', err);
    res.status(400).json({ error: err.message || 'Failed to update sale report' });
  }
});

/**
 * POST /api/sale-reports/:id/confirm
 * Confirm Sale Report and trigger atomic stock-out deduction
 */
router.post('/:id/confirm', (req, res) => {
  try {
    const report = confirmSaleReport(req.params.id, req.user?.id || null);
    res.json(report);
  } catch (err) {
    console.error('Failed to confirm sale report:', err);
    res.status(400).json({ error: err.message || 'Failed to confirm sale report' });
  }
});

/**
 * POST /api/sale-reports/:id/cancel
 * Cancel a DRAFT Sale Report
 */
router.post('/:id/cancel', (req, res) => {
  try {
    const report = cancelSaleReport(req.params.id, req.user?.id || null);
    res.json(report);
  } catch (err) {
    console.error('Failed to cancel sale report:', err);
    res.status(400).json({ error: err.message || 'Failed to cancel sale report' });
  }
});

export default router;
