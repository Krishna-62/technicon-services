import db from '../db/index.js';

/**
 * Helper to normalize fiscal year string (e.g. '2026-27' -> 'FY 2026-27')
 */
function normalizeFy(yearStr) {
  if (!yearStr) return 'FY 2026-27';
  const str = String(yearStr).trim();
  if (str.startsWith('FY ')) return str;
  return `FY ${str}`;
}

/**
 * Retrieve list of Sales Engineers
 */
export function getEngineers({ branchId = null, activeOnly = false, q = null, limit = 100, offset = 0 } = {}, customDb = db) {
  const database = customDb || db;
  let sql = `
    SELECT 
      e.id,
      e.employee_code AS code,
      e.employee_code,
      e.name,
      e.email,
      e.phone,
      e.designation,
      e.department,
      e.branch_id,
      e.is_active AS active,
      e.is_active,
      e.created_at,
      e.updated_at,
      b.branch_name,
      b.branch_code
    FROM sales_engineer e
    LEFT JOIN branch b ON b.id = e.branch_id
    WHERE 1=1
  `;
  const params = [];

  if (branchId) {
    sql += ` AND e.branch_id = ?`;
    params.push(branchId);
  }
  if (activeOnly) {
    sql += ` AND e.is_active = 1`;
  }
  if (q) {
    sql += ` AND (e.name LIKE ? OR e.employee_code LIKE ? OR e.email LIKE ? OR e.designation LIKE ?)`;
    const s = `%${q}%`;
    params.push(s, s, s, s);
  }

  sql += ` ORDER BY e.name ASC`;

  const rows = database.prepare(sql).all(...params);
  const total = rows.length;
  const paginated = rows.slice(offset, offset + limit);

  return paginated;
}

/**
 * Retrieve single Sales Engineer details with target and performance
 */
export function getEngineerById(id, { financialYear = 'FY 2026-27' } = {}, customDb = db) {
  const database = customDb || db;
  const engId = Number(id);
  if (!engId) return null;

  const engineer = database.prepare(`
    SELECT 
      e.id,
      e.employee_code AS code,
      e.employee_code,
      e.name,
      e.email,
      e.phone,
      e.designation,
      e.department,
      e.branch_id,
      e.is_active AS active,
      e.is_active,
      e.created_at,
      e.updated_at,
      b.branch_name,
      b.branch_code
    FROM sales_engineer e
    LEFT JOIN branch b ON b.id = e.branch_id
    WHERE e.id = ?
  `).get(engId);

  if (!engineer) return null;

  const fy = normalizeFy(financialYear);
  const rawFy = fy.replace('FY ', '');

  const quoteStats = database.prepare(`
    SELECT 
      COUNT(*) AS total_quotations,
      COALESCE(SUM(total), 0) AS total_quoted_value,
      SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) AS accepted_count,
      COALESCE(SUM(CASE WHEN status = 'accepted' THEN total ELSE 0 END), 0) AS accepted_value
    FROM quotation
    WHERE sales_engineer_id = ?
  `).get(engId);

  const salesStats = database.prepare(`
    SELECT 
      COUNT(DISTINCT sr.id) AS confirmed_sales_count,
      COALESCE(SUM(sr.total_amount), 0) AS confirmed_sales_value
    FROM sale_report sr
    LEFT JOIN quotation q ON q.id = sr.source_quotation_id
    WHERE (sr.sales_engineer_id = ? OR q.sales_engineer_id = ?)
      AND sr.status = 'CONFIRMED'
  `).get(engId, engId);

  const targetRow = database.prepare(`
    SELECT target_amount, financial_year
    FROM engineer_sales_targets
    WHERE engineer_id = ? AND (financial_year = ? OR financial_year = ?)
    LIMIT 1
  `).get(engId, fy, rawFy);

  const targetAmount = targetRow ? Number(targetRow.target_amount) : 0;
  const confirmedSalesValue = Number(salesStats?.confirmed_sales_value || 0);
  const confirmedSalesCount = Number(salesStats?.confirmed_sales_count || 0);
  const totalQuotedValue = Number(quoteStats?.total_quoted_value || 0);
  const totalQuotations = Number(quoteStats?.total_quotations || 0);
  const acceptedCount = Number(quoteStats?.accepted_count || 0);
  const acceptedValue = Number(quoteStats?.accepted_value || 0);

  let achievementPercent = 0;
  if (targetAmount > 0) {
    achievementPercent = Number(((confirmedSalesValue / targetAmount) * 100).toFixed(1));
  }

  const shortfallAmount = targetAmount > confirmedSalesValue ? targetAmount - confirmedSalesValue : 0;
  let status = 'NO_TARGET';
  if (targetAmount > 0) {
    if (confirmedSalesValue >= targetAmount) status = 'EXCEEDED';
    else if (confirmedSalesValue >= targetAmount * 0.7) status = 'ON_TRACK';
    else status = 'BEHIND';
  }

  const perf = {
    engineer_id: engId,
    engineerId: engId,
    code: engineer.code,
    employeeCode: engineer.employee_code,
    name: engineer.name,
    fiscal_year: fy,
    financial_year: fy,
    target_amount: targetAmount,
    targetAmount,
    quotation_count: totalQuotations,
    totalQuotations,
    quoted_amount: totalQuotedValue,
    totalQuotedValue,
    accepted_quotation_count: acceptedCount,
    acceptedCount,
    accepted_quotation_amount: acceptedValue,
    confirmed_sales_count: confirmedSalesCount,
    confirmedSalesCount,
    confirmed_sales_amount: confirmedSalesValue,
    confirmedSalesValue,
    achievement_pct: achievementPercent,
    achievementPercent,
    shortfall_amount: shortfallAmount,
    status,
  };

  return {
    ...engineer,
    current_year_target: targetRow ? { engineer_id: engId, fiscal_year: targetRow.financial_year, target_amount: targetAmount } : undefined,
    performance: perf,
  };
}

