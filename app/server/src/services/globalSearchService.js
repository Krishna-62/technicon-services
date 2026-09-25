import db from '../db/index.js';

/**
 * Normalizes query string for tokens and measurements
 * e.g., "2 ml screw cap" -> tokens: ["2ml", "screw", "cap"], clean: "2ml screw cap"
 */
export function normalizeQuery(rawQuery) {
  if (!rawQuery) return { clean: '', raw: '', tokens: [] };
  const raw = String(rawQuery).trim();
  
  // Normalize measurement spaces: "2 ml" -> "2ml", "2 - ml" -> "2ml"
  let clean = raw.toLowerCase()
    .replace(/(\d+)\s*-\s*(ml|l|g|kg|mg|mm|cm|m)\b/gi, '$1$2')
    .replace(/(\d+)\s+(ml|l|g|kg|mg|mm|cm|m)\b/gi, '$1$2')
    .replace(/[^\w\s\/\-\.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const tokens = clean.split(' ').filter(Boolean);
  return { clean, raw, tokens };
}

/**
 * Classifies query intent based on patterns and keywords
 */
export function detectSearchIntent(rawQuery, cleanQuery) {
  const q = cleanQuery.toLowerCase();
  const rawUpper = rawQuery.toUpperCase().trim();

  // Document Number Patterns
  if (/^QTN[\/-]?\d+/i.test(rawUpper) || /^\d{4}$/.test(rawUpper) || (q.includes('quotation') && !q.includes('aic'))) {
    return 'QUOTATION';
  }
  if (/^PO[\/-]?\d+/i.test(rawUpper) || q.includes('purchase order') || (q.startsWith('po ') && q.length < 15)) {
    return 'PURCHASE_ORDER';
  }
  if (/^PI[\/-]?\d+/i.test(rawUpper) || q.includes('performa') || (q.startsWith('pi ') && q.length < 15)) {
    return 'PERFORMA_INVOICE';
  }
  if (/^SR[\/-]?\d+/i.test(rawUpper) || q.includes('sale report')) {
    return 'SALE_REPORT';
  }

  // Stock / Inventory Intent
  const stockKeywords = ['stock', 'inventory', 'available', 'on hand', 'on_hand', 'reserved', 'warehouse', 'quantity', 'how many', 'availability'];
  if (stockKeywords.some((k) => q.includes(k))) {
    return 'PRODUCT_STOCK';
  }

  // Follow-Up Intent
  const followupKeywords = ['followup', 'follow-up', 'overdue', 'due today', 'today followups'];
  if (followupKeywords.some((k) => q.includes(k))) {
    return 'FOLLOW_UP';
  }

  // Warehouse Intent
  if (/^HYD[-_\s]?\d+/i.test(rawUpper) || q.includes('warehouse') || q.includes('hyderabad central')) {
    return 'WAREHOUSE';
  }

  // Customer Context Intent (e.g. "quotation AIC", "sales AIC", "follow up AIC")
  const customerContextKeywords = ['quotation', 'sales', 'stock', 'followup', 'follow up', 'orders', 'products'];
  if (customerContextKeywords.some((k) => q.includes(k))) {
    return 'CUSTOMER_CONTEXT';
  }

  return 'GENERAL_SEARCH';
}

/**
 * Performs universal global search across all ERP entities
 */
export function searchGlobal(userContext, queryStr, options = {}) {
  const limit = options.limit || 30;
  const { clean, raw, tokens } = normalizeQuery(queryStr);

  if (!clean || clean.length === 0) {
    return {
      query: queryStr,
      intent: 'GENERAL_SEARCH',
      isExactMatch: false,
      bestMatch: null,
      results: [],
      groups: {},
    };
  }

  const intent = detectSearchIntent(raw, clean);

  // Extract core entity target tokens by stripping intent keywords
  const intentKeywords = [
    'stock', 'inventory', 'available', 'on hand', 'on_hand', 'reserved', 'warehouse', 'quantity', 'how many', 'availability',
    'quotation', 'quotations', 'purchase order', 'po', 'performa invoice', 'pi', 'sale report', 'sr',
    'followup', 'follow-up', 'overdue', 'due today', 'today', 'sales', 'orders', 'products', 'customer'
  ];

  let targetTokens = tokens.filter((t) => !intentKeywords.includes(t.toLowerCase()));
  if (targetTokens.length === 0) targetTokens = tokens;
  
  const targetClean = targetTokens.join(' ');
  const rawLike = `%${raw}%`;
  const cleanLike = `%${clean}%`;
  const targetLike = `%${targetClean}%`;
  const firstTokenLike = `%${targetTokens[0]}%`;

  const results = [];

  // User Security Context Filters
  const firmId = userContext?.firm_id;
  const branchId = userContext?.branch_id;

  // -------------------------------------------------------------
  // 1. PRODUCTS & STOCK
  // -------------------------------------------------------------
  try {
    const productRows = db.prepare(`
      SELECT 
        p.id,
        p.part_no,
        p.description,
        p.hsn_sac,
        p.default_price,
        COALESCE(SUM(s.on_hand_quantity), 0) as total_on_hand,
        COALESCE(SUM(s.reserved_quantity), 0) as total_reserved,
        (COALESCE(SUM(s.on_hand_quantity), 0) - COALESCE(SUM(s.reserved_quantity), 0)) as total_available
      FROM product p
      LEFT JOIN inventory_stock s ON s.product_id = p.id
      WHERE 
        p.part_no LIKE ? OR 
        p.part_no LIKE ? OR
        p.description LIKE ? OR 
        p.description LIKE ? OR
        p.description LIKE ?
      GROUP BY p.id
      LIMIT 15
    `).all(rawLike, targetLike, rawLike, targetLike, firstTokenLike);

    productRows.forEach((p) => {
      let score = 3;
      const pDescLower = (p.description || '').toLowerCase();
      const pPartLower = (p.part_no || '').toLowerCase();

      if (pPartLower === clean || pPartLower === targetClean || pPartLower === raw.toLowerCase()) score = 10;
      else if (pDescLower === clean || pDescLower === targetClean) score = 9;
      else if (pPartLower.startsWith(targetClean) || pPartLower.includes(targetClean)) score = 8;
      else if (pDescLower.includes(targetClean)) score = 7;
      else if (targetTokens.every((t) => pDescLower.includes(t) || pPartLower.includes(t))) score = 5;

      const entityType = intent === 'PRODUCT_STOCK' ? 'PRODUCT_STOCK' : 'PRODUCT';
      const route = intent === 'PRODUCT_STOCK' 
        ? `/inventory/stock?productId=${p.id}` 
        : `/products/${p.id}`;

      results.push({
        type: entityType,
        id: p.id,
        title: p.description,
        subtitle: `PN: ${p.part_no} • Avail: ${p.total_available} (Hand: ${p.total_on_hand})`,
        metadata: {
          part_no: p.part_no,
          price: p.default_price,
          on_hand: p.total_on_hand,
          reserved: p.total_reserved,
          available: p.total_available,
        },
        route,
        score,
      });
    });
  } catch (err) {
    console.error('Error searching products:', err.message);
  }

  // -------------------------------------------------------------
  // 2. CUSTOMERS / COMPANIES
  // -------------------------------------------------------------
  try {
    const companyRows = db.prepare(`
      SELECT 
        c.id,
        c.name,
        c.address,
        c.state,
        c.email,
        c.phone,
        c.gstin,
        c.contact_person
      FROM company c
      WHERE 
        c.name LIKE ? OR 
        c.name LIKE ? OR
        c.address LIKE ? OR 
        c.state LIKE ? OR 
        c.email LIKE ? OR 
        c.phone LIKE ? OR 
        c.gstin LIKE ? OR
        c.contact_person LIKE ?
      LIMIT 15
    `).all(rawLike, targetLike, targetLike, targetLike, targetLike, targetLike, targetLike, targetLike);

    companyRows.forEach((c) => {
      let score = 3;
      const cNameLower = (c.name || '').toLowerCase();

      if (cNameLower === clean || cNameLower === targetClean) score = 10;
      else if (cNameLower.startsWith(clean) || cNameLower.startsWith(targetClean)) score = 8;
      else if (cNameLower.includes(clean) || cNameLower.includes(targetClean)) score = 7;
      else if (targetTokens.every((t) => cNameLower.includes(t))) score = 5;

      let targetRoute = `/companies/${c.id}`;

      results.push({
        type: 'CUSTOMER',
        id: c.id,
        title: c.name,
        subtitle: `GSTIN: ${c.gstin || 'N/A'} • Contact: ${c.contact_person || c.phone || 'N/A'} • ${c.state || ''}`,
        metadata: {
          gstin: c.gstin,
          state: c.state,
          contact: c.contact_person,
        },
        route: targetRoute,
        score,
      });
    });
  } catch (err) {
    console.error('Error searching companies:', err.message);
  }

  // -------------------------------------------------------------
  // 3. QUOTATIONS
  // -------------------------------------------------------------
  try {
    let qSql = `
      SELECT 
        q.id,
        q.number,
        q.date,
        q.status,
        q.net_subtotal,
        c.name as customer_name,
        e.name as engineer_name,
        b.branch_name
      FROM quotation q
      JOIN company c ON c.id = q.company_id
      LEFT JOIN sales_engineer e ON e.id = q.sales_engineer_id
      LEFT JOIN branch b ON b.id = q.branch_id
      WHERE 
        q.number LIKE ? OR 
        q.number LIKE ? OR
        c.name LIKE ? OR 
        c.name LIKE ? OR
        e.name LIKE ?
    `;

    const qParams = [rawLike, targetLike, rawLike, targetLike, rawLike];
    if (firmId) {
      qSql += ` AND (q.firm_id IS NULL OR q.firm_id = ?)`;
      qParams.push(firmId);
    }
    if (branchId) {
      qSql += ` AND (q.branch_id IS NULL OR q.branch_id = ?)`;
      qParams.push(branchId);
    }

    qSql += ` ORDER BY q.id DESC LIMIT 15`;
    const quotationRows = db.prepare(qSql).all(...qParams);

    quotationRows.forEach((q) => {
      let score = 3;
      const qNumLower = (q.number || '').toLowerCase();
      const cNameLower = (q.customer_name || '').toLowerCase();

      if (qNumLower === clean || qNumLower === raw.toLowerCase() || qNumLower === targetClean) score = 10;
      else if (qNumLower.endsWith(targetClean) || qNumLower.includes(targetClean)) score = 8;
      else if (cNameLower.includes(targetClean)) score = 6;

      results.push({
        type: 'QUOTATION',
        id: q.id,
        title: q.number,
        subtitle: `Customer: ${q.customer_name} • ₹${(q.net_subtotal || 0).toLocaleString('en-IN')} • Status: ${q.status}`,
        metadata: {
          customer: q.customer_name,
          engineer: q.engineer_name,
          status: q.status,
          net_subtotal: q.net_subtotal,
          date: q.date,
        },
        route: `/quotations/${q.id}`,
        score,
      });
    });
  } catch (err) {
    console.error('Error searching quotations:', err.message);
  }

  // -------------------------------------------------------------
  // 4. PURCHASE ORDERS
  // -------------------------------------------------------------
  try {
    const poRows = db.prepare(`
      SELECT 
        po.id,
        po.number,
        po.date,
        po.status,
        po.client_po_ref,
        q.number as quotation_number,
        c.name as customer_name
      FROM purchase_order po
      JOIN quotation q ON q.id = po.quotation_id
      JOIN company c ON c.id = q.company_id
      WHERE 
        po.number LIKE ? OR 
        po.number LIKE ? OR
        po.client_po_ref LIKE ? OR
        c.name LIKE ? OR
        c.name LIKE ?
      ORDER BY po.id DESC
      LIMIT 10
    `).all(rawLike, targetLike, targetLike, rawLike, targetLike);

    poRows.forEach((po) => {
      let score = 3;
      const poNumLower = (po.number || '').toLowerCase();
      if (poNumLower === clean || poNumLower === raw.toLowerCase() || poNumLower === targetClean) score = 10;
      else if (poNumLower.includes(targetClean)) score = 8;

      results.push({
        type: 'PURCHASE_ORDER',
        id: po.id,
        title: po.number,
        subtitle: `Customer: ${po.customer_name || 'N/A'} • Ref: ${po.client_po_ref || 'N/A'} • Status: ${po.status}`,
        metadata: {
          customer: po.customer_name,
          status: po.status,
          quotation_number: po.quotation_number,
        },
        route: `/purchase-orders/${po.id}`,
        score,
      });
    });
  } catch (err) {
    console.error('Error searching purchase orders:', err.message);
  }

  // -------------------------------------------------------------
  // 5. PERFORMA INVOICES
  // -------------------------------------------------------------
  try {
    const piRows = db.prepare(`
      SELECT 
        pi.id,
        pi.number,
        pi.date,
        pi.status,
        q.number as quotation_number,
        c.name as customer_name
      FROM performa_invoice pi
      JOIN quotation q ON q.id = pi.quotation_id
      JOIN company c ON c.id = q.company_id
      WHERE 
        pi.number LIKE ? OR 
        pi.number LIKE ? OR
        c.name LIKE ? OR
        c.name LIKE ?
      ORDER BY pi.id DESC
      LIMIT 10
    `).all(rawLike, targetLike, rawLike, targetLike);

    piRows.forEach((pi) => {
      let score = 3;
      const piNumLower = (pi.number || '').toLowerCase();
      if (piNumLower === clean || piNumLower === raw.toLowerCase() || piNumLower === targetClean) score = 10;
      else if (piNumLower.includes(targetClean)) score = 8;

      results.push({
        type: 'PERFORMA_INVOICE',
        id: pi.id,
        title: pi.number,
        subtitle: `Customer: ${pi.customer_name || 'N/A'} • Qtn: ${pi.quotation_number || 'N/A'} • Status: ${pi.status}`,
        metadata: {
          customer: pi.customer_name,
          status: pi.status,
          quotation_number: pi.quotation_number,
        },
        route: `/performa-invoices/${pi.id}`,
        score,
      });
    });
  } catch (err) {
    console.error('Error searching performa invoices:', err.message);
  }

  // -------------------------------------------------------------
  // 6. SALE REPORTS
  // -------------------------------------------------------------
  try {
    const srRows = db.prepare(`
      SELECT 
        sr.id,
        sr.report_number,
        sr.sale_date,
        sr.status,
        sr.total_amount,
        sr.company_name_snapshot as customer_name
      FROM sale_report sr
      WHERE 
        sr.report_number LIKE ? OR 
        sr.report_number LIKE ? OR
        sr.company_name_snapshot LIKE ? OR
        sr.company_name_snapshot LIKE ?
      ORDER BY sr.id DESC
      LIMIT 10
    `).all(rawLike, targetLike, rawLike, targetLike);

    srRows.forEach((sr) => {
      let score = 3;
      const srNumLower = (sr.report_number || '').toLowerCase();
      if (srNumLower === clean || srNumLower === raw.toLowerCase() || srNumLower === targetClean) score = 10;
      else if (srNumLower.includes(targetClean)) score = 8;

      results.push({
        type: 'SALE_REPORT',
        id: sr.id,
        title: sr.report_number,
        subtitle: `Customer: ${sr.customer_name || 'N/A'} • ₹${(sr.total_amount || 0).toLocaleString('en-IN')} • Status: ${sr.status}`,
        metadata: {
          customer: sr.customer_name,
          status: sr.status,
          amount: sr.total_amount,
        },
        route: `/sale-reports/${sr.id}`,
        score,
      });
    });
  } catch (err) {
    console.error('Error searching sale reports:', err.message);
  }

  // -------------------------------------------------------------
  // 7. SALES ENGINEERS
  // -------------------------------------------------------------
  try {
    const engRows = db.prepare(`
      SELECT id, name, employee_code, email, phone, designation
      FROM sales_engineer
      WHERE name LIKE ? OR name LIKE ? OR employee_code LIKE ? OR email LIKE ?
      LIMIT 10
    `).all(rawLike, targetLike, rawLike, rawLike);

    engRows.forEach((eng) => {
      let score = 3;
      const eNameLower = (eng.name || '').toLowerCase();
      if (eNameLower === clean || eNameLower === targetClean) score = 10;
      else if (eNameLower.includes(clean) || eNameLower.includes(targetClean)) score = 7;

      results.push({
        type: 'SALES_ENGINEER',
        id: eng.id,
        title: eng.name,
        subtitle: `Emp Code: ${eng.employee_code || 'N/A'} • ${eng.designation || 'Sales Engineer'}`,
        metadata: {
          code: eng.employee_code,
          email: eng.email,
        },
        route: `/sales/engineers/${eng.id}`,
        score,
      });
    });
  } catch (err) {
    console.error('Error searching sales engineers:', err.message);
  }

  // -------------------------------------------------------------
  // 8. WAREHOUSES
  // -------------------------------------------------------------
  try {
    const whRows = db.prepare(`
      SELECT id, name, code, city, state, address
      FROM warehouse
      WHERE name LIKE ? OR name LIKE ? OR code LIKE ? OR city LIKE ?
      LIMIT 10
    `).all(rawLike, targetLike, rawLike, rawLike);

    whRows.forEach((wh) => {
      let score = 3;
      const whNameLower = (wh.name || '').toLowerCase();
      const whCodeLower = (wh.code || '').toLowerCase();

      if (whCodeLower === clean || whCodeLower === targetClean || whNameLower === clean || whNameLower === targetClean) score = 10;
      else if (whCodeLower.includes(targetClean) || whNameLower.includes(targetClean)) score = 8;

      results.push({
        type: 'WAREHOUSE',
        id: wh.id,
        title: wh.name,
        subtitle: `Code: ${wh.code || 'N/A'} • City: ${wh.city || 'HQ'}, ${wh.state || ''}`,
        metadata: {
          code: wh.code,
          city: wh.city,
        },
        route: `/inventory/warehouses/${wh.id}`,
        score,
      });
    });
  } catch (err) {
    console.error('Error searching warehouses:', err.message);
  }

  // -------------------------------------------------------------
  // 9. FOLLOW-UPS
  // -------------------------------------------------------------
  try {
    const fRows = db.prepare(`
      SELECT 
        f.id,
        f.follow_up_date,
        f.follow_up_time,
        f.priority,
        f.status,
        f.notes,
        c.name as customer_name,
        q.number as quotation_number,
        q.id as quotation_id
      FROM quotation_follow_up f
      LEFT JOIN company c ON c.id = f.company_id
      LEFT JOIN quotation q ON q.id = f.quotation_id
      WHERE 
        f.notes LIKE ? OR 
        f.notes LIKE ? OR
        c.name LIKE ? OR 
        c.name LIKE ? OR
        q.number LIKE ?
      ORDER BY f.follow_up_date DESC
      LIMIT 10
    `).all(rawLike, targetLike, rawLike, targetLike, rawLike);

    fRows.forEach((f) => {
      let score = 4;
      if (clean.includes('overdue')) score = 8;

      const targetRoute = clean.includes('overdue') 
        ? '/follow-ups/overdue' 
        : clean.includes('today') 
        ? '/follow-ups/due-today' 
        : f.quotation_id 
        ? `/quotations/${f.quotation_id}` 
        : '/follow-ups/due-today';

      results.push({
        type: 'FOLLOW_UP',
        id: f.id,
        title: `Follow-up: ${f.customer_name || 'Customer'}`,
        subtitle: `Due: ${f.follow_up_date} • Priority: ${f.priority} • Qtn: ${f.quotation_number || 'N/A'}`,
        metadata: {
          customer: f.customer_name,
          quotation_number: f.quotation_number,
          priority: f.priority,
          status: f.status,
          date: f.follow_up_date,
        },
        route: targetRoute,
        score,
      });
    });
  } catch (err) {
    console.error('Error searching follow ups:', err.message);
  }

  // -------------------------------------------------------------
  // SORT & GROUP RESULTS DETERMINISTICALLY
  // -------------------------------------------------------------
  results.sort((a, b) => b.score - a.score);

  const bestMatch = results.length > 0 && results[0].score >= 8 ? results[0] : null;
  const isExactMatch = Boolean(bestMatch && (bestMatch.score >= 9 || bestMatch.title.toLowerCase() === clean));

  // Group by category
  const groups = {
    BEST_MATCH: bestMatch ? [bestMatch] : [],
    PRODUCTS: results.filter((r) => r.type === 'PRODUCT').slice(0, 5),
    INVENTORY: results.filter((r) => r.type === 'PRODUCT_STOCK').slice(0, 5),
    CUSTOMERS: results.filter((r) => r.type === 'CUSTOMER').slice(0, 5),
    QUOTATIONS: results.filter((r) => r.type === 'QUOTATION').slice(0, 5),
    PURCHASE_ORDERS: results.filter((r) => r.type === 'PURCHASE_ORDER').slice(0, 5),
    PERFORMA_INVOICES: results.filter((r) => r.type === 'PERFORMA_INVOICE').slice(0, 5),
    SALE_REPORTS: results.filter((r) => r.type === 'SALE_REPORT').slice(0, 5),
    FOLLOW_UPS: results.filter((r) => r.type === 'FOLLOW_UP').slice(0, 5),
    SALES_ENGINEERS: results.filter((r) => r.type === 'SALES_ENGINEER').slice(0, 5),
    WAREHOUSES: results.filter((r) => r.type === 'WAREHOUSE').slice(0, 5),
  };

  // Trim empty groups
  Object.keys(groups).forEach((key) => {
    if (groups[key].length === 0) delete groups[key];
  });

  return {
    query: queryStr,
    intent,
    isExactMatch,
    bestMatch,
    results: results.slice(0, limit),
    groups,
  };
}
