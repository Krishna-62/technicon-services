import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type ProductIntelligenceData, type ProductTrendDirection } from '../api';

function formatCurrency(n: number) {
  return `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function formatDate(d: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const TREND_EMOJI: Record<ProductTrendDirection, string> = {
  growing: '📈',
  declining: '📉',
  stable: '➖',
  no_data: '⚪',
};

const TREND_LABEL: Record<ProductTrendDirection, string> = {
  growing: 'Growing',
  declining: 'Declining',
  stable: 'Stable',
  no_data: 'No recent trend data',
};

export default function ProductIntelligence() {
  const { id } = useParams();
  const [data, setData] = useState<ProductIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadIntelligence = () => {
    if (!id) return;
    setLoading(true);
    setError('');
    api.products
      .intelligence(Number(id))
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('404')) {
          setError('Product not found (404).');
        } else if (msg.includes('401')) {
          setError('Session expired or unauthorized. Please log in again.');
        } else if (msg.includes('500')) {
          setError('Server error while computing product intelligence (500). Please try again.');
        } else {
          setError(msg || 'Unable to load product intelligence. Please try again.');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadIntelligence();
  }, [id]);

  return (
    <div>
      <p><Link to="/products">← Back to Products</Link></p>
      <h2>Product Intelligence</h2>

      {error && (
        <div className="error" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <span>{error}</span>
          <button
            onClick={loadIntelligence}
            className="btn"
            style={{ padding: '4px 12px', fontSize: '12px', cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      )}
      {loading && !data && !error && <p className="muted loading-text">Loading…</p>}

      {data && (
        <>
          <div className="card">
            <h3>{data.product.description}</h3>
            <p className="muted">Part No: {data.product.part_no}</p>

            {data.sales.orderCount === 0 ? (
              <p className="muted">No sales records found for this product yet.</p>
            ) : (
              <>
                <div className="stat-grid">
                  <div className="stat">
                    <div className="label">Revenue</div>
                    <div className="value">{formatCurrency(data.sales.revenue)}</div>
                  </div>
                  <div className="stat">
                    <div className="label">Units Sold</div>
                    <div className="value">{data.sales.unitsSold}</div>
                  </div>
                  <div className="stat">
                    <div className="label">Customers</div>
                    <div className="value">{data.sales.customers}</div>
                  </div>
                  <div className="stat">
                    <div className="label">Avg Selling Price</div>
                    <div className="value">{formatCurrency(data.sales.avgSellingPrice)}</div>
                  </div>
                </div>
                <p className="muted">
                  {data.sales.orderCount} orders · First sale: {formatDate(data.sales.firstSaleDate || '')} · Last sale: {formatDate(data.sales.lastSaleDate || '')}
                </p>
              </>
            )}
          </div>

          <div className="card">
            <h3>Trend</h3>
            <p>
              <span className={`badge health-${data.trend.direction === 'no_data' ? 'no_history' : data.trend.direction}`}>
                {TREND_EMOJI[data.trend.direction]} {TREND_LABEL[data.trend.direction]}
                {data.trend.pctChange != null && ` (${data.trend.pctChange >= 0 ? '+' : ''}${Math.round(data.trend.pctChange * 100)}%)`}
              </span>
            </p>
            <p className="muted">
              {data.trend.direction === 'no_data'
                ? 'Not enough recent sales history (last 12 months) to calculate a trend.'
                : `Revenue: ${formatCurrency(data.trend.recentRevenue)} in the last 6 months vs ${formatCurrency(data.trend.priorRevenue)} in the prior 6 months.`}
            </p>
          </div>

          <div className="card">
            <h3>Quotation Activity vs Purchase Activity</h3>
            <div className="stat-grid">
              <div className="stat">
                <div className="label">Times Quoted</div>
                <div className="value">{data.quotationActivity.quotationCount}</div>
              </div>
              <div className="stat">
                <div className="label">Quoted Qty</div>
                <div className="value">{data.quotationActivity.quotedQty}</div>
              </div>
              <div className="stat">
                <div className="label">Times Purchased</div>
                <div className="value">{data.sales.orderCount}</div>
              </div>
            </div>
            {data.quotationActivity.quotationCount === 0 && (
              <p className="muted">No quotation history is linked to this product yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
