import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  api,
  StockIntelligenceResponse,
  StockIntelligenceItem,
  Warehouse,
  StockDemandAnalysis,
  StockSalesVelocity,
  StockCoverageAnalysis,
  StockRestockRecommendation,
  StockIncomingImpact,
  StockOverstockItem,
} from '../../api';
import { Pagination } from '../../components/Pagination';
import {
  Search,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  PackageX,
  PackageCheck,
  Boxes,
  ArrowRight,
  FileText,
  Warehouse as WarehouseIcon,
  Sparkles,
  Zap,
  Info,
  Clock,
  ExternalLink,
  Calendar,
  Layers,
  ShieldAlert,
  BarChart3,
  TrendingUp as VelocityIcon,
} from 'lucide-react';

const PAGE_SIZE = 20;

type TabType =
  | 'overview'
  | 'demand'
  | 'velocity'
  | 'coverage'
  | 'recommendations'
  | 'incoming'
  | 'overstock';

function formatCurrency(val: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function TrendBadge({ trend }: { trend: string }) {
  if (trend === 'INCREASING') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#1B2E1E] text-[#4ADE80] border border-[#2B5230] rounded-md text-[11px] font-semibold">
        <TrendingUp className="w-3 h-3 text-[#4ADE80]" />
        Increasing
      </span>
    );
  }
  if (trend === 'DECREASING') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#2D1616] text-[#F87171] border border-[#572727] rounded-md text-[11px] font-semibold">
        <TrendingDown className="w-3 h-3 text-[#F87171]" />
        Decreasing
      </span>
    );
  }
  if (trend === 'STABLE') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#17202A] text-[#60A5FA] border border-[#233547] rounded-md text-[11px] font-semibold">
        <Minus className="w-3 h-3 text-[#60A5FA]" />
        Stable
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#1D211E] text-[#A5AEA8] border border-[#292E2A] rounded-md text-[11px] font-medium">
      No Recent Demand
    </span>
  );
}

function RecommendationBadge({ recommendation }: { recommendation: string }) {
  if (recommendation === 'RESTOCK_NOW' || recommendation === 'OUT_OF_STOCK') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#2D1616] text-[#F87171] border border-[#572727] rounded-md text-[11.5px] font-semibold">
        <AlertTriangle className="w-3.5 h-3.5" />
        Restock Now
      </span>
    );
  }
  if (recommendation === 'RESTOCK_SOON') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#2B2414] text-[#FBBF24] border border-[#524320] rounded-md text-[11.5px] font-semibold">
        <Zap className="w-3.5 h-3.5" />
        Restock Soon
      </span>
    );
  }
  if (recommendation === 'MONITOR') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#17202A] text-[#60A5FA] border border-[#233547] rounded-md text-[11.5px] font-medium">
        <Clock className="w-3.5 h-3.5" />
        Monitor
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#1B2E1E] text-[#4ADE80] border border-[#2B5230] rounded-md text-[11.5px] font-medium">
      <CheckCircle2 className="w-3.5 h-3.5" />
      Sufficient Stock
    </span>
  );
}

function StockStatusBadge({ status }: { status: string }) {
  if (status === 'out_of_stock' || status === 'OUT OF STOCK') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#2D1616] text-[#F87171] border border-[#572727] rounded text-[11px] font-semibold">
        Out of Stock
      </span>
    );
  }
  if (status === 'critical' || status === 'CRITICAL') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#2B2414] text-[#FBBF24] border border-[#524320] rounded text-[11px] font-semibold">
        Critical
      </span>
    );
  }
  if (status === 'low_stock' || status === 'LOW') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#2A2B14] text-[#EAB308] border border-[#4A4B20] rounded text-[11px] font-medium">
        Low Stock
      </span>
    );
  }
  if (status === 'OVERSTOCKED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#1C2035] text-[#818CF8] border border-[#313860] rounded text-[11px] font-semibold">
        Overstocked
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#1B2E1E] text-[#4ADE80] border border-[#2B5230] rounded text-[11px] font-medium">
      Healthy
    </span>
  );
}

