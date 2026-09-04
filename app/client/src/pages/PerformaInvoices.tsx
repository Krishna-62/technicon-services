import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, PerformaInvoice } from '../api';
import { Pagination } from '../components/Pagination';

const PAGE_SIZE = 20;

type DateFilter = 'all' | 'today' | 'week' | 'month';

// Pure string comparison against the API's plain 'YYYY-MM-DD' DATE values — never parses a row's
// date into a JS Date (which risks a timezone-driven off-by-one-day shift), only the boundaries are
// built from local calendar fields (getFullYear/getMonth/getDate), never .toISOString().
function getDateRange(filter: DateFilter): { start: string; end: string } | null {
  if (filter === 'all') return null;
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const toStr = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();

  if (filter === 'today') {
    const s = toStr(y, m, d);
    return { start: s, end: s };
  }
  if (filter === 'week') {
    const dayOfWeek = new Date(y, m, d).getDay(); // 0=Sun..6=Sat
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    return { start: toStr(y, m, d - diffToMonday), end: toStr(y, m, d - diffToMonday + 6) };
  }
  // month
  const lastDayOfMonth = new Date(y, m + 1, 0).getDate();
  return { start: toStr(y, m, 1), end: toStr(y, m, lastDayOfMonth) };
}

function matchesDate(dateStr: string | null | undefined, range: { start: string; end: string } | null) {
  if (!range) return true;
  if (!dateStr) return false;
  return dateStr >= range.start && dateStr <= range.end;
}

export default function PerformaInvoices() {
  const [rows, setRows] = useState<PerformaInvoice[]>([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.performaInvoices.list().then(setRows).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, dateFilter]);

  const statuses = useMemo(() => Array.from(new Set(rows.map((pi) => pi.status))).sort(), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const range = getDateRange(dateFilter);
    return rows.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (!matchesDate(r.date, range)) return false;
      if (q) {
        const number = (r.number || '').toLowerCase();
        const company = (r.company_name || '').toLowerCase();
        if (!number.includes(q) && !company.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, statusFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );

  const hasActiveFilters = search !== '' || statusFilter !== '' || dateFilter !== 'all';

  function resetFilters() {
    setSearch('');
    setStatusFilter('');
    setDateFilter('all');
  }

  return (
    <div>
      <h2>Performa Invoices</h2>
      {error && <div className="error">{error}</div>}

      <div className="filter-bar">
        <div className="field">
          <label>Search</label>
          <input
            type="search"
            placeholder="Search by number or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Date</label>
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as DateFilter)}>
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
        {hasActiveFilters && (
          <button className="btn small secondary" onClick={resetFilters} style={{ alignSelf: 'end' }}>
            Clear Filters
          </button>
        )}
        <div className="filter-count muted">{filtered.length} of {rows.length} performa invoices</div>
      </div>

      <div className="card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr><th>Number</th><th>Date</th><th>Company</th><th>Quotation</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {paged.map((pi) => (
                <tr key={pi.id}>
                  <td>{pi.number}</td>
                  <td>{pi.date}</td>
                  <td>{pi.company_name}</td>
                  <td><Link to={`/quotations/${pi.quotation_id}`}>{pi.quotation_number}</Link></td>
                  <td><span className={`badge ${pi.status}`}>{pi.status}</span></td>
                  <td><a className="btn small secondary" href={api.performaInvoices.pdfUrl(pi.id)} target="_blank" rel="noreferrer">PDF</a></td>
                </tr>
              ))}
              {filtered.length === 0 && rows.length === 0 && (
                <tr><td colSpan={6} className="muted">No performa invoices yet.</td></tr>
              )}
              {filtered.length === 0 && rows.length > 0 && (
                <tr><td colSpan={6} className="muted">No matches.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
