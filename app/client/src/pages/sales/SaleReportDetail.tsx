import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  api,
  SaleReportDetailResponse,
} from '../../api';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Building2,
  Warehouse as WarehouseIcon,
  Calendar,
  FileText,
  Boxes,
  ArrowRight,
  TrendingDown,
  Edit3,
  ExternalLink,
} from 'lucide-react';

function formatINR(val: number | undefined | null) {
  return '₹' + Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'CONFIRMED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1B2E1E] text-[#4ADE80] border border-[#2B5230] rounded-lg text-xs font-semibold">
        <span className="w-2 h-2 rounded-full bg-[#4ADE80]" />
        Confirmed (Stock Deducted)
      </span>
    );
  }
  if (status === 'DRAFT') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2B2414] text-[#FBBF24] border border-[#524320] rounded-lg text-xs font-semibold">
        <span className="w-2 h-2 rounded-full bg-[#FBBF24]" />
        Draft (No Stock Deduction)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2D1616] text-[#F87171] border border-[#572727] rounded-lg text-xs font-semibold">
      <span className="w-2 h-2 rounded-full bg-[#F87171]" />
      Cancelled
    </span>
  );
}

export default function SaleReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [report, setReport] = useState<SaleReportDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const fetchReport = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.saleReports.get(Number(id));
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load sale report details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [id]);

  const handleConfirm = async () => {
    if (!report) return;
    setActionLoading(true);
    setError('');
    try {
      const updated = await api.saleReports.confirm(report.id);
      setReport(updated);
      setConfirmModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to confirm sale report');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!report) return;
    if (!window.confirm('Are you sure you want to cancel this draft Sale Report?')) return;
    setActionLoading(true);
    setError('');
    try {
      const updated = await api.saleReports.cancel(report.id);
      setReport(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel sale report');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center text-[#A5AEA8]">
        Loading Sale Report details...
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <Link
          to="/sale-reports"
          className="inline-flex items-center gap-2 text-xs text-[#A5AEA8] hover:text-[#F5F7F4]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sale Reports</span>
        </Link>
        <div className="p-4 bg-[#2D1616] border border-[#572727] rounded-xl text-sm text-[#F87171] flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error || 'Sale Report not found'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Top Navigation & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/sale-reports"
            className="p-2 bg-[#141816] border border-[#232925] text-[#A5AEA8] hover:text-[#F5F7F4] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold font-mono text-[#F5F7F4]">
                {report.report_number}
              </h1>
              <StatusBadge status={report.status} />
            </div>
            <p className="text-xs text-[#A5AEA8] mt-0.5">
              Created on {formatDate(report.sale_date)} by {report.created_by_username || 'Staff'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {report.status === 'DRAFT' && (
            <>
              <Link
                to={`/sale-reports/${report.id}/edit`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1A1F1C] hover:bg-[#252C27] text-[#CCD4CE] border border-[#2E3631] rounded-lg text-xs font-medium transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Draft</span>
              </Link>
              <button
                type="button"
                onClick={handleCancel}
                disabled={actionLoading}
                className="px-3.5 py-2 bg-[#261515] hover:bg-[#381B1B] text-[#F87171] border border-[#522424] rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
              >
                Cancel Draft
              </button>
              <button
                type="button"
                onClick={() => setConfirmModalOpen(true)}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#B8F23A] text-[#101312] hover:bg-[#a6df2f] rounded-lg text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Stock OUT</span>
              </button>
            </>
          )}

          {report.status === 'CONFIRMED' && (
            <Link
              to="/inventory/stock"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1A1F1C] hover:bg-[#252C27] text-[#B8F23A] border border-[#2E3631] rounded-lg text-xs font-medium transition-colors"
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>View Inventory Ledger</span>
            </Link>
          )}
        </div>
      </div>

      {/* Confirmation Banner */}
      {report.status === 'CONFIRMED' && (
        <div className="p-4 bg-[#132417] border border-[#234B2A] rounded-xl flex items-start gap-3.5 text-sm text-[#4ADE80]">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#4ADE80]" />
          <div className="space-y-1">
            <p className="font-semibold text-[#F5F7F4]">Stock Outward Completed & Audited</p>
            <p className="text-xs text-[#9CD6A7]">
              This Sale Report was confirmed on {formatDateTime(report.confirmed_at)} by {report.confirmed_by_username || 'Staff'}.
              Physical stock has been deducted from <strong>{report.warehouse_name} ({report.warehouse_code})</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Draft Staged Banner */}
      {report.status === 'DRAFT' && (
        <div className="p-4 bg-[#261F12] border border-[#4F3C1D] rounded-xl flex items-start gap-3.5 text-sm text-[#FBBF24]">
          <Clock className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-[#F5F7F4]">Staged Draft Sale Report</p>
            <p className="text-xs text-[#E5B550]">
              No physical stock has been deducted yet. Review the details and click <strong>Confirm & Stock OUT</strong> to finalize the transaction and update physical warehouse balances.
            </p>
          </div>
        </div>
      )}

      {/* Metadata Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Customer Information */}
        <div className="bg-[#141816] border border-[#232925] rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8A958E] uppercase tracking-wider">
            <Building2 className="w-4 h-4 text-[#B8F23A]" />
            <span>Customer Details</span>
          </div>

          <div>
            {report.company_id ? (
              <Link
                to={`/companies/${report.company_id}/health`}
                className="text-base font-bold text-[#F5F7F4] hover:text-[#B8F23A] hover:underline transition-colors flex items-center gap-1.5"
              >
                <span>{report.company_name_snapshot}</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#6D756F]" />
              </Link>
            ) : (
              <p className="text-base font-bold text-[#F5F7F4]">{report.company_name_snapshot}</p>
            )}
            {report.phone_number_snapshot && (
              <p className="text-xs text-[#A5AEA8] mt-1">Phone: {report.phone_number_snapshot}</p>
            )}
            {report.company_address && (
              <p className="text-xs text-[#6D756F] mt-1">{report.company_address}</p>
            )}
            {report.company_gstin && (
              <p className="text-xs font-mono text-[#6D756F] mt-1">GSTIN: {report.company_gstin}</p>
            )}
          </div>
        </div>

        {/* Transaction Information */}
        <div className="bg-[#141816] border border-[#232925] rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8A958E] uppercase tracking-wider">
            <FileText className="w-4 h-4 text-[#B8F23A]" />
            <span>Transaction Info</span>
          </div>

          <div className="space-y-2 text-xs text-[#CCD4CE]">
            <div className="flex justify-between">
              <span className="text-[#8A958E]">Invoice Number:</span>
              <span className="font-mono font-semibold text-[#F5F7F4]">{report.invoice_number || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8A958E]">Source Type:</span>
              <span className="font-medium text-[#F5F7F4]">
                {report.source_type === 'INTERNAL_DOCUMENT' ? 'Internal Document' : 'Direct External'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8A958E]">Source Reference:</span>
              <span className="font-mono text-[#CCD4CE]">{report.source_reference || '—'}</span>
            </div>
            {report.sourceDocument && (
              <div className="flex justify-between items-center pt-1 border-t border-[#232925]">
                <span className="text-[#8A958E]">Linked Document:</span>
                <Link
                  to={
                    report.sourceDocument.type === 'QUOTATION'
                      ? `/quotations/${report.sourceDocument.document.id}`
                      : report.sourceDocument.type === 'PURCHASE_ORDER'
                      ? `/purchase-orders`
                      : `/performa-invoices`
                  }
                  className="text-xs font-mono text-[#B8F23A] hover:underline flex items-center gap-1"
                >
                  <span>{report.sourceDocument.document.number}</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Warehouse & Dispatch Details */}
        <div className="bg-[#141816] border border-[#232925] rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8A958E] uppercase tracking-wider">
            <WarehouseIcon className="w-4 h-4 text-[#B8F23A]" />
            <span>Dispatch Warehouse</span>
          </div>

          <div className="space-y-2 text-xs text-[#CCD4CE]">
            <div>
              <Link
                to={`/inventory/warehouses/${report.warehouse_id}`}
                className="text-base font-bold text-[#F5F7F4] hover:text-[#B8F23A] transition-colors flex items-center gap-1.5"
              >
                <span>{report.warehouse_name}</span>
                <span className="text-xs font-mono text-[#8A958E]">({report.warehouse_code})</span>
              </Link>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8A958E]">Created By:</span>
              <span className="text-[#F5F7F4]">{report.created_by_username || 'Staff'}</span>
            </div>
            {report.confirmed_at && (
              <div className="flex justify-between">
                <span className="text-[#8A958E]">Confirmed By:</span>
                <span className="text-[#4ADE80]">{report.confirmed_by_username || 'Staff'}</span>
              </div>
            )}
            {report.notes && (
              <div className="pt-1 text-[#8A958E]">
                <span>Notes: </span>
                <span className="text-[#CCD4CE] italic">{report.notes}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="bg-[#141816] border border-[#232925] rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 bg-[#0E1110] border-b border-[#232925] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-[#B8F23A]" />
            <h2 className="text-sm font-bold text-[#F5F7F4]">Sold Line Items</h2>
            <span className="text-xs text-[#8A958E]">({report.items.length} items)</span>
          </div>
          <span className="text-xs font-mono text-[#8A958E]">
            Total Sold Units: <strong className="text-[#F5F7F4]">{report.totalQuantity}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#A5AEA8]">
            <thead className="bg-[#0E1110] border-b border-[#232925] text-[#8A958E] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Part Number</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">HSN Code</th>
                <th className="px-4 py-3 text-right">Quantity</th>
                <th className="px-4 py-3 text-right">Unit Price</th>
                <th className="px-4 py-3 text-right">Total Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1D221F]">
              {report.items.map((it, idx) => (
                <tr key={it.id} className="hover:bg-[#181D1A] transition-colors">
                  <td className="px-4 py-3 text-[#6D756F] font-mono">{idx + 1}</td>
                  <td className="px-4 py-3 font-mono font-semibold text-[#F5F7F4] whitespace-nowrap">
                    <Link
                      to={`/inventory/stock/${it.product_id}`}
                      className="hover:text-[#B8F23A] transition-colors flex items-center gap-1"
                    >
                      <span>{it.part_number_snapshot}</span>
                      <ExternalLink className="w-3 h-3 opacity-40 hover:opacity-100" />
                    </Link>
                  </td>
                  <td className="px-4 py-3 max-w-sm truncate text-[#CCD4CE]" title={it.description_snapshot}>
                    {it.description_snapshot}
                  </td>
                  <td className="px-4 py-3 font-mono text-[#8A958E]">
                    {it.hsn_code_snapshot || '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-[#F5F7F4]">
                    {it.quantity} {it.unit || 'Nos'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[#CCD4CE]">
                    {formatINR(it.unit_price)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-[#F5F7F4]">
                    {formatINR(it.total_price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pricing Summary */}
        <div className="p-5 bg-[#0E1110] border-t border-[#232925] flex justify-end">
          <div className="w-64 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-[#8A958E]">
              <span>Subtotal:</span>
              <span className="text-[#F5F7F4] font-semibold">{formatINR(report.subtotal)}</span>
            </div>
            <div className="flex justify-between text-[#8A958E]">
              <span>GST ({report.tax_percent}%):</span>
              <span className="text-[#CCD4CE] font-semibold">{formatINR(report.tax_amount)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#232925] text-sm">
              <span className="text-[#F5F7F4] font-bold">Grand Total:</span>
              <span className="text-[#B8F23A] font-bold text-base">{formatINR(report.total_amount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Impact & Audit Section */}
      <div className="bg-[#141816] border border-[#232925] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#232925] pb-3">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-[#B8F23A]" />
            <h2 className="text-sm font-bold text-[#F5F7F4]">Physical Inventory Stock Impact</h2>
          </div>
          <span className="text-xs font-mono text-[#8A958E]">
            {report.warehouse_name} ({report.warehouse_code})
          </span>
        </div>

        {report.status === 'CONFIRMED' ? (
          <div className="space-y-3">
            <p className="text-xs text-[#A5AEA8]">
              The following inventory ledger records were atomically created for this sale:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {report.items.map((it) => (
                <div
                  key={it.id}
                  className="p-3.5 bg-[#0E1110] border border-[#232925] rounded-lg flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <Link
                      to={`/inventory/stock/${it.product_id}`}
                      className="text-xs font-mono font-semibold text-[#F5F7F4] hover:text-[#B8F23A] transition-colors"
                    >
                      {it.part_number_snapshot}
                    </Link>
                    <p className="text-[11px] text-[#8A958E] line-clamp-1">{it.description_snapshot}</p>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#4ADE80]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]" />
                      Sold: -{it.quantity} {it.unit || 'Nos'}
                    </span>
                  </div>

                  <div className="text-right font-mono text-xs">
                    <span className="text-[11px] text-[#8A958E] block">On-Hand Stock</span>
                    <span className="text-[#E25757] font-semibold">{it.before_on_hand}</span>
                    <span className="text-[#8A958E] mx-1">→</span>
                    <span className="text-[#4ADE80] font-bold">{it.after_on_hand}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-[#0E1110] border border-[#232925] rounded-lg text-xs text-[#8A958E] space-y-1">
            <p className="font-semibold text-[#CCD4CE]">No physical deduction yet.</p>
            <p>
              Once confirmed, on-hand quantity for these {report.items.length} products will be decremented in warehouse <strong>{report.warehouse_name}</strong> and logged in the inventory movement ledger.
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#141816] border border-[#2B332E] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-[#4ADE80]">
              <div className="p-2 bg-[#1B2E1E] border border-[#2B5230] rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F5F7F4]">Confirm Sale Report</h3>
                <p className="text-xs text-[#8A958E] font-mono">{report.report_number}</p>
              </div>
            </div>

            <p className="text-sm text-[#CCD4CE]">
              Are you sure you want to confirm this Sale Report?
            </p>

            <div className="p-3 bg-[#0E1110] border border-[#232925] rounded-lg text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-[#8A958E]">
                <span>Customer:</span>
                <span className="text-[#F5F7F4]">{report.company_name_snapshot}</span>
              </div>
              <div className="flex justify-between text-[#8A958E]">
                <span>Warehouse:</span>
                <span className="text-[#F5F7F4]">{report.warehouse_name}</span>
              </div>
              <div className="flex justify-between text-[#8A958E]">
                <span>Total Items / Qty:</span>
                <span className="text-[#F5F7F4]">{report.items.length} items ({report.totalQuantity} units)</span>
              </div>
              <div className="flex justify-between text-[#8A958E] pt-1 border-t border-[#1D221F]">
                <span>Total Amount:</span>
                <span className="text-[#B8F23A] font-bold">{formatINR(report.total_amount)}</span>
              </div>
            </div>

            <p className="text-xs text-[#8A958E]">
              This will execute an <strong>atomic STOCK OUT</strong>, deducting physical stock for all {report.items.length} items. This action cannot be confirmed twice.
            </p>

            {error && (
              <div className="p-3 bg-[#2D1616] border border-[#572727] rounded-lg text-xs text-[#F87171]">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                disabled={actionLoading}
                className="px-4 py-2 bg-[#1D221F] border border-[#2E3631] text-[#CCD4CE] hover:text-[#F5F7F4] rounded-lg text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={actionLoading}
                className="px-4 py-2 bg-[#B8F23A] text-[#101312] hover:bg-[#a6df2f] rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Deducting Stock...' : 'Confirm & Stock OUT'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
