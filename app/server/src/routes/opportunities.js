import { Router } from 'express';
import db from '../db/index.js';
import { getAllCompanyHealth, HEALTH_LABELS } from './companies.js';

const router = Router();

// Detector constants matching the authoritative business rules
const CROSS_SELL_MIN_ANCHOR_PURCHASES = 3;
const CROSS_SELL_STRONG_ANCHOR_PURCHASES = 5;
const CROSS_SELL_MIN_CO_BUYERS = 2;
const CROSS_SELL_STRONG_CO_BUYER_RATIO = 0.5;
const AOV_TREND_THRESHOLD = 0.3; // 30% increase in average order value
const STALE_AWAITING_RESPONSE_DAYS = 14;
const HIGH_VALUE_QUOTATION_MULTIPLIER = 1.5;
const MULTIPLE_UNCONVERTED_THRESHOLD = 2;

/**
 * Builds a lookup map for company ID by lowercase trimmed name.
 * Prevents N+1 database lookups when resolving company names from sales records.
 */
function getCompanyLookup() {
  const companies = db.prepare(`SELECT id, name FROM company`).all();
  const map = new Map();
  for (const c of companies) {
    if (c.name) {
      map.set(c.name.trim().toLowerCase(), c.id);
    }
  }
  return map;
}

/**
 * 1. Cross-Sell Detector
 * Identifies products that other customers who bought the same anchor product frequently also buy.
 */
function detectCrossSell(companyLookup) {
  const rows = db
    .prepare(
      `WITH anchors AS (
         SELECT company_name, part_no, COUNT(*) AS purchase_count, MAX(product_description) AS anchor_desc
         FROM sales_record WHERE needs_review = 0 AND part_no IS NOT NULL AND company_name IS NOT NULL
         GROUP BY company_name, part_no
         HAVING COUNT(*) >= ?
       ),
       part_buyers AS (
         SELECT DISTINCT company_name, part_no FROM sales_record WHERE needs_review = 0 AND part_no IS NOT NULL AND company_name IS NOT NULL
       ),
       part_desc AS (
         SELECT part_no, MAX(product_description) AS description FROM sales_record WHERE needs_review = 0 GROUP BY part_no
       )
       SELECT
         a.company_name, a.part_no AS anchor_part, a.anchor_desc, a.purchase_count,
         pb2.part_no AS candidate_part, pd.description AS candidate_desc,
         COUNT(DISTINCT pb2.company_name) AS co_buyers,
         (SELECT COUNT(DISTINCT company_name) FROM part_buyers WHERE part_no = a.part_no AND company_name <> a.company_name) AS total_other_anchor_buyers
       FROM anchors a
       JOIN part_buyers pb1 ON pb1.part_no = a.part_no AND pb1.company_name <> a.company_name
       JOIN part_buyers pb2 ON pb2.company_name = pb1.company_name AND pb2.part_no <> a.part_no
       JOIN part_desc pd ON pd.part_no = pb2.part_no
       WHERE NOT EXISTS (
         SELECT 1 FROM part_buyers x WHERE x.company_name = a.company_name AND x.part_no = pb2.part_no
       )
       GROUP BY a.company_name, a.part_no, a.anchor_desc, a.purchase_count, pb2.part_no, pd.description
       HAVING COUNT(DISTINCT pb2.company_name) >= ?
       ORDER BY a.company_name, a.part_no, co_buyers DESC`
    )
    .all(CROSS_SELL_MIN_ANCHOR_PURCHASES, CROSS_SELL_MIN_CO_BUYERS);

  // Keep best (highest co_buyers) candidate per (company, anchor_part)
  const seen = new Set();
  const best = [];
  for (const r of rows) {
    const key = `${r.company_name}|${r.anchor_part}`;
    if (seen.has(key)) continue;
    seen.add(key);
    best.push(r);
  }

  return best.map((r) => {
    const purchaseCount = Number(r.purchase_count);
    const coBuyers = Number(r.co_buyers);
    const totalOtherBuyers = Number(r.total_other_anchor_buyers);
    const ratio = totalOtherBuyers > 0 ? coBuyers / totalOtherBuyers : 0;
    const priority =
      purchaseCount >= CROSS_SELL_STRONG_ANCHOR_PURCHASES && ratio >= CROSS_SELL_STRONG_CO_BUYER_RATIO ? 'high' : 'medium';
    const anchorLabel = r.anchor_desc || r.anchor_part;
    const candidateLabel = r.candidate_desc || r.candidate_part;
    const companyId = companyLookup.get(r.company_name.trim().toLowerCase()) ?? null;

    return {
      type: 'cross_sell',
      priority,
      company_id: companyId,
      company_name: r.company_name,
      title: 'Cross-sell opportunity',
      description: `Purchased ${anchorLabel} ${purchaseCount} times but has never purchased ${candidateLabel}.`,
      action: `Consider cross-selling ${candidateLabel}.`,
      evidence: {
        anchor_part_no: r.anchor_part,
        anchor_product: anchorLabel,
        purchases: purchaseCount,
        recommended_part_no: r.candidate_part,
        recommended_product: candidateLabel,
        co_buyers: coBuyers,
        total_other_anchor_buyers: totalOtherBuyers,
      },
    };
  });
}

