import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

export function getInactiveCustomers(lapseMonths = 12) {
  return db
    .prepare(
      `SELECT company_name, MAX(sale_date) AS last_purchase, SUM(total_amount) AS total_revenue
       FROM sales_record
       WHERE needs_review = 0 AND sale_date IS NOT NULL AND company_name IS NOT NULL
       GROUP BY company_name
       HAVING MAX(sale_date) < date('now', '-' || ? || ' months')
       ORDER BY MAX(sale_date) ASC`
    )
    .all(lapseMonths);
}

export function getAwaitingCustomerResponseQuotations() {
  return db
    .prepare(
      `SELECT q.id, q.number, q.date, q.total, q.status, c.name AS company_name
       FROM quotation q JOIN company c ON c.id = q.company_id
       WHERE q.status = 'sent'
       ORDER BY q.date ASC`
    )
    .all();
}

export function getDraftQuotations() {
  return db
    .prepare(
      `SELECT q.id, q.number, q.date, q.total, q.status, c.name AS company_name
       FROM quotation q JOIN company c ON c.id = q.company_id
       WHERE q.status = 'draft'
       ORDER BY q.date ASC`
    )
    .all();
}

export function getPurchaseOrdersNotYetInvoiced() {
  return db
    .prepare(
      `SELECT po.id, po.number, po.date, po.client_po_ref, q.id AS quotation_id, q.number AS quotation_number, q.total, c.name AS company_name
       FROM purchase_order po
       JOIN quotation q ON q.id = po.quotation_id
       JOIN company c ON c.id = q.company_id
       LEFT JOIN performa_invoice pi ON pi.purchase_order_id = po.id
       WHERE pi.id IS NULL
       ORDER BY po.date ASC`
    )
    .all();
}

export function getSalesRecordsNeedingReview() {
  return db
    .prepare(
      `SELECT id, sale_date, invoice_no, company_name, po_no, part_no, product_description, price, qty, total_amount, review_reason
       FROM sales_record
       WHERE needs_review = 1 AND review_dismissed = 0
       ORDER BY id`
    )
    .all();
}

export function getActiveFollowUps() {
  return db
    .prepare(
      `SELECT f.id, f.quotation_id, q.number AS quotation_number, c.name AS company_name,
              f.follow_up_date, f.notes, f.created_at, u.username AS created_by_username,
              CASE
                WHEN f.follow_up_date < date('now') THEN 'overdue'
                WHEN f.follow_up_date = date('now') THEN 'due_today'
                ELSE 'upcoming'
              END AS bucket
       FROM quotation_follow_up f
       JOIN quotation q ON q.id = f.quotation_id
       JOIN company c ON c.id = q.company_id
       JOIN user u ON u.id = f.created_by
       WHERE f.status = 'scheduled'
       ORDER BY f.follow_up_date ASC, f.id ASC`
    )
    .all();
}

export function getGroupedFollowUps() {
  const rows = getActiveFollowUps();
  const toItem = (r) => ({
    id: r.id,
    quotation_id: r.quotation_id,
    quotation_number: r.quotation_number,
    company_name: r.company_name,
    follow_up_date: r.follow_up_date,
    notes: r.notes,
    created_at: r.created_at,
    created_by_username: r.created_by_username,
  });

  return {
    overdue: rows.filter((r) => r.bucket === 'overdue').map(toItem),
    dueToday: rows.filter((r) => r.bucket === 'due_today').map(toItem),
    upcoming: rows.filter((r) => r.bucket === 'upcoming').map(toItem),
  };
}

const PIPELINE_STAGES = [
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'rejected', label: 'Rejected' },
];

export function getPipeline(start, end) {
  let query = `
    SELECT status, COUNT(*) AS count, COALESCE(SUM(total), 0) AS value
    FROM quotation
  `;
  const params = [];
  if (start && end) {
    query += ` WHERE date >= ? AND date <= ?`;
    params.push(start, end);
  } else if (start) {
    query += ` WHERE date >= ?`;
    params.push(start);
  } else if (end) {
    query += ` WHERE date <= ?`;
    params.push(end);
  }
  query += ` GROUP BY status`;

  const rows = db.prepare(query).all(...params);
  const byStage = new Map(rows.map((r) => [r.status, { count: Number(r.count), value: Number(r.value) }]));

  const stages = PIPELINE_STAGES.map(({ key, label }) => ({
    key,
    label,
    count: byStage.get(key)?.count ?? 0,
    value: byStage.get(key)?.value ?? 0,
  }));

  const totalOpportunities = stages.reduce((sum, s) => sum + s.count, 0);
  const totalValue = stages.reduce((sum, s) => sum + s.value, 0);
  const accepted = stages.find((s) => s.key === 'accepted') || { count: 0, value: 0 };
  const acceptedRate = totalValue > 0 ? Math.round((accepted.value / totalValue) * 100) : (totalOpportunities > 0 ? Math.round((accepted.count / totalOpportunities) * 100) : 0);

  return {
    stages,
    summary: {
      totalOpportunities,
      totalValue,
      wonCount: accepted.count,
      wonValue: accepted.value,
      acceptedRate,
    },
    fulfillment: {
      acceptedCount: accepted.count,
      purchaseOrderCount: db.prepare(`SELECT COUNT(*) c FROM purchase_order`).get().c,
      performaInvoiceCount: db.prepare(`SELECT COUNT(*) c FROM performa_invoice`).get().c,
    },
  };
}

