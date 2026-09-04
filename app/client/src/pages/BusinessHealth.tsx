import { useEffect, useState } from 'react';
import { api, type BusinessHealthComponent, type BusinessHealthData } from '../api';

function componentTier(score: number | null): 'green' | 'yellow' | 'red' | null {
  if (score == null) return null;
  if (score >= 70) return 'green';
  if (score >= 40) return 'yellow';
  return 'red';
}

function ComponentCard({ component }: { component: BusinessHealthComponent }) {
  const tier = componentTier(component.score);
  return (
    <div className="stat">
      <div className="label">{component.label}</div>
      <div className="value">{component.score == null ? '—' : component.score}</div>
      {tier && <span className={`badge tier-${tier}`} style={{ marginTop: 6 }}>{tier === 'green' ? 'Strong' : tier === 'yellow' ? 'Watch' : 'Weak'}</span>}
      <p className="muted" style={{ fontSize: 12, marginTop: 8, marginBottom: 0 }}>{component.detail}</p>
    </div>
  );
}

export default function BusinessHealth() {
  const [businessHealth, setBusinessHealth] = useState<BusinessHealthData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.dashboard.businessHealth().then(setBusinessHealth).catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <h2>Business Health</h2>
      <p className="page-subtitle">An owner-friendly summary of overall business performance, scored from your real data.</p>

      <div className="card">
        {error ? (
          <div className="error">Unable to load business health score.</div>
        ) : !businessHealth ? (
          <p className="muted loading-text">Loading…</p>
        ) : businessHealth.overallScore == null ? (
          <p className="muted">Not enough data yet to calculate a business health score.</p>
        ) : (
          <>
            <p style={{ fontSize: 40, fontWeight: 800, margin: '0 0 4px' }}>
              {businessHealth.overallScore} / 100
            </p>
            <p style={{ fontSize: 18, fontWeight: 700, margin: '0 0 20px' }}>
              {businessHealth.tier === 'green' ? '🟢' : businessHealth.tier === 'yellow' ? '🟡' : '🔴'} {businessHealth.tierLabel}
            </p>

            <div className="stat-grid">
              {Object.values(businessHealth.components).map((c) => (
                <ComponentCard key={c.label} component={c} />
              ))}
            </div>

            {businessHealth.recommendation ? (
              <div className="health-recommendation">
                <h4>{businessHealth.recommendation.title}</h4>
                <p>{businessHealth.recommendation.detail}</p>
              </div>
            ) : (
              <div className="health-recommendation">
                <h4>No urgent recommendation right now.</h4>
                <p>Every scored area is currently healthy — keep up the good work.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
