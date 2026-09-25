import { Router } from 'express';
import {
  exportQuotations,
  exportEngineerPerformance,
  exportInventoryStock,
  exportProcurementRequirements,
  exportSalesReports,
} from '../services/excelExportService.js';

const router = Router();

function sendExcelResponse(res, buffer, filename) {
  const safeFilename = filename.replace(/[/\\?%*:|"<>]/g, '_');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
  res.send(buffer);
}

/**
 * GET /api/export/quotations
 */
router.get('/quotations', async (req, res) => {
  try {
    const { q, status, branchId, engineerId } = req.query;
    const buffer = await exportQuotations({
      q: q ? String(q) : null,
      status: status ? String(status) : null,
      branchId: branchId ? Number(branchId) : null,
      engineerId: engineerId ? Number(engineerId) : null,
    });
    const dateTag = new Date().toISOString().slice(0, 10);
    sendExcelResponse(res, buffer, `TECHNICON_Quotations_${dateTag}.xlsx`);
  } catch (err) {
    console.error('Failed to export quotations:', err);
    res.status(500).json({ error: err.message || 'Failed to export quotations' });
  }
});

/**
 * GET /api/export/engineers/performance
 */
router.get('/engineers/performance', async (req, res) => {
  try {
    const { financialYear, branchId, engineerId } = req.query;
    const buffer = await exportEngineerPerformance({
      financialYear: financialYear ? String(financialYear) : 'FY 2026-27',
      branchId: branchId ? Number(branchId) : null,
      engineerId: engineerId ? Number(engineerId) : null,
    });
    const fyTag = (financialYear || 'FY 2026-27').replace(/\s+/g, '_');
    sendExcelResponse(res, buffer, `TECHNICON_Engineer_Sales_${fyTag}.xlsx`);
  } catch (err) {
    console.error('Failed to export engineer performance:', err);
    res.status(500).json({ error: err.message || 'Failed to export engineer performance' });
  }
});

/**
 * GET /api/export/inventory/stock
 */
router.get('/inventory/stock', async (req, res) => {
  try {
    const { warehouseId, q } = req.query;
    const buffer = await exportInventoryStock({
      warehouseId: warehouseId ? Number(warehouseId) : null,
      q: q ? String(q) : null,
    });
    const dateTag = new Date().toISOString().slice(0, 10);
    sendExcelResponse(res, buffer, `TECHNICON_Inventory_Stock_${dateTag}.xlsx`);
  } catch (err) {
    console.error('Failed to export inventory stock:', err);
    res.status(500).json({ error: err.message || 'Failed to export inventory stock' });
  }
});

/**
 * GET /api/export/procurement/requirements
 */
router.get('/procurement/requirements', async (req, res) => {
  try {
    const { priority, status, warehouseId } = req.query;
    const buffer = await exportProcurementRequirements({
      priority: priority ? String(priority) : null,
      status: status ? String(status) : null,
      warehouseId: warehouseId ? Number(warehouseId) : null,
    });
    const dateTag = new Date().toISOString().slice(0, 10);
    sendExcelResponse(res, buffer, `TECHNICON_Procurement_Requirements_${dateTag}.xlsx`);
  } catch (err) {
    console.error('Failed to export procurement requirements:', err);
    res.status(500).json({ error: err.message || 'Failed to export procurement requirements' });
  }
});

/**
 * GET /api/export/sales/reports
 */
router.get('/sales/reports', async (req, res) => {
  try {
    const { branchId, engineerId } = req.query;
    const buffer = await exportSalesReports({
      branchId: branchId ? Number(branchId) : null,
      engineerId: engineerId ? Number(engineerId) : null,
    });
    const dateTag = new Date().toISOString().slice(0, 10);
    sendExcelResponse(res, buffer, `TECHNICON_Confirmed_Sales_${dateTag}.xlsx`);
  } catch (err) {
    console.error('Failed to export sales reports:', err);
    res.status(500).json({ error: err.message || 'Failed to export sales reports' });
  }
});

export default router;
