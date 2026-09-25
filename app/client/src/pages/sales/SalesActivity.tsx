import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, SalesActivityItem } from '../../api';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/state-views';

function formatCurrency(val: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

export default function SalesActivity() {
  const [activity, setActivity] = useState<SalesActivityItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [docTypeFilter, setDocTypeFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadActivity();
  }, [docTypeFilter, search]);

  const loadActivity = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.sales.activity({
        docType: docTypeFilter || undefined,
        q: search || undefined,
      });
      setActivity(res.activity);
      setTotal(res.total);
    } catch (err: any) {
      console.error('Failed to load sales activity log:', err);
      setError(err.message || 'Failed to load sales activity');
    } finally {
      setLoading(false);
    }
  };

  const getDocBadgeClass = (docType: string) => {
    switch (docType) {
      case 'QUOTATION':
        return 'bg-[#7E95FF]/10 text-[#7E95FF] border border-[#7E95FF]/30 font-semibold';
      case 'PURCHASE_ORDER':
        return 'bg-[#1D211E] text-[#F5F7F4] border border-[#333C31] font-semibold';
      case 'PERFORMA_INVOICE':
        return 'bg-[#D9A441]/10 text-[#D9A441] border border-[#D9A441]/30 font-semibold';
      case 'SALE_REPORT':
        return 'bg-[#B8F23A]/10 text-[#B8F23A] border border-[#B8F23A]/30 font-semibold';
      default:
        return 'bg-[#1D211E] text-[#A5AEA8] border border-[#292E2A]';
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#171918] border border-[#292E2A] p-4 rounded-xl">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F7F4] tracking-tight">Sales Activity Audit Stream</h1>
          <p className="text-xs text-[#A5AEA8] mt-1">
            Chronological record of document creations, status progression, customer actions, and dispatches.
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
            to="/sales"
            className="btn small bg-[#1D211E] text-[#F5F7F4] border border-[#292E2A] hover:bg-[#292E2A] text-xs font-semibold px-3 py-1.5 rounded-lg"
          >
            ← Sales Overview
          </Link>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-[#171918] border border-[#292E2A] p-3.5 rounded-xl">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <input
              type="text"
              className="w-full bg-[#101312] border border-[#292E2A] text-[#F5F7F4] px-3 py-1.5 rounded-lg text-xs outline-none focus:border-[#B8F23A]"
              placeholder="Search document number, company name, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <select
              className="w-full bg-[#101312] border border-[#292E2A] text-[#F5F7F4] px-3 py-1.5 rounded-lg text-xs outline-none focus:border-[#B8F23A]"
              value={docTypeFilter}
              onChange={(e) => setDocTypeFilter(e.target.value)}
            >
              <option value="">All Document Types</option>
              <option value="QUOTATION">Quotations</option>
              <option value="PURCHASE_ORDER">Purchase Orders</option>
              <option value="PERFORMA_INVOICE">Performa Invoices</option>
              <option value="SALE_REPORT">Sale Reports</option>
            </select>
          </div>
          {(search || docTypeFilter) && (
            <button
              className="btn small bg-[#1D211E] text-[#E25757] border border-[#292E2A] hover:bg-[#292E2A] text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0"
              onClick={() => {
                setSearch('');
                setDocTypeFilter('');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Content Table / State Views */}
      {loading ? (
        <LoadingState message="Loading activity audit log..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadActivity} />
      ) : activity.length === 0 ? (
        <EmptyState
          title="No sales activity records found"
          message="No commercial document creation or status events match the current filter criteria."
          icon="📜"
          actionLabel={search || docTypeFilter ? 'Clear Filters' : undefined}
          onAction={search || docTypeFilter ? () => { setSearch(''); setDocTypeFilter(''); } : undefined}
        />
      ) : (
        <div className="bg-[#171918] border border-[#292E2A] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[#292E2A] bg-[#1D211E]/80 text-[#A5AEA8] uppercase text-[10px] tracking-wider font-semibold">
                  <th className="p-3">Date & Time</th>
                  <th className="p-3">Document Type</th>
                  <th className="p-3">Document No</th>
                  <th className="p-3">Company Name</th>
                  <th className="p-3">Event Description</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#292E2A]/50">
                {activity.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#1D211E]/60 transition-colors">
                    <td className="p-3 text-[#A5AEA8] font-mono text-[11px] whitespace-nowrap">
                      {item.event_timestamp}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${getDocBadgeClass(item.doc_type)}`}>
                        {item.doc_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-[#F5F7F4]">{item.doc_number}</td>
                    <td className="p-3 font-medium text-[#F5F7F4] max-w-[180px] truncate" title={item.company_name}>
                      {item.company_name}
                    </td>
                    <td className="p-3 text-[#A5AEA8] max-w-[300px] truncate" title={item.description}>
                      {item.description}
                    </td>
                    <td className="p-3 text-right font-bold text-[#F5F7F4] font-mono">
                      {formatCurrency(Number(item.amount || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center px-4 py-2.5 bg-[#1D211E]/60 border-t border-[#292E2A] text-xs text-[#A5AEA8]">
            <span>Showing {activity.length} of {total} activity records</span>
            <span className="font-mono text-[11px]">Backend Authoritative Audit Log</span>
          </div>
        </div>
      )}
    </div>
  );
}
