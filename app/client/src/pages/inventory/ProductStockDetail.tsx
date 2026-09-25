import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  api,
  ProductStockDetailResponse,
  InventoryMovement,
  InventoryMovementType,
} from '../../api';

function formatNumber(n: number | undefined | null) {
  return Number(n || 0).toLocaleString('en-IN');
}

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

function MovementTypeBadge({ type }: { type: InventoryMovementType }) {
  const styles: Record<InventoryMovementType, { bg: string; text: string; label: string }> = {
    STOCK_IN: { bg: '#1E2E20', text: '#71D88A', label: 'Stock In' },
    STOCK_OUT: { bg: '#182838', text: '#60A5FA', label: 'Stock Out' },
    RETURN: { bg: '#2D1F3D', text: '#C084FC', label: 'Return' },
    ADJUSTMENT: { bg: '#3D2D14', text: '#F3BA47', label: 'Adjustment' },
    TRANSFER_IN: { bg: '#173030', text: '#2DD4BF', label: 'Transfer In' },
    TRANSFER_OUT: { bg: '#2D2018', text: '#FB923C', label: 'Transfer Out' },
    OPENING_STOCK: { bg: '#252927', text: '#A5AEA8', label: 'Opening Stock' },
  };

  const current = styles[type] || { bg: '#252927', text: '#A5AEA8', label: type };

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium tracking-wide"
      style={{ backgroundColor: current.bg, color: current.text }}
    >
      {current.label}
    </span>
  );
}