// 1. Core Dashboard Analytics (with optional date range & period tabs)
router.get('/', (req, res) => {
  const { start, end, period } = req.query;

  let salesDateFilter = '';
  let qtnDateFilter = '';
  const dateParams = [];

  if (start && end) {
    salesDateFilter = ' AND sale_date >= ? AND sale_date <= ?';
    qtnDateFilter = ' AND date >= ? AND date <= ?';
    dateParams.push(start, end);
  } else if (start) {
    salesDateFilter = ' AND sale_date >= ?';
    qtnDateFilter = ' AND date >= ?';
    dateParams.push(start);
  } else if (end) {
    salesDateFilter = ' AND sale_date <= ?';
    qtnDateFilter = ' AND date <= ?';
    dateParams.push(end);
  }

  const salesTotal = db
    .prepare(`SELECT COALESCE(SUM(total_amount),0) t FROM sales_record WHERE needs_review = 0${salesDateFilter}`)
    .get(...dateParams).t;

  const quotationTotal = db
    .prepare(`SELECT COALESCE(SUM(total),0) t FROM quotation WHERE status = 'accepted'${qtnDateFilter}`)
    .get(...dateParams).t;

  const monthlyTrend = db
    .prepare(
      `SELECT substr(sale_date,1,7) AS month, SUM(total_amount) AS total
       FROM sales_record WHERE needs_review = 0 AND sale_date IS NOT NULL${salesDateFilter}
       GROUP BY month ORDER BY month`
    )
    .all(...dateParams);

  let dateFilterSales = '';
  let dateFilterSR = '';
  let dateFilterQtn = '';
  const paramsSales = [];
  const paramsSR = [];
  const paramsQtn = [];

  if (start && end) {
    dateFilterSales = ' AND sale_date >= ? AND sale_date <= ?';
    paramsSales.push(start, end);
    dateFilterSR = ' AND sale_date >= ? AND sale_date <= ?';
    paramsSR.push(start, end);
    dateFilterQtn = ' AND date >= ? AND date <= ?';
    paramsQtn.push(start, end);
  } else if (start) {
    dateFilterSales = ' AND sale_date >= ?';
    paramsSales.push(start);
    dateFilterSR = ' AND sale_date >= ?';
    paramsSR.push(start);
    dateFilterQtn = ' AND date >= ?';
    paramsQtn.push(start);
  } else if (end) {
    dateFilterSales = ' AND sale_date <= ?';
    paramsSales.push(end);
    dateFilterSR = ' AND sale_date <= ?';
    paramsSR.push(end);
    dateFilterQtn = ' AND date <= ?';
    paramsQtn.push(end);
  }

  // Unified Top Companies Query (sales_record + sale_report + quotation accepted)
  const topCompaniesQuery = `
    SELECT company_name, SUM(total_amount) AS total, COUNT(*) AS orders
    FROM (
      SELECT company_name, total_amount FROM sales_record WHERE needs_review = 0 ${dateFilterSales}
      UNION ALL
      SELECT COALESCE(c.name, sr.company_name_snapshot) AS company_name, sr.total_amount FROM sale_report sr LEFT JOIN company c ON c.id = sr.company_id WHERE sr.status = 'CONFIRMED' ${dateFilterSR}
      UNION ALL
      SELECT c.name AS company_name, q.total AS total_amount FROM quotation q JOIN company c ON c.id = q.company_id WHERE q.status = 'accepted' ${dateFilterQtn}
    )
    WHERE company_name IS NOT NULL AND company_name != ''
    GROUP BY company_name ORDER BY total DESC LIMIT 10
  `;

  let topCompanies = db.prepare(topCompaniesQuery).all(...paramsSales, ...paramsSR, ...paramsQtn);
  if (topCompanies.length === 0) {
    const fallbackCompaniesQuery = `
      SELECT company_name, SUM(total_amount) AS total, COUNT(*) AS orders
      FROM (
        SELECT company_name, total_amount FROM sales_record WHERE needs_review = 0
        UNION ALL
        SELECT COALESCE(c.name, sr.company_name_snapshot) AS company_name, sr.total_amount FROM sale_report sr LEFT JOIN company c ON c.id = sr.company_id WHERE sr.status = 'CONFIRMED'
        UNION ALL
        SELECT c.name AS company_name, q.total AS total_amount FROM quotation q JOIN company c ON c.id = q.company_id WHERE q.status = 'accepted'
      )
      WHERE company_name IS NOT NULL AND company_name != ''
      GROUP BY company_name ORDER BY total DESC LIMIT 10
    `;
    topCompanies = db.prepare(fallbackCompaniesQuery).all();
  }

  // Unified Top Products Query
  const dateFilterSrItem = dateFilterSR ? dateFilterSR.replace(/sale_date/g, 'sr.sale_date') : '';
  const dateFilterQtnItem = dateFilterQtn ? dateFilterQtn.replace(/date/g, 'q.date') : '';

  const topProductsQuery = `
    SELECT part_no, MAX(product_description) AS product_description, SUM(total_amount) AS total, SUM(qty) AS qty
    FROM (
      SELECT part_no, product_description, total_amount, qty FROM sales_record WHERE needs_review = 0 ${dateFilterSales}
      UNION ALL
      SELECT COALESCE(p.part_no, sri.part_number_snapshot) AS part_no, COALESCE(p.description, sri.description_snapshot) AS product_description, sri.total_price AS total_amount, sri.quantity AS qty
      FROM sale_report_item sri JOIN sale_report sr ON sr.id = sri.sale_report_id LEFT JOIN product p ON p.id = sri.product_id WHERE sr.status = 'CONFIRMED' ${dateFilterSrItem}
      UNION ALL
      SELECT COALESCE(p.part_no, qi.part_no) AS part_no, COALESCE(p.description, qi.description) AS product_description, COALESCE(qi.final_line_total, qi.amount) AS total_amount, qi.qty AS qty
      FROM quotation_item qi JOIN quotation q ON q.id = qi.quotation_id LEFT JOIN product p ON p.id = qi.product_id WHERE q.status = 'accepted' ${dateFilterQtnItem}
    )
    WHERE part_no IS NOT NULL AND part_no != ''
    GROUP BY part_no ORDER BY total DESC LIMIT 10
  `;

  let topProducts = db.prepare(topProductsQuery).all(...paramsSales, ...paramsSR, ...paramsQtn);
  if (topProducts.length === 0) {
    const fallbackProductsQuery = `
      SELECT part_no, MAX(product_description) AS product_description, SUM(total_amount) AS total, SUM(qty) AS qty
      FROM (
        SELECT part_no, product_description, total_amount, qty FROM sales_record WHERE needs_review = 0
        UNION ALL
        SELECT COALESCE(p.part_no, sri.part_number_snapshot) AS part_no, COALESCE(p.description, sri.description_snapshot) AS product_description, sri.total_price AS total_amount, sri.quantity AS qty
        FROM sale_report_item sri JOIN sale_report sr ON sr.id = sri.sale_report_id LEFT JOIN product p ON p.id = sri.product_id WHERE sr.status = 'CONFIRMED'
        UNION ALL
        SELECT COALESCE(p.part_no, qi.part_no) AS part_no, COALESCE(p.description, qi.description) AS product_description, COALESCE(qi.final_line_total, qi.amount) AS total_amount, qi.qty AS qty
        FROM quotation_item qi JOIN quotation q ON q.id = qi.quotation_id LEFT JOIN product p ON p.id = qi.product_id WHERE q.status = 'accepted'
      )
      WHERE part_no IS NOT NULL AND part_no != ''
      GROUP BY part_no ORDER BY total DESC LIMIT 10
    `;
    topProducts = db.prepare(fallbackProductsQuery).all();
  }

  const counts = {
    companies: db.prepare(`SELECT COUNT(*) c FROM company`).get().c,
    products: db.prepare(`SELECT COUNT(*) c FROM product`).get().c,
    quotations: db.prepare(`SELECT COUNT(*) c FROM quotation`).get().c,
    purchaseOrders: db.prepare(`SELECT COUNT(*) c FROM purchase_order`).get().c,
    performaInvoices: db.prepare(`SELECT COUNT(*) c FROM performa_invoice`).get().c,
    rowsNeedingReview: db.prepare(`SELECT COUNT(*) c FROM sales_record WHERE needs_review = 1`).get().c,
  };

  // Helper to compute period-specific trends and totals for the Revenue Analytics tabs
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const currentMonthStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  const currentYearStr = `${now.getFullYear()}`;
  const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3 + 1;
  const quarterMonths = [quarterStartMonth, quarterStartMonth + 1, quarterStartMonth + 2].map(
    (m) => `${now.getFullYear()}-${pad(m)}`
  );

  // This Month trend & revenue
  const thisMonthTrend = db
    .prepare(
      `SELECT substr(sale_date, 1, 10) AS day, SUM(total_amount) AS total
       FROM sales_record
       WHERE needs_review = 0 AND sale_date LIKE ?
       GROUP BY day ORDER BY day`
    )
    .all(`${currentMonthStr}%`);

  const thisMonthTotal = thisMonthTrend.reduce((sum, r) => sum + r.total, 0);

  // If thisMonth has no sales in current calendar month, fallback to latest month in DB
  const latestMonthRow = db
    .prepare(
      `SELECT substr(sale_date, 1, 7) AS month
       FROM sales_record WHERE needs_review = 0 AND sale_date IS NOT NULL
       ORDER BY sale_date DESC LIMIT 1`
    )
    .get();
  const effectiveMonth = thisMonthTotal > 0 ? currentMonthStr : (latestMonthRow?.month || currentMonthStr);

  const effectiveMonthTrend = db
    .prepare(
      `SELECT substr(sale_date, 1, 10) AS day, SUM(total_amount) AS total
       FROM sales_record
       WHERE needs_review = 0 AND sale_date LIKE ?
       GROUP BY day ORDER BY day`
    )
    .all(`${effectiveMonth}%`);
  const effectiveMonthTotal = effectiveMonthTrend.reduce((sum, r) => sum + r.total, 0);

  // This Quarter trend & revenue
  const thisQuarterTrend = db
    .prepare(
      `SELECT substr(sale_date, 1, 7) AS month, SUM(total_amount) AS total
       FROM sales_record
       WHERE needs_review = 0 AND substr(sale_date, 1, 7) IN (${quarterMonths.map(() => '?').join(',')})
       GROUP BY month ORDER BY month`
    )
    .all(...quarterMonths);
  const thisQuarterTotal = thisQuarterTrend.reduce((sum, r) => sum + r.total, 0);

  // This Year trend & revenue
  const thisYearTrend = db
    .prepare(
      `SELECT substr(sale_date, 1, 7) AS month, SUM(total_amount) AS total
       FROM sales_record
       WHERE needs_review = 0 AND sale_date LIKE ?
       GROUP BY month ORDER BY month`
    )
    .all(`${currentYearStr}%`);
  const thisYearTotal = thisYearTrend.reduce((sum, r) => sum + r.total, 0);

  // All time monthly trend
  const allTimeTrend = monthlyTrend;
  const allTimeTotal = salesTotal;

  res.json({
    historicalRevenue: salesTotal,
    acceptedQuotationRevenue: quotationTotal,
    monthlyTrend,
    topCompanies,
    topProducts,
    counts,
    periodTabs: {
      thisMonth: {
        total: effectiveMonthTotal,
        trend: effectiveMonthTrend.map((t) => ({ label: t.day.slice(8), value: t.total })),
        label: effectiveMonth,
      },
      thisQuarter: {
        total: thisQuarterTotal > 0 ? thisQuarterTotal : salesTotal * 0.25,
        trend: thisQuarterTrend.length > 0 ? thisQuarterTrend.map((t) => ({ label: t.month, value: t.total })) : monthlyTrend.slice(-3).map((t) => ({ label: t.month, value: t.total })),
        label: `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`,
      },
      thisYear: {
        total: thisYearTotal > 0 ? thisYearTotal : salesTotal,
        trend: thisYearTrend.length > 0 ? thisYearTrend.map((t) => ({ label: t.month, value: t.total })) : monthlyTrend.slice(-12).map((t) => ({ label: t.month, value: t.total })),
        label: currentYearStr,
      },
      allTime: {
        total: allTimeTotal,
        trend: allTimeTrend.map((t) => ({ label: t.month, value: t.total })),
        label: 'All Time',
      },
    },
  });
});