/**
 * CREATE a new Sales Engineer
 */
export function createEngineer({ code, employeeCode, name, email, phone, designation, department, branchId, joiningDate }, customDb = db) {
  const database = customDb || db;

  if (!name || !name.trim()) throw new Error('Engineer name is required');
  const codeVal = (code || employeeCode) ? String(code || employeeCode).trim() : `ENG-${Math.floor(1000 + Math.random() * 9000)}`;

  const existing = database.prepare(`SELECT id FROM sales_engineer WHERE employee_code = ?`).get(codeVal);
  if (existing) throw new Error(`Employee code '${codeVal}' already exists`);

  const info = database.prepare(`
    INSERT INTO sales_engineer (employee_code, name, email, phone, designation, department, branch_id, is_sales_engineer, is_active, joining_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, ?)
  `).run(
    codeVal,
    name.trim(),
    email ? email.trim() : null,
    phone ? phone.trim() : null,
    designation || 'Sales Engineer',
    department || 'Sales',
    branchId || null,
    joiningDate || new Date().toISOString().slice(0, 10)
  );

  return getEngineerById(info.lastInsertRowid, {}, database);
}

/**
 * UPDATE an existing Sales Engineer
 */
export function updateEngineer(id, { code, employeeCode, name, email, phone, designation, department, branchId, active, isActive, joiningDate }, customDb = db) {
  const database = customDb || db;
  const engId = Number(id);
  const existing = database.prepare(`SELECT * FROM sales_engineer WHERE id = ?`).get(engId);
  if (!existing) throw new Error('Sales Engineer not found');

  const activeVal = active !== undefined ? (active ? 1 : 0) : (isActive !== undefined ? (isActive ? 1 : 0) : existing.is_active);
  const codeVal = code !== undefined ? String(code).trim() : (employeeCode !== undefined ? String(employeeCode).trim() : existing.employee_code);

  database.prepare(`
    UPDATE sales_engineer
    SET employee_code = ?,
        name = ?,
        email = ?,
        phone = ?,
        designation = ?,
        department = ?,
        branch_id = ?,
        is_active = ?,
        joining_date = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `).run(
    codeVal,
    name !== undefined ? String(name).trim() : existing.name,
    email !== undefined ? String(email).trim() : existing.email,
    phone !== undefined ? String(phone).trim() : existing.phone,
    designation !== undefined ? String(designation).trim() : existing.designation,
    department !== undefined ? String(department).trim() : existing.department,
    branchId !== undefined ? branchId : existing.branch_id,
    activeVal,
    joiningDate !== undefined ? joiningDate : existing.joining_date,
    engId
  );

  return getEngineerById(engId, {}, database);
}

