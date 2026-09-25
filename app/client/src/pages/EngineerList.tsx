import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, SalesEngineer, EngineerPerformanceSummary, EngineerPerformance } from '../api';

export default function EngineerList() {
  const [engineers, setEngineers] = useState<SalesEngineer[]>([]);
  const [performance, setPerformance] = useState<EngineerPerformanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [fiscalYear, setFiscalYear] = useState('2026-27');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [savingEngineer, setSavingEngineer] = useState(false);

  const [targetModalEngineer, setTargetModalEngineer] = useState<SalesEngineer | null>(null);
  const [targetAmountInput, setTargetAmountInput] = useState<number | string>('');
  const [savingTarget, setSavingTarget] = useState(false);

  function loadData() {
    setLoading(true);
    setError('');
    Promise.all([
      api.engineers.list(),
      api.engineers.performance(fiscalYear),
    ])
      .then(([engList, perfData]) => {
        setEngineers(engList);
        setPerformance(perfData);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, [fiscalYear]);

  async function handleCreateEngineer(e: React.FormEvent) {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) return;
    setSavingEngineer(true);
    try {
      await api.engineers.create({
        code: newCode.trim(),
        name: newName.trim(),
        email: newEmail.trim() || null,
        phone: newPhone.trim() || null,
      });
      setShowAddModal(false);
      setNewCode('');
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingEngineer(false);
    }
  }

  async function handleSetTarget(e: React.FormEvent) {
    e.preventDefault();
    if (!targetModalEngineer || !targetAmountInput) return;
    setSavingTarget(true);
    try {
      await api.engineers.setTarget({
        engineer_id: targetModalEngineer.id,
        fiscal_year: fiscalYear,
        target_amount: Number(targetAmountInput),
      });
      setTargetModalEngineer(null);
      setTargetAmountInput('');
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingTarget(false);
    }
  }

  const perfMap = new Map<number, EngineerPerformance>();
  performance?.engineers.forEach((p) => perfMap.set(p.engineer_id, p));

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#292E2A]">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F7F4] tracking-tight">Sales Engineers & Target Management</h1>
          <p className="text-sm text-[#A5AEA8] mt-1">
            Track sales team attribution, annual target achievements, and revenue performance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
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

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#B8F23A] hover:bg-[#a3d933] text-[#101312] font-semibold rounded-lg text-xs transition-colors shadow-sm inline-flex items-center space-x-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Sales Engineer</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[#E25757]/10 border border-[#E25757]/30 rounded-xl text-[#E25757] text-sm">
          {error}
        </div>
      )}

      {/* Overview Cards */}
      {performance && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-[#171918] border border-[#292E2A] rounded-xl p-4">
            <span className="text-xs text-[#A5AEA8] uppercase tracking-wider block font-medium">Sales Engineers</span>
            <span className="text-2xl font-bold text-[#F5F7F4] mt-1 block">{performance.summary.total_engineers}</span>
          </div>
          <div className="bg-[#171918] border border-[#292E2A] rounded-xl p-4">
            <span className="text-xs text-[#A5AEA8] uppercase tracking-wider block font-medium">Total Target ({fiscalYear})</span>
            <span className="text-2xl font-bold text-[#F5F7F4] mt-1 block font-mono">
              ₹{performance.summary.total_target.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="bg-[#171918] border border-[#292E2A] rounded-xl p-4">
            <span className="text-xs text-[#A5AEA8] uppercase tracking-wider block font-medium">Total Quoted</span>
            <span className="text-2xl font-bold text-[#60A5FA] mt-1 block font-mono">
              ₹{performance.summary.total_quoted.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="bg-[#171918] border border-[#292E2A] rounded-xl p-4">
            <span className="text-xs text-[#A5AEA8] uppercase tracking-wider block font-medium">Confirmed Sales</span>
            <span className="text-2xl font-bold text-[#34D399] mt-1 block font-mono">
              ₹{performance.summary.total_confirmed.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="bg-[#171918] border border-[#292E2A] rounded-xl p-4">
            <span className="text-xs text-[#A5AEA8] uppercase tracking-wider block font-medium">Overall Achievement</span>
            <span className="text-2xl font-bold text-[#B8F23A] mt-1 block">
              {performance.summary.overall_achievement_pct.toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      {/* Engineer Table */}
      <div className="bg-[#171918] border border-[#292E2A] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#101312] text-xs font-semibold text-[#A5AEA8] uppercase tracking-wider border-b border-[#292E2A]">
              <tr>
                <th className="px-4 py-3">Code / Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3 text-right">FY Target (₹)</th>
                <th className="px-4 py-3 text-right">Quoted (₹)</th>
                <th className="px-4 py-3 text-right">Confirmed Sales (₹)</th>
                <th className="px-4 py-3 text-right">Achievement %</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#292E2A] text-[#F5F7F4]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[#A5AEA8] text-xs">
                    Loading sales engineers...
                  </td>
                </tr>
              ) : engineers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[#A5AEA8] text-xs">
                    No sales engineers found. Click "Add Sales Engineer" to create one.
                  </td>
                </tr>
              ) : (
                engineers.map((eng) => {
                  const perf = perfMap.get(eng.id);
                  const targetVal = perf?.target_amount || 0;
                  const confirmedVal = perf?.confirmed_sales_amount || 0;
                  const quotedVal = perf?.quoted_amount || 0;
                  const pct = perf?.achievement_pct || 0;

                  let statusBadge = 'bg-[#A5AEA8]/10 text-[#A5AEA8] border-[#A5AEA8]/30';
                  let statusLabel = 'NO TARGET';

                  if (perf?.status === 'EXCEEDED') {
                    statusBadge = 'bg-[#34D399]/10 text-[#34D399] border-[#34D399]/30';
                    statusLabel = 'EXCEEDED';
                  } else if (perf?.status === 'ON_TRACK') {
                    statusBadge = 'bg-[#B8F23A]/10 text-[#B8F23A] border-[#B8F23A]/30';
                    statusLabel = 'ON TRACK';
                  } else if (perf?.status === 'BEHIND') {
                    statusBadge = 'bg-[#E25757]/10 text-[#E25757] border-[#E25757]/30';
                    statusLabel = 'BEHIND';
                  }

                  return (
                    <tr key={eng.id} className="hover:bg-[#101312]/50 transition-colors">
                      <td className="px-4 py-3">
                        <Link to={`/sales/engineers/${eng.id}`} className="font-semibold text-[#F5F7F4] hover:text-[#B8F23A] block">
                          {eng.name}
                        </Link>
                        <span className="text-xs text-[#A5AEA8] font-mono">{eng.code}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#A5AEA8]">
                        <div>{eng.email || '—'}</div>
                        <div>{eng.phone || '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-[#F5F7F4]">
                        ₹{targetVal.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[#60A5FA]">
                        ₹{quotedVal.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[#34D399] font-bold">
                        ₹{confirmedVal.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        <div className="flex items-center justify-end space-x-2">
                          <div className="w-16 bg-[#101312] border border-[#292E2A] rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-[#B8F23A] h-full transition-all"
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-[#F5F7F4]">{pct.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${statusBadge}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => {
                            setTargetModalEngineer(eng);
                            setTargetAmountInput(targetVal > 0 ? targetVal : '');
                          }}
                          className="px-2.5 py-1 bg-[#101312] hover:bg-[#292E2A] text-[#B8F23A] border border-[#292E2A] rounded text-xs transition-colors cursor-pointer"
                        >
                          Set Target
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Engineer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#171918] border border-[#292E2A] rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-[#292E2A] pb-3">
              <h3 className="text-lg font-bold text-[#F5F7F4]">Add Sales Engineer</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#A5AEA8] hover:text-[#F5F7F4]">✕</button>
            </div>
            <form onSubmit={handleCreateEngineer} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-semibold text-[#A5AEA8] mb-1">Engineer Code *</label>
                <input
                  type="text"
                  required
                  placeholder="ENG-005"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full bg-[#101312] border border-[#292E2A] rounded-lg px-3 py-2 text-sm text-[#F5F7F4] focus:outline-none focus:border-[#B8F23A]"
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-semibold text-[#A5AEA8] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Vijay Kumar"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[#101312] border border-[#292E2A] rounded-lg px-3 py-2 text-sm text-[#F5F7F4] focus:outline-none focus:border-[#B8F23A]"
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-semibold text-[#A5AEA8] mb-1">Email</label>
                <input
                  type="email"
                  placeholder="vijay@technicon.in"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-[#101312] border border-[#292E2A] rounded-lg px-3 py-2 text-sm text-[#F5F7F4] focus:outline-none focus:border-[#B8F23A]"
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-semibold text-[#A5AEA8] mb-1">Phone</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full bg-[#101312] border border-[#292E2A] rounded-lg px-3 py-2 text-sm text-[#F5F7F4] focus:outline-none focus:border-[#B8F23A]"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#101312] text-[#A5AEA8] border border-[#292E2A] rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEngineer}
                  className="px-4 py-2 bg-[#B8F23A] text-[#101312] font-semibold rounded-lg text-xs"
                >
                  {savingEngineer ? 'Saving...' : 'Create Engineer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Target Set Modal */}
      {targetModalEngineer && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#171918] border border-[#292E2A] rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-[#292E2A] pb-3">
              <h3 className="text-lg font-bold text-[#F5F7F4]">Set Annual Target for {targetModalEngineer.name}</h3>
              <button onClick={() => setTargetModalEngineer(null)} className="text-[#A5AEA8] hover:text-[#F5F7F4]">✕</button>
            </div>
            <form onSubmit={handleSetTarget} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-semibold text-[#A5AEA8] mb-1">Fiscal Year</label>
                <input
                  type="text"
                  disabled
                  value={fiscalYear}
                  className="w-full bg-[#101312] border border-[#292E2A] rounded-lg px-3 py-2 text-sm text-[#A5AEA8]"
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-semibold text-[#A5AEA8] mb-1">Annual Sales Target (₹) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="10000"
                  placeholder="5000000"
                  value={targetAmountInput}
                  onChange={(e) => setTargetAmountInput(e.target.value)}
                  className="w-full bg-[#101312] border border-[#292E2A] rounded-lg px-3 py-2 text-sm text-[#F5F7F4] focus:outline-none focus:border-[#B8F23A] font-mono"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTargetModalEngineer(null)}
                  className="px-4 py-2 bg-[#101312] text-[#A5AEA8] border border-[#292E2A] rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTarget}
                  className="px-4 py-2 bg-[#B8F23A] text-[#101312] font-semibold rounded-lg text-xs"
                >
                  {savingTarget ? 'Saving Target...' : 'Save Target'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
