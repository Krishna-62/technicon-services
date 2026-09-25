import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  api,
  StockReservation,
  Warehouse,
  Product,
} from '../../api';
import { Pagination } from '../../components/Pagination';
import {
  Search,
  Filter,
  Plus,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Boxes,
  Lock,
  ArrowRight,
  TrendingDown,
  Warehouse as WarehouseIcon,
} from 'lucide-react';

const PAGE_SIZE = 20;

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'ACTIVE') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#2B2414] text-[#FBBF24] border border-[#524320] rounded-md text-[11.5px] font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-[#FBBF24]" />
        Active (Reserved)
      </span>
    );
  }
  if (status === 'FULFILLED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#1B2E1E] text-[#4ADE80] border border-[#2B5230] rounded-md text-[11.5px] font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]" />
        Fulfilled (Dispatched)
      </span>
    );
  }
  if (status === 'RELEASED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#17202A] text-[#60A5FA] border border-[#233547] rounded-md text-[11.5px] font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-[#60A5FA]" />
        Released
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#2D1616] text-[#F87171] border border-[#572727] rounded-md text-[11.5px] font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-[#F87171]" />
      Cancelled
    </span>
  );
}

export default function ReservationList() {
  const navigate = useNavigate();

  const [reservations, setReservations] = useState<StockReservation[]>([]);
  const [total, setTotal] = useState(0);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [referenceTypeFilter, setReferenceTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [releasingId, setReleasingId] = useState<number | null>(null);
  const [fulfillingId, setFulfillingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Create form state
  const [createWarehouseId, setCreateWarehouseId] = useState<number | ''>('');
  const [createProductId, setCreateProductId] = useState<number | ''>('');
  const [createQuantity, setCreateQuantity] = useState<number | ''>('');
  const [createRefType, setCreateRefType] = useState<string>('MANUAL');
  const [createRefId, setCreateRefId] = useState<string>('');
  const [createNotes, setCreateNotes] = useState<string>('');
  const [selectedStockSnapshot, setSelectedStockSnapshot] = useState<{ onHand: number; reserved: number; available: number } | null>(null);

  // Load static option data
  useEffect(() => {
    Promise.all([api.inventory.listWarehouses(true), api.products.list()])
      .then(([whs, prods]) => {
        setWarehouses(whs);
        setProducts(prods);
        const defWh = whs.find((w) => w.is_default === 1) || whs[0];
        if (defWh) setCreateWarehouseId(defWh.id);
      })
      .catch(console.error);
  }, []);

  // Fetch reservations
  const fetchReservations = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.inventory.listReservations({
        warehouseId: warehouseFilter ? Number(warehouseFilter) : undefined,
        status: statusFilter || undefined,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      });

      let items = res.reservations;

      // Apply client-side search query matching
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        items = items.filter(
          (r) =>
            String(r.id).includes(q) ||
            r.part_no?.toLowerCase().includes(q) ||
            r.product_description?.toLowerCase().includes(q) ||
            r.reference_id?.toLowerCase().includes(q) ||
            r.reference_type?.toLowerCase().includes(q) ||
            r.notes?.toLowerCase().includes(q)
        );
      }

      if (referenceTypeFilter) {
        items = items.filter((r) => r.reference_type === referenceTypeFilter);
      }

      setReservations(items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load stock reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [page, statusFilter, warehouseFilter, referenceTypeFilter, searchQuery]);

  // Real-time stock lookup when product & warehouse selected in create modal
  useEffect(() => {
    if (createWarehouseId && createProductId) {
      api.inventory
        .getProductStock(Number(createProductId), Number(createWarehouseId))
        .then((data) => {
          const whStock = data.warehouses.find((w) => w.warehouseId === Number(createWarehouseId));
          if (whStock) {
            setSelectedStockSnapshot({
              onHand: whStock.onHandQuantity,
              reserved: whStock.reservedQuantity,
              available: whStock.availableQuantity,
            });
          } else {
            setSelectedStockSnapshot({ onHand: 0, reserved: 0, available: 0 });
          }
        })
        .catch(() => setSelectedStockSnapshot(null));
    } else {
      setSelectedStockSnapshot(null);
    }
  }, [createWarehouseId, createProductId]);

  // Compute KPI statistics
  const kpi = useMemo(() => {
    let activeCount = 0;
    let totalReservedQty = 0;
    let fulfilledCount = 0;
    let releasedCount = 0;

    for (const r of reservations) {
      if (r.status === 'ACTIVE') {
        activeCount++;
        totalReservedQty += Number(r.quantity || 0);
      } else if (r.status === 'FULFILLED') {
        fulfilledCount++;
      } else if (r.status === 'RELEASED' || r.status === 'CANCELLED') {
        releasedCount++;
      }
    }

    return {
      totalCount: total,
      activeCount,
      totalReservedQty,
      fulfilledCount,
      releasedCount,
    };
  }, [reservations, total]);

  // Create Reservation Handler
  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (!createWarehouseId || !createProductId || !createQuantity) {
      setModalError('Warehouse, Product, and Quantity are required');
      return;
    }

    const qty = Number(createQuantity);
    if (qty <= 0) {
      setModalError('Quantity must be greater than zero');
      return;
    }

    if (selectedStockSnapshot && qty > selectedStockSnapshot.available) {
      setModalError(
        `Insufficient available stock. Available: ${selectedStockSnapshot.available}, Requested: ${qty}`
      );
      return;
    }

    setSubmitting(true);
    try {
      await api.inventory.reserveStock({
        warehouseId: Number(createWarehouseId),
        productId: Number(createProductId),
        quantity: qty,
        referenceType: createRefType,
        referenceId: createRefId.trim() || undefined,
        notes: createNotes.trim() || undefined,
      });

      setIsCreateOpen(false);
      setCreateQuantity('');
      setCreateRefId('');
      setCreateNotes('');
      fetchReservations();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create reservation');
    } finally {
      setSubmitting(false);
    }
  };

  // Release Handler
  const handleRelease = async () => {
    if (!releasingId) return;
    setSubmitting(true);
    setModalError('');
    try {
      await api.inventory.releaseReservation(releasingId);
      setReleasingId(null);
      fetchReservations();
    } catch (err: any) {
      setModalError(err.message || 'Failed to release reservation');
    } finally {
      setSubmitting(false);
    }
  };

  // Fulfill Handler
  const handleFulfill = async () => {
    if (!fulfillingId) return;
    setSubmitting(true);
    setModalError('');
    try {
      await api.inventory.fulfillReservation(fulfillingId);
      setFulfillingId(null);
      fetchReservations();
    } catch (err: any) {
      setModalError(err.message || 'Failed to fulfill reservation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setWarehouseFilter('');
    setReferenceTypeFilter('');
    setPage(1);
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    Boolean(statusFilter) ||
    Boolean(warehouseFilter) ||
    Boolean(referenceTypeFilter);

  return (
    <div className="p-6 max-w-[1440px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#F5F7F4]">Stock Reservations</h1>
            <span className="px-2.5 py-0.5 bg-[#171B18] text-[#FBBF24] border border-[#3A321B] rounded-full text-xs font-mono">
              Commitment Engine
            </span>
          </div>
          <p className="text-sm text-[#A5AEA8] mt-1">
            Commit inventory to sales without physically deducting on-hand warehouse stock
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#B8F23A] text-[#101312] font-semibold text-sm rounded-lg hover:bg-[#a6df2f] transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Reservation</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-[#141816] border border-[#232925] rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs text-[#8A958E] font-medium">Total Tracked</span>
          <span className="text-2xl font-bold text-[#F5F7F4] mt-2 font-mono">{kpi.totalCount}</span>
        </div>

        <div className="bg-[#141816] border border-[#232925] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#FBBF24] font-medium">Active (Committed)</span>
            <span className="w-2 h-2 rounded-full bg-[#FBBF24]" />
          </div>
          <span className="text-2xl font-bold text-[#FBBF24] mt-2 font-mono">{kpi.activeCount}</span>
        </div>

        <div className="bg-[#141816] border border-[#232925] rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs text-[#F5F7F4] font-medium">Active Reserved Units</span>
          <span className="text-2xl font-bold text-[#F5F7F4] mt-2 font-mono">{kpi.totalReservedQty}</span>
        </div>

        <div className="bg-[#141816] border border-[#232925] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#4ADE80] font-medium">Fulfilled (Dispatched)</span>
            <span className="w-2 h-2 rounded-full bg-[#4ADE80]" />
          </div>
          <span className="text-2xl font-bold text-[#4ADE80] mt-2 font-mono">{kpi.fulfilledCount}</span>
        </div>

        <div className="bg-[#141816] border border-[#232925] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#60A5FA] font-medium">Released / Cancelled</span>
            <span className="w-2 h-2 rounded-full bg-[#60A5FA]" />
          </div>
          <span className="text-2xl font-bold text-[#60A5FA] mt-2 font-mono">{kpi.releasedCount}</span>
        </div>
      </div>

      {/* Expandable Search & Filter Bar */}
      <div className="bg-[#141816] border border-[#232925] rounded-xl p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6D756F]" />
            <input
              type="text"
              placeholder="Search by Reservation #, Part #, Description, or Reference..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-[#0E1110] border border-[#232925] rounded-lg text-sm text-[#F5F7F4] placeholder-[#5A635D] focus:outline-none focus:border-[#B8F23A] transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`inline-flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
                isFilterOpen || hasActiveFilters
                  ? 'bg-[#1D221E] border-[#B8F23A] text-[#F5F7F4]'
                  : 'bg-[#0E1110] border-[#232925] text-[#A5AEA8] hover:text-[#F5F7F4]'
              }`}
            >
              <Filter className="w-4 h-4 text-[#B8F23A]" />
              <span>Filters</span>
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-[#B8F23A]" />}
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0E1110] border border-[#232925] rounded-lg text-sm text-[#A5AEA8] hover:text-[#F5F7F4] hover:border-[#38423B] transition-colors"
                title="Reset filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Drawer */}
        {isFilterOpen && (
          <div className="pt-3 border-t border-[#232925] grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8A958E] mb-1.5">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-[#0E1110] border border-[#232925] rounded-lg text-sm text-[#F5F7F4] focus:outline-none focus:border-[#B8F23A]"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active (Reserved)</option>
                <option value="FULFILLED">Fulfilled (Dispatched)</option>
                <option value="RELEASED">Released</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8A958E] mb-1.5">Warehouse</label>
              <select
                value={warehouseFilter}
                onChange={(e) => {
                  setWarehouseFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-[#0E1110] border border-[#232925] rounded-lg text-sm text-[#F5F7F4] focus:outline-none focus:border-[#B8F23A]"
              >
                <option value="">All Warehouses</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8A958E] mb-1.5">Reference Type</label>
              <select
                value={referenceTypeFilter}
                onChange={(e) => {
                  setReferenceTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-[#0E1110] border border-[#232925] rounded-lg text-sm text-[#F5F7F4] focus:outline-none focus:border-[#B8F23A]"
              >
                <option value="">All References</option>
                <option value="QUOTATION">Quotation</option>
                <option value="SALE_REPORT">Sale Report</option>
                <option value="MANUAL">Manual Reservation</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-[#2D1616] border border-[#572727] rounded-xl flex items-center gap-3 text-sm text-[#F87171]">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Reservations Table */}
      <div className="bg-[#141816] border border-[#232925] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#A5AEA8]">
            <thead className="bg-[#0E1110] border-b border-[#232925] text-xs text-[#8A958E] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3.5">Res #</th>
                <th className="px-4 py-3.5">Product</th>
                <th className="px-4 py-3.5">Warehouse</th>
                <th className="px-4 py-3.5 text-right">Qty</th>
                <th className="px-4 py-3.5">Reference</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Reserved By / Date</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1D221F]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-[#6D756F]">
                    Loading stock reservations...
                  </td>
                </tr>
              ) : reservations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center">
                      <Lock className="w-10 h-10 text-[#434D46] mb-3" />
                      <p className="text-base font-semibold text-[#F5F7F4]">No Stock Reservations Found</p>
                      <p className="text-xs text-[#8A958E] mt-1 mb-4">
                        {hasActiveFilters
                          ? 'Try adjusting your search or filters to see more results.'
                          : 'Create a stock reservation to commit inventory without physically deducting on-hand stock.'}
                      </p>
                      {hasActiveFilters ? (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="px-3.5 py-1.5 bg-[#1D221E] border border-[#2E3630] rounded-lg text-xs text-[#F5F7F4] hover:bg-[#252C26]"
                        >
                          Clear Filters
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsCreateOpen(true)}
                          className="px-4 py-2 bg-[#B8F23A] text-[#101312] font-semibold text-xs rounded-lg hover:bg-[#a6df2f]"
                        >
                          Create Reservation
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                reservations.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-[#181D1A] transition-colors cursor-pointer"
                    onClick={() => navigate(`/inventory/reservations/${r.id}`)}
                  >
                    <td className="px-4 py-3.5 font-mono font-semibold text-[#F5F7F4] whitespace-nowrap">
                      <Link
                        to={`/inventory/reservations/${r.id}`}
                        className="hover:text-[#B8F23A] transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        #RES-{r.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        to={`/inventory/stock/${r.product_id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-mono font-semibold text-[#F5F7F4] hover:text-[#B8F23A] transition-colors block"
                      >
                        {r.part_no}
                      </Link>
                      <span className="text-xs text-[#8A958E] truncate block max-w-xs">
                        {r.product_description}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                      <span className="text-[#F5F7F4]">{r.warehouse_name}</span>
                      <span className="text-[11px] text-[#6D756F] ml-1 font-mono">({r.warehouse_code})</span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-[#FBBF24] whitespace-nowrap text-base">
                      {r.quantity}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                      <span className="text-[#CCD4CE] font-mono">{r.reference_type || 'MANUAL'}</span>
                      {r.reference_id && (
                        <span className="text-[11px] text-[#6D756F] block font-mono">ID: {r.reference_id}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                      <span className="text-[#F5F7F4] block">{r.reserved_by_username || 'Staff'}</span>
                      <span className="text-[#6D756F] text-[11px]">{formatDate(r.created_at)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-2">
                        {r.status === 'ACTIVE' && (
                          <>
                            <button
                              type="button"
                              onClick={() => setReleasingId(r.id)}
                              className="px-2.5 py-1 bg-[#17202A] hover:bg-[#202E3E] text-[#60A5FA] border border-[#233547] rounded text-xs font-medium transition-colors"
                              title="Release Reservation (Decreases reserved stock, leaves on-hand unchanged)"
                            >
                              Release
                            </button>
                            <button
                              type="button"
                              onClick={() => setFulfillingId(r.id)}
                              className="px-2.5 py-1 bg-[#1E2E20] hover:bg-[#283F2B] text-[#71D88A] border border-[#2B4B32] rounded text-xs font-medium transition-colors"
                              title="Fulfill Reservation (Deducts physical on-hand stock and logs STOCK_OUT)"
                            >
                              Fulfill
                            </button>
                          </>
                        )}
                        <Link
                          to={`/inventory/reservations/${r.id}`}
                          className="px-2.5 py-1 bg-[#1A1F1C] hover:bg-[#242C27] text-[#CCD4CE] border border-[#2E3631] rounded text-xs font-medium transition-colors"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="p-4 border-t border-[#232925] flex justify-between items-center bg-[#0E1110]">
            <span className="text-xs text-[#8A958E]">
              Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, total)} of {total} reservations
            </span>
            <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Create Reservation Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#141816] border border-[#2B332E] rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#232925] pb-3">
              <div className="flex items-center gap-2.5 text-[#FBBF24]">
                <Lock className="w-5 h-5" />
                <h3 className="text-base font-bold text-[#F5F7F4]">Create Stock Reservation</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-[#6D756F] hover:text-[#F5F7F4] text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleCreateReservation} className="space-y-4 text-xs">
              {modalError && (
                <div className="p-3 bg-[#2D1616] border border-[#572727] rounded-lg text-xs text-[#F87171] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#8A958E] mb-1">Warehouse *</label>
                <select
                  value={createWarehouseId}
                  onChange={(e) => setCreateWarehouseId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#0E1110] border border-[#232925] rounded-lg text-sm text-[#F5F7F4] focus:outline-none focus:border-[#B8F23A]"
                  required
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8A958E] mb-1">Product *</label>
                <select
                  value={createProductId}
                  onChange={(e) => setCreateProductId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#0E1110] border border-[#232925] rounded-lg text-sm text-[#F5F7F4] focus:outline-none focus:border-[#B8F23A]"
                  required
                >
                  <option value="">Select Product from Catalogue</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.part_no} — {p.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Real-time Stock Snapshot Banner */}
              {selectedStockSnapshot && (
                <div className="p-3 bg-[#0E1110] border border-[#232925] rounded-lg flex items-center justify-between font-mono">
                  <span className="text-[#8A958E]">Current Stock:</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[#CCD4CE]">On-Hand: <strong>{selectedStockSnapshot.onHand}</strong></span>
                    <span className="text-[#FBBF24]">Reserved: <strong>{selectedStockSnapshot.reserved}</strong></span>
                    <span className="text-[#4ADE80]">Available: <strong>{selectedStockSnapshot.available}</strong></span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#8A958E] mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    placeholder="e.g. 10"
                    value={createQuantity}
                    onChange={(e) => setCreateQuantity(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 bg-[#0E1110] border border-[#232925] rounded-lg text-sm text-[#F5F7F4] font-mono focus:outline-none focus:border-[#B8F23A]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#8A958E] mb-1">Reference Type</label>
                  <select
                    value={createRefType}
                    onChange={(e) => setCreateRefType(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0E1110] border border-[#232925] rounded-lg text-sm text-[#F5F7F4] focus:outline-none focus:border-[#B8F23A]"
                  >
                    <option value="MANUAL">MANUAL (General Hold)</option>
                    <option value="QUOTATION">QUOTATION</option>
                    <option value="SALE_REPORT">SALE_REPORT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8A958E] mb-1">Reference ID / Document # (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. QTN-2026-001"
                  value={createRefId}
                  onChange={(e) => setCreateRefId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0E1110] border border-[#232925] rounded-lg text-sm text-[#F5F7F4] font-mono focus:outline-none focus:border-[#B8F23A]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8A958E] mb-1">Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Reason or customer commitment details..."
                  value={createNotes}
                  onChange={(e) => setCreateNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0E1110] border border-[#232925] rounded-lg text-sm text-[#F5F7F4] focus:outline-none focus:border-[#B8F23A]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#232925]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 bg-[#1D221F] border border-[#2E3631] text-[#CCD4CE] hover:text-[#F5F7F4] rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#B8F23A] text-[#101312] hover:bg-[#a6df2f] rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Reserve Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Release Confirmation Modal */}
      {releasingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#141816] border border-[#2B332E] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-[#60A5FA]">
              <div className="p-2 bg-[#17202A] border border-[#233547] rounded-lg">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F5F7F4]">Release Stock Reservation</h3>
                <p className="text-xs text-[#8A958E] font-mono">#RES-{releasingId}</p>
              </div>
            </div>

            <p className="text-sm text-[#CCD4CE]">
              Releasing this reservation will decrease <strong>reserved stock</strong> and return available stock to normal.
              Physical on-hand stock will remain completely unchanged.
            </p>

            {modalError && (
              <div className="p-3 bg-[#2D1616] border border-[#572727] rounded-lg text-xs text-[#F87171]">
                {modalError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setReleasingId(null);
                  setModalError('');
                }}
                disabled={submitting}
                className="px-4 py-2 bg-[#1D221F] border border-[#2E3631] text-[#CCD4CE] hover:text-[#F5F7F4] rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRelease}
                disabled={submitting}
                className="px-4 py-2 bg-[#60A5FA] text-[#101312] hover:bg-[#3b82f6] rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {submitting ? 'Releasing...' : 'Yes, Release Reservation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fulfill Confirmation Modal */}
      {fulfillingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#141816] border border-[#2B332E] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-[#4ADE80]">
              <div className="p-2 bg-[#1B2E1E] border border-[#2B5230] rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F5F7F4]">Fulfill Stock Reservation</h3>
                <p className="text-xs text-[#8A958E] font-mono">#RES-{fulfillingId}</p>
              </div>
            </div>

            <p className="text-sm text-[#CCD4CE]">
              Fulfilling this reservation will perform an <strong>atomic STOCK OUT</strong>.
              Both physical on-hand stock and reserved stock will be decremented, and an entry will be logged in the inventory movement ledger.
            </p>

            {modalError && (
              <div className="p-3 bg-[#2D1616] border border-[#572727] rounded-lg text-xs text-[#F87171]">
                {modalError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setFulfillingId(null);
                  setModalError('');
                }}
                disabled={submitting}
                className="px-4 py-2 bg-[#1D221F] border border-[#2E3631] text-[#CCD4CE] hover:text-[#F5F7F4] rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFulfill}
                disabled={submitting}
                className="px-4 py-2 bg-[#B8F23A] text-[#101312] hover:bg-[#a6df2f] rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {submitting ? 'Fulfilling...' : 'Yes, Fulfill & Deduct Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
