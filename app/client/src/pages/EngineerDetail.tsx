import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, SalesEngineer, EngineerSalesTarget, EngineerPerformance } from '../api';

export default function EngineerDetail() {
  const { id } = useParams();
  const engineerId = Number(id);

  const [engineer, setEngineer] = useState<SalesEngineer | null>(null);
  const [target, setTarget] = useState<EngineerSalesTarget | null>(null);
  const [performance, setPerformance] = useState<EngineerPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [fiscalYear, setFiscalYear] = useState('2026-27');
  const [targetInput, setTargetInput] = useState<number | string>('');
  const [savingTarget, setSavingTarget] = useState(false);

  function loadData() {
    setLoading(true);
    setError('');
    api.engineers
      .get(engineerId)
      .then((data) => {
        setEngineer(data);
        if (data.current_year_target) setTarget(data.current_year_target);
        if (data.performance) {
          setPerformance(data.performance);
          setTargetInput(data.performance.target_amount || '');
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, [engineerId, fiscalYear]);

  async function handleSaveTarget(e: React.FormEvent) {
    e.preventDefault();
    setSavingTarget(true);
    try {
      await api.engineers.setTarget({
        engineer_id: engineerId,
        fiscal_year: fiscalYear,
        target_amount: Number(targetInput) || 0,
      });
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingTarget(false);
    }
  }

  if (loading) {
    return <div className="p-6 text-[#A5AEA8] text-sm">Loading engineer performance...</div>;
  }

  if (error || !engineer) {
    return (
      <div className="p-6 text-[#E25757] text-sm bg-[#E25757]/10 border border-[#E25757]/20 rounded-xl">
        {error || 'Engineer not found.'}
      </div>
    );
  }

  const pct = performance?.achievement_pct || 0;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="pb-4 border-b border-[#292E2A]">
        <div className="flex items-center gap-2 mb-1">
          <Link to="/sales/engineers" className="text-xs text-[#A5AEA8] hover:text-[#B8F23A]">
            ← Sales Engineers
          </Link>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#F5F7F4] tracking-tight">{engineer.name}</h1>
            <p className="text-xs text-[#A5AEA8] font-mono mt-0.5">Code: {engineer.code} | Email: {engineer.email || '—'} | Phone: {engineer.phone || '—'}</p>
          </div>
          <select
            value={fiscalYear}
            onChange={(e) => setFiscalYear(e.target.value)}
            className="bg-[#171918] border border-[#292E2A] rounded-lg px-3 py-1.5 text-xs text-[#F5F7F4] focus:outline-none focus:border-[#B8F23A]"
          >
            <option value="2026-27">FY 2026-27</option>
            <option value="2025-26">FY 2025-26</option>
          </select>
        </div>
      </div>

      {/* Target Progress Card */}
      <div className="bg-[#171918] border border-[#292E2A] rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#292E2A] pb-4">
          <div>
            <h2 className="text-base font-semibold text-[#F5F7F4]">Annual Target Progress ({fiscalYear})</h2>
            <p className="text-xs text-[#A5AEA8]">Confirmed sales achievement vs allocated annual sales target.</p>
          </div>
          <span className="text-xl font-bold text-[#B8F23A]">{pct.toFixed(1)}% Achieved</span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-[#A5AEA8]">
            <span>Confirmed: ₹{(performance?.confirmed_sales_amount || 0).toLocaleString('en-IN')}</span>
            <span>Target: ₹{(performance?.target_amount || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="w-full bg-[#101312] border border-[#292E2A] rounded-full h-3 overflow-hidden">
            <div
              className="bg-[#B8F23A] h-full transition-all duration-500"
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
          {performance?.shortfall_amount && performance.shortfall_amount > 0 ? (
            <p className="text-xs text-[#E25757] font-mono text-right">
              Shortfall to Target: ₹{performance.shortfall_amount.toLocaleString('en-IN')}
            </p>
          ) : (
            <p className="text-xs text-[#34D399] font-mono text-right">Target Achieved / Exceeded!</p>
          )}
        </div>

        {/* Breakdown Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
          <div className="bg-[#101312] p-3 rounded-lg border border-[#292E2A]">
            <span className="text-[10px] uppercase text-[#A5AEA8] block">Total Quotations</span>
            <span className="text-lg font-bold text-[#F5F7F4]">{performance?.quotation_count || 0}</span>
            <span className="text-xs font-mono text-[#60A5FA] block">
              ₹{(performance?.quoted_amount || 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-[#101312] p-3 rounded-lg border border-[#292E2A]">
            <span className="text-[10px] uppercase text-[#A5AEA8] block">Accepted Proposals</span>
            <span className="text-lg font-bold text-[#F5F7F4]">{performance?.accepted_quotation_count || 0}</span>
            <span className="text-xs font-mono text-[#B8F23A] block">
              ₹{(performance?.accepted_quotation_amount || 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-[#101312] p-3 rounded-lg border border-[#292E2A]">
            <span className="text-[10px] uppercase text-[#A5AEA8] block">Confirmed Sales</span>
            <span className="text-lg font-bold text-[#F5F7F4]">{performance?.confirmed_sales_count || 0}</span>
            <span className="text-xs font-mono text-[#34D399] block font-bold">
              ₹{(performance?.confirmed_sales_amount || 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-[#101312] p-3 rounded-lg border border-[#292E2A]">
            <span className="text-[10px] uppercase text-[#A5AEA8] block">Status</span>
            <span className="text-lg font-bold text-[#F5F7F4]">{performance?.status || 'NO TARGET'}</span>
          </div>
        </div>
      </div>

      {/* Target Management Form */}
      <div className="bg-[#171918] border border-[#292E2A] rounded-xl p-6 mb-6">
        <h2 className="text-base font-semibold text-[#F5F7F4] mb-4 pb-2 border-b border-[#292E2A]">
          Update Sales Target for {fiscalYear}
        </h2>
        <form onSubmit={handleSaveTarget} className="flex flex-col sm:flex-row items-end gap-4">
          <div className="flex-1">
            <label className="block text-xs uppercase font-semibold text-[#A5AEA8] mb-1">
              Target Amount (₹)
            </label>
            <input
              type="number"
              required
              min="0"
              step="50000"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              className="w-full bg-[#101312] border border-[#292E2A] rounded-lg px-3.5 py-2 text-sm text-[#F5F7F4] focus:outline-none focus:border-[#B8F23A] font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={savingTarget}
            className="px-5 py-2 bg-[#B8F23A] hover:bg-[#a3d933] text-[#101312] font-semibold rounded-lg text-sm transition-colors cursor-pointer"
          >
            {savingTarget ? 'Saving...' : 'Save Target'}
          </button>
        </form>
      </div>

      {/* Step 2B — Follow-up Workload & Opportunity Performance */}
      <EngineerFollowUpSection engineerId={engineerId} />
    </div>
  );
}

function EngineerFollowUpSection({ engineerId }: { engineerId: number }) {
  const [fuPerf, setFuPerf] = useState<any>(null);

  useEffect(() => {
    import('../api').then(({ fetchEngineerFollowUpPerformance }) => {
      fetchEngineerFollowUpPerformance(engineerId).then(setFuPerf).catch(console.error);
    });
  }, [engineerId]);

  if (!fuPerf) return <div className="text-xs text-[#6D756F]">Loading follow-up workload...</div>;

  return (
    <div className="bg-[#171918] border border-[#292E2A] rounded-xl p-6 space-y-4">
      <h2 className="text-base font-semibold text-[#F5F7F4] pb-2 border-b border-[#292E2A]">
        Follow-Up Performance & Opportunity Workload
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="bg-[#101312] p-3 rounded-lg border border-[#292E2A]">
          <span className="text-[10px] uppercase text-[#A5AEA8] block">Due Today</span>
          <span className="text-xl font-bold text-[#D9A441]">{fuPerf.due_today_count}</span>
        </div>
        <div className="bg-[#101312] p-3 rounded-lg border border-[#292E2A]">
          <span className="text-[10px] uppercase text-[#A5AEA8] block">Overdue</span>
          <span className="text-xl font-bold text-[#E25757]">{fuPerf.overdue_count}</span>
        </div>
        <div className="bg-[#101312] p-3 rounded-lg border border-[#292E2A]">
          <span className="text-[10px] uppercase text-[#A5AEA8] block">Upcoming</span>
          <span className="text-xl font-bold text-[#7E95FF]">{fuPerf.upcoming_count}</span>
        </div>
        <div className="bg-[#101312] p-3 rounded-lg border border-[#292E2A]">
          <span className="text-[10px] uppercase text-[#A5AEA8] block">Done This Month</span>
          <span className="text-xl font-bold text-[#B8F23A]">{fuPerf.completed_this_month_count}</span>
        </div>
        <div className="bg-[#101312] p-3 rounded-lg border border-[#292E2A]">
          <span className="text-[10px] uppercase text-[#A5AEA8] block">Open Quotations</span>
          <span className="text-xl font-bold text-[#F5F7F4]">{fuPerf.open_quotations_count}</span>
        </div>
        <div className="bg-[#101312] p-3 rounded-lg border border-[#292E2A]">
          <span className="text-[10px] uppercase text-[#A5AEA8] block">Stale Quotations</span>
          <span className="text-xl font-bold text-[#D9A441]">{fuPerf.stale_quotations_count}</span>
        </div>
      </div>

      <div className="pt-2">
        <h3 className="text-xs font-semibold text-[#A5AEA8] uppercase mb-2">Assigned Follow-ups</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#292E2A] text-[#A5AEA8]">
                <th className="p-2">Date</th>
                <th className="p-2">Customer</th>
                <th className="p-2">Quotation</th>
                <th className="p-2 text-center">Priority</th>
                <th className="p-2">Status</th>
                <th className="p-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {fuPerf.follow_ups?.map((f: any) => (
                <tr key={f.id} className="border-b border-[#292E2A]/50">
                  <td className="p-2 text-[#F5F7F4]">{f.follow_up_date}</td>
                  <td className="p-2 text-[#A5AEA8]">{f.customer_name || 'N/A'}</td>
                  <td className="p-2 font-bold text-[#B8F23A]">
                    <Link to={`/quotations/${f.quotation_id}`}>{f.quotation_number}</Link>
                  </td>
                  <td className="p-2 text-center">
                    <span className={`badge ${f.priority === 'HIGH' || f.priority === 'URGENT' ? 'danger' : 'secondary'}`}>
                      {f.priority}
                    </span>
                  </td>
                  <td className="p-2">
                    <span className="badge warning">{f.status}</span>
                  </td>
                  <td className="p-2 text-[#A5AEA8]">{f.notes || '-'}</td>
                </tr>
              ))}
              {(!fuPerf.follow_ups || fuPerf.follow_ups.length === 0) && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-[#6D756F]">
                    No follow-ups recorded for this sales engineer.
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