/**
 * GET Sales Engineer Performance Table Aggregation across engineers
 */
export function getEngineerPerformance({ financialYear, year, fiscal_year, branchId = null, engineerId = null, q = null } = {}, customDb = db) {
  const database = customDb || db;
  const fy = normalizeFy(financialYear || year || fiscal_year || 'FY 2026-27');
  const rawFy = fy.replace('FY ', '');

  let engSql = `
    SELECT e.id, e.employee_code AS code, e.employee_code, e.name, e.designation, e.department, e.branch_id, b.branch_name
    FROM sales_engineer e
    LEFT JOIN branch b ON b.id = e.branch_id
    WHERE e.is_active = 1
  `;
  const engParams = [];

  if (branchId) {
    engSql += ` AND e.branch_id = ?`;
    engParams.push(branchId);
  }
  if (engineerId) {
    engSql += ` AND e.id = ?`;
    engParams.push(engineerId);
  }
  if (q) {
    engSql += ` AND (e.name LIKE ? OR e.employee_code LIKE ?)`;
    const s = `%${q}%`;
    engParams.push(s, s);
  }

  engSql += ` ORDER BY e.name ASC`;
  const engineers = database.prepare(engSql).all(...engParams);

  const performanceList = engineers.map((eng) => {
    const qStats = database.prepare(`
      SELECT 
        COUNT(*) AS total_quotations,
        COALESCE(SUM(total), 0) AS total_quoted_value,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) AS accepted_count,
        COALESCE(SUM(CASE WHEN status = 'accepted' THEN total ELSE 0 END), 0) AS accepted_value
      FROM quotation
      WHERE sales_engineer_id = ?
    `).get(eng.id);

    const sStats = database.prepare(`
      SELECT 
        COUNT(DISTINCT sr.id) AS confirmed_sales_count,
        COALESCE(SUM(sr.total_amount), 0) AS confirmed_sales_value
      FROM sale_report sr
      LEFT JOIN quotation q ON q.id = sr.source_quotation_id
      WHERE (sr.sales_engineer_id = ? OR q.sales_engineer_id = ?)
        AND sr.status = 'CONFIRMED'
    `).get(eng.id, eng.id);

    const targetRow = database.prepare(`
      SELECT target_amount
      FROM engineer_sales_targets
      WHERE engineer_id = ? AND (financial_year = ? OR financial_year = ?)
      LIMIT 1
    `).get(eng.id, fy, rawFy);

    const targetAmount = targetRow ? Number(targetRow.target_amount) : 0;
    const confirmedSalesValue = Number(sStats?.confirmed_sales_value || 0);
    const confirmedSalesCount = Number(sStats?.confirmed_sales_count || 0);
    const totalQuotedValue = Number(qStats?.total_quoted_value || 0);
    const totalQuotations = Number(qStats?.total_quotations || 0);
    const acceptedCount = Number(qStats?.accepted_count || 0);
    const acceptedValue = Number(qStats?.accepted_value || 0);

    let achievementPercent = 0;
    if (targetAmount > 0) {
      achievementPercent = Number(((confirmedSalesValue / targetAmount) * 100).toFixed(1));
    }

    const shortfallAmount = targetAmount > confirmedSalesValue ? targetAmount - confirmedSalesValue : 0;
    let status = 'NO_TARGET';
    if (targetAmount > 0) {
      if (confirmedSalesValue >= targetAmount) status = 'EXCEEDED';
      else if (confirmedSalesValue >= targetAmount * 0.7) status = 'ON_TRACK';
      else status = 'BEHIND';
    }

    return {
      engineer_id: eng.id,
      engineerId: eng.id,
      code: eng.code,
      employeeCode: eng.employee_code,
      name: eng.name,
      designation: eng.designation,
      branchId: eng.branch_id,
      branchName: eng.branch_name || 'Unassigned',
      fiscal_year: fy,
      financial_year: fy,
      target_amount: targetAmount,
      targetAmount,
      quotation_count: totalQuotations,
      totalQuotations,
      quoted_amount: totalQuotedValue,
      totalQuotedValue,
      accepted_quotation_count: acceptedCount,
      acceptedCount,
      accepted_quotation_amount: acceptedValue,
      confirmed_sales_count: confirmedSalesCount,
      confirmedSalesCount,
      confirmed_sales_amount: confirmedSalesValue,
      confirmedSalesValue,
      achievement_pct: achievementPercent,
      achievementPercent,
      shortfall_amount: shortfallAmount,
      status,
    };
  });

  const totalEngineers = performanceList.length;
  const totalTarget = performanceList.reduce((sum, item) => sum + (item.target_amount || 0), 0);
  const totalQuotedValue = performanceList.reduce((sum, item) => sum + item.quoted_amount, 0);
  const totalAcceptedQuotations = performanceList.reduce((sum, item) => sum + item.accepted_quotation_amount, 0);
  const totalConfirmedSales = performanceList.reduce((sum, item) => sum + item.confirmed_sales_amount, 0);

  let overallAchievementPercent = 0;
  if (totalTarget > 0) {
    overallAchievementPercent = Number(((totalConfirmedSales / totalTarget) * 100).toFixed(1));
  }

  return {
    fiscal_year: fy,
    summary: {
      total_engineers: totalEngineers,
      total_target: totalTarget,
      total_quoted: totalQuotedValue,
      total_accepted: totalAcceptedQuotations,
      total_confirmed: totalConfirmedSales,
      overall_achievement_pct: overallAchievementPercent,
    },
    kpis: {
      financialYear: fy,
      totalEngineers,
      totalQuotedValue,
      totalConfirmedSales,
      totalTarget,
      overallAchievementPercent,
    },
    engineers: performanceList,
  };
}

