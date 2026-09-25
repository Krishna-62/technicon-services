import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, SalesOverviewResponse } from '../../api';
import { LoadingState, ErrorState } from '../../components/ui/state-views';

function formatCurrency(val: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

export default function SalesOverview() {
  const [data, setData] = useState<SalesOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.sales.overview();
      setData(res);
    } catch (err: any) {
      console.error('Failed to load sales overview:', err);
      setError(err.message || 'Failed to load sales overview');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading Sales Control Center..." />;
  }

  if (error || !data) {
    return <ErrorState message={error || 'Failed to load sales overview'} onRetry={loadOverview} />;
  }

  const { kpis, pipeline } = data;

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#171918] border border-[#292E2A] p-4 rounded-xl">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F7F4] tracking-tight">Sales Overview & Controls</h1>
          <p className="text-xs text-[#A5AEA8] mt-1">
            Unified operational control center for quotations, purchase orders, performa invoices, and sale reports.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/sales/pipeline"
            className="btn small bg-[#1D211E] text-[#B8F23A] border border-[#333C31] hover:bg-[#292E2A] text-xs font-semibold px-3 py-1.5 rounded-lg"
          >
            📊 Pipeline Board
          </Link>
          <Link
            to="/quotations/new"
            className="btn small bg-[#B8F23A] hover:bg-[#a3d933] text-[#101312] font-semibold text-xs px-3 py-1.5 rounded-lg"
          >
            + New Quotation
          </Link>
          <Link
            to="/sales/orders"
            className="btn small bg-[#1D211E] text-[#F5F7F4] border border-[#292E2A] hover:bg-[#292E2A] text-xs font-semibold px-3 py-1.5 rounded-lg"
          >
            View Orders
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid - Fixed text collision */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#171918] border border-[#292E2A] p-3.5 rounded-xl hover:border-[#333C31] transition-colors space-y-1">
          <div className="text-[10px] uppercase font-semibold tracking-wider text-[#A5AEA8]">Total Quotations</div>
          <div className="text-xl font-bold text-[#F5F7F4]">{kpis.totalQuotations}</div>
          <div className="text-[11px] text-[#6D756F] pt-1 border-t border-[#292E2A]/50">
            Drafts: <span className="text-[#F5F7F4] font-medium">{kpis.draftQuotations}</span> | Sent: <span className="text-[#F5F7F4] font-medium">{kpis.sentQuotations}</span>
          </div>
        </div>

        <div className="bg-[#171918] border border-[#292E2A] p-3.5 rounded-xl hover:border-[#333C31] transition-colors space-y-1">
          <div className="text-[10px] uppercase font-semibold tracking-wider text-[#A5AEA8]">Accepted Quotes</div>
          <div className="text-xl font-bold text-[#B8F23A]">{kpis.acceptedQuotations}</div>
          <div className="text-[11px] text-[#6D756F] pt-1 border-t border-[#292E2A]/50 font-mono">
            {formatCurrency(kpis.acceptedQuotationValue)}
          </div>
        </div>

        <div className="bg-[#171918] border border-[#292E2A] p-3.5 rounded-xl hover:border-[#333C31] transition-colors space-y-1">
          <div className="text-[10px] uppercase font-semibold tracking-wider text-[#A5AEA8]">Open Orders</div>
          <div className="text-xl font-bold text-[#7E95FF]">{kpis.openOrders}</div>
          <div className="text-[11px] text-[#6D756F] pt-1 border-t border-[#292E2A]/50 font-mono">
            {formatCurrency(kpis.openOrderValue)}
          </div>
        </div>

        <div className="bg-[#171918] border border-[#292E2A] p-3.5 rounded-xl hover:border-[#333C31] transition-colors space-y-1">
          <div className="text-[10px] uppercase font-semibold tracking-wider text-[#A5AEA8]">Pending PIs</div>
          <div className="text-xl font-bold text-[#D9A441]">{kpis.pendingPis}</div>
          <div className="text-[11px] text-[#6D756F] pt-1 border-t border-[#292E2A]/50">Awaiting Invoicing</div>
        </div>

        <div className="bg-[#171918] border border-[#292E2A] p-3.5 rounded-xl hover:border-[#333C31] transition-colors space-y-1">
          <div className="text-[10px] uppercase font-semibold tracking-wider text-[#A5AEA8]">Pending Dispatch</div>
          <div className="text-xl font-bold text-[#F2994A]">{kpis.pendingSaleReports}</div>
          <div className="text-[11px] text-[#6D756F] pt-1 border-t border-[#292E2A]/50">Draft Sale Reports</div>
        </div>

        <div className="bg-[#171918] border border-[#B8F23A]/40 p-3.5 rounded-xl hover:border-[#B8F23A] transition-colors space-y-1 bg-[#B8F23A]/5">
          <div className="text-[10px] uppercase font-semibold tracking-wider text-[#B8F23A]">Confirmed Sales</div>
          <div className="text-xl font-bold text-[#B8F23A] font-mono">{formatCurrency(kpis.salesValue)}</div>
          <div className="text-[11px] text-[#A5AEA8] pt-1 border-t border-[#B8F23A]/20">
            {kpis.confirmedSales} Confirmed Sales
          </div>
        </div>
      </div>

      {/* Horizontal Process Stage Flow */}
      <div className="bg-[#171918] border border-[#292E2A] p-4 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#F5F7F4]">Sales Pipeline Stage Flow</h2>
            <p className="text-xs text-[#A5AEA8]">Commercial document progression from quotation to confirmed sale</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#1D211E] text-[#B8F23A] border border-[#333C31] font-mono">
            Conversion Rate: {kpis.quotationConversionRate}%
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 pt-1">
          {pipeline.map((stage, idx) => (
            <div
              key={stage.stage}
              className="relative bg-[#101312] border border-[#292E2A] p-3 rounded-xl flex flex-col justify-between hover:border-[#333C31] transition-colors"
            >
              <div>
                <div className="flex justify-between items-center text-[10px] uppercase font-bold text-[#6D756F]">
                  <span>Stage 0{idx + 1}</span>
                  {idx < pipeline.length - 1 && <span className="hidden lg:inline text-[#292E2A] font-bold text-sm">→</span>}
                </div>
                <div className="text-xs font-bold text-[#F5F7F4] mt-1">{stage.label}</div>
              </div>
              <div className="mt-3 pt-2 border-t border-[#292E2A]/60 flex justify-between items-baseline">
                <span className="text-base font-bold text-[#F5F7F4]">{stage.count}</span>
                <span className="text-xs font-mono text-[#B8F23A] font-semibold">{formatCurrency(Number(stage.value))}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls & Financial Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Operational Sales Controls */}
        <div className="bg-[#171918] border border-[#292E2A] p-4 rounded-xl space-y-3">
          <h2 className="text-sm font-bold text-[#F5F7F4]">Operational Sales Controls</h2>
          <div className="space-y-2">
            <Link
              to="/sales/pipeline"
              className="flex items-center justify-between p-3 rounded-xl bg-[#101312] border border-[#292E2A] hover:border-[#333C31] hover:bg-[#1D211E]/80 transition-all"
            >
              <div>
                <div className="text-xs font-bold text-[#F5F7F4]">Sales Pipeline Control Center</div>
                <div className="text-[11px] text-[#A5AEA8]">Kanban & Table view of all active opportunities & stock risk</div>
              </div>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#B8F23A]/10 text-[#B8F23A] border border-[#B8F23A]/30">
                Pipeline Control
              </span>
            </Link>

            <Link
              to="/follow-ups/due-today"
              className="flex items-center justify-between p-3 rounded-xl bg-[#101312] border border-[#292E2A] hover:border-[#333C31] hover:bg-[#1D211E]/80 transition-all"
            >
              <div>
                <div className="text-xs font-bold text-[#F5F7F4]">Follow-ups Due Today</div>
                <div className="text-[11px] text-[#A5AEA8]">Scheduled customer actions requiring contact today</div>
              </div>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#7E95FF]/10 text-[#7E95FF] border border-[#7E95FF]/30">
                Due Today Queue
              </span>
            </Link>

            <Link
              to="/follow-ups/overdue"
              className="flex items-center justify-between p-3 rounded-xl bg-[#101312] border border-[#292E2A] hover:border-[#333C31] hover:bg-[#1D211E]/80 transition-all"
            >
              <div>
                <div className="text-xs font-bold text-[#F5F7F4]">Overdue Follow-ups</div>
                <div className="text-[11px] text-[#A5AEA8]">High priority pending follow-ups requiring escalation</div>
              </div>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#E25757]/10 text-[#E25757] border border-[#E25757]/30">
                Action Required
              </span>
            </Link>

            <Link
              to="/sales/activity"
              className="flex items-center justify-between p-3 rounded-xl bg-[#101312] border border-[#292E2A] hover:border-[#333C31] hover:bg-[#1D211E]/80 transition-all"
            >
              <div>
                <div className="text-xs font-bold text-[#F5F7F4]">Sales Activity Audit Log</div>
                <div className="text-[11px] text-[#A5AEA8]">Chronological event stream of all sales document events</div>
              </div>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#1D211E] text-[#A5AEA8] border border-[#292E2A]">
                Audit Stream
              </span>
            </Link>
          </div>
        </div>

        {/* Financial Summary Metrics */}
        <div className="bg-[#171918] border border-[#292E2A] p-4 rounded-xl space-y-3">
          <h2 className="text-sm font-bold text-[#F5F7F4]">Financial Summary Metrics</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <tbody className="divide-y divide-[#292E2A]/50">
                <tr>
                  <td className="py-2.5 text-[#A5AEA8]">Gross Sales (Confirmed)</td>
                  <td className="py-2.5 text-right font-bold text-[#B8F23A] font-mono">{formatCurrency(kpis.grossSales)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-[#A5AEA8]">Accepted Quotation Pipeline</td>
                  <td className="py-2.5 text-right font-bold text-[#F5F7F4] font-mono">{formatCurrency(kpis.acceptedQuotationValue)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-[#A5AEA8]">Open Order Value</td>
                  <td className="py-2.5 text-right font-bold text-[#F5F7F4] font-mono">{formatCurrency(kpis.openOrderValue)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-[#A5AEA8]">Pending Dispatch Value</td>
                  <td className="py-2.5 text-right font-bold text-[#D9A441] font-mono">{formatCurrency(kpis.pendingDispatchValue)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-[#A5AEA8]">Average Order Value</td>
                  <td className="py-2.5 text-right font-bold text-[#F5F7F4] font-mono">{formatCurrency(kpis.averageOrderValue)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-[#A5AEA8]">Quotation Conversion Rate</td>
                  <td className="py-2.5 text-right font-bold text-[#7E95FF] font-mono">{kpis.quotationConversionRate}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