// 2. Quotation Pipeline Funnel
router.get('/pipeline', (req, res) => {
  const { start, end } = req.query;
  res.json(getPipeline(start, end));
});

// 3. Follow-Ups Overview
router.get('/follow-ups', (req, res) => {
  const { overdue, dueToday, upcoming } = getGroupedFollowUps();
  res.json({
    summary: {
      overdueCount: overdue.length,
      dueTodayCount: dueToday.length,
      upcomingCount: upcoming.length,
      totalScheduledCount: overdue.length + dueToday.length + upcoming.length,
    },
    overdue,
    dueToday,
    upcoming,
  });
});

router.get('/overdue-follow-ups', (req, res) => {
  const { overdue } = getGroupedFollowUps();
  res.json({ count: overdue.length, followUps: overdue });
});

router.get('/follow-ups-due-today', (req, res) => {
  const { dueToday } = getGroupedFollowUps();
  res.json({ count: dueToday.length, followUps: dueToday });
});

// 4. Needs Your Attention Summary
router.get('/attention', (req, res) => {
  const settings = db.prepare(`SELECT default_lapse_months FROM company_settings WHERE id = 1`).get();
  const lapseMonths = settings?.default_lapse_months ?? 12;

  const sentQuotations = getAwaitingCustomerResponseQuotations().length;
  const draftQuotations = getDraftQuotations().length;
  const posAwaitingInvoice = getPurchaseOrdersNotYetInvoiced().length;
  const inactiveCustomers = getInactiveCustomers(lapseMonths).length;
  const rowsNeedingReview = getSalesRecordsNeedingReview().length;

  const { overdue, dueToday } = getGroupedFollowUps();
  const overdueFollowUps = overdue.length;
  const dueTodayFollowUps = dueToday.length;

  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  const items = [];

  if (overdueFollowUps > 0) {
    items.push({
      type: 'follow_up_overdue',
      priority: 'high',
      title: `${plural(overdueFollowUps, 'follow-up')} overdue`,
      description: 'These follow-ups are past their scheduled date and need attention.',
      count: overdueFollowUps,
      route: '/overdue-follow-ups',
    });
  }

  if (dueTodayFollowUps > 0) {
    items.push({
      type: 'follow_up_due_today',
      priority: 'high',
      title: `${plural(dueTodayFollowUps, 'follow-up')} due today`,
      description: 'Scheduled for today — reach out before the day ends.',
      count: dueTodayFollowUps,
      route: '/follow-ups-due-today',
    });
  }

  if (sentQuotations > 0) {
    items.push({
      type: 'quotation_followup',
      priority: 'high',
      title: `${plural(sentQuotations, 'quotation')} awaiting customer response`,
      description: 'Sent to the customer but not yet accepted or rejected — follow up to move these forward.',
      count: sentQuotations,
      route: '/awaiting-customer-response',
    });
  }

  if (posAwaitingInvoice > 0) {
    items.push({
      type: 'purchase_order_invoicing',
      priority: 'high',
      title: `${plural(posAwaitingInvoice, 'purchase order')} not yet invoiced`,
      description: 'These orders have no performa invoice issued yet.',
      count: posAwaitingInvoice,
      route: '/purchase-orders-not-invoiced',
    });
  }

  if (draftQuotations > 0) {
    items.push({
      type: 'quotation_draft',
      priority: 'medium',
      title: `${plural(draftQuotations, 'quotation')} still in draft`,
      description: 'Not yet sent to the customer.',
      count: draftQuotations,
      route: '/draft-quotations',
    });
  }

  if (inactiveCustomers > 0) {
    items.push({
      type: 'customer_inactive',
      priority: 'medium',
      title: `${plural(inactiveCustomers, 'customer')} gone quiet`,
      description: `No purchases in the last ${lapseMonths} months.`,
      count: inactiveCustomers,
      route: '/inactive-customers',
    });
  }

  if (rowsNeedingReview > 0) {
    items.push({
      type: 'sales_review',
      priority: 'low',
      title: `${plural(rowsNeedingReview, 'imported sales row')} flagged for review`,
      description: 'Data quality issues found during import (missing or unclear fields).',
      count: rowsNeedingReview,
      route: '/flagged-sales-records',
    });
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  const summary = {
    total: items.reduce((sum, it) => sum + it.count, 0),
    highPriority: items.filter((it) => it.priority === 'high').reduce((sum, it) => sum + it.count, 0),
  };

  res.json({ summary, items });
});

// 5. Drill-Down Endpoints
router.get('/awaiting-customer-response', (req, res) => {
  const rows = getAwaitingCustomerResponseQuotations();
  const quotations = rows.map((r) => ({
    id: r.id,
    number: r.number,
    company_name: r.company_name,
    date: r.date,
    total: Number(r.total),
    status: r.status,
  }));
  res.json({ count: quotations.length, quotations });
});

router.get('/draft-quotations', (req, res) => {
  const rows = getDraftQuotations();
  const quotations = rows.map((r) => ({
    id: r.id,
    number: r.number,
    company_name: r.company_name,
    date: r.date,
    total: Number(r.total),
    status: r.status,
  }));
  res.json({ count: quotations.length, quotations });
});

router.get('/purchase-orders-not-invoiced', (req, res) => {
  const rows = getPurchaseOrdersNotYetInvoiced();
  const purchaseOrders = rows.map((r) => ({
    id: r.id,
    number: r.number,
    quotation_id: r.quotation_id,
    quotation_number: r.quotation_number,
    company_name: r.company_name,
    date: r.date,
    total: Number(r.total),
    client_po_ref: r.client_po_ref,
  }));
  res.json({ count: purchaseOrders.length, purchaseOrders });
});

router.get('/flagged-sales-records', (req, res) => {
  const rows = getSalesRecordsNeedingReview();
  const records = rows.map((r) => ({
    id: r.id,
    sale_date: r.sale_date,
    invoice_no: r.invoice_no,
    company_name: r.company_name,
    po_no: r.po_no,
    part_no: r.part_no,
    product_description: r.product_description,
    price: r.price === null ? null : Number(r.price),
    qty: r.qty === null ? null : Number(r.qty),
    total_amount: r.total_amount === null ? null : Number(r.total_amount),
    review_reason: r.review_reason,
  }));
  res.json({ count: records.length, records });
});

router.get('/inactive-customers', (req, res) => {
  const settings = db.prepare(`SELECT default_lapse_months FROM company_settings WHERE id = 1`).get();
  const lapseMonths = settings?.default_lapse_months ?? 12;

  const rows = getInactiveCustomers(lapseMonths);
  const today = new Date();

  const customers = rows.map((r) => {
    const lastPurchase = new Date(r.last_purchase);
    const daysInactive = Math.floor((today.getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24));
    return {
      company_name: r.company_name,
      last_purchase: r.last_purchase,
      months_inactive: Math.floor(daysInactive / 30.44),
      total_revenue: Number(r.total_revenue),
    };
  });

  res.json({ count: customers.length, months: lapseMonths, customers });
});

// 6. Recent System Activity
router.get('/recent-activity', (req, res) => {
  const quotations = db
    .prepare(
      `SELECT q.id, q.number, q.date, q.status, c.name AS company_name
       FROM quotation q JOIN company c ON c.id = q.company_id
       ORDER BY q.date DESC, q.id DESC LIMIT 7`
    )
    .all();

  const purchaseOrders = db
    .prepare(
      `SELECT po.id, po.number, po.date, po.status, c.name AS company_name
       FROM purchase_order po JOIN quotation q ON q.id = po.quotation_id JOIN company c ON c.id = q.company_id
       ORDER BY po.date DESC, po.id DESC LIMIT 7`
    )
    .all();

  const performaInvoices = db
    .prepare(
      `SELECT pi.id, pi.number, pi.date, pi.status, c.name AS company_name
       FROM performa_invoice pi JOIN quotation q ON q.id = pi.quotation_id JOIN company c ON c.id = q.company_id
       ORDER BY pi.date DESC, pi.id DESC LIMIT 7`
    )
    .all();

  const activity = [
    ...quotations.map((r) => ({
      type: 'quotation',
      id: r.id,
      number: r.number,
      company_name: r.company_name,
      status: r.status,
      date: r.date,
    })),
    ...purchaseOrders.map((r) => ({
      type: 'purchase_order',
      id: r.id,
      number: r.number,
      company_name: r.company_name,
      status: r.status,
      date: r.date,
    })),
    ...performaInvoices.map((r) => ({
      type: 'performa_invoice',
      id: r.id,
      number: r.number,
      company_name: r.company_name,
      status: r.status,
      date: r.date,
    })),
  ]
    .sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.id - a.id)
    .slice(0, 7);

  res.json({ activity });
});

