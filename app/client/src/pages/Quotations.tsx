import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, Quotation } from '../api';
import { Pagination } from '../components/Pagination';
import { ChevronDown, ChevronUp, Search, X, Filter, RotateCcw } from 'lucide-react';

const PAGE_SIZE = 20;

type DateFilter = 'all' | 'today' | 'week' | 'month';

function getDateRange(filter: DateFilter): { start: string; end: string } | null {
  if (filter === 'all') return null;
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const toStr = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();

  if (filter === 'today') {
    const s = toStr(y, m, d);
    return { start: s, end: s };
  }
  if (filter === 'week') {
    const dayOfWeek = new Date(y, m, d).getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    return { start: toStr(y, m, d - diffToMonday), end: toStr(y, m, d - diffToMonday + 6) };
  }
  const lastDayOfMonth = new Date(y, m + 1, 0).getDate();
  return { start: toStr(y, m, 1), end: toStr(y, m, lastDayOfMonth) };
}

function matchesDate(dateStr: string | null | undefined, range: { start: string; end: string } | null) {
  if (!range) return true;
  if (!dateStr) return false;
  return dateStr >= range.start && dateStr <= range.end;
}

const STAGE_COLORS: Record<string, string> = {
  draft: '#A5AEA8',
  sent: '#708D31',
  accepted: '#B8F23A',
  rejected: '#E25757',
  po_created: '#7E95FF',
  pi_created: '#7E95FF',
};