/**
 * 2. Customer At-Risk Detector
 * Reuses the authoritative Customer Health classifications ('inactive' and 'at_risk').
 */
function detectAtRisk(customers) {
  return customers
    .filter((s) => s.status === 'at_risk' || s.status === 'inactive')
    .map((s) => {
      const priority = s.status === 'inactive' ? 'high' : 'medium';
      const action = s.status === 'inactive' ? 'Re-engage this customer.' : 'Customer may be at risk — consider follow-up.';
      return {
        type: 'at_risk',
        priority,
        company_id: s.company_id,
        company_name: s.company_name,
        title: `Customer ${HEALTH_LABELS[s.status] || s.status}`,
        description:
          s.status === 'inactive'
            ? `No purchase in ${s.daysSinceLastOrder} days (past the ${s.lapseMonths}-month lapse threshold).`
            : `No purchase in ${s.daysSinceLastOrder} days — approaching the ${s.lapseMonths}-month lapse threshold.`,
        action,
        evidence: {
          days_since_last_order: s.daysSinceLastOrder,
          lapse_months: s.lapseMonths,
          total_revenue: s.totalRevenue,
          order_count: s.orderCount,
        },
      };
    });
}

/**
 * 3. High-Value Customer Detector
 * Detects strong accounts without open activity in pipeline, plus customers with rising AOV trend.
 */
function detectHighValue(customers, companyLookup) {
  const strong = customers.filter((s) => s.status === 'strong');

  // Authoritative open pipeline statuses: draft, sent, accepted
  const openPipelineRows = db
    .prepare(`SELECT DISTINCT company_id FROM quotation WHERE status IN ('draft', 'sent', 'accepted')`)
    .all();
  const openPipelineCompanyIds = new Set(openPipelineRows.map((r) => r.company_id));

  const staticOpportunities = strong
    .filter((s) => s.company_id != null && !openPipelineCompanyIds.has(s.company_id))
    .map((s) => ({
      type: 'high_value',
      priority: 'high',
      company_id: s.company_id,
      company_name: s.company_name,
      title: 'High-value account, no open activity',
      description: `Total business of ₹${Math.round(s.totalRevenue).toLocaleString('en-IN')} across ${s.orderCount} orders, well above average, with no currently open quotations.`,
      action: 'High-value account — prioritize relationship.',
      evidence: { total_revenue: s.totalRevenue, order_count: s.orderCount },
    }));

  // Trend: Trailing 6 months vs prior 6 months
  const trendRows = db
    .prepare(
      `SELECT company_name,
         SUM(CASE WHEN sale_date >= date('now', '-6 months') THEN total_amount ELSE 0 END) AS recent_total,
         COUNT(CASE WHEN sale_date >= date('now', '-6 months') THEN 1 END) AS recent_count,
         SUM(CASE WHEN sale_date >= date('now', '-12 months') AND sale_date < date('now', '-6 months') THEN total_amount ELSE 0 END) AS prior_total,
         COUNT(CASE WHEN sale_date >= date('now', '-12 months') AND sale_date < date('now', '-6 months') THEN 1 END) AS prior_count
       FROM sales_record WHERE needs_review = 0 AND company_name IS NOT NULL
       GROUP BY company_name
       HAVING COUNT(CASE WHEN sale_date >= date('now', '-6 months') THEN 1 END) > 0
          AND COUNT(CASE WHEN sale_date >= date('now', '-12 months') AND sale_date < date('now', '-6 months') THEN 1 END) > 0`
    )
    .all();

  const trendOpportunities = [];
  for (const r of trendRows) {
    const recentAov = Number(r.recent_total) / Number(r.recent_count);
    const priorAov = Number(r.prior_total) / Number(r.prior_count);
    if (priorAov <= 0) continue;
    const pctChange = (recentAov - priorAov) / priorAov;
    if (pctChange >= AOV_TREND_THRESHOLD) {
      const companyId = companyLookup.get(r.company_name.trim().toLowerCase()) ?? null;
      trendOpportunities.push({
        type: 'high_value',
        priority: 'medium',
        company_id: companyId,
        company_name: r.company_name,
        title: 'Rising order value',
        description: `Average order value increased ${Math.round(pctChange * 100)}% over the last 6 months.`,
        action: 'High-value account — prioritize relationship.',
        evidence: { recent_avg_order_value: recentAov, prior_avg_order_value: priorAov, pct_change: pctChange },
      });
    }
  }

  return [...staticOpportunities, ...trendOpportunities];
}

/**
 * 4. Quotation Conversion Detector
 * Identifies high-value unconverted quotations, multiple unconverted quotations, and stale awaiting-response quotations.
 */