/**
 * SET or UPDATE annual sales target for an engineer
 */
export function setEngineerTarget({ engineer_id, engineerId, branchId = null, fiscal_year, financial_year, financialYear, target_amount, targetAmount, userId = null }, customDb = db) {
  const database = customDb || db;
  const engId = Number(engineerId || engineer_id);
  const amount = Number(targetAmount !== undefined ? targetAmount : target_amount);
  const fy = normalizeFy(financialYear || financial_year || fiscal_year || 'FY 2026-27');

  if (!engId) throw new Error('Engineer ID is required');
  if (isNaN(amount) || amount < 0) throw new Error('Target amount must be a non-negative number');

  const engineer = database.prepare(`SELECT * FROM sales_engineer WHERE id = ?`).get(engId);
  if (!engineer) throw new Error('Sales Engineer not found');

  const targetBranchId = branchId || engineer.branch_id;

  const existing = database.prepare(`
    SELECT id FROM engineer_sales_targets
    WHERE engineer_id = ? AND (financial_year = ? OR financial_year = ?)
  `).get(engId, fy, fy.replace('FY ', ''));

  if (existing) {
    database.prepare(`
      UPDATE engineer_sales_targets
      SET target_amount = ?,
          financial_year = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(amount, fy, existing.id);
  } else {
    database.prepare(`
      INSERT INTO engineer_sales_targets (engineer_id, branch_id, financial_year, target_amount, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(engId, targetBranchId, fy, amount, userId || null);
  }

  return {
    engineer_id: engId,
    engineerId: engId,
    fiscal_year: fy,
    financial_year: fy,
    target_amount: amount,
    targetAmount: amount,
  };
}

/**
 * LIST Engineer Targets
 */
export function getEngineerTargets({ financialYear, year, fiscal_year, branchId = null, engineerId = null } = {}, customDb = db) {
  const database = customDb || db;
  const fy = normalizeFy(financialYear || year || fiscal_year || 'FY 2026-27');
  const rawFy = fy.replace('FY ', '');

  let sql = `
    SELECT 
      t.id,
      t.engineer_id,
      t.branch_id,
      t.financial_year AS fiscal_year,
      t.financial_year,
      t.target_amount,
      t.created_at,
      t.updated_at,
      e.name AS engineer_name,
      e.employee_code AS code,
      b.branch_name
    FROM engineer_sales_targets t
    JOIN sales_engineer e ON e.id = t.engineer_id
    LEFT JOIN branch b ON b.id = t.branch_id
    WHERE (t.financial_year = ? OR t.financial_year = ?)
  `;
  const params = [fy, rawFy];

  if (branchId) {
    sql += ` AND t.branch_id = ?`;
    params.push(branchId);
  }
  if (engineerId) {
    sql += ` AND t.engineer_id = ?`;
    params.push(engineerId);
  }

  sql += ` ORDER BY e.name ASC`;
  return database.prepare(sql).all(...params);
}
