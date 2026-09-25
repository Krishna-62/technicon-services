import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  api,
  StockReservationDetailResponse,
} from '../../api';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Warehouse as WarehouseIcon,
  Boxes,
  Lock,
  RotateCcw,
  ExternalLink,
  TrendingDown,
} from 'lucide-react';

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
  if (status === 'ACTIVE') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2B2414] text-[#FBBF24] border border-[#524320] rounded-lg text-xs font-semibold">
        <span className="w-2 h-2 rounded-full bg-[#FBBF24]" />
        Active (Stock Committed)
      </span>
    );
  }
  if (status === 'FULFILLED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1B2E1E] text-[#4ADE80] border border-[#2B5230] rounded-lg text-xs font-semibold">
        <span className="w-2 h-2 rounded-full bg-[#4ADE80]" />
        Fulfilled (Physical Stock Deducted)
      </span>
    );
  }
  if (status === 'RELEASED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#17202A] text-[#60A5FA] border border-[#233547] rounded-lg text-xs font-semibold">
        <span className="w-2 h-2 rounded-full bg-[#60A5FA]" />
        Released
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

export default function ReservationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [reservation, setReservation] = useState<StockReservationDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);
  const [fulfillModalOpen, setFulfillModalOpen] = useState(false);

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.inventory.getReservation(Number(id));
      setReservation(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load reservation details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleRelease = async () => {
    if (!reservation) return;
    setActionLoading(true);
    setError('');
    try {
      await api.inventory.releaseReservation(reservation.id);
      setReleaseModalOpen(false);
      fetchDetail();
    } catch (err: any) {
      setError(err.message || 'Failed to release reservation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFulfill = async () => {
    if (!reservation) return;
    setActionLoading(true);
    setError('');
    try {
      await api.inventory.fulfillReservation(reservation.id);
      setFulfillModalOpen(false);
      fetchDetail();
    } catch (err: any) {
      setError(err.message || 'Failed to fulfill reservation');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center text-[#A5AEA8]">
        Loading reservation details...
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <Link
          to="/inventory/reservations"
          className="inline-flex items-center gap-2 text-xs text-[#A5AEA8] hover:text-[#F5F7F4]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Reservations</span>
        </Link>
        <div className="p-4 bg-[#2D1616] border border-[#572727] rounded-xl text-sm text-[#F87171] flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error || 'Reservation not found'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1280px] mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            to="/inventory/reservations"
            className="inline-flex items-center gap-1.5 text-xs text-[#A5AEA8] hover:text-[#F5F7F4] transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Reservations</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-mono tracking-tight text-[#F5F7F4]">
              #RES-{reservation.id}
            </h1>
            <StatusBadge status={reservation.status} />
          </div>
        </div>

        {/* Action Controls for ACTIVE reservations */}
        {reservation.status === 'ACTIVE' && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setReleaseModalOpen(true)}
              className="px-4 py-2 bg-[#17202A] border border-[#233547] text-[#60A5FA] hover:bg-[#202E3E] rounded-lg text-sm font-semibold transition-colors"
            >
              Release Reservation
            </button>
            <button
              type="button"
              onClick={() => setFulfillModalOpen(true)}
              className="px-4 py-2 bg-[#B8F23A] text-[#101312] hover:bg-[#a6df2f] rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              Fulfill & Deduct Stock
            </button>
          </div>
        )}
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Product Card */}
        <div className="bg-[#141816] border border-[#232925] rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8A958E] uppercase tracking-wider">
            <Boxes className="w-4 h-4 text-[#B8F23A]" />
            <span>Reserved Product</span>
          </div>

          <div className="space-y-2 text-xs text-[#CCD4CE]">
            <div>
              <Link
                to={`/inventory/stock/${reservation.product_id}`}
                className="text-base font-bold text-[#F5F7F4] hover:text-[#B8F23A] transition-colors flex items-center gap-1.5 font-mono"
              >
                <span>{reservation.part_no}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </Link>
              <p className="text-xs text-[#8A958E] mt-0.5 line-clamp-2">{reservation.product_description}</p>
            </div>
            {reservation.hsn_sac && (
              <div className="flex justify-between">
                <span className="text-[#8A958E]">HSN Code:</span>
                <span className="font-mono text-[#F5F7F4]">{reservation.hsn_sac}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#8A958E]">Unit of Measure:</span>
              <span className="text-[#F5F7F4]">{reservation.unit || 'Nos'}</span>
            </div>
          </div>
        </div>

        {/* Warehouse Card */}
        <div className="bg-[#141816] border border-[#232925] rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8A958E] uppercase tracking-wider">
            <WarehouseIcon className="w-4 h-4 text-[#B8F23A]" />
            <span>Warehouse Location</span>
          </div>

          <div className="space-y-2 text-xs text-[#CCD4CE]">
            <div>
              <Link
                to={`/inventory/warehouses/${reservation.warehouse_id}`}
                className="text-base font-bold text-[#F5F7F4] hover:text-[#B8F23A] transition-colors flex items-center gap-1.5"
              >
                <span>{reservation.warehouse_name}</span>
                <span className="text-xs font-mono text-[#8A958E]">({reservation.warehouse_code})</span>
              </Link>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8A958E]">Reserved By:</span>
              <span className="text-[#F5F7F4]">{reservation.reserved_by_username || 'Staff'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8A958E]">Created Date:</span>
              <span className="text-[#CCD4CE]">{formatDate(reservation.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Current Stock Snapshot Card */}
        <div className="bg-[#141816] border border-[#232925] rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8A958E] uppercase tracking-wider">
            <Lock className="w-4 h-4 text-[#FBBF24]" />
            <span>Current Stock Snapshot</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between p-2 bg-[#0E1110] border border-[#232925] rounded-lg">
              <span className="text-[#8A958E]">On-Hand Physical:</span>
              <span className="text-[#F5F7F4] font-bold text-sm">{reservation.stock.onHand}</span>
            </div>
            <div className="flex justify-between p-2 bg-[#0E1110] border border-[#232925] rounded-lg">
              <span className="text-[#FBBF24]">Total Reserved:</span>
              <span className="text-[#FBBF24] font-bold text-sm">{reservation.stock.reserved}</span>
            </div>
            <div className="flex justify-between p-2 bg-[#0E1110] border border-[#232925] rounded-lg">
              <span className="text-[#4ADE80]">Net Available:</span>
              <span className="text-[#4ADE80] font-bold text-sm">{reservation.stock.available}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reservation Details Box */}
      <div className="bg-[#141816] border border-[#232925] rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-[#F5F7F4]">Commitment Details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 bg-[#0E1110] border border-[#232925] rounded-lg">
            <span className="text-[#8A958E] block text-[11px]">Reserved Quantity</span>
            <span className="text-xl font-bold text-[#FBBF24] mt-1 block">
              {reservation.quantity} {reservation.unit || 'Nos'}
            </span>
          </div>

          <div className="p-3 bg-[#0E1110] border border-[#232925] rounded-lg">
            <span className="text-[#8A958E] block text-[11px]">Reference Type</span>
            <span className="text-sm font-semibold text-[#CCD4CE] mt-1 block">
              {reservation.reference_type || 'MANUAL'}
            </span>
          </div>

          <div className="p-3 bg-[#0E1110] border border-[#232925] rounded-lg">
            <span className="text-[#8A958E] block text-[11px]">Reference ID / Doc #</span>
            <span className="text-sm font-semibold text-[#F5F7F4] mt-1 block">
              {reservation.reference_id || '—'}
            </span>
          </div>

          <div className="p-3 bg-[#0E1110] border border-[#232925] rounded-lg">
            <span className="text-[#8A958E] block text-[11px]">Lifecycle Date</span>
            <span className="text-xs text-[#CCD4CE] mt-1 block">
              {reservation.status === 'FULFILLED'
                ? `Fulfilled: ${formatDateTime(reservation.fulfilled_at)}`
                : reservation.status === 'RELEASED'
                ? `Released: ${formatDateTime(reservation.released_at)}`
                : `Created: ${formatDateTime(reservation.created_at)}`}
            </span>
          </div>
        </div>

        {reservation.notes && (
          <div className="p-3.5 bg-[#0E1110] border border-[#232925] rounded-lg text-xs space-y-1">
            <span className="text-[#8A958E] font-medium">Notes & Context:</span>
            <p className="text-[#CCD4CE] italic">{reservation.notes}</p>
          </div>
        )}
      </div>

      {/* Audit Trail Movements */}
      {reservation.movements && reservation.movements.length > 0 && (
        <div className="bg-[#141816] border border-[#232925] rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#232925] pb-3">
            <TrendingDown className="w-4 h-4 text-[#B8F23A]" />
            <h2 className="text-sm font-bold text-[#F5F7F4]">Linked Inventory Movements</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#A5AEA8]">
              <thead className="bg-[#0E1110] border-b border-[#232925] text-[#8A958E] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Log ID</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Movement Type</th>
                  <th className="px-4 py-3 text-right">Quantity</th>
                  <th className="px-4 py-3 text-right">Before On-Hand</th>
                  <th className="px-4 py-3 text-right">After On-Hand</th>
                  <th className="px-4 py-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1D221F]">
                {reservation.movements.map((m) => (
                  <tr key={m.id} className="hover:bg-[#181D1A]">
                    <td className="px-4 py-3 font-mono font-semibold text-[#F5F7F4]">#{m.id}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(m.created_at)}</td>
                    <td className="px-4 py-3 font-mono text-[#4ADE80] font-semibold">{m.movement_type}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[#E25757]">-{m.quantity}</td>
                    <td className="px-4 py-3 text-right font-mono text-[#CCD4CE]">{m.before_on_hand}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[#4ADE80]">{m.after_on_hand}</td>
                    <td className="px-4 py-3 text-[#CCD4CE]">{m.reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Release Confirmation Modal */}
      {releaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#141816] border border-[#2B332E] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-[#60A5FA]">
              <div className="p-2 bg-[#17202A] border border-[#233547] rounded-lg">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F5F7F4]">Release Stock Reservation</h3>
                <p className="text-xs text-[#8A958E] font-mono">#RES-{reservation.id}</p>
              </div>
            </div>

            <p className="text-sm text-[#CCD4CE]">
              Releasing this reservation will decrease <strong>reserved stock by {reservation.quantity}</strong> and return available stock to normal.
              Physical on-hand stock will remain completely unchanged.
            </p>

            {error && (
              <div className="p-3 bg-[#2D1616] border border-[#572727] rounded-lg text-xs text-[#F87171]">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReleaseModalOpen(false)}
                disabled={actionLoading}
                className="px-4 py-2 bg-[#1D221F] border border-[#2E3631] text-[#CCD4CE] hover:text-[#F5F7F4] rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRelease}
                disabled={actionLoading}
                className="px-4 py-2 bg-[#60A5FA] text-[#101312] hover:bg-[#3b82f6] rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Releasing...' : 'Yes, Release Reservation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fulfill Confirmation Modal */}
      {fulfillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#141816] border border-[#2B332E] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-[#4ADE80]">
              <div className="p-2 bg-[#1B2E1E] border border-[#2B5230] rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F5F7F4]">Fulfill Stock Reservation</h3>
                <p className="text-xs text-[#8A958E] font-mono">#RES-{reservation.id}</p>
              </div>
            </div>

            <p className="text-sm text-[#CCD4CE]">
              Fulfilling this reservation will perform an <strong>atomic STOCK OUT</strong> of {reservation.quantity} {reservation.unit || 'Nos'} for {reservation.part_no}.
              Physical on-hand stock will decrease, and an inventory movement will be logged.
            </p>

            {error && (
              <div className="p-3 bg-[#2D1616] border border-[#572727] rounded-lg text-xs text-[#F87171]">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFulfillModalOpen(false)}
                disabled={actionLoading}
                className="px-4 py-2 bg-[#1D221F] border border-[#2E3631] text-[#CCD4CE] hover:text-[#F5F7F4] rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFulfill}
                disabled={actionLoading}
                className="px-4 py-2 bg-[#B8F23A] text-[#101312] hover:bg-[#a6df2f] rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Fulfilling...' : 'Yes, Fulfill & Deduct Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
