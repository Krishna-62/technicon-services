import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

router.get('/', (req, res) => {
  const salesTotal = db.prepare(`SELECT COALESCE(SUM(total_amount),0) t FROM sales_record WHERE needs_review = 0`).get().t;
  const quotationTotal = db.prepare(`SELECT COALESCE(SUM(total),0) t FROM quotation WHERE status = 'accepted'`).get().t;

  const monthlyTrend = db
    .prepare(
      `SELECT substr(sale_date,1,7) AS month, SUM(total_amount) AS total
       FROM sales_record WHERE needs_review = 0 AND sale_date IS NOT NULL
       GROUP BY month ORDER BY month`
    )
    .all();

  const topCompanies = db
    .prepare(
      `SELECT company_name, SUM(total_amount) AS total, COUNT(*) AS orders
       FROM sales_record WHERE needs_review = 0
       GROUP BY company_name ORDER BY total DESC LIMIT 10`
    )
    .all();

  const topProducts = db
    .prepare(
      `SELECT part_no, product_description, SUM(total_amount) AS total, SUM(qty) AS qty
       FROM sales_record WHERE needs_review = 0
       GROUP BY part_no ORDER BY total DESC LIMIT 10`
    )
    .all();

  const counts = {
    companies: db.prepare(`SELECT COUNT(*) c FROM company`).get().c,
    products: db.prepare(`SELECT COUNT(*) c FROM product`).get().c,
    quotations: db.prepare(`SELECT COUNT(*) c FROM quotation`).get().c,
    purchaseOrders: db.prepare(`SELECT COUNT(*) c FROM purchase_order`).get().c,
    performaInvoices: db.prepare(`SELECT COUNT(*) c FROM performa_invoice`).get().c,
    rowsNeedingReview: db.prepare(`SELECT COUNT(*) c FROM sales_record WHERE needs_review = 1`).get().c,
  };

  res.json({
    historicalRevenue: salesTotal,
    acceptedQuotationRevenue: quotationTotal,
    monthlyTrend,
    topCompanies,
    topProducts,
    counts,
  });
});

export default router;
