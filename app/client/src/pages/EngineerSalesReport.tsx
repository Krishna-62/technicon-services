import { useEffect, useState } from 'react';
import { api, EngineerPerformanceSummary } from '../api';

export default function EngineerSalesReport() {
  const [fiscalYear, setFiscalYear] = useState('2026-27');
  const [performance, setPerformance] = useState<EngineerPerformanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api.engineers
      .performance(fiscalYear)
      .then(setPerformance)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [fiscalYear]);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#292E2A]">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F7F4] tracking-tight">Engineer Sales & Target Report</h1>
          <p className="text-sm text-[#A5AEA8] mt-1">
            Year-end annual sales engineer performance report and target achievement summary.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={fiscalYear}
            onChange={(e) => setFiscalYear(e.target.value)}
            className="bg-[#171918] border border-[#292E2A] rounded-lg px-3 py-2 text-xs text-[#F5F7F4] focus:outline-none focus:border-[#B8F23A]"
          >
            <option value="2026-27">FY 2026-27</option>
            <option value="2025-26">FY 2025-26</option>
          </select>

          <a
            href={api.export.engineersPerformanceUrl(fiscalYear)}
            download
            className="px-4 py-2 bg-[#171918] hover:bg-[#292E2A] text-[#34D399] border border-[#292E2A] rounded-lg text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export Excel</span>
          </a>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[#E25757]/10 border border-[#E25757]/30 rounded-xl text-[#E25757] text-sm">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      {performance && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#171918] border border-[#292E2A] rounded-xl p-4">
            <span className="text-xs text-[#A5AEA8] uppercase tracking-wider block font-medium">Annual Sales Target</span>
            <span className="text-2xl font-bold text-[#F5F7F4] mt-1 block font-mono">
              ₹{performance.summary.total_target.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-[#171918] border border-[#292E2A] rounded-xl p-4">
            <span className="text-xs text-[#A5AEA8] uppercase tracking-wider block font-medium">Total Quoted Value</span>
            <span className="text-2xl font-bold text-[#60A5FA] mt-1 block font-mono">
              ₹{performance.summary.total_quoted.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-[#171918] border border-[#292E2A] rounded-xl p-4">
            <span className="text-xs text-[#A5AEA8] uppercase tracking-wider block font-medium">Confirmed Sales Achieved</span>
            <span className="text-2xl font-bold text-[#34D399] mt-1 block font-mono">
              ₹{performance.summary.total_confirmed.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-[#171918] border border-[#292E2A] rounded-xl p-4">
            <span className="text-xs text-[#A5AEA8] uppercase tracking-wider block font-medium">Team Achievement Rate</span>
            <span className="text-2xl font-bold text-[#B8F23A] mt-1 block">
              {performance.summary.overall_achievement_pct.toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      {/* Report Table */}
      <div className="bg-[#171918] border border-[#292E2A] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#292E2A] flex justify-between items-center">
          <h2 className="text-base font-semibold text-[#F5F7F4]">Sales Engineer Performance Breakdown</h2>
          <span className="text-xs font-mono text-[#A5AEA8]">{fiscalYear}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#101312] text-xs font-semibold text-[#A5AEA8] uppercase tracking-wider border-b border-[#292E2A]">
              <tr>
                <th className="px-4 py-3">Code / Engineer</th>
                <th className="px-4 py-3 text-right">Target (₹)</th>
                <th className="px-4 py-3 text-right">Quoted (₹)</th>
                <th className="px-4 py-3 text-right">Accepted (₹)</th>
                <th className="px-4 py-3 text-right">Confirmed Sales (₹)</th>
                <th className="px-4 py-3 text-right">Achieved %</th>
                <th className="px-4 py-3 text-right">Shortfall (₹)</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#292E2A] text-[#F5F7F4]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[#A5AEA8] text-xs">
                    Loading report data...
                  </td>
                </tr>
              ) : !performance || performance.engineers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[#A5AEA8] text-xs">
                    No engineer performance data recorded for {fiscalYear}.
                  </td>
                </tr>
              ) : (
                performance.engineers.map((eng) => {
                  let badgeColor = 'bg-[#A5AEA8]/10 text-[#A5AEA8] border-[#A5AEA8]/30';
                  if (eng.status === 'EXCEEDED') badgeColor = 'bg-[#34D399]/10 text-[#34D399] border-[#34D399]/30';
                  else if (eng.status === 'ON_TRACK') badgeColor = 'bg-[#B8F23A]/10 text-[#B8F23A] border-[#B8F23A]/30';
                  else if (eng.status === 'BEHIND') badgeColor = 'bg-[#E25757]/10 text-[#E25757] border-[#E25757]/30';

                  return (
                    <tr key={eng.engineer_id} className="hover:bg-[#101312]/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-semibold text-[#F5F7F4] block">{eng.name}</span>
                        <span className="text-xs text-[#A5AEA8] font-mono">{eng.code}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-[#F5F7F4]">
                        ₹{eng.target_amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[#60A5FA]">
                        ₹{eng.quoted_amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[#B8F23A]">
                        ₹{eng.accepted_quotation_amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[#34D399] font-bold">
                        ₹{eng.confirmed_sales_amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-[#F5F7F4]">
                        {eng.achievement_pct.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[#E25757]">
                        {eng.shortfall_amount > 0 ? `₹${eng.shortfall_amount.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${badgeColor}`}>
                          {eng.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
