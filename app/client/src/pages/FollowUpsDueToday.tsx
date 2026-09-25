import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchFollowUpsDueToday,
  completeFollowUpApi,
  rescheduleFollowUpApi,
  type SalesFollowUp,
} from '../api';
import { LoadingState, ErrorState, EmptyState } from '../components/ui/state-views';

function formatCurrency(val: number | null) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

export default function FollowUpsDueToday() {
  const [followUps, setFollowUps] = useState<SalesFollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Action modal
  const [activeModal, setActiveModal] = useState<{
    open: boolean;
    type: 'complete' | 'reschedule';
    item?: SalesFollowUp;
  }>({ open: false, type: 'complete' });

  const [notes, setNotes] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('11:00');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const rows = await fetchFollowUpsDueToday({ q: search });
      setFollowUps(rows);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load follow-ups due today');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const handleExportExcel = () => {
    window.location.href = `/api/sales/follow-ups/export?dueToday=true&q=${encodeURIComponent(search)}`;
  };

  const openActionModal = (type: 'complete' | 'reschedule', item: SalesFollowUp) => {
    setActiveModal({ open: true, type, item });
    setNotes('');
    setNewDate(new Date().toISOString().split('T')[0]);
    setNewTime('11:00');
  };

  const handleActionSubmit = async () => {
    if (!activeModal.item) return;
    setSubmitting(true);
    try {
      if (activeModal.type === 'complete') {
        await completeFollowUpApi(activeModal.item.id, { notes });
      } else {
        await rescheduleFollowUpApi(activeModal.item.id, {
          followUpDate: newDate,
          followUpTime: newTime,
          notes,
        });
      }
      setActiveModal({ open: false, type: 'complete' });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update follow-up');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && followUps.length === 0) {
    return <LoadingState message="Loading due-today follow-ups..." />;
  }

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-[#E25757]/20 text-[#E25757] border border-[#E25757]/40 font-bold';
      case 'HIGH':
        return 'bg-[#D9A441]/20 text-[#D9A441] border border-[#D9A441]/40 font-semibold';
      case 'NORMAL':
        return 'bg-[#1D211E] text-[#7E95FF] border border-[#333C31]';
      case 'LOW':
      default:
        return 'bg-[#1D211E] text-[#A5AEA8] border border-[#292E2A]';
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#171918] border border-[#292E2A] p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-[#F5F7F4] tracking-tight">Follow-Ups Due Today</h1>
            <span className="bg-[#B8F23A]/10 text-[#B8F23A] text-xs font-semibold px-2.5 py-0.5 rounded-full border border-[#B8F23A]/30">
              Today's Queue
            </span>
          </div>
          <p className="text-xs text-[#A5AEA8] mt-1">
            Scheduled sales follow-ups requiring customer action or engineering contact today.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="btn small bg-[#1D211E] text-[#F5F7F4] border-[#292E2A] hover:bg-[#292E2A] transition-colors"
          >
            🔄 Refresh
          </button>
          <button
            className="btn small bg-[#B8F23A] hover:bg-[#a3d933] text-[#101312] font-semibold transition-colors px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs"
            onClick={handleExportExcel}
          >
            📥 Export Excel
          </button>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={loadData} />}

      {/* KPI Toolbar Card */}
      <div className="bg-[#171918] border border-[#292E2A] p-4 rounded-xl flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#B8F23A]/10 border border-[#B8F23A]/30 flex items-center justify-center text-lg font-bold text-[#B8F23A]">
            {followUps.length}
          </div>
          <div>
            <div className="text-xs font-bold text-[#F5F7F4]">Follow-ups Scheduled For Today</div>
            <div className="text-[11px] text-[#A5AEA8]">Contact customer before close of business today</div>
          </div>
        </div>

        <div className="w-full sm:w-auto">
          <input
            type="text"
            className="bg-[#101312] border border-[#292E2A] text-[#F5F7F4] px-3 py-1.5 rounded-lg text-xs w-full sm:w-72 outline-none focus:border-[#B8F23A]"
            placeholder="Search customer, quotation, engineer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table / Empty State */}
      {followUps.length === 0 ? (
        <EmptyState
          title="No follow-ups due today"
          message="All scheduled customer follow-ups are currently up to date for today."
          icon="🎉"
          actionLabel={search ? 'Clear Search' : undefined}
          onAction={search ? () => setSearch('') : undefined}
        />
      ) : (
        <div className="bg-[#171918] border border-[#292E2A] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[#292E2A] bg-[#1D211E]/80 text-[#A5AEA8] uppercase text-[10px] tracking-wider font-semibold">
                  <th className="p-3">Time</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Quotation No</th>
                  <th className="p-3">Engineer</th>
                  <th className="p-3">Branch</th>
                  <th className="p-3 text-right">Value (₹)</th>
                  <th className="p-3 text-center">Priority</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Notes / Next Action</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#292E2A]/50">
                {followUps.map((f) => (
                  <tr key={f.id} className="hover:bg-[#1D211E]/60 transition-colors">
                    <td className="p-3 font-mono text-[#7E95FF] font-semibold">{f.follow_up_time || 'All Day'}</td>
                    <td className="p-3 font-bold text-[#F5F7F4] max-w-[180px] truncate" title={f.customer_name || ''}>
                      {f.customer_name || 'N/A'}
                    </td>
                    <td className="p-3 font-bold font-mono">
                      {f.quotation_id ? (
                        <Link to={`/quotations/${f.quotation_id}`} className="text-[#B8F23A] hover:underline">
                          {f.quotation_number}
                        </Link>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-3 text-[#A5AEA8]">{f.engineer_name || 'Unassigned'}</td>
                    <td className="p-3 text-[#A5AEA8]">{f.branch_name || 'Main'}</td>
                    <td className="p-3 text-right font-bold text-[#F5F7F4] font-mono">
                      {formatCurrency(f.net_subtotal)}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${getPriorityBadgeClass(f.priority)}`}>
                        {f.priority}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#1D211E] text-[#A5AEA8] border border-[#292E2A]">
                        {f.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-[#A5AEA8] max-w-[220px] truncate" title={f.notes || ''}>
                      {f.notes || 'No notes added'}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          className="btn tiny bg-[#B8F23A] hover:bg-[#a3d933] text-[#101312] font-semibold text-[11px] px-2.5 py-1 rounded-md"
                          onClick={() => openActionModal('complete', f)}
                        >
                          Complete
                        </button>
                        <button
                          className="btn tiny bg-[#1D211E] text-[#F5F7F4] border border-[#292E2A] hover:bg-[#292E2A] text-[11px] font-semibold px-2 py-1 rounded-md"
                          onClick={() => openActionModal('reschedule', f)}
                        >
                          Reschedule
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {activeModal.open && activeModal.item && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-[#171918] border border-[#292E2A] p-5 rounded-xl max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-[#292E2A] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#F5F7F4]">
                  {activeModal.type === 'complete' ? 'Complete Follow-Up' : 'Reschedule Follow-Up'}
                </h3>
                <p className="text-xs text-[#A5AEA8] mt-0.5">
                  {activeModal.item.customer_name} — {activeModal.item.quotation_number}
                </p>
              </div>
              <button
                onClick={() => setActiveModal({ open: false, type: 'complete' })}
                className="text-[#A5AEA8] hover:text-[#F5F7F4] font-bold text-lg"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {activeModal.type === 'reschedule' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#A5AEA8] font-medium mb-1">New Date</label>
                    <input
                      type="date"
                      className="w-full bg-[#101312] border border-[#292E2A] text-[#F5F7F4] p-2 rounded-lg outline-none focus:border-[#B8F23A]"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[#A5AEA8] font-medium mb-1">Time</label>
                    <input
                      type="time"
                      className="w-full bg-[#101312] border border-[#292E2A] text-[#F5F7F4] p-2 rounded-lg outline-none focus:border-[#B8F23A]"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[#A5AEA8] font-medium mb-1">
                  {activeModal.type === 'complete' ? 'Completion Notes & Outcome' : 'Reschedule Reason & Notes'}
                </label>
                <textarea
                  rows={3}
                  className="w-full bg-[#101312] border border-[#292E2A] text-[#F5F7F4] p-2.5 rounded-lg outline-none focus:border-[#B8F23A]"
                  placeholder="Record customer feedback, interaction outcome, or next steps..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#292E2A]">
              <button
                className="btn small bg-[#1D211E] text-[#F5F7F4] border border-[#292E2A] hover:bg-[#292E2A] px-4 py-2 text-xs font-semibold rounded-lg"
                onClick={() => setActiveModal({ open: false, type: 'complete' })}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="btn small bg-[#B8F23A] hover:bg-[#a3d933] text-[#101312] font-semibold px-4 py-2 text-xs rounded-lg"
                onClick={handleActionSubmit}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : activeModal.type === 'complete' ? 'Mark Completed' : 'Save Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
