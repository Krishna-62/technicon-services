import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type CustomerHealthStatus, type CustomerHealthSummaryData } from '../api';
import { Pagination } from '../components/Pagination';

const PAGE_SIZE = 20;

function formatCurrency(n: number) {
  return `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function relativeDays(days: number | null) {
  if (days == null) return '—';
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30.44);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

const STATUS_LABELS: Record<CustomerHealthStatus, string> = {
  new: 'New',
  strong: 'Strong',
  active: 'Active',
  at_risk: 'At Risk',
  inactive: 'Inactive',
  no_history: 'No Purchase History',
};

const STATUS_EMOJI: Record<CustomerHealthStatus, string> = {
  new: '🆕',
  strong: '🟢',
  active: '🟢',
  at_risk: '🟡',
  inactive: '🔴',
  no_history: '⚪',
};

// This page is a pure display layer over GET /api/companies/health-summary — every status shown
// is exactly what the backend's classifyHealthStatus() (Step 6.2) computed, never recalculated here.
export default function CustomerHealthOverview() {
  const [data, setData] = useState<CustomerHealthSummaryData | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.companies.healthSummary().then(setData).catch((e) => setError(e.message));
  }, []);

  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.customers.filter(
      (c) => (!q || c.company_name.toLowerCase().includes(q)) && (!statusFilter || c.status === statusFilter)
    );
  }, [data, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(() => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [filtered, currentPage]);

  return (
    <div>
      <h2>Customer Health</h2>
      <p className="page-subtitle">Which customers are active, at risk, or lapsed, and their business value — based on your real purchase history.</p>

      {error && <div className="error">{error}</div>}

      {!error && !data && <p className="muted loading-text">Loading…</p>}

      {data && (
        <>
          <div className="stat-grid">
            <div className="stat"><div className="label">Total Customers</div><div className="value">{data.summary.total}</div></div>
            <div className="stat"><div className="label">Active</div><div className="value">{data.summary.active}</div></div>
            <div className="stat"><div className="label">Strong</div><div className="value">{data.summary.strong}</div></div>
            <div className="stat"><div className="label">At Risk</div><div className="value">{data.summary.atRisk}</div></div>
            <div className="stat"><div className="label">Inactive</div><div className="value">{data.summary.inactive}</div></div>
            <div className="stat"><div className="label">New</div><div className="value">{data.summary.new}</div></div>
            <div className="stat"><div className="label">No Purchase History</div><div className="value">{data.summary.noHistory}</div></div>
          </div>

          <div className="filter-bar">
            <div className="field">
              <label>Search</label>
              <input type="search" placeholder="Search company…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="field">
              <label>Health Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                {(Object.keys(STATUS_LABELS) as CustomerHealthStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div className="filter-count muted">{filtered.length} of {data.customers.length} customers</div>
          </div>

          <div className="card">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Health</th>
                    <th>Total Business</th>
                    <th>Orders</th>
                    <th>Last Order</th>
                    <th>Avg Order Value</th>
                    <th>Days Since Last Order</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((c) => (
                    <tr key={c.company_id}>
                      <td>{c.company_name}</td>
                      <td><span className={`badge health-${c.status}`}>{STATUS_EMOJI[c.status]} {STATUS_LABELS[c.status]}</span></td>
                      <td>{formatCurrency(c.totalRevenue)}</td>
                      <td>{c.orderCount}</td>
                      <td>{formatDate(c.lastOrderDate)}</td>
                      <td>{formatCurrency(c.avgOrderValue)}</td>
                      <td>{relativeDays(c.daysSinceLastOrder)}</td>
                      <td><Link className="btn small secondary" to={`/companies/${c.company_id}/health`}>View →</Link></td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={8} className="muted">No matches.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