export default function Quotations() {
  const [rows, setRows] = useState<Quotation[]>([]);
  const [error, setError] = useState('');
  
  // Expandable Search & Filter State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchNumber, setSearchNumber] = useState('');
  const [searchCompany, setSearchCompany] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.quotations.list().then(setRows).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchNumber, searchCompany, statusFilter, dateFilter, minAmount, maxAmount]);

  const filtered = useMemo(() => {
    const qNum = searchNumber.trim().toLowerCase();
    const qComp = searchCompany.trim().toLowerCase();
    const range = getDateRange(dateFilter);
    const minVal = minAmount !== '' ? Number(minAmount) : null;
    const maxVal = maxAmount !== '' ? Number(maxAmount) : null;

    return rows.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (!matchesDate(r.date, range)) return false;
      if (qNum && !(r.number || '').toLowerCase().includes(qNum)) return false;
      if (qComp && !(r.company_name || '').toLowerCase().includes(qComp)) return false;
      if (minVal !== null && !isNaN(minVal) && (r.total || 0) < minVal) return false;
      if (maxVal !== null && !isNaN(maxVal) && (r.total || 0) > maxVal) return false;
      return true;
    });
  }, [rows, searchNumber, searchCompany, statusFilter, dateFilter, minAmount, maxAmount]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );

  const hasSearchFilters =
    searchNumber !== '' ||
    searchCompany !== '' ||
    dateFilter !== 'all' ||
    minAmount !== '' ||
    maxAmount !== '';

  const hasAnyActiveFilters = hasSearchFilters || statusFilter !== '';

  function resetFilters() {
    setSearchNumber('');
    setSearchCompany('');
    setStatusFilter('');
    setDateFilter('all');
    setMinAmount('');
    setMaxAmount('');
  }

  function clearSearchPanelFilters() {
    setSearchNumber('');
    setSearchCompany('');
    setDateFilter('all');
    setMinAmount('');
    setMaxAmount('');
  }

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = { All: rows.length, Draft: 0, Sent: 0, Accepted: 0, Rejected: 0 };
    rows.forEach((r) => {
      if (r.status === 'draft') counts.Draft++;
      else if (r.status === 'sent') counts.Sent++;
      else if (r.status === 'accepted') counts.Accepted++;
      else if (r.status === 'rejected') counts.Rejected++;
    });
    return counts;
  }, [rows]);

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6 bg-[#101312] text-[#F5F7F4] min-h-screen">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="margin-0 text-[34px] font-medium tracking-[-.02em] leading-[1.05]">
            Quotations
          </h1>
          <p className="margin-0 text-[13.5px] text-[#A5AEA8]">
            Every quotation with its stage, value and follow-up position.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={api.export.quotationsUrl(statusFilter ? { status: statusFilter } : undefined)}
            download
            className="h-[34px] px-3.5 rounded-[9px] bg-transparent border border-[#292E2A] text-[#34D399] font-medium text-[12.5px] flex items-center justify-center hover:bg-[#1c211e] transition-colors no-underline cursor-pointer"
          >
            Export Excel
          </a>
          <Link
            to="/quotations/new"
            className="h-[34px] px-3.5 rounded-[9px] bg-transparent border border-[#3a4a1f] text-[#B8F23A] font-medium text-[12.5px] flex items-center justify-center hover:bg-[#1b2013] transition-colors no-underline"
          >
            + New quotation
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-[10px] border border-[#4a2a2a] bg-[#1b1414] text-[#E25757] text-[12.5px]">
          {error}
        </div>
      )}

      {/* Main Table Container Card */}
      <section className="bg-[#171918] border border-[#292E2A] rounded-[16px] p-[16px_18px_12px] flex flex-col gap-4 shadow-xl">
        
        {/* Stage Filter Chips & Expandable Search Toggle */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 border-b border-[#20251f] pb-3.5">
          {/* Status Stage Chips */}
          <div className="flex gap-2 flex-wrap items-center">
            {[
              { name: 'All', key: '' },
              { name: 'Draft', key: 'draft' },
              { name: 'Sent', key: 'sent' },
              { name: 'Accepted', key: 'accepted' },
              { name: 'Rejected', key: 'rejected' },
            ].map((chip) => {
              const active = statusFilter === chip.key;
              const count = stageCounts[chip.name] || 0;
              return (
                <button
                  key={chip.name}
                  type="button"
                  onClick={() => setStatusFilter(chip.key)}
                  className={`inline-flex items-center gap-2 h-[32px] px-3 rounded-[8px] text-[12px] cursor-pointer transition-colors border ${
                    active
                      ? 'bg-[#23271f] border-[#3a4a1f] text-[#B8F23A] font-semibold'
                      : 'bg-transparent border-[#292E2A] text-[#A5AEA8] hover:border-[#3a4237]'
                  }`}
                >
                  <span>{chip.name}</span>
                  <span className="text-[#6d756f] text-[11px]">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Search Trigger Button & Summary Stats */}
          <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-expanded={isSearchOpen}
              aria-controls="quotation-search-panel"
              aria-label={isSearchOpen ? 'Hide search options' : 'Show search options'}
              className={`inline-flex items-center gap-2 h-[32px] px-3.5 rounded-[8px] text-[12px] font-semibold cursor-pointer transition-all border ${
                isSearchOpen || hasSearchFilters
                  ? 'bg-[#1D211E] border-[#B8F23A] text-[#B8F23A] shadow-xs'
                  : 'bg-[#101312] border-[#292E2A] text-[#F5F7F4] hover:border-[#3a4237]'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-[#B8F23A]" />
              <span>Search & Filter</span>
              {hasSearchFilters && (
                <span className="w-2 h-2 rounded-full bg-[#B8F23A] animate-pulse" />
              )}
              {isSearchOpen ? (
                <ChevronUp className="w-3.5 h-3.5 ml-0.5 text-[#B8F23A]" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-[#A5AEA8]" />
              )}
            </button>

            {hasAnyActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 h-[32px] px-3 rounded-[8px] bg-[#1D211E] border border-[#292E2A] text-[#A5AEA8] text-[12px] hover:text-[#F5F7F4] hover:border-[#3a4237] cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset All</span>
              </button>
            )}

            <span className="text-[11.5px] text-[#6d756f] ml-1">
              Showing {filtered.length} of {rows.length}
            </span>
          </div>
        </div>

        {/* EXPANDED POP-DOWN SEARCH PANEL */}
        {isSearchOpen && (
          <div
            id="quotation-search-panel"
            className="bg-[#101312] border border-[#292E2A] rounded-[12px] p-4 transition-all duration-200 animate-in fade-in slide-in-from-top-2 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#20251f]">
              <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[#A5AEA8]">
                <Filter className="w-3.5 h-3.5 text-[#B8F23A]" />
                <span>Advanced Quotation Search</span>
              </div>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="text-[#6d756f] hover:text-[#F5F7F4] p-1 rounded-md transition-colors"
                aria-label="Close search panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* 1. Search Quotation Number */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6d756f] mb-1.5">
                  Quotation No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. TSQOT2627/1"
                  value={searchNumber}
                  onChange={(e) => setSearchNumber(e.target.value)}
                  className="w-full h-[34px] px-3 rounded-[8px] bg-[#171918] border border-[#292E2A] text-[#F5F7F4] text-[12.5px] outline-none focus:border-[#B8F23A] placeholder-[#6d756f] transition-colors"
                />
              </div>

              {/* 2. Search Customer Company */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6d756f] mb-1.5">
                  Customer / Company
                </label>
                <input
                  type="text"
                  placeholder="e.g. Basil"
                  value={searchCompany}
                  onChange={(e) => setSearchCompany(e.target.value)}
                  className="w-full h-[34px] px-3 rounded-[8px] bg-[#171918] border border-[#292E2A] text-[#F5F7F4] text-[12.5px] outline-none focus:border-[#B8F23A] placeholder-[#6d756f] transition-colors"
                />
              </div>

              {/* 3. Date Range */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6d756f] mb-1.5">
                  Time Period
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                  className="w-full h-[34px] px-3 rounded-[8px] bg-[#171918] border border-[#292E2A] text-[#F5F7F4] text-[12.5px] outline-none focus:border-[#B8F23A] cursor-pointer transition-colors"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>

              {/* 4. Min Amount */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6d756f] mb-1.5">
                  Min Amount (₹)
                </label>
                <input
                  type="number"
                  placeholder="Min ₹"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  className="w-full h-[34px] px-3 rounded-[8px] bg-[#171918] border border-[#292E2A] text-[#F5F7F4] text-[12.5px] outline-none focus:border-[#B8F23A] placeholder-[#6d756f] tabular-nums transition-colors"
                />
              </div>

              {/* 5. Max Amount */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6d756f] mb-1.5">
                  Max Amount (₹)
                </label>
                <input
                  type="number"
                  placeholder="Max ₹"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  className="w-full h-[34px] px-3 rounded-[8px] bg-[#171918] border border-[#292E2A] text-[#F5F7F4] text-[12.5px] outline-none focus:border-[#B8F23A] placeholder-[#6d756f] tabular-nums transition-colors"
                />
              </div>
            </div>

            {/* Panel Footer / Clear Action */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#20251f]">
              <span className="text-[11.5px] text-[#A5AEA8]">
                {filtered.length} matching quotations
              </span>
              {hasSearchFilters && (
                <button
                  type="button"
                  onClick={clearSearchPanelFilters}
                  className="px-3 py-1 bg-[#1D211E] hover:bg-[#292E2A] text-[#E25757] border border-[#E25757]/30 text-xs font-semibold rounded-lg transition-colors inline-flex items-center space-x-1"
                >
                  <X className="w-3 h-3" />
                  <span>Clear Search Filters</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Quotations Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-[#20251f]">
                <th className="text-left p-[8px_10px] font-normal text-[11px] tracking-[.08em] text-[#6d756f] uppercase">
                  QUOTATION
                </th>
                <th className="text-left p-[8px_10px] font-normal text-[11px] tracking-[.08em] text-[#6d756f] uppercase">
                  CUSTOMER
                </th>
                <th className="text-left p-[8px_10px] font-normal text-[11px] tracking-[.08em] text-[#6d756f] uppercase">
                  DATE
                </th>
                <th className="text-right p-[8px_10px] font-normal text-[11px] tracking-[.08em] text-[#6d756f] uppercase">
                  AMOUNT
                </th>
                <th className="text-left p-[8px_10px] font-normal text-[11px] tracking-[.08em] text-[#6d756f] uppercase">
                  STAGE
                </th>
                <th className="text-right p-[8px_10px] font-normal text-[11px] tracking-[.08em] text-[#6d756f] uppercase">
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody>
              {paged.map((q) => {
                const color = STAGE_COLORS[q.status] || '#A5AEA8';
                return (
                  <tr
                    key={q.id}
                    className="border-b border-[#1a1f1c] hover:bg-[#1a1e1c] transition-colors"
                  >
                    <td className="p-[11px_10px]">
                      <Link
                        to={`/quotations/${q.id}`}
                        className="text-[#B8F23A] hover:underline font-medium"
                      >
                        {q.number}
                      </Link>
                    </td>
                    <td className="p-[11px_10px] text-[#F5F7F4]">{q.company_name || '—'}</td>
                    <td className="p-[11px_10px] text-[#A5AEA8]">{q.date}</td>
                    <td className="p-[11px_10px] text-right font-medium text-[#F5F7F4]">
                      ₹{Number(q.total || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="p-[11px_10px]">
                      <span className="inline-flex items-center gap-1.5 capitalize" style={{ color }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                        {q.status}
                      </span>
                    </td>
                    <td className="p-[11px_10px] text-right">
                      <Link
                        to={`/quotations/${q.id}`}
                        className="text-[12px] text-[#A5AEA8] hover:text-[#B8F23A] hover:underline"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-[#A5AEA8] text-[13px]">
                    No quotations found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pagination Footer */}
      <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

