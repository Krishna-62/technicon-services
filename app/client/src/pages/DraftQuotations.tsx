import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type DraftQuotationsData } from '../api';

function formatCurrency(n: number) {
  return `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function formatDate(d: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function DraftQuotations() {
  const [data, setData] = useState<DraftQuotationsData | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.dashboard.draftQuotations().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <p className="muted loading-text">Loading…</p>;

  const q = search.toLowerCase();
  const filtered = search
    ? data.quotations.filter((it) => it.number.toLowerCase().includes(q) || it.company_name.toLowerCase().includes(q))
    : data.quotations;

  return (
    <div>
      <h2>Draft Quotations</h2>
      <p className="page-subtitle">Quotations that are still being prepared and have not yet been sent to the customer.</p>

      <div className="inactive-summary">
        <div className="inactive-summary-count">
          {data.count} Draft Quotation{data.count === 1 ? '' : 's'}
        </div>
        <div className="inactive-summary-hint">Not yet sent to the customer.</div>
      </div>

      <input
        type="search"
        placeholder="Search by quotation number or company..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ maxWidth: 320, marginBottom: 14 }}
      />

      <div className="card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Quotation Number</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it) => (
                <tr key={it.id}>
                  <td>{it.number}</td>
                  <td>{it.company_name}</td>
                  <td>{formatDate(it.date)}</td>
                  <td>{formatCurrency(it.total)}</td>
                  <td>
                    <Link className="btn small secondary" to={`/quotations/${it.id}`}>
                      Continue →
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && data.quotations.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted">
                    No draft quotations.
                    <br />
                    You're all caught up.
                  </td>
                </tr>
              )}
              {filtered.length === 0 && data.quotations.length > 0 && (
                <tr>
                  <td colSpan={5} className="muted">
                    No matches.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
