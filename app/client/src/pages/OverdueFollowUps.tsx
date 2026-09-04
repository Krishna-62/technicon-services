import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type OverdueFollowUpsData } from '../api';

function formatDate(d: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function OverdueFollowUps() {
  const [data, setData] = useState<OverdueFollowUpsData | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.dashboard.overdueFollowUps().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <p className="muted loading-text">Loading…</p>;

  const q = search.toLowerCase();
  const filtered = search
    ? data.followUps.filter(
        (it) =>
          it.company_name.toLowerCase().includes(q) ||
          it.quotation_number.toLowerCase().includes(q) ||
          (it.notes || '').toLowerCase().includes(q)
      )
    : data.followUps;

  return (
    <div>
      <h2>Overdue Follow-Ups</h2>
      <p className="page-subtitle">Scheduled follow-ups that are past their follow-up date.</p>

      <div className="inactive-summary">
        <div className="inactive-summary-count">
          {data.count} Overdue Follow-Up{data.count === 1 ? '' : 's'}
        </div>
        <div className="inactive-summary-hint">Past their scheduled date — reach out as soon as possible.</div>
      </div>

      <input
        type="search"
        placeholder="Search by company, quotation number, or notes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ maxWidth: 320, marginBottom: 14 }}
      />

      <div className="card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Quotation Number</th>
                <th>Follow-up Date</th>
                <th>Notes</th>
                <th>Created By</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it) => (
                <tr key={it.id}>
                  <td>{it.company_name}</td>
                  <td>{it.quotation_number}</td>
                  <td>{formatDate(it.follow_up_date)}</td>
                  <td>{it.notes || '-'}</td>
                  <td>{it.created_by_username || '-'}</td>
                  <td>
                    <Link className="btn small secondary" to={`/quotations/${it.quotation_id}`}>
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && data.followUps.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted">
                    No overdue follow-ups.
                    <br />
                    You're all caught up.
                  </td>
                </tr>
              )}
              {filtered.length === 0 && data.followUps.length > 0 && (
                <tr>
                  <td colSpan={6} className="muted">
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
