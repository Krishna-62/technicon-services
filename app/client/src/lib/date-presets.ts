export interface DateRangePreset {
  id: string;
  label: string;
  start?: string;
  end?: string;
}

export function getDateRangePresets(): DateRangePreset[] {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const todayStr = fmt(now);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
  const startOfQuarter = new Date(now.getFullYear(), qStartMonth, 1);
  const endOfQuarter = new Date(now.getFullYear(), qStartMonth + 3, 0);

  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear(), 11, 31);

  return [
    { id: 'last30', label: 'Last 30 Days', start: fmt(thirtyDaysAgo), end: todayStr },
    { id: 'thisMonth', label: 'This Month', start: fmt(startOfMonth), end: fmt(endOfMonth) },
    { id: 'thisQuarter', label: 'This Quarter', start: fmt(startOfQuarter), end: fmt(endOfQuarter) },
    { id: 'thisYear', label: 'This Year', start: fmt(startOfYear), end: fmt(endOfYear) },
    { id: 'oct25_sep26', label: 'Oct 25 — Sep 26', start: '2025-10-01', end: '2026-09-30' },
    { id: 'allTime', label: 'All Time' },
  ];
}

export const DATE_RANGE_EVENT = 'technicon-date-range-change';

export function broadcastDateRange(preset: DateRangePreset) {
  try {
    localStorage.setItem('technicon_date_range', JSON.stringify(preset));
  } catch {}
  window.dispatchEvent(new CustomEvent(DATE_RANGE_EVENT, { detail: preset }));
}

export function getStoredDateRange(): DateRangePreset {
  try {
    const raw = localStorage.getItem('technicon_date_range');
    if (raw) return JSON.parse(raw);
  } catch {}
  return { id: 'oct25_sep26', label: 'Oct 25 — Sep 26', start: '2025-10-01', end: '2026-09-30' };
}
