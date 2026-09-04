import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type CompanyHealthData, type CustomerHealthStatus } from '../api';

function formatCurrency(n: number) {
  return `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function formatDate(d: string) {
  if (!d) return '';
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

const EMOJI: Record<CustomerHealthStatus, string> = {
  new: '🆕',
  strong: '🟢',
  active: '🟢',
  at_risk: '🟡',
  inactive: '🔴',
  no_history: '⚪',
};

const DESCRIPTION: Record<CustomerHealthStatus, string> = {
  new: 'First purchase was recent — not enough history yet to judge a trend.',
  strong: 'Buying recently and well above average order value for this business.',
  active: 'Buying recently, within normal purchasing patterns.',
  at_risk: 'Purchasing has slowed — approaching the inactivity threshold.',
  inactive: 'No purchases within the configured lapse window.',
  no_history: 'No sales records found for this company yet.',
};

export default function CompanyHealth() {
  const { id } = useParams();
  const [data, setData] = useState<CompanyHealthData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api.companies.health(Number(id)).then(setData).catch((e) => setError(e.message));
  }, [id]);

  return (
    <div>
      <p><Link to="/companies">← Back to Companies</Link></p>
      <h2>Customer Health</h2>

      {error && <div className="error">{error}</div>}

      {!error && !data && <p className="muted loading-text">Loading…</p>}

      {data && (
        <div className="card">
          <h3>{data.company.name}</h3>
          <p>
            <span className={`badge health-${data.health.status}`}>
              {EMOJI[data.health.status]} {data.health.label}
            </span>
          </p>
          <p className="muted">{DESCRIPTION[data.health.status]}</p>

          {data.health.status !== 'no_history' && (
            <div className="stat-grid">
              <div className="stat">
                <div className="label">Total Business</div>
                <div className="value">{formatCurrency(data.health.totalRevenue)}</div>
              </div>
              <div className="stat">
                <div className="label">Orders</div>
                <div className="value">{data.health.orderCount}</div>
              </div>
              <div className="stat">
                <div className="label">Last Order</div>
                <div className="value">{relativeDays(data.health.daysSinceLastOrder)}</div>
              </div>
              <div className="stat">
                <div className="label">Avg Order Value</div>
                <div className="value">{formatCurrency(data.health.avgOrderValue)}</div>
              </div>
            </div>
          )}

          {data.health.status !== 'no_history' && (
            <p className="muted">
              First order: {formatDate(data.health.firstOrderDate || '')} · Last order: {formatDate(data.health.lastOrderDate || '')} ·
              {' '}Inactivity threshold: {data.health.lapseMonths} months
            </p>
          )}
        </div>
      )}
    </div>
  );
}
