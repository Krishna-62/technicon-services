import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Opportunity, type OpportunityType } from '../api';
import { Pagination } from '../components/Pagination';

const PAGE_SIZE = 20;

const TYPE_LABELS: Record<OpportunityType, string> = {
  cross_sell: 'Cross-Sell',
  at_risk: 'Customer At-Risk',
  high_value: 'High-Value',
  quotation_conversion: 'Quotation Conversion',
};

const PRIORITY_EMOJI: Record<string, string> = { high: '🔴', medium: '🟡', low: '🟢' };

function formatCurrency(n: number) {
  return `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

// A short "why" line built purely from the evidence object the backend already returns for this
// opportunity — no new metric, just a readable rendering of existing fields (shape differs per
// opportunity type/sub-case, so this is a display-only switch, not a calculation).
function evidenceSummary(o: Opportunity): string | null {
  const e = o.evidence || {};
  if (o.type === 'cross_sell') {
    return `${e.co_buyers} of ${e.total_other_anchor_buyers} other ${e.anchor_product} buyers also buy ${e.recommended_product}.`;
  }
  if (o.type === 'at_risk') {
    return `${e.days_since_last_order} days since last order (lapse threshold: ${e.lapse_months} months).`;
  }
  if (o.type === 'high_value') {
    if (e.pct_change != null) {
      return `Recent avg order value ${formatCurrency(e.recent_avg_order_value)} vs prior ${formatCurrency(e.prior_avg_order_value)}.`;
    }
    return `Total business ${formatCurrency(e.total_revenue)} across ${e.order_count} orders.`;
  }
  if (o.type === 'quotation_conversion') {
    if (e.quotation_numbers) return `Quotations: ${e.quotation_numbers.join(', ')}`;
    if (e.quotation_number) return `Quotation ${e.quotation_number}${e.status ? `, status ${e.status}` : ''}.`;
  }
  return null;
}

// Reuses real existing routes only — quotation-scoped opportunities link to the actual quotation
// when a single one is identifiable; everything else falls back to the company it's about.
function opportunityLink(o: Opportunity): { to: string; label: string } | null {
  if (o.type === 'quotation_conversion' && o.evidence?.quotation_id) {
    return { to: `/quotations/${o.evidence.quotation_id}`, label: 'View Quotation' };
  }
  if (o.company_id) {
    return { to: `/companies/${o.company_id}/health`, label: 'View Customer' };
  }
  return null;
}

// Search matches across whichever of these fields exist for a given opportunity — never assumes a
// field is present, since evidence shape differs per type.
function matchesSearch(o: Opportunity, q: string): boolean {
  const haystack = [
    o.company_name,
    o.title,
    o.description,
    o.evidence?.recommended_product,
    o.evidence?.quotation_number,
    ...(Array.isArray(o.evidence?.quotation_numbers) ? o.evidence.quotation_numbers : []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

export default function Opportunities() {
  const [data, setData] = useState<Opportunity[] | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.opportunities
      .list()
      .then((res) => setData(res.opportunities))
      .catch(() => setError('Unable to load growth opportunities. Please try again.'));
  }, []);

  useEffect(() => { setPage(1); }, [search, typeFilter, priorityFilter]);

  const summary = useMemo(() => {
    if (!data) return null;
    return {
      total: data.length,
      high: data.filter((o) => o.priority === 'high').length,
      medium: data.filter((o) => o.priority === 'medium').length,
      low: data.filter((o) => o.priority === 'low').length,
    };
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.filter(
      (o) =>
        (!q || matchesSearch(o, q)) &&
        (!typeFilter || o.type === typeFilter) &&
        (!priorityFilter || o.priority === priorityFilter)
    );
  }, [data, search, typeFilter, priorityFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(() => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [filtered, currentPage]);

  return (
    <div>
      <h2>Growth Opportunities</h2>
      <p className="page-subtitle">Deterministic, evidence-backed opportunities detected from your real business data. Read-only — nothing here is sent or scheduled automatically.</p>

      {error && <div className="error">{error}</div>}
      {!error && !data && <p className="muted loading-text">Loading growth opportunities…</p>}

      {data && (
        <>
          {summary && (
            <div className="stat-grid">
              <div className="stat"><div className="label">Total Opportunities</div><div className="value">{summary.total}</div></div>
              <div className="stat"><div className="label">High Priority</div><div className="value">{summary.high}</div></div>
              <div className="stat"><div className="label">Medium Priority</div><div className="value">{summary.medium}</div></div>
              <div className="stat"><div className="label">Low Priority</div><div className="value">{summary.low}</div></div>
            </div>
          )}

          {data.length === 0 ? (
            <div className="card">
              <p className="muted" style={{ margin: 0 }}>No growth opportunities identified. You're currently covered.</p>
            </div>
          ) : (
            <>
              <div className="filter-bar">
                <div className="field">
                  <label>Search</label>
                  <input type="search" placeholder="Search company, product, quotation…" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="field">
                  <label>Type</label>
                  <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                    <option value="">All Types</option>
                    {Object.entries(TYPE_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Priority</label>
                  <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                    <option value="">All Priority</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="filter-count muted">{filtered.length} of {data.length} opportunities</div>
              </div>

              <div className="card">
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Priority</th>
                        <th>Type</th>
                        <th>Company</th>
                        <th>Opportunity</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {paged.map((o, i) => {
                        const link = opportunityLink(o);
                        const evidence = evidenceSummary(o);
                        return (
                          <tr key={i}>
                            <td><span className={`badge ${o.priority === 'high' ? 'rejected' : o.priority === 'medium' ? 'sent' : 'open'}`}>{PRIORITY_EMOJI[o.priority]} {o.priority}</span></td>
                            <td>{TYPE_LABELS[o.type]}</td>
                            <td>{o.company_name}</td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{o.title}</div>
                              <div className="muted" style={{ fontSize: 12.5 }}>{o.description}</div>
                              {evidence && <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>Evidence: {evidence}</div>}
                              <div style={{ fontSize: 12.5, marginTop: 2 }}>→ {o.action}</div>
                            </td>
                            <td>{link && <Link className="btn small secondary" to={link.to}>{link.label}</Link>}</td>
                          </tr>
                        );
                      })}
                      {filtered.length === 0 && <tr><td colSpan={5} className="muted">No matches.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </>
      )}
    </div>
  );
}
