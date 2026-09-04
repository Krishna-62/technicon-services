import db from '../db/index.js';

// Server-authoritative date range resolution for the AI assistant. The model is never allowed to
// invent or compute date boundaries itself — it can only supply a structured descriptor (mode +
// small set of fields), which this module turns into concrete 'YYYY-MM-DD' boundaries.
//
// Absolute modes (year/month/quarter/explicit) are resolved with plain string/integer arithmetic —
// no JS Date object is ever constructed, so there is no timezone-conversion risk. Relative modes
// (this_year, last_90_days, ...) are resolved entirely in SQL against Postgres's CURRENT_DATE (the
// real server date), reusing the same date_trunc/INTERVAL pattern already proven correct elsewhere
// in this codebase (dashboard.js's pipeline/inactive-customer queries) — never against Node's clock.
//
// Every returned range uses an inclusive start / exclusive end convention (`col >= start AND col <
// end`), matching the convention already used throughout dashboard.js and reports.js.

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const RELATIVE_PERIODS = [
  'this_year', 'last_year', 'this_month', 'last_month',
  'this_quarter', 'last_quarter', 'last_90_days', 'last_6_months', 'last_12_months',
];

function pad2(n) {
  return String(n).padStart(2, '0');
}

function isValidYear(y) {
  return Number.isInteger(y) && y >= 2000 && y <= 2100;
}

function yearRange(year) {
  return { startDate: `${year}-01-01`, endDate: `${year + 1}-01-01`, label: `calendar year ${year}` };
}

function monthRange(year, month) {
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return {
    startDate: `${year}-${pad2(month)}-01`,
    endDate: `${nextYear}-${pad2(nextMonth)}-01`,
    label: `${MONTH_NAMES[month - 1]} ${year}`,
  };
}

function quarterRange(year, quarter) {
  const startMonth = (quarter - 1) * 3 + 1;
  const endMonthExclusive = startMonth + 3; // may be 13 -> rolls into next year below
  const endYear = endMonthExclusive > 12 ? year + 1 : year;
  const endMonth = endMonthExclusive > 12 ? endMonthExclusive - 12 : endMonthExclusive;
  return {
    startDate: `${year}-${pad2(startMonth)}-01`,
    endDate: `${endYear}-${pad2(endMonth)}-01`,
    label: `Q${quarter} ${year}`,
  };
}

// Every relative period is only ever a lookup key into these developer-authored SQL fragments — the
// model's `relativePeriod` argument is never concatenated into SQL beyond this fixed switch.
// Boundaries are computed by Postgres against CURRENT_DATE, never derived from a JS Date.
function relativePeriodSql(period) {
  switch (period) {
    case 'last_year':
      return { startExpr: `date_trunc('year', CURRENT_DATE - INTERVAL '1 year')`, endExpr: `date_trunc('year', CURRENT_DATE)` };
    case 'this_month':
      return { startExpr: `date_trunc('month', CURRENT_DATE)`, endExpr: `date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'` };
    case 'last_month':
      return { startExpr: `date_trunc('month', CURRENT_DATE - INTERVAL '1 month')`, endExpr: `date_trunc('month', CURRENT_DATE)` };
    case 'this_quarter':
      return { startExpr: `date_trunc('quarter', CURRENT_DATE)`, endExpr: `date_trunc('quarter', CURRENT_DATE) + INTERVAL '3 month'` };
    case 'last_quarter':
      return { startExpr: `date_trunc('quarter', CURRENT_DATE - INTERVAL '3 month')`, endExpr: `date_trunc('quarter', CURRENT_DATE)` };
    case 'last_90_days':
      return { startExpr: `CURRENT_DATE - INTERVAL '90 days'`, endExpr: `CURRENT_DATE + INTERVAL '1 day'` };
    case 'last_6_months':
      return { startExpr: `CURRENT_DATE - INTERVAL '6 months'`, endExpr: `CURRENT_DATE + INTERVAL '1 day'` };
    case 'last_12_months':
      return { startExpr: `CURRENT_DATE - INTERVAL '12 months'`, endExpr: `CURRENT_DATE + INTERVAL '1 day'` };
    case 'this_year':
    default:
      return { startExpr: `date_trunc('year', CURRENT_DATE)`, endExpr: `date_trunc('year', CURRENT_DATE) + INTERVAL '1 year'` };
  }
}