export default function StockIntelligence() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const [data, setData] = useState<StockIntelligenceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter States
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [dateRangePreset, setDateRangePreset] = useState<string>('30');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [recommendationFilter, setRecommendationFilter] = useState<string>('all');

  // Pagination & Detail Drawer
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<StockIntelligenceItem | null>(null);

  const fetchIntelligence = async () => {
    setLoading(true);
    setError('');
    try {
      const isCustom = dateRangePreset === 'custom';
      const periodDays = !isCustom ? Number(dateRangePreset) : undefined;
      const res = await api.inventory.getStockIntelligence({
        warehouseId: selectedWarehouseId ? Number(selectedWarehouseId) : undefined,
        period: periodDays,
        start: isCustom && customStart ? customStart : undefined,
        end: isCustom && customEnd ? customEnd : undefined,
      });
      setData(res);
    } catch (err: any) {
      console.error('Failed to load stock intelligence:', err);
      setError(err.message || 'Failed to load stock intelligence analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntelligence();
  }, [selectedWarehouseId, dateRangePreset]);

  const handleApplyCustomDates = () => {
    if (dateRangePreset === 'custom') {
      fetchIntelligence();
    }
  };

  // Filtered Overview Products
  const filteredProducts = useMemo(() => {
    if (!data?.products) return [];

    return data.products.filter((p) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesPart = p.partNo.toLowerCase().includes(q);
        const matchesDesc = p.description.toLowerCase().includes(q);
        if (!matchesPart && !matchesDesc) return false;
      }

      if (statusFilter !== 'all') {
        if (p.stockStatus !== statusFilter) return false;
      }

      if (recommendationFilter !== 'all') {
        if (recommendationFilter === 'needs_restock') {
          if (p.recommendation !== 'RESTOCK_NOW' && p.recommendation !== 'RESTOCK_SOON') return false;
        } else if (p.recommendation !== recommendationFilter) {
          return false;
        }
      }

      return true;
    });
  }, [data?.products, searchQuery, statusFilter, recommendationFilter]);

  // Pagination Slice
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE) || 1;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, recommendationFilter, selectedWarehouseId, dateRangePreset, activeTab]);

  if (loading && !data) {
    return (
      <div className="p-8 max-w-[1400px] mx-auto text-center space-y-4 text-[#A5AEA8]">
        <div className="animate-spin w-8 h-8 border-2 border-[#B8F23A] border-t-transparent rounded-full mx-auto" />
        <p className="text-sm font-medium">Analyzing stock velocity & replenishment models...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#292E2A] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#F5F7F4]">Stock Intelligence</h1>
            <span className="px-2.5 py-0.5 bg-[#1D2B1B] text-[#B8F23A] border border-[#334D2E] rounded-md text-xs font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Automated Analysis
            </span>
          </div>
          <p className="text-xs text-[#A5AEA8] mt-1">
            Real-time demand trends, stock coverage, and automatic replenishment recommendations calculated from live transactions.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Warehouse Selector */}
          <div className="flex items-center gap-2 bg-[#171918] border border-[#292E2A] px-3 py-1.5 rounded-lg">
            <WarehouseIcon className="w-4 h-4 text-[#A5AEA8]" />
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="bg-transparent text-xs text-[#F5F7F4] focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-[#171918] text-[#F5F7F4]">All Warehouses</option>
              {data?.warehouses?.map((w) => (
                <option key={w.id} value={w.id} className="bg-[#171918] text-[#F5F7F4]">
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-2 bg-[#171918] border border-[#292E2A] px-3 py-1.5 rounded-lg">
            <Calendar className="w-4 h-4 text-[#A5AEA8]" />
            <select
              value={dateRangePreset}
              onChange={(e) => setDateRangePreset(e.target.value)}
              className="bg-transparent text-xs text-[#F5F7F4] focus:outline-none cursor-pointer"
            >
              <option value="30" className="bg-[#171918] text-[#F5F7F4]">Last 30 Days</option>
              <option value="60" className="bg-[#171918] text-[#F5F7F4]">Last 60 Days</option>
              <option value="90" className="bg-[#171918] text-[#F5F7F4]">Last 90 Days</option>
              <option value="180" className="bg-[#171918] text-[#F5F7F4]">Last 6 Months (180d)</option>
              <option value="365" className="bg-[#171918] text-[#F5F7F4]">This Year (365d)</option>
              <option value="custom" className="bg-[#171918] text-[#F5F7F4]">Custom Date Range</option>
            </select>
          </div>

          {dateRangePreset === 'custom' && (
            <div className="flex items-center gap-2 bg-[#171918] border border-[#292E2A] p-1.5 rounded-lg">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-[#101312] text-xs text-[#F5F7F4] border border-[#292E2A] rounded px-2 py-1 focus:outline-none"
              />
              <span className="text-xs text-[#A5AEA8]">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-[#101312] text-xs text-[#F5F7F4] border border-[#292E2A] rounded px-2 py-1 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleApplyCustomDates}
                className="px-2.5 py-1 bg-[#1D2B1B] hover:bg-[#273B24] text-[#B8F23A] border border-[#334D2E] rounded text-xs font-semibold"
              >
                Apply
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={fetchIntelligence}
            className="p-2 bg-[#171918] hover:bg-[#1D211E] text-[#A5AEA8] hover:text-[#F5F7F4] border border-[#292E2A] rounded-lg transition-colors"
            title="Refresh Analysis"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[#2D1616] border border-[#572727] rounded-xl text-xs text-[#F87171] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchIntelligence}
            className="px-3 py-1 bg-[#572727] hover:bg-[#723232] text-[#F5F7F4] rounded-md font-medium text-[11px]"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Section */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-[#171918] border border-[#292E2A] rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-[#A5AEA8]">
            <span>Total Tracked</span>
            <Boxes className="w-4 h-4 text-[#A5AEA8]" />
          </div>
          <p className="text-xl font-bold font-mono text-[#F5F7F4]">{data?.summary.totalProducts ?? 0}</p>
          <p className="text-[11px] text-[#6D756F]">{data?.summary.totalOnHand ?? 0} total units on hand</p>
        </div>

        <div className="p-4 bg-[#171918] border border-[#292E2A] rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-[#A5AEA8]">
            <span>With Stock</span>
            <PackageCheck className="w-4 h-4 text-[#4ADE80]" />
          </div>
          <p className="text-xl font-bold font-mono text-[#4ADE80]">{data?.summary.withStock ?? 0}</p>
          <p className="text-[11px] text-[#6D756F]">{data?.summary.totalAvailable ?? 0} units available</p>
        </div>

        <div className="p-4 bg-[#171918] border border-[#292E2A] rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-[#A5AEA8]">
            <span>Low Stock</span>
            <AlertTriangle className="w-4 h-4 text-[#EAB308]" />
          </div>
          <p className="text-xl font-bold font-mono text-[#EAB308]">{data?.summary.lowStock ?? 0}</p>
          <p className="text-[11px] text-[#6D756F]">Approaching reorder point</p>
        </div>

        <div className="p-4 bg-[#171918] border border-[#292E2A] rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-[#A5AEA8]">
            <span>Critical Stock</span>
            <Zap className="w-4 h-4 text-[#FBBF24]" />
          </div>
          <p className="text-xl font-bold font-mono text-[#FBBF24]">{data?.summary.criticalStock ?? 0}</p>
          <p className="text-[11px] text-[#6D756F]">Below critical threshold</p>
        </div>

        <div className="p-4 bg-[#171918] border border-[#292E2A] rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-[#A5AEA8]">
            <span>Out of Stock</span>
            <PackageX className="w-4 h-4 text-[#F87171]" />
          </div>
          <p className="text-xl font-bold font-mono text-[#F87171]">{data?.summary.outOfStock ?? 0}</p>
          <p className="text-[11px] text-[#6D756F]">Zero available inventory</p>
        </div>

        <div className="p-4 bg-[#171918] border border-[#334D2E] shadow-[inset_0_1px_0_#B8F23A] rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-[#B8F23A]">
            <span className="font-semibold">Needs Restock</span>
            <Sparkles className="w-4 h-4 text-[#B8F23A]" />
          </div>
          <p className="text-xl font-bold font-mono text-[#B8F23A]">{data?.summary.needsRestock ?? 0}</p>
          <p className="text-[11px] text-[#A5AEA8]">Action recommended</p>
        </div>
      </div>

      {/* Navigation Section Tabs */}
      <div className="flex items-center gap-1 border-b border-[#292E2A] overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'overview'
              ? 'bg-[#171918] text-[#B8F23A] border-t border-l border-r border-[#292E2A] border-b-transparent shadow-sm'
              : 'text-[#A5AEA8] hover:text-[#F5F7F4] hover:bg-[#101312]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('demand')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'demand'
              ? 'bg-[#171918] text-[#B8F23A] border-t border-l border-r border-[#292E2A] border-b-transparent shadow-sm'
              : 'text-[#A5AEA8] hover:text-[#F5F7F4] hover:bg-[#101312]'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Demand Analysis</span>
          <span className="px-1.5 py-0.2 bg-[#101312] text-[#A5AEA8] text-[10px] rounded border border-[#292E2A]">
            {data?.demand?.length ?? 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('velocity')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'velocity'
              ? 'bg-[#171918] text-[#B8F23A] border-t border-l border-r border-[#292E2A] border-b-transparent shadow-sm'
              : 'text-[#A5AEA8] hover:text-[#F5F7F4] hover:bg-[#101312]'
          }`}
        >
          <VelocityIcon className="w-4 h-4" />
          <span>Sales Velocity</span>
          <span className="px-1.5 py-0.2 bg-[#101312] text-[#A5AEA8] text-[10px] rounded border border-[#292E2A]">
            {data?.velocity?.length ?? 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('coverage')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'coverage'
              ? 'bg-[#171918] text-[#B8F23A] border-t border-l border-r border-[#292E2A] border-b-transparent shadow-sm'
              : 'text-[#A5AEA8] hover:text-[#F5F7F4] hover:bg-[#101312]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Stock Coverage</span>
          <span className="px-1.5 py-0.2 bg-[#101312] text-[#A5AEA8] text-[10px] rounded border border-[#292E2A]">
            {data?.coverage?.length ?? 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('recommendations')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'recommendations'
              ? 'bg-[#171918] text-[#B8F23A] border-t border-l border-r border-[#292E2A] border-b-transparent shadow-sm'
              : 'text-[#A5AEA8] hover:text-[#F5F7F4] hover:bg-[#101312]'
          }`}
        >
          <Zap className="w-4 h-4 text-[#FBBF24]" />
          <span>Restock Recommendations</span>
          <span className="px-1.5 py-0.2 bg-[#2B2414] text-[#FBBF24] font-mono text-[10px] rounded border border-[#524320]">
            {data?.recommendations?.length ?? 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('incoming')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'incoming'
              ? 'bg-[#171918] text-[#B8F23A] border-t border-l border-r border-[#292E2A] border-b-transparent shadow-sm'
              : 'text-[#A5AEA8] hover:text-[#F5F7F4] hover:bg-[#101312]'
          }`}
        >
          <Layers className="w-4 h-4 text-[#60A5FA]" />
          <span>Incoming Impact</span>
          <span className="px-1.5 py-0.2 bg-[#101312] text-[#A5AEA8] text-[10px] rounded border border-[#292E2A]">
            {data?.incomingImpact?.length ?? 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('overstock')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'overstock'
              ? 'bg-[#171918] text-[#B8F23A] border-t border-l border-r border-[#292E2A] border-b-transparent shadow-sm'
              : 'text-[#A5AEA8] hover:text-[#F5F7F4] hover:bg-[#101312]'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-[#818CF8]" />
          <span>Overstock Detection</span>
          <span className="px-1.5 py-0.2 bg-[#101312] text-[#A5AEA8] text-[10px] rounded border border-[#292E2A]">
            {data?.overstock?.length ?? 0}
          </span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stock Health Breakdown Filter Strip */}
          <div className="p-4 bg-[#171918] border border-[#292E2A] rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#F5F7F4] uppercase tracking-wider">
                Stock Health Breakdown:
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setStatusFilter(statusFilter === 'healthy' ? 'all' : 'healthy')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  statusFilter === 'healthy'
                    ? 'bg-[#1B2E1E] text-[#4ADE80] border-[#2B5230]'
                    : 'bg-[#101312] text-[#A5AEA8] border-[#292E2A] hover:text-[#F5F7F4]'
                }`}
              >
                Healthy ({data?.health.healthy ?? 0})
              </button>
              <button
                onClick={() => setStatusFilter(statusFilter === 'low_stock' ? 'all' : 'low_stock')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  statusFilter === 'low_stock'
                    ? 'bg-[#2A2B14] text-[#EAB308] border-[#4A4B20]'
                    : 'bg-[#101312] text-[#A5AEA8] border-[#292E2A] hover:text-[#F5F7F4]'
                }`}
              >
                Low Stock ({data?.health.low ?? 0})
              </button>
              <button
                onClick={() => setStatusFilter(statusFilter === 'critical' ? 'all' : 'critical')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  statusFilter === 'critical'
                    ? 'bg-[#2B2414] text-[#FBBF24] border-[#524320]'
                    : 'bg-[#101312] text-[#A5AEA8] border-[#292E2A] hover:text-[#F5F7F4]'
                }`}
              >
                Critical ({data?.health.critical ?? 0})
              </button>
              <button
                onClick={() => setStatusFilter(statusFilter === 'out_of_stock' ? 'all' : 'out_of_stock')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  statusFilter === 'out_of_stock'
                    ? 'bg-[#2D1616] text-[#F87171] border-[#572727]'
                    : 'bg-[#101312] text-[#A5AEA8] border-[#292E2A] hover:text-[#F5F7F4]'
                }`}
              >
                Out of Stock ({data?.health.outOfStock ?? 0})
              </button>
              <Link
                to="/inventory/stock"
                className="px-3 py-1.5 rounded-lg border border-[#292E2A] bg-[#1D211E] text-xs font-medium text-[#A5AEA8] hover:text-[#F5F7F4] flex items-center gap-1"
              >
                <span>View Stock Ledger</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A5AEA8]" />
              <input
                type="text"
                placeholder="Search part number or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#171918] border border-[#292E2A] rounded-lg pl-9 pr-4 py-2 text-xs text-[#F5F7F4] placeholder-[#6D756F] focus:outline-none focus:border-[#B8F23A]"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xs text-[#A5AEA8] shrink-0">Recommendation:</span>
              <select
                value={recommendationFilter}
                onChange={(e) => setRecommendationFilter(e.target.value)}
                className="bg-[#171918] border border-[#292E2A] text-xs text-[#F5F7F4] px-3 py-2 rounded-lg focus:outline-none cursor-pointer"
              >
                <option value="all">All Recommendations</option>
                <option value="needs_restock">Restock Required (Now / Soon)</option>
                <option value="RESTOCK_NOW">Restock Now</option>
                <option value="RESTOCK_SOON">Restock Soon</option>
                <option value="MONITOR">Monitor</option>
                <option value="NO_ACTION">Sufficient Stock</option>
              </select>
            </div>
          </div>

          {/* Primary ERP Intelligence Table */}
          <div className="bg-[#171918] border border-[#292E2A] rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#101312] border-b border-[#292E2A] text-[11px] font-semibold text-[#A5AEA8] uppercase tracking-wider">
                    <th className="py-3 px-4">Part No / Description</th>
                    <th className="py-3 px-3 text-right">Available</th>
                    <th className="py-3 px-3 text-right">Reserved</th>
                    <th className="py-3 px-3 text-right">Incoming</th>
                    <th className="py-3 px-3 text-right">Units Sold</th>
                    <th className="py-3 px-3 text-right">Monthly Use</th>
                    <th className="py-3 px-3 text-right">Days Stock</th>
                    <th className="py-3 px-3 text-center">Trend</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Recommendation</th>
                    <th className="py-3 px-3 text-right">Suggested Restock</th>
                    <th className="py-3 px-4 text-center">Actions & Links</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#292E2A] text-xs text-[#F5F7F4]">
                  {paginatedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-[#A5AEA8]">
                        No product intelligence data matches your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedProducts.map((p) => (
                      <tr
                        key={p.productId}
                        onClick={() => setSelectedProduct(p)}
                        className="hover:bg-[#1D211E]/60 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <span className="font-mono font-bold text-[#F5F7F4]">{p.partNo}</span>
                            <p className="text-[11.5px] text-[#A5AEA8] line-clamp-1">{p.description}</p>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-[#F5F7F4]">
                          {p.available} {p.unit}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[#A5AEA8]">
                          {p.reserved > 0 ? (
                            <span className="text-[#FBBF24] font-semibold">{p.reserved}</span>
                          ) : (
                            '0'
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[#60A5FA]">
                          {p.incoming > 0 ? `+${p.incoming}` : '0'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[#F5F7F4]">
                          {p.unitsSoldRecent}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[#A5AEA8]">
                          {p.monthlyConsumption} /mo
                        </td>
                        <td className="py-3 px-3 text-right font-mono">
                          {p.daysOfStockRemaining !== null ? (
                            <span
                              className={`font-semibold ${
                                p.daysOfStockRemaining <= 7
                                  ? 'text-[#F87171]'
                                  : p.daysOfStockRemaining <= 15
                                  ? 'text-[#FBBF24]'
                                  : 'text-[#4ADE80]'
                              }`}
                            >
                              {p.daysOfStockRemaining}d
                            </span>
                          ) : (
                            <span className="text-[#6D756F]">No demand</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <TrendBadge trend={p.demandTrend} />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <StockStatusBadge status={p.stockStatus} />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <RecommendationBadge recommendation={p.recommendation} />
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold">
                          {p.suggestedRestockQty > 0 ? (
                            <span className="text-[#B8F23A]">+{p.suggestedRestockQty}</span>
                          ) : (
                            <span className="text-[#6D756F]">0</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setSelectedProduct(p)}
                              className="px-2 py-1 bg-[#1D211E] hover:bg-[#292E2A] text-[#F5F7F4] rounded text-[11px] font-medium"
                              title="View full intelligence analysis"
                            >
                              Details
                            </button>
                            <Link
                              to={`/inventory/stock?productId=${p.productId}`}
                              className="px-2 py-1 bg-[#101312] hover:bg-[#191D1A] text-[#60A5FA] border border-[#233547] rounded text-[11px] font-medium flex items-center gap-0.5"
                              title="View stock ledger entries"
                            >
                              <span>Stock</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                            <Link
                              to={`/sale-reports?productId=${p.productId}`}
                              className="px-2 py-1 bg-[#101312] hover:bg-[#191D1A] text-[#A5AEA8] border border-[#292E2A] rounded text-[11px] font-medium flex items-center gap-0.5"
                              title="View sales reports for this product"
                            >
                              <span>Sales</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                            {(p.recommendation === 'RESTOCK_NOW' || p.recommendation === 'RESTOCK_SOON' || p.suggestedRestockQty > 0) && (
                              <button
                                type="button"
                                onClick={() => navigate(`/inventory/stock-inward?productId=${p.productId}`)}
                                className="px-2 py-1 bg-[#1D2B1B] hover:bg-[#273B24] text-[#B8F23A] border border-[#334D2E] rounded text-[11px] font-semibold flex items-center gap-0.5"
                              >
                                <span>Restock</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {filteredProducts.length > 0 && (
              <div className="p-4 border-t border-[#292E2A] bg-[#101312]">
                <Pagination
                  page={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>

          {/* Sales Impact Section: Recent Confirmed Sale Reports */}
          {data?.recentSales && data.recentSales.length > 0 && (
            <div className="bg-[#171918] border border-[#292E2A] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#292E2A] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#F5F7F4] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#B8F23A]" />
                    Recent Sales Impact (Confirmed Sale Reports)
                  </h3>
                  <p className="text-xs text-[#A5AEA8] mt-0.5">
                    Physical stock dispatches automatically recorded by recent confirmed Sale Reports.
                  </p>
                </div>
                <Link
                  to="/sale-reports"
                  className="text-xs font-semibold text-[#B8F23A] hover:underline flex items-center gap-1"
                >
                  <span>View All Sale Reports</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.recentSales.map((s) => (
                  <Link
                    key={s.id}
                    to={`/sale-reports/${s.id}`}
                    className="p-3.5 bg-[#101312] border border-[#292E2A] hover:border-[#334D2E] rounded-lg space-y-2 transition-all group"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-[#B8F23A] group-hover:underline">
                        #{s.report_number}
                      </span>
                      <span className="text-[#A5AEA8]">{formatDate(s.sale_date)}</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#F5F7F4] line-clamp-1">{s.company_name}</p>
                      <p className="text-[11px] text-[#A5AEA8]">{s.warehouse_name || 'Warehouse'}</p>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-[#292E2A]">
                      <span className="text-[#A5AEA8]">
                        {s.product_count} line items ({s.total_quantity} units)
                      </span>
                      <span className="font-mono font-bold text-[#F5F7F4]">
                        {formatCurrency(s.total_amount)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DEMAND ANALYSIS */}
      {activeTab === 'demand' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#171918] border border-[#292E2A] rounded-xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#F5F7F4] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#B8F23A]" />
                Product Demand Analysis
              </h3>
              <p className="text-xs text-[#A5AEA8] mt-0.5">
                Evaluation of product popularity, total units sold, customer reach, and revenue contribution.
              </p>
            </div>
            <span className="text-xs font-mono text-[#B8F23A] bg-[#1D2B1B] px-3 py-1 rounded-lg border border-[#334D2E]">
              {data?.demand?.length ?? 0} Products Analyzed
            </span>
          </div>

          <div className="bg-[#171918] border border-[#292E2A] rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#101312] border-b border-[#292E2A] text-[11px] font-semibold text-[#A5AEA8] uppercase tracking-wider">
                    <th className="py-3 px-4">Part No / Description</th>
                    <th className="py-3 px-3 text-right">Units Sold</th>
                    <th className="py-3 px-3 text-right">Sales Count</th>
                    <th className="py-3 px-3 text-right">Customers</th>
                    <th className="py-3 px-3 text-right">Total Revenue</th>
                    <th className="py-3 px-3 text-right">Avg Selling Price</th>
                    <th className="py-3 px-3 text-center">First / Last Sale</th>
                    <th className="py-3 px-3 text-center">Demand Classification</th>
                    <th className="py-3 px-4 text-center">Cross-Module Links</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#292E2A] text-xs text-[#F5F7F4]">
                  {!data?.demand || data.demand.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-[#A5AEA8]">
                        No demand data recorded in the selected period.
                      </td>
                    </tr>
                  ) : (
                    data.demand.map((d) => (
                      <tr key={d.productId} className="hover:bg-[#1D211E]/60 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-[#F5F7F4]">{d.partNo}</span>
                          <p className="text-[11.5px] text-[#A5AEA8] line-clamp-1">{d.description}</p>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-[#B8F23A]">
                          {d.unitsSold}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[#F5F7F4]">
                          {d.salesCount}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[#60A5FA]">
                          {d.customerCount}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[#F5F7F4]">
                          {formatCurrency(d.revenue)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[#A5AEA8]">
                          {formatCurrency(d.avgSellingPrice)}
                        </td>
                        <td className="py-3 px-3 text-center text-[11px] text-[#A5AEA8]">
                          <div>{formatDate(d.lastSaleDate)}</div>
                          <div className="text-[10px] text-[#6D756F]">First: {formatDate(d.firstSaleDate)}</div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                              d.demandClassification === 'HIGH DEMAND'
                                ? 'bg-[#1B2E1E] text-[#4ADE80] border border-[#2B5230]'
                                : d.demandClassification === 'MEDIUM DEMAND'
                                ? 'bg-[#17202A] text-[#60A5FA] border border-[#233547]'
                                : d.demandClassification === 'LOW DEMAND'
                                ? 'bg-[#2B2414] text-[#FBBF24] border border-[#524320]'
                                : 'bg-[#101312] text-[#A5AEA8] border border-[#292E2A]'
                            }`}
                          >
                            {d.demandClassification}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const found = data.products.find((p) => p.productId === d.productId);
                                if (found) setSelectedProduct(found);
                              }}
                              className="text-[11px] font-semibold text-[#B8F23A] hover:underline"
                            >
                              View Product Intelligence →
                            </button>
                            <Link
                              to={`/inventory/stock?productId=${d.productId}`}
                              className="text-[11px] text-[#60A5FA] hover:underline"
                            >
                              View Stock →
                            </Link>
                            <Link
                              to={`/sale-reports?productId=${d.productId}`}
                              className="text-[11px] text-[#A5AEA8] hover:underline"
                            >
                              View Sales →
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SALES VELOCITY */}
      {activeTab === 'velocity' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#171918] border border-[#292E2A] rounded-xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#F5F7F4] flex items-center gap-2">
                <VelocityIcon className="w-4 h-4 text-[#B8F23A]" />
                Sales Velocity & Run Rate Analysis
              </h3>
              <p className="text-xs text-[#A5AEA8] mt-0.5">
                Daily, weekly, and monthly run rates calculated from confirmed sales transactions.
              </p>
            </div>
            <span className="text-xs font-mono text-[#B8F23A] bg-[#1D2B1B] px-3 py-1 rounded-lg border border-[#334D2E]">
              {data?.velocity?.length ?? 0} Products Analyzed
            </span>
          </div>

          <div className="bg-[#171918] border border-[#292E2A] rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#101312] border-b border-[#292E2A] text-[11px] font-semibold text-[#A5AEA8] uppercase tracking-wider">
                    <th className="py-3 px-4">Part No / Description</th>
                    <th className="py-3 px-3 text-right">Available Stock</th>
                    <th className="py-3 px-3 text-right">30-Day Sales</th>
                    <th className="py-3 px-3 text-right">Daily Velocity</th>
                    <th className="py-3 px-3 text-right">Weekly Run Rate</th>
                    <th className="py-3 px-3 text-right">Monthly Consumption</th>
                    <th className="py-3 px-3 text-center">Trend</th>
                    <th className="py-3 px-3 text-center">Velocity Classification</th>
                    <th className="py-3 px-4 text-center">Cross-Module Links</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#292E2A] text-xs text-[#F5F7F4]">
                  {!data?.velocity || data.velocity.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-[#A5AEA8]">
                        No sales velocity data recorded in the selected period.
                      </td>
                    </tr>
                  ) : (
                    data.velocity.map((v) => (
                      <tr key={v.productId} className="hover:bg-[#1D211E]/60 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-[#F5F7F4]">{v.partNo}</span>
                          <p className="text-[11.5px] text-[#A5AEA8] line-clamp-1">{v.description}</p>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[#F5F7F4]">
                          {v.currentAvailableStock}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[#B8F23A] font-bold">
                          {v.unitsSold30Day}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[#4ADE80] font-semibold">
                          {v.dailyVelocity} /day
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[#60A5FA]">
                          {v.weeklyVelocity} /wk
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[#F5F7F4]">
                          {v.monthlyVelocity} /mo
                        </td>
                        <td className="py-3 px-3 text-center">
                          <TrendBadge trend={v.trend} />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                              v.velocityStatus === 'FAST_MOVING'
                                ? 'bg-[#1B2E1E] text-[#4ADE80] border border-[#2B5230]'
                                : v.velocityStatus === 'MODERATE_MOVING'
                                ? 'bg-[#17202A] text-[#60A5FA] border border-[#233547]'
                                : v.velocityStatus === 'SLOW_MOVING'
                                ? 'bg-[#2B2414] text-[#FBBF24] border border-[#524320]'
                                : 'bg-[#101312] text-[#A5AEA8] border border-[#292E2A]'
                            }`}
                          >
                            {v.velocityStatus.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const found = data.products.find((p) => p.productId === v.productId);
                                if (found) setSelectedProduct(found);
                              }}
                              className="text-[11px] font-semibold text-[#B8F23A] hover:underline"
                            >
                              View Product Intelligence →
                            </button>
                            <Link
                              to={`/inventory/stock?productId=${v.productId}`}
                              className="text-[11px] text-[#60A5FA] hover:underline"
                            >
                              View Stock →
                            </Link>
                            <Link
                              to={`/sale-reports?productId=${v.productId}`}
                              className="text-[11px] text-[#A5AEA8] hover:underline"
                            >
                              View Sales →
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STOCK COVERAGE */}
      {activeTab === 'coverage' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#171918] border border-[#292E2A] rounded-xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#F5F7F4] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#B8F23A]" />
                Stock Coverage Analysis (Days of Inventory)
              </h3>
              <p className="text-xs text-[#A5AEA8] mt-0.5">
                Projected days remaining before stockout based on available inventory and current daily sales velocity.
              </p>
            </div>
            <span className="text-xs font-mono text-[#B8F23A] bg-[#1D2B1B] px-3 py-1 rounded-lg border border-[#334D2E]">
              {data?.coverage?.length ?? 0} Products Tracked
            </span>
          </div>

          <div className="bg-[#171918] border border-[#292E2A] rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#101312] border-b border-[#292E2A] text-[11px] font-semibold text-[#A5AEA8] uppercase tracking-wider">
                    <th className="py-3 px-4">Part No / Description</th>
                    <th className="py-3 px-3 text-right">On Hand</th>
                    <th className="py-3 px-3 text-right">Reserved</th>
                    <th className="py-3 px-3 text-right">Available Stock</th>
                    <th className="py-3 px-3 text-right">Incoming</th>
                    <th className="py-3 px-3 text-right">Daily Velocity</th>
                    <th className="py-3 px-3 text-right">Days of Stock</th>
                    <th className="py-3 px-3 text-center">Coverage Status</th>
                    <th className="py-3 px-4 text-center">Cross-Module Links</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#292E2A] text-xs text-[#F5F7F4]">
                  {!data?.coverage || data.coverage.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-[#A5AEA8]">
                        No stock coverage data available.
                      </td>
                    </tr>
                  ) : (
                    data.coverage.map((c) => (
                      <tr key={c.productId} className="hover:bg-[#1D211E]/60 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-[#F5F7F4]">{c.partNo}</span>
                          <p className="text-[11.5px] text-[#A5AEA8] line-clamp-1">{c.description}</p>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[#A5AEA8]">
                          {c.onHand}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[#FBBF24]">
                          {c.reserved > 0 ? c.reserved : '0'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-[#F5F7F4]">
                          {c.availableStock}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[#60A5FA]">
                          {c.incoming > 0 ? `+${c.incoming}` : '0'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[#A5AEA8]">
                          {c.dailyVelocity} /day
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold">
                          {c.coverageDays !== null ? (
                            <span
                              className={
                                c.coverageDays <= 7
                                  ? 'text-[#F87171]'
                                  : c.coverageDays <= 14
                                  ? 'text-[#FBBF24]'
                                  : 'text-[#4ADE80]'
                              }
                            >
                              {c.coverageDays} days
                            </span>
                          ) : (
                            <span className="text-[#6D756F]">No demand</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <StockStatusBadge status={c.coverageStatus} />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const found = data.products.find((p) => p.productId === c.productId);
                                if (found) setSelectedProduct(found);
                              }}
                              className="text-[11px] font-semibold text-[#B8F23A] hover:underline"
                            >
                              View Product Intelligence →
                            </button>
                            <Link
                              to={`/inventory/stock?productId=${c.productId}`}
                              className="text-[11px] text-[#60A5FA] hover:underline"
                            >
                              View Stock →
                            </Link>
                            <Link
                              to={`/sale-reports?productId=${c.productId}`}
                              className="text-[11px] text-[#A5AEA8] hover:underline"
                            >
                              View Sales →
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: RESTOCK RECOMMENDATIONS */}
      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#171918] border border-[#292E2A] rounded-xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#F5F7F4] flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#FBBF24]" />
                Automated Restock Recommendations
              </h3>
              <p className="text-xs text-[#A5AEA8] mt-0.5">
                Replenishment suggestion based on reorder points, lead time (14d), safety stock, and live reservation reserves.
              </p>
            </div>
            <span className="text-xs font-mono text-[#FBBF24] bg-[#2B2414] px-3 py-1 rounded-lg border border-[#524320]">
              {data?.recommendations?.length ?? 0} Recommendations Available
            </span>
          </div>

          <div className="bg-[#171918] border border-[#292E2A] rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#101312] border-b border-[#292E2A] text-[11px] font-semibold text-[#A5AEA8] uppercase tracking-wider">
                    <th className="py-3 px-4">Part No / Description</th>
                    <th className="py-3 px-3 text-right">Available Stock</th>
                    <th className="py-3 px-3 text-right">Reserved</th>
                    <th className="py-3 px-3 text-right">Incoming</th>
                    <th className="py-3 px-3 text-right">Daily Velocity</th>
                    <th className="py-3 px-3 text-right">Reorder Point</th>
                    <th className="py-3 px-3 text-right">Recommended Restock</th>
                    <th className="py-3 px-3 text-center">Priority</th>
                    <th className="py-3 px-3">Reason / Recommendation</th>
                    <th className="py-3 px-4 text-center">Action & Links</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#292E2A] text-xs text-[#F5F7F4]">
                  {!data?.recommendations || data.recommendations.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-[#A5AEA8]">
                        All products have sufficient stock. No replenishment required at this time.
                      </td>
                    </tr>
                  ) : (
                    data.recommendations.map((r) => (
                      <tr key={r.productId} className="hover:bg-[#1D211E]/60 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-[#F5F7F4]">{r.partNo}</span>
                          <p className="text-[11.5px] text-[#A5AEA8] line-clamp-1">{r.description}</p>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-[#F5F7F4]">
                          {r.available}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[#FBBF24]">
                          {r.reserved > 0 ? r.reserved : '0'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[#60A5FA]">
                          {r.incoming > 0 ? `+${r.incoming}` : '0'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[#A5AEA8]">
                          {r.dailyVelocity} /day
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[#FBBF24]">
                          {r.reorderPoint}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-[#B8F23A]">
                          +{r.recommendedQty}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                              r.priority === 'URGENT'
                                ? 'bg-[#2D1616] text-[#F87171] border border-[#572727]'
                                : r.priority === 'HIGH'
                                ? 'bg-[#2B2414] text-[#FBBF24] border border-[#524320]'
                                : r.priority === 'MEDIUM'
                                ? 'bg-[#17202A] text-[#60A5FA] border border-[#233547]'
                                : 'bg-[#101312] text-[#A5AEA8] border border-[#292E2A]'
                            }`}
                          >
                            {r.priority}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[11.5px] text-[#A5AEA8] max-w-xs">
                          {r.reason}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => navigate(`/inventory/stock-inward?productId=${r.productId}`)}
                              className="px-2.5 py-1 bg-[#1D2B1B] hover:bg-[#273B24] text-[#B8F23A] border border-[#334D2E] rounded text-[11px] font-semibold flex items-center gap-1"
                            >
                              <span>Restock Now</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                            <div className="flex items-center gap-2 mt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const found = data.products.find((p) => p.productId === r.productId);
                                  if (found) setSelectedProduct(found);
                                }}
                                className="text-[10.5px] text-[#B8F23A] hover:underline"
                              >
                                View Product Intelligence →
                              </button>
                              <Link
                                to={`/inventory/stock?productId=${r.productId}`}
                                className="text-[10.5px] text-[#60A5FA] hover:underline"
                              >
                                View Stock →
                              </Link>
                              <Link
                                to={`/sale-reports?productId=${r.productId}`}
                                className="text-[10.5px] text-[#A5AEA8] hover:underline"
                              >
                                View Sales →
                              </Link>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: INCOMING STOCK IMPACT */}
      {activeTab === 'incoming' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#171918] border border-[#292E2A] rounded-xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#F5F7F4] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#60A5FA]" />
                Incoming Stock Impact Analysis
              </h3>
              <p className="text-xs text-[#A5AEA8] mt-0.5">
                Evaluation of draft and pending Stock Inwards on inventory coverage days.
              </p>
            </div>
            <span className="text-xs font-mono text-[#60A5FA] bg-[#17202A] px-3 py-1 rounded-lg border border-[#233547]">
              {data?.incomingImpact?.length ?? 0} Products With Pending Deliveries
            </span>
          </div>

          <div className="bg-[#171918] border border-[#292E2A] rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#101312] border-b border-[#292E2A] text-[11px] font-semibold text-[#A5AEA8] uppercase tracking-wider">
                    <th className="py-3 px-4">Part No / Description</th>
                    <th className="py-3 px-3 text-right">Available Stock</th>
                    <th className="py-3 px-3 text-right">Incoming Units</th>
                    <th className="py-3 px-3 text-right">Current Coverage</th>
                    <th className="py-3 px-3 text-right">Projected Coverage</th>
                    <th className="py-3 px-3">Impact Statement</th>
                    <th className="py-3 px-4 text-center">Cross-Module Links</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#292E2A] text-xs text-[#F5F7F4]">
                  {!data?.incomingImpact || data.incomingImpact.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#A5AEA8]">
                        No pending incoming stock receipts recorded.
                      </td>
                    </tr>
                  ) : (
                    data.incomingImpact.map((inc) => (
                      <tr key={inc.productId} className="hover:bg-[#1D211E]/60 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-[#F5F7F4]">{inc.partNo}</span>
                          <p className="text-[11.5px] text-[#A5AEA8] line-clamp-1">{inc.description}</p>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[#F5F7F4]">
                          {inc.available}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-[#60A5FA]">
                          +{inc.incoming}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[#A5AEA8]">
                          {inc.currentCoverageDays !== null ? `${inc.currentCoverageDays}d` : 'No demand'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-[#4ADE80]">
                          {inc.projectedCoverageDays !== null ? `${inc.projectedCoverageDays}d` : 'No demand'}
                        </td>
                        <td className="py-3 px-3 text-[11.5px] text-[#F5F7F4]">
                          {inc.impact}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const found = data.products.find((p) => p.productId === inc.productId);
                                if (found) setSelectedProduct(found);
                              }}
                              className="text-[11px] font-semibold text-[#B8F23A] hover:underline"
                            >
                              View Product Intelligence →
                            </button>
                            <Link
                              to={`/inventory/stock?productId=${inc.productId}`}
                              className="text-[11px] text-[#60A5FA] hover:underline"
                            >
                              View Stock →
                            </Link>
                            <Link
                              to={`/sale-reports?productId=${inc.productId}`}
                              className="text-[11px] text-[#A5AEA8] hover:underline"
                            >
                              View Sales →
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: OVERSTOCK DETECTION */}
      {activeTab === 'overstock' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#171918] border border-[#292E2A] rounded-xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#F5F7F4] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#818CF8]" />
                Overstock & Slow-Moving Stock Detection
              </h3>
              <p className="text-xs text-[#A5AEA8] mt-0.5">
                Identification of products with excessive inventory coverage (&gt;180 days) or dormant sales velocity.
              </p>
            </div>
            <span className="text-xs font-mono text-[#818CF8] bg-[#1C2035] px-3 py-1 rounded-lg border border-[#313860]">
              {data?.overstock?.length ?? 0} Overstocked Products Identified
            </span>
          </div>

          <div className="bg-[#171918] border border-[#292E2A] rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#101312] border-b border-[#292E2A] text-[11px] font-semibold text-[#A5AEA8] uppercase tracking-wider">
                    <th className="py-3 px-4">Part No / Description</th>
                    <th className="py-3 px-3 text-right">Available Stock</th>
                    <th className="py-3 px-3 text-right">Daily Velocity</th>
                    <th className="py-3 px-3 text-right">Coverage Days</th>
                    <th className="py-3 px-3 text-center">Overstock Classification</th>
                    <th className="py-3 px-3">Reason & Strategy</th>
                    <th className="py-3 px-4 text-center">Cross-Module Links</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#292E2A] text-xs text-[#F5F7F4]">
                  {!data?.overstock || data.overstock.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#A5AEA8]">
                        No overstocked or dormant inventory detected.
                      </td>
                    </tr>
                  ) : (
                    data.overstock.map((o) => (
                      <tr key={o.productId} className="hover:bg-[#1D211E]/60 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-[#F5F7F4]">{o.partNo}</span>
                          <p className="text-[11.5px] text-[#A5AEA8] line-clamp-1">{o.description}</p>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-[#818CF8]">
                          {o.availableStock}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[#A5AEA8]">
                          {o.dailyVelocity} /day
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-[#818CF8]">
                          {o.coverageDays !== null ? `${o.coverageDays} days` : 'Dormant'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                              o.overstockType === 'POTENTIAL_OVERSTOCK'
                                ? 'bg-[#1C2035] text-[#818CF8] border border-[#313860]'
                                : 'bg-[#2B2414] text-[#FBBF24] border border-[#524320]'
                            }`}
                          >
                            {o.overstockType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[11.5px] text-[#A5AEA8] max-w-sm">
                          {o.reason}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const found = data.products.find((p) => p.productId === o.productId);
                                if (found) setSelectedProduct(found);
                              }}
                              className="text-[11px] font-semibold text-[#B8F23A] hover:underline"
                            >
                              View Product Intelligence →
                            </button>
                            <Link
                              to={`/inventory/stock?productId=${o.productId}`}
                              className="text-[11px] text-[#60A5FA] hover:underline"
                            >
                              View Stock →
                            </Link>
                            <Link
                              to={`/sale-reports?productId=${o.productId}`}
                              className="text-[11px] text-[#A5AEA8] hover:underline"
                            >
                              View Sales →
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal / Drawer */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#171918] border border-[#292E2A] rounded-xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#292E2A] pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-[#B8F23A]">{selectedProduct.partNo}</span>
                <h2 className="text-lg font-bold text-[#F5F7F4]">{selectedProduct.description}</h2>
                <p className="text-xs text-[#A5AEA8]">Product Intelligence Breakdown & Replenishment Rules</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="p-1 text-[#A5AEA8] hover:text-[#F5F7F4] rounded-lg hover:bg-[#1D211E]"
              >
                ✕
              </button>
            </div>

            {/* Explanation Alert Box */}
            <div className="p-4 bg-[#1D211E] border border-[#334D2E] rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#B8F23A]">
                <Info className="w-4 h-4" />
                <span>WHY THIS PRODUCT NEEDS ATTENTION</span>
              </div>
              <p className="text-xs text-[#F5F7F4] leading-relaxed">
                {selectedProduct.explanation}
              </p>
            </div>

            {/* Stock Snapshot Grid */}
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 bg-[#101312] border border-[#292E2A] rounded-lg space-y-1">
                <span className="text-[11px] text-[#A5AEA8]">On Hand</span>
                <p className="text-base font-bold font-mono text-[#F5F7F4]">{selectedProduct.onHand} {selectedProduct.unit}</p>
              </div>
              <div className="p-3 bg-[#101312] border border-[#292E2A] rounded-lg space-y-1">
                <span className="text-[11px] text-[#A5AEA8]">Reserved</span>
                <p className="text-base font-bold font-mono text-[#FBBF24]">{selectedProduct.reserved} {selectedProduct.unit}</p>
              </div>
              <div className="p-3 bg-[#101312] border border-[#292E2A] rounded-lg space-y-1">
                <span className="text-[11px] text-[#A5AEA8]">Available</span>
                <p className="text-base font-bold font-mono text-[#4ADE80]">{selectedProduct.available} {selectedProduct.unit}</p>
              </div>
              <div className="p-3 bg-[#101312] border border-[#292E2A] rounded-lg space-y-1">
                <span className="text-[11px] text-[#A5AEA8]">Incoming</span>
                <p className="text-base font-bold font-mono text-[#60A5FA]">+{selectedProduct.incoming} {selectedProduct.unit}</p>
              </div>
            </div>

            {/* Demand & Velocity Metrics */}
            <div className="grid grid-cols-2 gap-4 border-t border-b border-[#292E2A] py-4 text-xs space-y-2 sm:space-y-0">
              <div className="space-y-2">
                <h4 className="font-semibold text-[#F5F7F4]">Sales Velocity</h4>
                <div className="flex justify-between py-1 border-b border-[#292E2A]/50">
                  <span className="text-[#A5AEA8]">Daily Velocity:</span>
                  <span className="font-mono font-bold text-[#F5F7F4]">{selectedProduct.dailyVelocity} units/day</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#292E2A]/50">
                  <span className="text-[#A5AEA8]">Monthly Consumption:</span>
                  <span className="font-mono font-bold text-[#F5F7F4]">{selectedProduct.monthlyConsumption} units/mo</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#A5AEA8]">Units Sold ({dateRangePreset}d):</span>
                  <span className="font-mono font-bold text-[#F5F7F4]">{selectedProduct.unitsSoldRecent} units</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-[#F5F7F4]">Coverage & Recommendation</h4>
                <div className="flex justify-between py-1 border-b border-[#292E2A]/50">
                  <span className="text-[#A5AEA8]">Days Stock Remaining:</span>
                  <span className="font-mono font-bold text-[#FBBF24]">
                    {selectedProduct.daysOfStockRemaining !== null ? `${selectedProduct.daysOfStockRemaining} days` : 'No demand'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#292E2A]/50">
                  <span className="text-[#A5AEA8]">Coverage with Incoming:</span>
                  <span className="font-mono font-bold text-[#60A5FA]">
                    {selectedProduct.projectedDaysWithIncoming !== null ? `${selectedProduct.projectedDaysWithIncoming} days` : 'No demand'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#A5AEA8]">Suggested Reorder:</span>
                  <span className="font-mono font-bold text-[#B8F23A]">
                    {selectedProduct.suggestedRestockQty > 0 ? `+${selectedProduct.suggestedRestockQty} units` : '0'}
                  </span>
                </div>
              </div>
            </div>

            {/* Cross-Module Quick Links in Modal */}
            <div className="flex items-center justify-between p-3 bg-[#101312] border border-[#292E2A] rounded-lg">
              <span className="text-xs text-[#A5AEA8]">Quick Cross-Module Navigation:</span>
              <div className="flex items-center gap-2">
                <Link
                  to={`/inventory/stock?productId=${selectedProduct.productId}`}
                  onClick={() => setSelectedProduct(null)}
                  className="px-2.5 py-1 bg-[#171918] hover:bg-[#1D211E] text-[#60A5FA] border border-[#233547] rounded text-xs font-medium flex items-center gap-1"
                >
                  <span>View Stock Ledger</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
                <Link
                  to={`/sale-reports?productId=${selectedProduct.productId}`}
                  onClick={() => setSelectedProduct(null)}
                  className="px-2.5 py-1 bg-[#171918] hover:bg-[#1D211E] text-[#A5AEA8] border border-[#292E2A] rounded text-xs font-medium flex items-center gap-1"
                >
                  <span>View Sale Reports</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 bg-[#101312] border border-[#292E2A] hover:bg-[#1D211E] text-xs text-[#A5AEA8] rounded-lg font-medium"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  const pId = selectedProduct.productId;
                  setSelectedProduct(null);
                  navigate(`/inventory/stock-inward?productId=${pId}`);
                }}
                className="px-4 py-2 bg-[#B8F23A] hover:bg-[#A3D933] text-[#101312] rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#B8F23A]/10"
              >
                <span>Restock Product Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
