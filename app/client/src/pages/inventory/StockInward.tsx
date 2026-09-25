import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  api,
  StockReceipt,
  Warehouse,
  Product,
  ExcelAnalyzeResponse,
  ExcelPreviewResponse,
} from '../../api';
import { Pagination } from '../../components/Pagination';

const PAGE_SIZE = 20;

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

function ReceiptStatusBadge({ status }: { status: string }) {
  if (status === 'CONFIRMED') {
    return (
      <span className="px-2 py-0.5 bg-[#1E2E20] text-[#71D88A] border border-[#2B4B32] rounded text-[11px] font-medium">
        Confirmed
      </span>
    );
  }
  if (status === 'DRAFT') {
    return (
      <span className="px-2 py-0.5 bg-[#261E12] text-[#F3BA47] border border-[#58411D] rounded text-[11px] font-medium">
        Draft (Staged)
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 bg-[#2A1515] text-[#F87171] border border-[#5A2424] rounded text-[11px] font-medium">
      Cancelled
    </span>
  );
}

interface ManualLineItem {
  productId: number;
  partNo: string;
  quantity: string;
  notes: string;
}

export default function StockInward() {
  const navigate = useNavigate();

  const [receipts, setReceipts] = useState<StockReceipt[]>([]);
  const [total, setTotal] = useState(0);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [page, setPage] = useState(1);

  // Manual Receipt Modal State
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualWarehouseId, setManualWarehouseId] = useState<number | ''>('');
  const [manualReceiptNumber, setManualReceiptNumber] = useState('');
  const [manualSourceType, setManualSourceType] = useState('MANUAL');
  const [manualSourceRef, setManualSourceRef] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [manualItems, setManualItems] = useState<ManualLineItem[]>([]);
  const [manualConfirmImmediately, setManualConfirmImmediately] = useState(true);
  const [manualSaving, setManualSaving] = useState(false);
  const [manualError, setManualError] = useState('');

  // Excel Wizard Modal State
  const [excelModalOpen, setExcelModalOpen] = useState(false);
  const [excelStep, setExcelStep] = useState<'upload' | 'mapping' | 'preview' | 'success'>('upload');
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelAnalysis, setExcelAnalysis] = useState<ExcelAnalyzeResponse | null>(null);
  const [excelWarehouseId, setExcelWarehouseId] = useState<number | ''>('');
  const [excelSheetName, setExcelSheetName] = useState('');
  const [excelPartNoCol, setExcelPartNoCol] = useState('');
  const [excelQtyCol, setExcelQtyCol] = useState('');
  const [excelNotesCol, setExcelNotesCol] = useState('');
  const [excelPreview, setExcelPreview] = useState<ExcelPreviewResponse | null>(null);
  const [excelReceiptNumber, setExcelReceiptNumber] = useState('');
  const [excelSourceRef, setExcelSourceRef] = useState('');
  const [excelNotes, setExcelNotes] = useState('');
  const [excelBusy, setExcelBusy] = useState(false);
  const [excelError, setExcelError] = useState('');
  const [createdReceiptId, setCreatedReceiptId] = useState<number | null>(null);

  // Load initial data
  const loadReceipts = () => {
    setLoading(true);
    setError('');

    const offset = (page - 1) * PAGE_SIZE;
    api.inventory.receipts
      .list({
        warehouseId: selectedWarehouse ? Number(selectedWarehouse) : undefined,
        status: selectedStatus || undefined,
        sourceType: selectedSource || undefined,
        q: search.trim() || undefined,
        limit: PAGE_SIZE,
        offset,
      })
      .then((res) => {
        setReceipts(res.receipts);
        setTotal(res.total);
      })
      .catch((err) => {
        console.error('Failed to load receipts:', err);
        setError(err.message || 'Failed to load stock receipts');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReceipts();
  }, [page, selectedWarehouse, selectedStatus, selectedSource]);

  useEffect(() => {
    api.inventory
      .listWarehouses(true)
      .then((whs) => {
        setWarehouses(whs);
        if (whs.length === 1) {
          setManualWarehouseId(whs[0].id);
          setExcelWarehouseId(whs[0].id);
        } else {
          const def = whs.find((w) => w.is_default === 1);
          if (def) {
            setManualWarehouseId(def.id);
            setExcelWarehouseId(def.id);
          }
        }
      })
      .catch((err) => console.error('Failed to load warehouses:', err));

    api.products
      .list()
      .then(setProducts)
      .catch((err) => console.error('Failed to load product catalogue:', err));
  }, []);

  // --- Manual Receipt Handlers ---
  const openManualModal = () => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    setManualReceiptNumber(`SR-${today}-${rand}`);
    setManualSourceType('MANUAL');
    setManualSourceRef('');
    setManualNotes('');
    setManualItems([
      { productId: products[0]?.id || 0, partNo: products[0]?.part_no || '', quantity: '10', notes: '' },
    ]);
    setManualConfirmImmediately(true);
    setManualError('');
    setManualModalOpen(true);
  };

  const addManualItem = () => {
    const firstProd = products[0];
    setManualItems([
      ...manualItems,
      { productId: firstProd?.id || 0, partNo: firstProd?.part_no || '', quantity: '1', notes: '' },
    ]);
  };

  const removeManualItem = (index: number) => {
    if (manualItems.length <= 1) return;
    setManualItems(manualItems.filter((_, idx) => idx !== index));
  };

  const updateManualItem = (index: number, field: keyof ManualLineItem, value: any) => {
    const updated = [...manualItems];
    if (field === 'productId') {
      const prod = products.find((p) => p.id === Number(value));
      updated[index] = {
        ...updated[index],
        productId: Number(value),
        partNo: prod?.part_no || '',
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setManualItems(updated);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualWarehouseId) {
      setManualError('Please select a warehouse facility');
      return;
    }
    if (manualItems.length === 0) {
      setManualError('At least one product line item is required');
      return;
    }

    // Validate quantities
    for (let i = 0; i < manualItems.length; i++) {
      const q = Number(manualItems[i].quantity);
      if (isNaN(q) || q <= 0) {
        setManualError(`Row ${i + 1} has an invalid quantity: must be greater than zero`);
        return;
      }
    }

    // Aggregate duplicate products before submission
    const aggregated = new Map<number, { productId: number; quantity: number; notes: string }>();
    for (const item of manualItems) {
      const qty = Number(item.quantity);
      if (aggregated.has(item.productId)) {
        const existing = aggregated.get(item.productId)!;
        existing.quantity += qty;
        if (item.notes && !existing.notes) existing.notes = item.notes;
      } else {
        aggregated.set(item.productId, {
          productId: item.productId,
          quantity: qty,
          notes: item.notes,
        });
      }
    }

    setManualSaving(true);
    setManualError('');

    try {
      const res = await api.inventory.receipts.create({
        warehouseId: Number(manualWarehouseId),
        receiptNumber: manualReceiptNumber.trim() || undefined,
        sourceType: manualSourceType,
        sourceReference: manualSourceRef.trim() || undefined,
        notes: manualNotes.trim() || undefined,
        items: Array.from(aggregated.values()),
        confirmImmediately: manualConfirmImmediately,
      });

      setManualModalOpen(false);
      loadReceipts();
      navigate(`/inventory/stock-inward/${res.id}`);
    } catch (err: any) {
      console.error('Failed to create manual receipt:', err);
      setManualError(err.message || 'Failed to create manual stock receipt');
    } finally {
      setManualSaving(false);
    }
  };

  // --- Excel Wizard Handlers ---
  const openExcelModal = () => {
    setExcelStep('upload');
    setExcelFile(null);
    setExcelAnalysis(null);
    setExcelPreview(null);
    setExcelError('');
    setCreatedReceiptId(null);
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    setExcelReceiptNumber(`SR-EXCEL-${today}-${rand}`);
    setExcelSourceRef('');
    setExcelNotes('');
    setExcelModalOpen(true);
  };

  const handleExcelFileSelect = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setExcelError('File exceeds 5MB limit');
      return;
    }
    const ext = file.name.toLowerCase();
    if (!ext.endsWith('.xlsx') && !ext.endsWith('.xls')) {
      setExcelError('Please select a valid Excel file (.xlsx or .xls)');
      return;
    }

    setExcelFile(file);
    setExcelError('');
    setExcelBusy(true);

    try {
      const analysis = await api.inventory.receipts.analyzeExcel(file);
      setExcelAnalysis(analysis);
      if (analysis.sheets.length > 0) {
        setExcelSheetName(analysis.sheets[0].name);
      }
      setExcelPartNoCol(analysis.suggestedPartNoColumn || analysis.sheets[0]?.headers[0] || '');
      setExcelQtyCol(analysis.suggestedQuantityColumn || analysis.sheets[0]?.headers[1] || '');
      setExcelNotesCol(analysis.suggestedNotesColumn || '');
      setExcelStep('mapping');
    } catch (err: any) {
      console.error('Failed to analyze Excel file:', err);
      setExcelError(err.message || 'Failed to analyze Excel file');
    } finally {
      setExcelBusy(false);
    }
  };

  const handleExcelPreview = async () => {
    if (!excelFile || !excelWarehouseId || !excelPartNoCol || !excelQtyCol) {
      setExcelError('Please select warehouse, Part Number column, and Quantity column');
      return;
    }

    setExcelBusy(true);
    setExcelError('');

    try {
      const preview = await api.inventory.receipts.previewExcel({
        file: excelFile,
        warehouseId: Number(excelWarehouseId),
        sheetName: excelSheetName || undefined,
        partNoColumn: excelPartNoCol,
        quantityColumn: excelQtyCol,
        notesColumn: excelNotesCol || undefined,
      });
      setExcelPreview(preview);
      setExcelStep('preview');
    } catch (err: any) {
      console.error('Failed to generate Excel preview:', err);
      setExcelError(err.message || 'Failed to preview stock receipt data');
    } finally {
      setExcelBusy(false);
    }
  };

  const handleExcelConfirm = async () => {
    if (!excelPreview || excelPreview.validItems.length === 0 || !excelWarehouseId) {
      setExcelError('No valid items to restock');
      return;
    }

    setExcelBusy(true);
    setExcelError('');

    try {
      const items = excelPreview.validItems.map((item) => ({
        productId: item.productId,
        quantity: item.incomingQuantity,
        notes: item.notes || undefined,
      }));

      const receipt = await api.inventory.receipts.create({
        warehouseId: Number(excelWarehouseId),
        receiptNumber: excelReceiptNumber.trim() || undefined,
        sourceType: 'EXCEL_IMPORT',
        sourceReference: excelSourceRef.trim() || excelFile?.name,
        notes: excelNotes.trim() || `Imported from ${excelFile?.name}`,
        items,
        confirmImmediately: true,
      });

      setCreatedReceiptId(receipt.id);
      setExcelStep('success');
      loadReceipts();
    } catch (err: any) {
      console.error('Failed to confirm Excel stock receipt:', err);
      setExcelError(err.message || 'Failed to confirm stock receipt');
    } finally {
      setExcelBusy(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="p-6 flex flex-col gap-6 bg-[#101312] text-[#F5F7F4] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs text-[#A5AEA8]">
            <Link to="/inventory" className="hover:text-[#B8F23A] transition-colors">
              Inventory
            </Link>
            <span>/</span>
            <span className="text-[#F5F7F4]">Stock Inward</span>
          </div>
          <h1 className="margin-0 text-[32px] font-medium tracking-[-.02em] leading-[1.05]">
            Stock Inward & Restocking
          </h1>
          <p className="margin-0 text-[13.5px] text-[#A5AEA8]">
            Receive new physical inventory into warehouse facilities manually or via Excel import.
          </p>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <button
            onClick={openManualModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#1B1F1D] hover:bg-[#242A27] text-[#F5F7F4] border border-[#292E2A] rounded-lg text-xs font-semibold transition-colors"
          >
            <span>📝</span>
            <span>+ Manual Stock Receipt</span>
          </button>
          <button
            onClick={openExcelModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#B8F23A] hover:bg-[#A6DD34] text-[#101312] font-semibold rounded-lg text-xs transition-colors"
          >
            <span>📊</span>
            <span>Upload Excel</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[#2A1515] border border-[#5A2424] text-[#F87171] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>⚠️</span>
            <span className="text-sm">{error}</span>
          </div>
          <button
            onClick={loadReceipts}
            className="px-3 py-1 bg-[#381B1B] hover:bg-[#482222] text-[#FCA5A5] rounded text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter Control Bar */}
      <div className="bg-[#171918] border border-[#292E2A] rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 flex-wrap">
          {/* Search */}
          <div className="relative min-w-[220px]">
            <input
              type="text"
              placeholder="Search receipt #, reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadReceipts()}
              className="w-full bg-[#121413] border border-[#292E2A] rounded-lg px-3 py-2 text-xs text-[#F5F7F4] placeholder-[#646D67] focus:outline-none focus:border-[#B8F23A]"
            />
          </div>

          {/* Warehouse Selector */}
          <select
            value={selectedWarehouse}
            onChange={(e) => {
              setSelectedWarehouse(e.target.value);
              setPage(1);
            }}
            className="bg-[#121413] border border-[#292E2A] rounded-lg px-3 py-2 text-xs text-[#F5F7F4] focus:outline-none focus:border-[#B8F23A]"
          >
            <option value="">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.code} - {w.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="bg-[#121413] border border-[#292E2A] rounded-lg px-3 py-2 text-xs text-[#F5F7F4] focus:outline-none focus:border-[#B8F23A]"
          >
            <option value="">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="DRAFT">Draft</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Source Filter */}
          <select
            value={selectedSource}
            onChange={(e) => {
              setSelectedSource(e.target.value);
              setPage(1);
            }}
            className="bg-[#121413] border border-[#292E2A] rounded-lg px-3 py-2 text-xs text-[#F5F7F4] focus:outline-none focus:border-[#B8F23A]"
          >
            <option value="">All Sources</option>
            <option value="MANUAL">Manual Entry</option>
            <option value="EXCEL_IMPORT">Excel Import</option>
            <option value="VENDOR_DELIVERY">Vendor Delivery</option>
          </select>

          <button
            onClick={() => {
              setPage(1);
              loadReceipts();
            }}
            className="px-3 py-2 bg-[#B8F23A] hover:bg-[#A6DD34] text-[#101312] font-semibold rounded-lg text-xs transition-colors"
          >
            Apply
          </button>
        </div>

        <div className="text-xs text-[#A5AEA8]">
          Total {total} receipts
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-[#171918] border border-[#292E2A] rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 flex flex-col gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-[#1B1F1D] rounded animate-pulse" />
            ))}
          </div>
        ) : receipts.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-3">
            <span className="text-3xl">📥</span>
            <p className="text-[#F5F7F4] font-medium text-base">No stock receipts recorded</p>
            <p className="text-xs text-[#A5AEA8] max-w-sm">
              Use '+ Manual Stock Receipt' or 'Upload Excel' above to receive and record incoming stock.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#292E2A] text-xs text-[#A5AEA8] uppercase tracking-wider bg-[#141615]">
                  <th className="py-3 px-4 font-medium">Receipt #</th>
                  <th className="py-3 px-4 font-medium">Date</th>
                  <th className="py-3 px-4 font-medium">Facility</th>
                  <th className="py-3 px-4 font-medium">Source</th>
                  <th className="py-3 px-4 font-medium text-center">SKUs</th>
                  <th className="py-3 px-4 font-medium text-right">Total Units</th>
                  <th className="py-3 px-4 font-medium text-center">Status</th>
                  <th className="py-3 px-4 font-medium">Created By</th>
                  <th className="py-3 px-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202522]">
                {receipts.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#1C201E] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-xs text-[#F5F7F4]">
                      <Link
                        to={`/inventory/stock-inward/${rec.id}`}
                        className="text-[#B8F23A] hover:underline"
                      >
                        {rec.receipt_number}
                      </Link>
                      {rec.source_reference && (
                        <p className="text-[11px] text-[#7A837E] truncate max-w-[180px]">
                          Ref: {rec.source_reference}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#A5AEA8] whitespace-nowrap">
                      {formatDate(rec.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#F5F7F4]">
                      <span className="font-medium">{rec.warehouse_name}</span>{' '}
                      <span className="text-[#7A837E] font-mono">({rec.warehouse_code})</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#A5AEA8]">
                      {rec.source_type}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 bg-[#202422] rounded text-[11px] font-mono text-[#A5AEA8]">
                        {rec.product_count || 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono font-bold text-right text-[#71D88A]">
                      +{formatNumber(rec.total_quantity)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <ReceiptStatusBadge status={rec.status} />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#A5AEA8]">
                      {rec.created_by_username || 'System'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/inventory/stock-inward/${rec.id}`}
                        className="px-2.5 py-1 bg-[#1F2421] hover:bg-[#282E2B] text-[#F5F7F4] border border-[#292E2A] rounded text-xs font-medium transition-colors"
                      >
                        Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-2">
          <Pagination page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />
        </div>
      )}

      {/* --- MODAL 1: MANUAL STOCK RECEIPT --- */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-[#171918] border border-[#292E2A] rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl my-8">
            <div className="p-4 border-b border-[#292E2A] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">📝</span>
                <h3 className="font-semibold text-base text-[#F5F7F4]">Manual Stock Receipt</h3>
              </div>
              <button
                type="button"
                onClick={() => setManualModalOpen(false)}
                className="text-[#A5AEA8] hover:text-[#F5F7F4] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="p-5 flex flex-col gap-4">
              {manualError && (
                <div className="p-3 bg-[#2A1515] border border-[#5A2424] text-[#F87171] rounded-lg text-xs">
                  {manualError}
                </div>
              )}

              {/* Receipt Header Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#A5AEA8]">
                    Warehouse Facility <span className="text-[#F87171]">*</span>
                  </label>
                  <select
                    required
                    value={manualWarehouseId}
                    onChange={(e) => setManualWarehouseId(Number(e.target.value))}
                    className="bg-[#121413] border border-[#292E2A] rounded-lg px-3 py-2 text-xs text-[#F5F7F4] focus:outline-none focus:border-[#B8F23A]"
                  >
                    <option value="">-- Select Destination Facility --</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.code} - {w.name} {w.is_default === 1 ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#A5AEA8]">
                    Receipt Number <span className="text-[#F87171]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={manualReceiptNumber}
                    onChange={(e) => setManualReceiptNumber(e.target.value)}
                    className="bg-[#121413] border border-[#292E2A] rounded-lg px-3 py-2 text-xs font-mono text-[#F5F7F4] focus:outline-none focus:border-[#B8F23A]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#A5AEA8]">Source / Vendor</label>
                  <select
                    value={manualSourceType}
                    onChange={(e) => setManualSourceType(e.target.value)}
                    className="bg-[#121413] border border-[#292E2A] rounded-lg px-3 py-2 text-xs text-[#F5F7F4] focus:outline-none focus:border-[#B8F23A]"
                  >
                    <option value="MANUAL">Manual Restocking</option>
                    <option value="VENDOR_DELIVERY">Vendor Delivery</option>
                    <option value="PURCHASE_RECEIPT">Purchase Receipt</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#A5AEA8]">
                    Vendor Delivery / Challan Ref
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DC-9841 / INV-2024-01"
                    value={manualSourceRef}
                    onChange={(e) => setManualSourceRef(e.target.value)}
                    className="bg-[#121413] border border-[#292E2A] rounded-lg px-3 py-2 text-xs text-[#F5F7F4] focus:outline-none focus:border-[#B8F23A]"
                  />
                </div>
              </div>

              {/* Line Items Table */}
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#F5F7F4] uppercase tracking-wider">
                    Receipt Line Items ({manualItems.length})
                  </span>
                  <button
                    type="button"
                    onClick={addManualItem}
                    className="px-2.5 py-1 bg-[#1F2421] hover:bg-[#282E2B] text-[#B8F23A] border border-[#292E2A] rounded text-xs font-medium transition-colors"
                  >
                    + Add Line
                  </button>
                </div>

                <div className="bg-[#121413] border border-[#292E2A] rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#292E2A] text-[#A5AEA8] uppercase bg-[#141615]">
                        <th className="py-2.5 px-3">Product / Part No</th>
                        <th className="py-2.5 px-3 w-28 text-right">Inward Qty</th>
                        <th className="py-2.5 px-3">Notes</th>
                        <th className="py-2.5 px-3 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#202522]">
                      {manualItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3">
                            <select
                              value={item.productId}
                              onChange={(e) => updateManualItem(idx, 'productId', e.target.value)}
                              className="w-full bg-[#171918] border border-[#292E2A] rounded px-2 py-1.5 text-xs text-[#F5F7F4] focus:outline-none focus:border-[#B8F23A]"
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.part_no} — {p.description} ({p.unit || 'Nos'})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              min="1"
                              step="any"
                              required
                              value={item.quantity}
                              onChange={(e) => updateManualItem(idx, 'quantity', e.target.value)}
                              className="w-full bg-[#171918] border border-[#292E2A] rounded px-2 py-1.5 text-xs font-mono text-right text-[#71D88A] focus:outline-none focus:border-[#B8F23A]"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              placeholder="Line note..."
                              value={item.notes}
                              onChange={(e) => updateManualItem(idx, 'notes', e.target.value)}
                              className="w-full bg-[#171918] border border-[#292E2A] rounded px-2 py-1.5 text-xs text-[#F5F7F4] focus:outline-none focus:border-[#B8F23A]"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            {manualItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeManualItem(idx)}
                                className="text-[#F87171] hover:text-[#ff9999] font-bold text-sm"
                              >
                                ✕
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Units Summary */}
              <div className="bg-[#121413] border border-[#292E2A] rounded-lg p-3 flex items-center justify-between text-xs">
                <span className="text-[#A5AEA8]">Total Incoming Units:</span>
                <span className="font-mono font-bold text-sm text-[#71D88A]">
                  +{manualItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)} units
                </span>
              </div>

              {/* Confirmation Option */}
              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#F5F7F4]">
                  <input
                    type="checkbox"
                    checked={manualConfirmImmediately}
                    onChange={(e) => setManualConfirmImmediately(e.target.checked)}
                    className="rounded border-[#292E2A] text-[#B8F23A] focus:ring-0"
                  />
                  <span>Confirm and update physical inventory stock immediately</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#292E2A]">
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="px-3.5 py-2 bg-[#1E2220] hover:bg-[#282D2A] text-[#A5AEA8] rounded-lg text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={manualSaving}
                  className="px-4 py-2 bg-[#B8F23A] hover:bg-[#A6DD34] disabled:opacity-50 text-[#101312] rounded-lg text-xs font-semibold transition-colors"
                >
                  {manualSaving ? 'Recording Receipt...' : 'Save Stock Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: EXCEL RESTOCKING WIZARD --- */}
      {excelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-[#171918] border border-[#292E2A] rounded-xl w-full max-w-4xl overflow-hidden shadow-2xl my-8">
            <div className="p-4 border-b border-[#292E2A] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>
                <h3 className="font-semibold text-base text-[#F5F7F4]">
                  Excel Stock Restocking Wizard
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setExcelModalOpen(false)}
                className="text-[#A5AEA8] hover:text-[#F5F7F4] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Stepper Tabs */}
            <div className="bg-[#141615] border-b border-[#292E2A] px-6 py-2.5 flex items-center gap-4 text-xs font-medium overflow-x-auto">
              <span
                className={`px-2.5 py-1 rounded transition-colors ${
                  excelStep === 'upload' ? 'bg-[#1D2B1B] text-[#B8F23A] font-bold border border-[#334D2E]' : 'text-[#7A837E]'
                }`}
              >
                1. Upload File
              </span>
              <span className="text-[#3A423D]">→</span>
              <span
                className={`px-2.5 py-1 rounded transition-colors ${
                  excelStep === 'mapping' ? 'bg-[#1D2B1B] text-[#B8F23A] font-bold border border-[#334D2E]' : 'text-[#7A837E]'
                }`}
              >
                2. Column Mapping
              </span>
              <span className="text-[#3A423D]">→</span>
              <span
                className={`px-2.5 py-1 rounded transition-colors ${
                  excelStep === 'preview' ? 'bg-[#1D2B1B] text-[#B8F23A] font-bold border border-[#334D2E]' : 'text-[#7A837E]'
                }`}
              >
                3. Validate & Impact
              </span>
              <span className="text-[#3A423D]">→</span>
              <span
                className={`px-2.5 py-1 rounded transition-colors ${
                  excelStep === 'success' ? 'bg-[#1D2B1B] text-[#B8F23A] font-bold border border-[#334D2E]' : 'text-[#7A837E]'
                }`}
              >
                4. Confirm & Result
              </span>
            </div>

            <div className="p-6 flex flex-col gap-4">
              {excelError && (
                <div className="p-3 bg-[#2A1515] border border-[#5A2424] text-[#F87171] rounded-lg text-xs flex items-center justify-between">
                  <span>⚠️ {excelError}</span>
                </div>
              )}

              {/* STEP 1: UPLOAD */}
              {excelStep === 'upload' && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-[#292E2A] rounded-xl bg-[#121413] gap-4">
                    <span className="text-4xl">📁</span>
                    <div className="text-center">
                      <p className="text-sm font-medium text-[#F5F7F4]">
                        Select Excel Stock Inward File
                      </p>
                      <p className="text-xs text-[#A5AEA8] mt-1">
                        Supports <strong className="text-[#F5F7F4]">.xlsx</strong> and <strong className="text-[#F5F7F4]">.xls</strong> files (Maximum safe file size: 5MB, up to 2,000 rows).
                      </p>
                    </div>
                    <label className="cursor-pointer px-4 py-2 bg-[#B8F23A] hover:bg-[#A6DD34] text-[#101312] font-semibold text-xs rounded-lg transition-colors shadow-lg shadow-[#B8F23A]/10">
                      {excelBusy ? 'Analyzing Workbook...' : 'Browse File'}
                      <input
                        type="file"
                        accept=".xlsx, .xls"
                        disabled={excelBusy}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleExcelFileSelect(file);
                        }}
                      />
                    </label>
                  </div>

                  {excelFile && (
                    <div className="p-3.5 bg-[#121413] border border-[#292E2A] rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">📄</span>
                        <div>
                          <p className="font-medium text-[#F5F7F4]">{excelFile.name}</p>
                          <p className="text-[11px] text-[#A5AEA8]">
                            {(excelFile.size / 1024).toFixed(1)} KB • Upload Status: <span className="text-[#71D88A]">Ready</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: COLUMN MAPPING & WAREHOUSE */}
              {excelStep === 'mapping' && excelAnalysis && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Destination Facility */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[#A5AEA8]">
                        Destination Warehouse <span className="text-[#F87171]">*</span>
                      </label>
                      <select
                        value={excelWarehouseId}
                        onChange={(e) => setExcelWarehouseId(Number(e.target.value))}
                        className="bg-[#121413] border border-[#292E2A] rounded-lg px-3 py-2 text-xs text-[#F5F7F4] focus:outline-none focus:border-[#B8F23A]"
                      >
                        <option value="">-- Select Destination Warehouse --</option>
                        {warehouses.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.code} - {w.name} {w.is_default === 1 ? '(Default)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Worksheet Selector */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[#A5AEA8]">Worksheet</label>
                      <select
                        value={excelSheetName}
                        onChange={(e) => setExcelSheetName(e.target.value)}
                        className="bg-[#121413] border border-[#292E2A] rounded-lg px-3 py-2 text-xs text-[#F5F7F4] focus:outline-none focus:border-[#B8F23A]"
                      >
                        {excelAnalysis.sheets.map((s) => (
                          <option key={s.name} value={s.name}>
                            {s.name} ({s.rowCount} rows)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Part Number Column Mapping */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[#A5AEA8]">
                        Part Number Column <span className="text-[#F87171]">*</span>
                      </label>
                      <select
                        value={excelPartNoCol}
                        onChange={(e) => setExcelPartNoCol(e.target.value)}
                        className="bg-[#121413] border border-[#292E2A] rounded-lg px-3 py-2 text-xs text-[#F5F7F4] focus:outline-none focus:border-[#B8F23A]"
                      >
                        <option value="">-- Select Excel Column --</option>
                        {excelAnalysis.sheets
                          .find((s) => s.name === excelSheetName)
                          ?.headers.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Quantity Column Mapping */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[#A5AEA8]">
                        Quantity Column <span className="text-[#F87171]">*</span>
                      </label>
                      <select
                        value={excelQtyCol}
                        onChange={(e) => setExcelQtyCol(e.target.value)}
                        className="bg-[#121413] border border-[#292E2A] rounded-lg px-3 py-2 text-xs text-[#F5F7F4] focus:outline-none focus:border-[#B8F23A]"
                      >
                        <option value="">-- Select Excel Column --</option>
                        {excelAnalysis.sheets
                          .find((s) => s.name === excelSheetName)
                          ?.headers.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* Sample Data Table */}
                  <div className="flex flex-col gap-1.5 pt-2">
                    <span className="text-xs font-medium text-[#A5AEA8]">
                      Sample Data from Selected Sheet:
                    </span>
                    <div className="bg-[#121413] border border-[#292E2A] rounded-lg overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[#292E2A] text-[#7A837E] uppercase bg-[#141615]">
                            {excelAnalysis.sheets
                              .find((s) => s.name === excelSheetName)
                              ?.headers.map((h) => (
                                <th key={h} className="py-2 px-3 whitespace-nowrap">
                                  {h}
                                </th>
                              ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#202522]">
                          {excelAnalysis.sheets
                            .find((s) => s.name === excelSheetName)
                            ?.sampleRows.slice(0, 4)
                            .map((row, idx) => (
                              <tr key={idx}>
                                {excelAnalysis.sheets
                                  .find((s) => s.name === excelSheetName)
                                  ?.headers.map((h) => (
                                    <td key={h} className="py-1.5 px-3 text-[#A5AEA8] whitespace-nowrap">
                                      {row[h] || '—'}
                                    </td>
                                  ))}
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-[#292E2A]">
                    <button
                      type="button"
                      onClick={() => setExcelStep('upload')}
                      className="text-xs text-[#A5AEA8] hover:text-[#F5F7F4]"
                    >
                      ← Choose different file
                    </button>
                    <button
                      type="button"
                      disabled={excelBusy || !excelWarehouseId || !excelPartNoCol || !excelQtyCol}
                      onClick={handleExcelPreview}
                      className="px-4 py-2 bg-[#B8F23A] hover:bg-[#A6DD34] disabled:opacity-50 text-[#101312] font-semibold text-xs rounded-lg transition-colors"
                    >
                      {excelBusy ? 'Validating against Catalogue...' : 'Validate & Preview Impact →'}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: PREVIEW & IMPACT */}
              {excelStep === 'preview' && excelPreview && (
                <div className="flex flex-col gap-4">
                  {/* Summary KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[#121413] border border-[#292E2A] rounded-xl p-3">
                      <span className="text-[11px] text-[#A5AEA8]">Total File Rows</span>
                      <div className="text-xl font-bold text-[#F5F7F4] mt-1">
                        {excelPreview.summary.totalRows}
                      </div>
                    </div>
                    <div className="bg-[#121413] border border-[#292E2A] rounded-xl p-3">
                      <span className="text-[11px] text-[#71D88A]">Valid Products</span>
                      <div className="text-xl font-bold text-[#71D88A] mt-1">
                        {excelPreview.summary.validItemCount}
                      </div>
                    </div>
                    <div className="bg-[#121413] border border-[#292E2A] rounded-xl p-3">
                      <span className="text-[11px] text-[#F87171]">Invalid Rows</span>
                      <div className="text-xl font-bold text-[#F87171] mt-1">
                        {excelPreview.summary.invalidRowCount}
                      </div>
                    </div>
                    <div className="bg-[#121413] border border-[#292E2A] rounded-xl p-3 bg-gradient-to-b from-[#121413] to-[#141F16]">
                      <span className="text-[11px] text-[#B8F23A]">Incoming Units</span>
                      <div className="text-xl font-bold text-[#B8F23A] mt-1">
                        +{formatNumber(excelPreview.summary.totalIncomingUnits)}
                      </div>
                    </div>
                  </div>

                  {/* Warnings Box */}
                  {excelPreview.warnings.length > 0 && (
                    <div className="p-3.5 bg-[#261E12] border border-[#58411D] text-[#F3BA47] rounded-xl text-xs flex flex-col gap-1">
                      <span className="font-semibold flex items-center gap-1">
                        <span>⚠️</span> System Warnings & Information:
                      </span>
                      {excelPreview.warnings.map((w, i) => (
                        <p key={i} className="text-[11.5px] opacity-90">
                          • {w}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Invalid Rows Table */}
                  {excelPreview.invalidRows.length > 0 && (
                    <div className="bg-[#2A1515] border border-[#5A2424] rounded-xl p-3.5 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#F87171]">
                          ❌ Rejected Rows ({excelPreview.invalidRows.length}) — will NOT be imported:
                        </span>
                        <Link
                          to="/products"
                          target="_blank"
                          className="text-xs text-[#B8F23A] hover:underline flex items-center gap-1 font-medium"
                        >
                          <span>View Products</span>
                          <span>→</span>
                        </Link>
                      </div>
                      <div className="max-h-36 overflow-y-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="text-[#FCA5A5] border-b border-[#5A2424] bg-[#331717]">
                              <th className="py-1.5 px-2">Row #</th>
                              <th className="py-1.5 px-2">Part No</th>
                              <th className="py-1.5 px-2">Quantity</th>
                              <th className="py-1.5 px-2">Validation Error</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#3D1A1A]">
                            {excelPreview.invalidRows.map((inv, idx) => (
                              <tr key={idx}>
                                <td className="py-1.5 px-2 font-mono text-[#A5AEA8]">
                                  {inv.rowNumber}
                                </td>
                                <td className="py-1.5 px-2 font-mono text-[#F87171]">
                                  {inv.partNo || '—'}
                                </td>
                                <td className="py-1.5 px-2 text-[#A5AEA8]">{inv.quantity || '—'}</td>
                                <td className="py-1.5 px-2 text-[#FCA5A5]">{inv.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Valid Items Stock Impact Table */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-[#F5F7F4] uppercase tracking-wider">
                      Stock Impact Preview ({excelPreview.validItems.length} Products):
                    </span>
                    <div className="bg-[#121413] border border-[#292E2A] rounded-lg overflow-x-auto max-h-56 overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[#292E2A] text-[#A5AEA8] uppercase bg-[#141615]">
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">Part No</th>
                            <th className="py-2.5 px-3">Description</th>
                            <th className="py-2.5 px-3 text-right">Current On Hand</th>
                            <th className="py-2.5 px-3 text-right">Inward Qty</th>
                            <th className="py-2.5 px-3 text-right">Projected On Hand</th>
                            <th className="py-2.5 px-3 text-right">Projected Available</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#202522]">
                          {excelPreview.validItems.map((item) => (
                            <tr key={item.productId} className="hover:bg-[#181C1A]">
                              <td className="py-2 px-3 text-[11px] font-semibold text-[#4ADE80]">
                                ✓ VALID
                              </td>
                              <td className="py-2 px-3 font-mono font-medium text-[#F5F7F4]">
                                {item.partNo}
                              </td>
                              <td className="py-2 px-3 text-[#A5AEA8] max-w-[200px] truncate">
                                {item.description}
                              </td>
                              <td className="py-2 px-3 font-mono text-right text-[#A5AEA8]">
                                {item.currentOnHand} {item.unit}
                              </td>
                              <td className="py-2 px-3 font-mono text-right font-bold text-[#71D88A]">
                                +{item.incomingQuantity}
                              </td>
                              <td className="py-2 px-3 font-mono text-right font-semibold text-[#F5F7F4]">
                                {item.projectedOnHand}
                              </td>
                              <td className="py-2 px-3 font-mono text-right font-bold text-[#B8F23A]">
                                {item.projectedAvailable}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Header Details for Confirmation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#292E2A]">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-[#A5AEA8]">Receipt Number</label>
                      <input
                        type="text"
                        value={excelReceiptNumber}
                        onChange={(e) => setExcelReceiptNumber(e.target.value)}
                        className="bg-[#121413] border border-[#292E2A] rounded px-2.5 py-1.5 text-xs font-mono text-[#F5F7F4] focus:outline-none focus:border-[#B8F23A]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-[#A5AEA8]">Delivery Reference / Invoice</label>
                      <input
                        type="text"
                        placeholder="e.g. PO-8411 / Vendor Bill"
                        value={excelSourceRef}
                        onChange={(e) => setExcelSourceRef(e.target.value)}
                        className="bg-[#121413] border border-[#292E2A] rounded px-2.5 py-1.5 text-xs text-[#F5F7F4] focus:outline-none focus:border-[#B8F23A]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-[#292E2A]">
                    <button
                      type="button"
                      onClick={() => setExcelStep('mapping')}
                      className="text-xs text-[#A5AEA8] hover:text-[#F5F7F4]"
                    >
                      ← Back to Mapping
                    </button>
                    <button
                      type="button"
                      disabled={excelBusy || excelPreview.validItems.length === 0}
                      onClick={handleExcelConfirm}
                      className="px-5 py-2.5 bg-[#B8F23A] hover:bg-[#A6DD34] disabled:opacity-50 text-[#101312] font-bold text-xs rounded-lg transition-colors shadow-lg shadow-[#B8F23A]/10"
                    >
                      {excelBusy
                        ? 'Confirming Receipt...'
                        : `Confirm Stock Import (+${formatNumber(excelPreview.summary.totalIncomingUnits)} Units) →`}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: SUCCESS RESULT PAGE (STEP 12 COMPLIANCE) */}
              {excelStep === 'success' && (
                <div className="p-6 text-center flex flex-col items-center gap-6">
                  <div className="w-16 h-16 rounded-full bg-[#1D2B1B] border border-[#334D2E] text-[#B8F23A] flex items-center justify-center text-3xl">
                    ✓
                  </div>

                  <div>
                    <h4 className="text-xl font-bold text-[#F5F7F4]">
                      Stock Import Successful
                    </h4>
                    <p className="text-xs text-[#A5AEA8] mt-1 max-w-md">
                      Physical inventory stock levels, movements, and stock intelligence metrics have been updated atomically.
                    </p>
                  </div>

                  {/* Summary Card */}
                  <div className="w-full max-w-md bg-[#121413] border border-[#292E2A] rounded-xl p-4 space-y-2 text-xs text-left">
                    <div className="flex justify-between py-1 border-b border-[#292E2A]/50">
                      <span className="text-[#A5AEA8]">Stock Receipt Number:</span>
                      <span className="font-mono font-bold text-[#B8F23A]">
                        {excelReceiptNumber}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#292E2A]/50">
                      <span className="text-[#A5AEA8]">Products Updated:</span>
                      <span className="font-mono font-semibold text-[#F5F7F4]">
                        {excelPreview?.summary.validItemCount ?? 0} SKUs
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#292E2A]/50">
                      <span className="text-[#A5AEA8]">Units Added:</span>
                      <span className="font-mono font-bold text-[#71D88A]">
                        +{formatNumber(excelPreview?.summary.totalIncomingUnits)} units
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#292E2A]/50">
                      <span className="text-[#A5AEA8]">Destination Warehouse:</span>
                      <span className="font-semibold text-[#F5F7F4]">
                        {warehouses.find((w) => w.id === Number(excelWarehouseId))?.name || 'Central Warehouse'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#A5AEA8]">Date & Time:</span>
                      <span className="text-[#A5AEA8]">
                        {formatDate(new Date().toISOString())}
                      </span>
                    </div>
                  </div>

                  {/* Result Buttons */}
                  <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
                    {createdReceiptId && (
                      <Link
                        to={`/inventory/stock-inward/${createdReceiptId}`}
                        onClick={() => setExcelModalOpen(false)}
                        className="px-4 py-2.5 bg-[#B8F23A] hover:bg-[#A6DD34] text-[#101312] font-bold text-xs rounded-lg transition-colors"
                      >
                        View Stock Receipt →
                      </Link>
                    )}

                    <Link
                      to="/inventory/stock"
                      onClick={() => setExcelModalOpen(false)}
                      className="px-4 py-2.5 bg-[#1B1F1D] hover:bg-[#252B28] text-[#F5F7F4] border border-[#292E2A] rounded-lg text-xs font-semibold transition-colors"
                    >
                      View Stock Ledger
                    </Link>

                    <Link
                      to="/inventory/intelligence"
                      onClick={() => setExcelModalOpen(false)}
                      className="px-4 py-2.5 bg-[#1B1F1D] hover:bg-[#252B28] text-[#B8F23A] border border-[#334D2E] rounded-lg text-xs font-semibold transition-colors"
                    >
                      View Stock Intelligence
                    </Link>

                    <button
                      onClick={() => setExcelModalOpen(false)}
                      className="px-4 py-2.5 bg-[#121413] hover:bg-[#1A1D1B] text-[#A5AEA8] border border-[#292E2A] rounded-lg text-xs font-medium transition-colors"
                    >
                      Back to Stock Inward
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