export default function ProductStockDetail() {
  const { productId: pIdStr } = useParams<{ productId: string }>();
  const productId = Number(pIdStr);

  const [stockDetail, setStockDetail] = useState<ProductStockDetailResponse | null>(null);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    if (!productId) return;
    setLoading(true);
    setError('');

    try {
      const [detailRes, movRes] = await Promise.all([
        api.inventory.getProductStock(productId),
        api.inventory.listMovements({ productId, limit: 50 }),
      ]);
      setStockDetail(detailRes);
      setMovements(movRes.movements);
    } catch (err: any) {
      console.error('Failed to load product stock details:', err);
      setError(err.message || 'Product stock not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [productId]);

  if (loading) {
    return (
      <div className="p-6 flex flex-col gap-6 bg-[#101312] text-[#F5F7F4] min-h-screen">
        <div className="h-6 w-40 bg-[#1B1F1D] rounded animate-pulse" />
        <div className="h-12 w-80 bg-[#1B1F1D] rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-[#171918] border border-[#292E2A] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !stockDetail) {
    return (
      <div className="p-6 flex flex-col gap-6 bg-[#101312] text-[#F5F7F4] min-h-screen">
        <div className="p-6 rounded-xl bg-[#2A1515] border border-[#5A2424] text-[#F87171] flex flex-col items-start gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h2 className="font-semibold text-base">Product Stock Record Not Found</h2>
              <p className="text-xs opacity-90">{error || 'Unable to retrieve product stock'}</p>
            </div>
          </div>
          <Link
            to="/inventory/stock"
            className="px-3.5 py-2 bg-[#381B1B] hover:bg-[#482222] text-[#FCA5A5] border border-[#6B2A2A] rounded-lg text-xs font-medium"
          >
            ← Back to Stock Ledger
          </Link>
        </div>
      </div>
    );
  }

  const { product, totals, warehouses } = stockDetail;

  return (
    <div className="p-6 flex flex-col gap-6 bg-[#101312] text-[#F5F7F4] min-h-screen">
      {/* Breadcrumbs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-[#A5AEA8]">
          <Link to="/inventory" className="hover:text-[#B8F23A] transition-colors">
            Inventory
          </Link>
          <span>/</span>
          <Link to="/inventory/stock" className="hover:text-[#B8F23A] transition-colors">
            Stock Ledger
          </Link>
          <span>/</span>
          <span className="text-[#F5F7F4] font-mono">{product.part_no}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/products/${product.id}/intelligence`}
            className="text-xs text-[#B8F23A] hover:underline"
          >
            Product Intelligence →
          </Link>
          <span className="text-[#3A403D]">|</span>
          <Link
            to="/inventory/stock"
            className="text-xs text-[#A5AEA8] hover:text-[#F5F7F4] transition-colors"
          >
            ← Back to Ledger
          </Link>
        </div>
      </div>

      {/* Product Header Card */}
      <div className="bg-[#171918] border border-[#292E2A] rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="px-2.5 py-1 bg-[#202422] border border-[#2B312E] rounded text-sm font-mono font-bold text-[#B8F23A]">
              {product.part_no}
            </span>
            <span className="text-xs text-[#A5AEA8]">Unit: {product.unit || 'Nos'}</span>
            {product.hsn_sac && (
              <span className="text-xs text-[#7A837E]">HSN: {product.hsn_sac}</span>
            )}
          </div>
          <h1 className="text-xl font-semibold text-[#F5F7F4]">
            {product.description}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-[#A5AEA8]">Catalogue Price</span>
            <div className="text-base font-bold text-[#F5F7F4]">
              ₹{Number(product.default_price || 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      {/* Aggregated Totals Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#171918] border border-[#292E2A] rounded-xl p-4">
          <span className="text-[12px] text-[#A5AEA8] font-medium">Physical On Hand</span>
          <div className="mt-2 text-2xl font-bold text-[#F5F7F4]">
            {formatNumber(totals.onHandQuantity)} <span className="text-xs font-normal text-[#A5AEA8]">{product.unit}</span>
          </div>
          <span className="text-[11px] text-[#A5AEA8]">Total across {warehouses.length} facilities</span>
        </div>

        <div className="bg-[#171918] border border-[#292E2A] rounded-xl p-4">
          <span className="text-[12px] text-[#A5AEA8] font-medium">Reserved Stock</span>
          <div className="mt-2 text-2xl font-bold text-[#D9A441]">
            {formatNumber(totals.reservedQuantity)} <span className="text-xs font-normal text-[#A5AEA8]">{product.unit}</span>
          </div>
          <span className="text-[11px] text-[#A5AEA8]">Committed orders</span>
        </div>

        <div className="bg-[#171918] border border-[#292E2A] rounded-xl p-4 bg-gradient-to-b from-[#171918] to-[#141F16]">
          <span className="text-[12px] text-[#71D88A] font-medium">Available to Sell</span>
          <div className="mt-2 text-2xl font-bold text-[#B8F23A]">
            {formatNumber(totals.availableQuantity)} <span className="text-xs font-normal text-[#71D88A]">{product.unit}</span>
          </div>
          <span className="text-[11px] text-[#71D88A]">On Hand − Reserved</span>
        </div>

        <div className="bg-[#171918] border border-[#292E2A] rounded-xl p-4">
          <span className="text-[12px] text-[#A5AEA8] font-medium">Incoming Stock</span>
          <div className="mt-2 text-2xl font-bold text-[#60A5FA]">
            {formatNumber(totals.incomingQuantity)} <span className="text-xs font-normal text-[#A5AEA8]">{product.unit}</span>
          </div>
          <span className="text-[11px] text-[#A5AEA8]">Pending receipts</span>
        </div>
      </div>

      {/* Warehouse Breakdown */}
      <div className="bg-[#171918] border border-[#292E2A] rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#292E2A] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#F5F7F4] flex items-center gap-2">
            <span>🏢</span> Facility Breakdown ({warehouses.length})
          </h2>
          <span className="text-xs text-[#A5AEA8]">Stock allocation by warehouse location</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#292E2A] text-xs text-[#A5AEA8] uppercase tracking-wider bg-[#141615]">
                <th className="py-3 px-4 font-medium">Facility</th>
                <th className="py-3 px-4 font-medium text-right">Physical On Hand</th>
                <th className="py-3 px-4 font-medium text-right">Reserved</th>
                <th className="py-3 px-4 font-medium text-right">Available</th>
                <th className="py-3 px-4 font-medium text-right">Incoming</th>
                <th className="py-3 px-4 font-medium text-right">Min Threshold</th>
                <th className="py-3 px-4 font-medium text-center">Status</th>
                <th className="py-3 px-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#202522]">
              {warehouses.map((wh) => (
                <tr key={wh.warehouseId} className="hover:bg-[#1C201E] transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-[#202422] border border-[#2B312E] rounded text-xs font-mono text-[#F5F7F4]">
                        {wh.warehouseCode}
                      </span>
                      <Link
                        to={`/inventory/warehouses/${wh.warehouseId}`}
                        className="text-xs font-semibold text-[#F5F7F4] hover:text-[#B8F23A] transition-colors"
                      >
                        {wh.warehouseName}
                      </Link>
                      {wh.warehouseIsDefault && (
                        <span className="px-1.5 py-0.2 bg-[#1E2E20] text-[#71D88A] border border-[#2B4B32] rounded text-[9px] font-semibold">
                          DEFAULT
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono text-right text-[#F5F7F4]">
                    {wh.onHandQuantity}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono text-right text-[#D9A441]">
                    {wh.reservedQuantity}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono text-right font-bold text-[#B8F23A]">
                    {wh.availableQuantity}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono text-right text-[#60A5FA]">
                    {wh.incomingQuantity}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono text-right text-[#A5AEA8]">
                    Min: {wh.lowStockThreshold} / Crit: {wh.criticalStockThreshold}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {wh.availableQuantity <= wh.criticalStockThreshold ? (
                      <span className="px-2 py-0.5 bg-[#2A1515] text-[#F87171] border border-[#5A2424] rounded text-[10px] font-semibold">
                        CRITICAL
                      </span>
                    ) : wh.availableQuantity <= wh.lowStockThreshold ? (
                      <span className="px-2 py-0.5 bg-[#261E12] text-[#F3BA47] border border-[#58411D] rounded text-[10px] font-semibold">
                        LOW STOCK
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-[#1E2E20] text-[#71D88A] rounded text-[10px] font-medium">
                        HEALTHY
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      to={`/inventory/warehouses/${wh.warehouseId}`}
                      className="px-2.5 py-1 bg-[#1F2421] hover:bg-[#282E2B] text-[#F5F7F4] border border-[#292E2A] rounded text-xs font-medium transition-colors"
                    >
                      Facility →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movement History / Audit Trail */}
      <div className="bg-[#171918] border border-[#292E2A] rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#292E2A] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#F5F7F4] flex items-center gap-2">
            <span>📋</span> Stock Movement Audit Trail ({movements.length})
          </h2>
          <span className="text-xs text-[#A5AEA8]">Immutable chronological stock ledger records</span>
        </div>

        {movements.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#A5AEA8]">
            No movement ledger records found for this product.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#292E2A] text-xs text-[#A5AEA8] uppercase tracking-wider bg-[#141615]">
                  <th className="py-3 px-4 font-medium">Timestamp</th>
                  <th className="py-3 px-4 font-medium">Facility</th>
                  <th className="py-3 px-4 font-medium">Movement Type</th>
                  <th className="py-3 px-4 font-medium text-right">Quantity</th>
                  <th className="py-3 px-4 font-medium text-right">Before</th>
                  <th className="py-3 px-4 font-medium text-right">After</th>
                  <th className="py-3 px-4 font-medium">Reference</th>
                  <th className="py-3 px-4 font-medium">User / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202522]">
                {movements.map((mov) => {
                  const isPositive = ['STOCK_IN', 'RETURN', 'TRANSFER_IN', 'OPENING_STOCK'].includes(
                    mov.movement_type
                  );
                  return (
                    <tr key={mov.id} className="hover:bg-[#1C201E] transition-colors">
                      <td className="py-3 px-4 text-xs text-[#A5AEA8] whitespace-nowrap">
                        {formatDate(mov.created_at)}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-[#F5F7F4]">
                        {mov.warehouse_code || `WH #${mov.warehouse_id}`}
                      </td>
                      <td className="py-3 px-4">
                        <MovementTypeBadge type={mov.movement_type} />
                      </td>
                      <td
                        className={`py-3 px-4 text-xs font-mono font-bold text-right ${
                          isPositive ? 'text-[#71D88A]' : 'text-[#F87171]'
                        }`}
                      >
                        {isPositive ? `+${mov.quantity}` : `-${mov.quantity}`}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-right text-[#7A837E]">
                        {mov.before_on_hand}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-right font-semibold text-[#F5F7F4]">
                        {mov.after_on_hand}
                      </td>
                      <td className="py-3 px-4 text-xs text-[#A5AEA8]">
                        {mov.reference_type ? `${mov.reference_type} #${mov.reference_id || ''}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-xs text-[#7A837E] max-w-[200px] truncate">
                        {mov.created_by_username ? `${mov.created_by_username}: ` : ''}
                        {mov.reason || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