async function resolveRelative(period) {
  const normalized = RELATIVE_PERIODS.includes(period) ? period : 'this_year';
  const { startExpr, endExpr } = relativePeriodSql(normalized);
  const row = await db.prepare(`SELECT (${startExpr})::date AS start_date, (${endExpr})::date AS end_date`).get();
  const labelWords = normalized.replace(/_/g, ' ');
  return { startDate: row.start_date, endDate: row.end_date, label: labelWords };
}

// Returns the real application/server date (from Postgres, never Node's clock) as plain integer
// components — used only for validation (e.g. rejecting a nonsensical future year), never for
// boundary math itself.
export async function getServerToday() {
  const row = await db
    .prepare(`SELECT EXTRACT(YEAR FROM CURRENT_DATE)::int AS y, EXTRACT(MONTH FROM CURRENT_DATE)::int AS m, EXTRACT(DAY FROM CURRENT_DATE)::int AS d`)
    .get();
  return { year: Number(row.y), month: Number(row.m), day: Number(row.d) };
}

// `raw` is the model-supplied structured descriptor (never free text, never SQL). Returns
// { startDate, endDate, label } with 'YYYY-MM-DD' strings, or null if raw is missing/unparseable —
// callers should fall back to a documented default (this_year) and say so, per the system prompt's
// "state the assumption" rule, rather than silently guessing.
export async function resolveDateRange(raw) {
  if (!raw || typeof raw !== 'object') return resolveRelative('this_year');

  const mode = raw.mode;

  if (mode === 'year' && isValidYear(Number(raw.year))) {
    return yearRange(Number(raw.year));
  }

  if (mode === 'month' && isValidYear(Number(raw.year)) && Number.isInteger(Number(raw.month)) && Number(raw.month) >= 1 && Number(raw.month) <= 12) {
    return monthRange(Number(raw.year), Number(raw.month));
  }

  if (mode === 'quarter' && isValidYear(Number(raw.year)) && Number.isInteger(Number(raw.quarter)) && Number(raw.quarter) >= 1 && Number(raw.quarter) <= 4) {
    return quarterRange(Number(raw.year), Number(raw.quarter));
  }

  if (mode === 'explicit' && typeof raw.startDate === 'string' && typeof raw.endDateInclusive === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.startDate) && /^\d{4}-\d{2}-\d{2}$/.test(raw.endDateInclusive)) {
    // endDateInclusive from the model is treated as inclusive (matches how people phrase date
    // ranges); the exclusive upper bound used internally is computed in SQL, not JS, to avoid any
    // date-rollover/timezone arithmetic here.
    const row = await db.prepare(`SELECT (?::date + INTERVAL '1 day')::date AS end_exclusive`).get(raw.endDateInclusive);
    return { startDate: raw.startDate, endDate: row.end_exclusive, label: `${raw.startDate} through ${raw.endDateInclusive}` };
  }

  if (mode === 'relative' && typeof raw.relativePeriod === 'string') {
    return resolveRelative(raw.relativePeriod);
  }

  // Unrecognized/incomplete descriptor — documented default, never a guess at what the user meant.
  return resolveRelative('this_year');
}

export const DATE_RANGE_PARAM_SCHEMA = {
  type: 'object',
  description:
    "Structured time period. NEVER compute or guess actual calendar dates yourself — always describe the period using this schema and the backend will resolve exact boundaries using the real server date. For an explicit calendar year like '2024 sales', use mode='year', year=2024 (this means 1 Jan 2024 - 31 Dec 2024 exactly, NOT a rolling 12-month window). For 'January 2024', use mode='month', year=2024, month=1. For 'Q1 2024', use mode='quarter', year=2024, quarter=1. For relative phrases like 'this year', 'last year', 'last 90 days', use mode='relative' with relativePeriod. Omit entirely to default to the current calendar year.",
  properties: {
    mode: { type: 'string', enum: ['year', 'month', 'quarter', 'relative', 'explicit'] },
    year: { type: 'number', description: 'Calendar year, e.g. 2024. Required for mode=year/month/quarter.' },
    month: { type: 'number', description: 'Month number 1-12. Required for mode=month.' },
    quarter: { type: 'number', description: 'Quarter number 1-4. Required for mode=quarter.' },
    relativePeriod: { type: 'string', enum: RELATIVE_PERIODS, description: 'Required for mode=relative.' },
    startDate: { type: 'string', description: "YYYY-MM-DD. Only for mode=explicit, when the user gives explicit start/end dates." },
    endDateInclusive: { type: 'string', description: 'YYYY-MM-DD, inclusive. Only for mode=explicit.' },
  },
};