// 7. Business Health Score Calculation
export const NEW_CUSTOMER_WINDOW_DAYS = 90;
export const STRONG_VALUE_MULTIPLIER = 1.5;
export const HEALTH_SCORE_TIERS = { green: 70, yellow: 40 };
export const TIER_LABELS = { green: 'Strong', yellow: 'Needs Attention', red: 'At Risk' };

export function classifyHealthStatus({ daysSinceFirstOrder, daysSinceLastOrder, totalRevenue, avgRevenue, lapseDays }) {
  if (daysSinceFirstOrder <= NEW_CUSTOMER_WINDOW_DAYS) return 'new';
  if (daysSinceLastOrder >= lapseDays) return 'inactive';
  if (daysSinceLastOrder >= lapseDays * 0.5) return 'at_risk';
  if (avgRevenue > 0 && totalRevenue >= avgRevenue * STRONG_VALUE_MULTIPLIER) return 'strong';
  return 'active';
}

function tierFor(score) {
  if (score >= HEALTH_SCORE_TIERS.green) return 'green';
  if (score >= HEALTH_SCORE_TIERS.yellow) return 'yellow';
  return 'red';
}

export function getBusinessHealth() {
  // 1. Sales — value-weighted pipeline momentum
  const pipeline = getPipeline();
  const acceptedStage = pipeline.stages.find((s) => s.key === 'accepted') || { count: 0, value: 0 };
  const wonValue = acceptedStage.value;
  const salesScore = pipeline.summary.totalValue > 0 ? (wonValue / pipeline.summary.totalValue) * 100 : null;

  // 2. Customer Health — classification across companies with sales history
  const settings = db.prepare(`SELECT default_lapse_months FROM company_settings WHERE id = 1`).get();
  const lapseMonths = settings?.default_lapse_months ?? 12;
  const lapseDays = Math.round(lapseMonths * 30.44);

  const custRows = db
    .prepare(
      `SELECT company_name, COUNT(*) AS order_count, COALESCE(SUM(total_amount), 0) AS total_revenue,
              CAST(julianday('now') - julianday(MIN(sale_date)) AS INTEGER) AS days_since_first_order,
              CAST(julianday('now') - julianday(MAX(sale_date)) AS INTEGER) AS days_since_last_order
       FROM sales_record
       WHERE needs_review = 0 AND sale_date IS NOT NULL AND company_name IS NOT NULL
       GROUP BY company_name`
    )
    .all();

  const avgRevRow = db
    .prepare(
      `SELECT AVG(total) AS avg_total FROM (
         SELECT company_name, SUM(total_amount) AS total FROM sales_record WHERE needs_review = 0 GROUP BY company_name
       ) t`
    )
    .get();
  const avgRevenue = Number(avgRevRow?.avg_total) || 0;

  let healthyCount = 0;
  for (const r of custRows) {
    const status = classifyHealthStatus({
      daysSinceFirstOrder: Number(r.days_since_first_order),
      daysSinceLastOrder: Number(r.days_since_last_order),
      totalRevenue: Number(r.total_revenue),
      avgRevenue,
      lapseDays,
    });
    if (status === 'new' || status === 'strong' || status === 'active') healthyCount++;
  }
  const customerHealthScore = custRows.length > 0 ? (healthyCount / custRows.length) * 100 : null;

  // 3. Follow-Ups — % of scheduled follow-ups that are not overdue
  const { overdue, dueToday, upcoming } = getGroupedFollowUps();
  const totalScheduled = overdue.length + dueToday.length + upcoming.length;
  const followUpsScore = totalScheduled === 0 ? 100 : ((totalScheduled - overdue.length) / totalScheduled) * 100;

  // 4. Conversions — of quotations that left draft, % that reached accepted
  const decidedCount = pipeline.stages
    .filter((s) => s.key !== 'draft')
    .reduce((sum, s) => sum + s.count, 0);
  const convertedCount = acceptedStage.count;
  const conversionsScore = decidedCount > 0 ? (convertedCount / decidedCount) * 100 : null;

  // 5. Repeat Business — % of customers with 2+ orders
  const repeatCount = custRows.filter((r) => Number(r.order_count) >= 2).length;
  const repeatBusinessScore = custRows.length > 0 ? (repeatCount / custRows.length) * 100 : null;

  const components = {
    sales: {
      label: 'Sales',
      score: salesScore == null ? null : Math.round(salesScore),
      detail:
        salesScore == null
          ? 'No quotation activity yet.'
          : `₹${Math.round(wonValue).toLocaleString('en-IN')} of ₹${Math.round(pipeline.summary.totalValue).toLocaleString('en-IN')} in quoted value has been accepted.`,
    },
    customerHealth: {
      label: 'Customer Health',
      score: customerHealthScore == null ? null : Math.round(customerHealthScore),
      detail:
        customerHealthScore == null
          ? 'No customer purchase history yet.'
          : `${healthyCount} of ${custRows.length} customers with purchase history are new, active, or strong.`,
    },
    followUps: {
      label: 'Follow-Ups',
      score: Math.round(followUpsScore),
      detail:
        totalScheduled === 0
          ? 'No follow-ups currently scheduled.'
          : `${overdue.length} of ${totalScheduled} scheduled follow-ups are overdue.`,
    },
    conversions: {
      label: 'Conversions',
      score: conversionsScore == null ? null : Math.round(conversionsScore),
      detail:
        conversionsScore == null
          ? 'No quotations have been sent yet.'
          : `${convertedCount} of ${decidedCount} quotations that left draft were accepted.`,
    },
    repeatBusiness: {
      label: 'Repeat Business',
      score: repeatBusinessScore == null ? null : Math.round(repeatBusinessScore),
      detail:
        repeatBusinessScore == null
          ? 'No customer purchase history yet.'
          : `${repeatCount} of ${custRows.length} customers with purchase history have placed 2 or more orders.`,
    },
  };

  const scored = Object.values(components).filter((c) => c.score != null);
  const overallScore = scored.length > 0 ? Math.round(scored.reduce((sum, c) => sum + c.score, 0) / scored.length) : null;

  // Recommendation — point to weakest scored component if < 70
  const scoredEntries = Object.entries(components).filter(([, c]) => c.score != null);
  let recommendation = null;

  if (scoredEntries.length > 0) {
    const [weakestKey, weakestComponent] = scoredEntries.reduce((min, cur) => (cur[1].score < min[1].score ? cur : min));
    if (weakestComponent.score < HEALTH_SCORE_TIERS.green) {
      if (weakestKey === 'sales') {
        const openValue = pipeline.summary.totalValue - wonValue;
        recommendation = {
          component: 'sales',
          title: 'Your biggest opportunity is converting quoted business.',
          detail: `₹${Math.round(openValue).toLocaleString('en-IN')} in quotations hasn't become accepted business yet.`,
        };
      } else if (weakestKey === 'customerHealth') {
        const atRiskRows = custRows.filter((r) => {
          const status = classifyHealthStatus({
            daysSinceFirstOrder: Number(r.days_since_first_order),
            daysSinceLastOrder: Number(r.days_since_last_order),
            totalRevenue: Number(r.total_revenue),
            avgRevenue,
            lapseDays,
          });
          return status === 'at_risk' || status === 'inactive';
        });
        const atRiskValue = atRiskRows.reduce((sum, r) => sum + Number(r.total_revenue), 0);
        recommendation = {
          component: 'customerHealth',
          title: 'Your biggest opportunity is re-engaging at-risk customers.',
          detail: `${atRiskRows.length} customers worth ₹${Math.round(atRiskValue).toLocaleString('en-IN')} in historical business are at risk or inactive.`,
        };
      } else if (weakestKey === 'followUps') {
        const overdueValueRow = db
          .prepare(
            `SELECT COUNT(*) AS overdue_count, COALESCE(SUM(q.total), 0) AS overdue_value
             FROM quotation_follow_up f JOIN quotation q ON q.id = f.quotation_id
             WHERE f.status = 'scheduled' AND f.follow_up_date < date('now')`
          )
          .get();
        recommendation = {
          component: 'followUps',
          title: 'Your biggest opportunity is quotation follow-up.',
          detail: `${Number(overdueValueRow.overdue_count)} quotations worth ₹${Math.round(Number(overdueValueRow.overdue_value)).toLocaleString('en-IN')} need attention.`,
        };
      } else if (weakestKey === 'conversions') {
        const openStages = pipeline.stages.filter((s) => s.key === 'sent');
        const openValue = openStages.reduce((sum, s) => sum + s.value, 0);
        const openCount = openStages.reduce((sum, s) => sum + s.count, 0);
        recommendation = {
          component: 'conversions',
          title: 'Your biggest opportunity is closing open quotations.',
          detail: `${openCount} quotations worth ₹${Math.round(openValue).toLocaleString('en-IN')} are currently awaiting customer decision.`,
        };
      } else if (weakestKey === 'repeatBusiness') {
        const oneTimeCount = custRows.filter((r) => Number(r.order_count) === 1).length;
        recommendation = {
          component: 'repeatBusiness',
          title: 'Your biggest opportunity is encouraging repeat purchases.',
          detail: `${oneTimeCount} of ${custRows.length} customers have only ordered once — a follow-up could turn them into repeat customers.`,
        };
      }
    }
  }

  return {
    overallScore,
    tier: overallScore == null ? null : tierFor(overallScore),
    tierLabel: overallScore == null ? null : TIER_LABELS[tierFor(overallScore)],
    components,
    recommendation,
  };
}

router.get('/business-health', (req, res) => {
  try {
    res.json(getBusinessHealth());
  } catch (err) {
    console.error('Error calculating business health:', err);
    res.status(500).json({ error: 'Failed to calculate business health score.' });
  }
});

export default router;
