import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type ProductIntelligenceSummaryData, type ProductTrendDirection } from '../api';
import { Pagination } from '../components/Pagination';

const PAGE_SIZE = 20;

function formatCurrency(n: number) {
  return `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

const TREND_LABELS: Record<ProductTrendDirection, string> = {
  growing: 'Growing',
  declining: 'Declining',
  stable: 'Stable',
  no_data: 'No recent trend data',
};

const TREND_EMOJI: Record<ProductTrendDirection, string> = {
  growing: '📈',
  declining: '📉',
  stable: '➖',
  no_data: '⚪',
};

// Trend filter options are limited to the values the backend actually computes (growing / declining
// / stable / no_data) — no "Frequently Quoted"/"Frequently Purchased"/"Best Selling" filter buckets,
// since no backend threshold defines those; inventing one here would be a UI-only classification the
// data doesn't back. "Best Selling" is instead shown as a Top Revenue/Top Units summary card below,
// which needs no new threshold — just the max of an already-returned field.
const TREND_FILTERS: ProductTrendDirection[] = ['growing', 'declining', 'stable', 'no_data'];

export default function ProductIntelligenceOverview() {
  const [data, setData] = useState<ProductIntelligenceSummaryData | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [trendFilter, setTrendFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.products.intelligenceSummary().then(setData).catch(() => setError('Unable to load product intelligence. Please try again.'));
  }, []);

  useEffect(() => { setPage(1); }, [search, trendFilter]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.products.filter(
      (p) =>
        (!q || p.description.toLowerCase().includes(q) || p.part_no.toLowerCase().includes(q)) &&
        (!trendFilter || p.trendDirection === trendFilter)
    );
  }, [data, search, trendFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(() => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [filtered, currentPage]);

  return (
    <div>
      <h2>Product Intelligence</h2>
      <p className="page-subtitle">Which products sell the most, which are growing or declining, and quotation activity vs actual purchases — based on your real sales history.</p>

      {error && <div className="error">{error}</div>}
      {!error && !data && <p className="muted loading-text">Loading product intelligence…</p>}

      {data && (
        <>
          <div className="stat-grid">
            <div className="stat"><div className="label">Total Products</div><div className="value">{data.summary.totalProducts}</div></div>
            <div className="stat"><div className="label">Products With Sales</div><div className="value">{data.summary.productsWithSales}</div></div>
            <div className="stat">
              <div className="label">Top Revenue Product</div>
              <div className="value" style={{ fontSize: 15 }}>{data.summary.topRevenueProduct ? data.summary.topRevenueProduct.description : '—'}</div>
              {data.summary.topRevenueProduct && <p className="muted" style={{ margin: '4px 0 0', fontSize: 12 }}>{formatCurrency(data.summary.topRevenueProduct.revenue)}</p>}
            </div>
            <div className="stat">
              <div className="label">Top Units Product</div>
              <div className="value" style={{ fontSize: 15 }}>{data.summary.topUnitsProduct ? data.summary.topUnitsProduct.description : '—'}</div>
              {data.summary.topUnitsProduct && <p className="muted" style={{ margin: '4px 0 0', fontSize: 12 }}>{data.summary.topUnitsProduct.unitsSold} units</p>}
            </div>
          </div>

          {data.products.length === 0 ? (
            <div className="card">
              <p className="muted" style={{ margin: 0 }}>No product intelligence available.</p>
            </div>
          ) : (
            <>
              <div className="filter-bar">
                <div className="field">
                  <label>Search Products</label>
                  <input type="search" placeholder="Search by name or part no…" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="field">
                  <label>Trend</label>
                  <select value={trendFilter} onChange={(e) => setTrendFilter(e.target.value)}>
                    <option value="">All</option>
                    {TREND_FILTERS.map((t) => (
                      <option key={t} value={t}>{TREND_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-count muted">{filtered.length} of {data.products.length} products</div>
              </div>

              <div className="card">
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Revenue</th>
                        <th>Units</th>
                        <th>Customers</th>
                        <th>Avg Selling Price</th>
                        <th>Quotes</th>
                        <th>Trend</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {paged.map((p) => (
                        <tr key={p.id}>
                          <td>{p.description}<div className="muted" style={{ fontSize: 11.5 }}>{p.part_no}</div></td>
                          <td>{formatCurrency(p.revenue)}</td>
                          <td>{p.unitsSold}</td>
                          <td>{p.customers}</td>
                          <td>{formatCurrency(p.avgSellingPrice)}</td>
                          <td>{p.quotationCount}</td>
                          <td><span className={`badge health-${p.trendDirection === 'no_data' ? 'no_history' : p.trendDirection}`}>{TREND_EMOJI[p.trendDirection]} {TREND_LABELS[p.trendDirection]}</span></td>
                          <td><Link className="btn small secondary" to={`/products/${p.id}/intelligence`}>View →</Link></td>
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
        </>
      )}
    </div>
  );
}
