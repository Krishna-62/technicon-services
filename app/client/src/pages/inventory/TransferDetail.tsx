import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, StockTransferDetailResponse } from '../../api';
import { ArrowLeft, ArrowRightLeft, RefreshCw, CheckCircle2, Clock, Building, Package, User, FileText } from 'lucide-react';

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TransferDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [transfer, setTransfer] = useState<StockTransferDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.inventory.operations
      .getTransfer(Number(id))
      .then(setTransfer)
      .catch((err) => {
        console.error('Error fetching transfer details:', err);
        setError(err.message || 'Failed to load transfer details');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-12 text-center text-[#A5AEA8] bg-[#171918] rounded-xl border border-[#292E2A]">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#B8F23A] mb-2" />
        Loading transfer details...
      </div>
    );
  }

  if (error || !transfer) {
    return (
      <div className="p-6 bg-[#2D1616] border border-[#572727] text-[#F87171] rounded-xl space-y-4">
        <div>{error || 'Transfer not found'}</div>
        <button
          onClick={() => navigate('/inventory/operations/transfers')}
          className="px-4 py-2 bg-[#171918] text-[#F5F7F4] rounded-lg text-xs font-semibold"
        >
          Back to Transfers List
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#292E2A] pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/inventory/operations/transfers"
            className="p-2 bg-[#171918] border border-[#292E2A] rounded-lg text-[#A5AEA8] hover:text-[#F5F7F4]"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#F5F7F4]">{transfer.transferNumber}</h1>
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[#1B2E1E] text-[#4ADE80] border border-[#2B5230]">
                {transfer.status}
              </span>
            </div>
            <p className="text-xs text-[#A5AEA8] mt-0.5">Warehouse Transfer Record</p>
          </div>
        </div>

        <div className="text-right text-xs text-[#A5AEA8]">
          <div>Created: <span className="text-[#F5F7F4] font-medium">{formatDate(transfer.createdAt)}</span></div>
          <div>By: <span className="text-[#F5F7F4] font-medium">{transfer.createdBy}</span></div>
        </div>
      </div>

      {/* Warehouses & Product Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#171918] border border-[#292E2A] rounded-xl p-4 space-y-2">
          <div className="text-xs font-semibold text-[#F87171] uppercase tracking-wider flex items-center gap-1.5">
            <Building className="w-4 h-4 text-[#F87171]" />
            Source Warehouse
          </div>
          <div className="text-base font-bold text-[#F5F7F4]">{transfer.sourceWarehouseName}</div>
          <div className="text-xs text-[#A5AEA8]">Code: {transfer.sourceWarehouseCode}</div>
          <div className="pt-2 border-t border-[#292E2A] text-xs space-y-1">
            <div className="flex justify-between text-[#A5AEA8]">
              <span>Before On-Hand:</span>
              <span className="text-[#F5F7F4] font-medium">{transfer.sourceBeforeOnHand}</span>
            </div>
            <div className="flex justify-between text-[#A5AEA8]">
              <span>After On-Hand:</span>
              <span className="text-[#F87171] font-bold">{transfer.sourceAfterOnHand}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#171918] border border-[#292E2A] rounded-xl p-4 space-y-2">
          <div className="text-xs font-semibold text-[#4ADE80] uppercase tracking-wider flex items-center gap-1.5">
            <Building className="w-4 h-4 text-[#4ADE80]" />
            Destination Warehouse
          </div>
          <div className="text-base font-bold text-[#F5F7F4]">{transfer.destinationWarehouseName}</div>
          <div className="text-xs text-[#A5AEA8]">Code: {transfer.destinationWarehouseCode}</div>
          <div className="pt-2 border-t border-[#292E2A] text-xs space-y-1">
            <div className="flex justify-between text-[#A5AEA8]">
              <span>Before On-Hand:</span>
              <span className="text-[#F5F7F4] font-medium">{transfer.destBeforeOnHand}</span>
            </div>
            <div className="flex justify-between text-[#A5AEA8]">
              <span>After On-Hand:</span>
              <span className="text-[#4ADE80] font-bold">{transfer.destAfterOnHand}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#171918] border border-[#292E2A] rounded-xl p-4 space-y-2">
          <div className="text-xs font-semibold text-[#B8F23A] uppercase tracking-wider flex items-center gap-1.5">
            <Package className="w-4 h-4 text-[#B8F23A]" />
            Transferred Item
          </div>
          <div className="text-base font-bold text-[#B8F23A]">{transfer.partNumber}</div>
          <div className="text-xs text-[#A5AEA8] line-clamp-1">{transfer.productDescription}</div>
          <div className="pt-2 border-t border-[#292E2A] text-xs space-y-1">
            <div className="flex justify-between text-[#A5AEA8]">
              <span>Transferred Quantity:</span>
              <span className="text-[#B8F23A] font-bold text-sm">{transfer.quantity} {transfer.productUnit}</span>
            </div>
            {transfer.reference && (
              <div className="flex justify-between text-[#A5AEA8]">
                <span>Reference:</span>
                <span className="text-[#F5F7F4] font-medium">{transfer.reference}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      {transfer.notes && (
        <div className="bg-[#171918] border border-[#292E2A] rounded-xl p-4 space-y-1">
          <div className="text-xs font-semibold text-[#A5AEA8]">Transfer Notes</div>
          <p className="text-xs text-[#F5F7F4]">{transfer.notes}</p>
        </div>
      )}

      {/* Linked Movement Audit Trail */}
      <div className="bg-[#171918] border border-[#292E2A] rounded-xl overflow-hidden space-y-3 p-4">
        <h3 className="text-sm font-bold text-[#F5F7F4] flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-[#60A5FA]" />
          Linked Inventory Audit Movements
        </h3>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#1D211E] border-b border-[#292E2A] text-[11px] font-semibold text-[#A5AEA8] uppercase tracking-wider">
              <th className="py-2.5 px-3">Movement Type</th>
              <th className="py-2.5 px-3">Warehouse</th>
              <th className="py-2.5 px-3 text-right">Quantity</th>
              <th className="py-2.5 px-3 text-right">Before</th>
              <th className="py-2.5 px-3 text-right">After</th>
              <th className="py-2.5 px-3">Reason</th>
              <th className="py-2.5 px-3">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#292E2A] text-xs">
            {transfer.movements.map((m) => (
              <tr key={m.id} className="hover:bg-[#1D211E]/50">
                <td className="py-2.5 px-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      m.movement_type === 'TRANSFER_IN'
                        ? 'bg-[#1B2E1E] text-[#4ADE80] border border-[#2B5230]'
                        : 'bg-[#2D1616] text-[#F87171] border border-[#572727]'
                    }`}
                  >
                    {m.movement_type}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-[#F5F7F4] font-medium">{m.warehouse_name}</td>
                <td className="py-2.5 px-3 text-right font-bold text-[#F5F7F4]">{m.quantity}</td>
                <td className="py-2.5 px-3 text-right text-[#A5AEA8]">{m.before_on_hand}</td>
                <td className="py-2.5 px-3 text-right font-semibold text-[#4ADE80]">{m.after_on_hand}</td>
                <td className="py-2.5 px-3 text-[#A5AEA8]">{m.reason}</td>
                <td className="py-2.5 px-3 text-[#A5AEA8]">{formatDate(m.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