function detectQuotationConversion() {
  const unconvertedRows = db
    .prepare(
      `SELECT q.id, q.number, q.company_id, c.name AS company_name, q.total, q.status, q.date
       FROM quotation q JOIN company c ON c.id = q.company_id
       WHERE q.status <> 'rejected'
         AND NOT EXISTS (SELECT 1 FROM performa_invoice pi WHERE pi.quotation_id = q.id)
         AND NOT EXISTS (SELECT 1 FROM purchase_order po WHERE po.quotation_id = q.id)`
    )
    .all();

  const avgRow = db.prepare(`SELECT AVG(total) AS avg_total FROM quotation`).get();
  const avgQuotationValue = Number(avgRow?.avg_total) || 0;

  const opportunities = [];

  // High-value unconverted: quotation total >= 1.5x average quotation
  for (const q of unconvertedRows) {
    const total = Number(q.total);
    if (avgQuotationValue > 0 && total >= avgQuotationValue * HIGH_VALUE_QUOTATION_MULTIPLIER) {
      opportunities.push({
        type: 'quotation_conversion',
        priority: 'high',
        company_id: q.company_id,
        company_name: q.company_name,
        title: 'High-value quotation not yet converted',
        description: `Quotation ${q.number} for ₹${Math.round(total).toLocaleString('en-IN')} (status: ${q.status}) has not converted to a purchase order or performa invoice.`,
        action: 'Follow up to move this quotation forward.',
        evidence: { quotation_id: q.id, quotation_number: q.number, total, status: q.status, avg_quotation_value: avgQuotationValue },
      });
    }
  }

  // Multiple unconverted quotations for the same company: >= 2
  const byCompany = new Map();
  for (const q of unconvertedRows) {
    if (!byCompany.has(q.company_id)) byCompany.set(q.company_id, { company_name: q.company_name, quotations: [] });
    byCompany.get(q.company_id).quotations.push(q);
  }
  for (const [companyId, group] of byCompany) {
    if (group.quotations.length >= MULTIPLE_UNCONVERTED_THRESHOLD) {
      const totalValue = group.quotations.reduce((sum, q) => sum + Number(q.total), 0);
      opportunities.push({
        type: 'quotation_conversion',
        priority: 'medium',
        company_id: companyId,
        company_name: group.company_name,
        title: 'Multiple unconverted quotations',
        description: `${group.quotations.length} quotations totalling ₹${Math.round(totalValue).toLocaleString('en-IN')} have not converted.`,
        action: 'Review open quotations for this customer.',
        evidence: { quotation_count: group.quotations.length, total_value: totalValue, quotation_numbers: group.quotations.map((q) => q.number) },
      });
    }
  }

  // Stale awaiting customer response: status = 'sent' AND days_since_sent > 14
  const staleRows = db
    .prepare(
      `SELECT q.id, q.number, q.company_id, c.name AS company_name, q.total,
              CAST(julianday('now') - julianday(q.date) AS INTEGER) AS days_since_sent
       FROM quotation q JOIN company c ON c.id = q.company_id
       WHERE q.status = 'sent' AND (julianday('now') - julianday(q.date)) > ?`
    )
    .all(STALE_AWAITING_RESPONSE_DAYS);

  for (const q of staleRows) {
    opportunities.push({
      type: 'quotation_conversion',
      priority: 'medium',
      company_id: q.company_id,
      company_name: q.company_name,
      title: 'Awaiting customer response',
      description: `Quotation ${q.number} has been awaiting a response for ${Number(q.days_since_sent)} days.`,
      action: 'Follow up with the customer on this quotation.',
      evidence: { quotation_id: q.id, quotation_number: q.number, days_since_sent: Number(q.days_since_sent), total: Number(q.total) },
    });
  }

  return opportunities;
}

/**
 * GET /api/opportunities
 * Returns all detected growth opportunities and summary counts.
 */
router.get('/', (req, res) => {
  try {
    const companyLookup = getCompanyLookup();
    const { customers } = getAllCompanyHealth();

    const crossSell = detectCrossSell(companyLookup);
    const atRisk = detectAtRisk(customers);
    const highValue = detectHighValue(customers, companyLookup);
    const quotationConversion = detectQuotationConversion();

    const all = [...crossSell, ...atRisk, ...highValue, ...quotationConversion];
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    all.sort((a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2));

    const highCount = all.filter((o) => o.priority === 'high').length;
    const mediumCount = all.filter((o) => o.priority === 'medium').length;
    const lowCount = all.filter((o) => o.priority === 'low').length;

    res.json({
      opportunities: all,
      summary: {
        total: all.length,
        high: highCount,
        medium: mediumCount,
        low: lowCount,
        highPriority: highCount,
      },
    });
  } catch (err) {
    console.error('Error computing growth opportunities:', err);
    res.status(500).json({ error: 'Failed to compute growth opportunities' });
  }
});

export default router;
