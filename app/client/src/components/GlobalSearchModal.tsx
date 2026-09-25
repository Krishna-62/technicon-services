import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchGlobalApi, type GlobalSearchResponse, type SearchResultItem } from '../api';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResponse, setSearchResponse] = useState<GlobalSearchResponse | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('technicon_recent_searches');
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch (e) {
      // ignore
    }
  }, []);

  const saveRecentSearch = (term: string) => {
    if (!term || term.trim().length < 1) return;
    const cleanTerm = term.trim();
    const updated = [cleanTerm, ...recentSearches.filter((s) => s.toLowerCase() !== cleanTerm.toLowerCase())].slice(0, 5);
    setRecentSearches(updated);
    try {
      localStorage.setItem('technicon_recent_searches', JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('technicon_recent_searches');
    } catch (e) {
      // ignore
    }
  };

  // Focus input on modal open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Debounced Search API call
  useEffect(() => {
    if (!query.trim()) {
      setSearchResponse(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const res = await searchGlobalApi(query);
        setSearchResponse(res);
        setSelectedIndex(0);
        setError(null);
      } catch (err: any) {
        console.error('Search API error:', err);
        setError(err.message || 'Unable to perform search right now.');
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Flattened active results list for keyboard arrow navigation
  const flatResultsList = useMemo(() => {
    if (!searchResponse || !searchResponse.groups) return [];
    const list: SearchResultItem[] = [];
    Object.values(searchResponse.groups).forEach((items) => {
      items.forEach((item) => {
        if (!list.some((existing) => existing.type === item.type && existing.id === item.id)) {
          list.push(item);
        }
      });
    });
    return list;
  }, [searchResponse]);

  const handleSelectResult = (item: SearchResultItem) => {
    saveRecentSearch(query || item.title);
    onClose();
    setQuery('');
    navigate(item.route);
  };

  // Keyboard navigation & Shortcuts (Ctrl+K / Cmd+K / Esc / Arrows / Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global Ctrl+K / Cmd+K shortcut
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          window.dispatchEvent(new CustomEvent('open-global-search'));
        }
        return;
      }

      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (flatResultsList.length > 0 ? (prev + 1) % flatResultsList.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (flatResultsList.length > 0 ? (prev - 1 + flatResultsList.length) % flatResultsList.length : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatResultsList.length > 0 && flatResultsList[selectedIndex]) {
          handleSelectResult(flatResultsList[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatResultsList, selectedIndex]);

  if (!isOpen) return null;

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'PRODUCT':
        return '📦';
      case 'PRODUCT_STOCK':
        return '📊';
      case 'CUSTOMER':
        return '🏢';
      case 'QUOTATION':
        return '📜';
      case 'PURCHASE_ORDER':
        return '📄';
      case 'PERFORMA_INVOICE':
        return '🧾';
      case 'SALE_REPORT':
        return '🏷️';
      case 'SALES_ENGINEER':
        return '👤';
      case 'WAREHOUSE':
        return '🏭';
      case 'FOLLOW_UP':
        return '📅';
      default:
        return '🔍';
    }
  };

  const getGroupTitle = (groupKey: string) => {
    switch (groupKey) {
      case 'BEST_MATCH':
        return '⭐ BEST MATCH';
      case 'PRODUCTS':
        return '📦 PRODUCTS';
      case 'INVENTORY':
        return '📊 INVENTORY STOCK';
      case 'CUSTOMERS':
        return '🏢 CUSTOMERS';
      case 'QUOTATIONS':
        return '📜 QUOTATIONS';
      case 'PURCHASE_ORDERS':
        return '📄 PURCHASE ORDERS';
      case 'PERFORMA_INVOICES':
        return '🧾 PERFORMA INVOICES';
      case 'SALE_REPORTS':
        return '🏷️ SALE REPORTS';
      case 'FOLLOW_UPS':
        return '📅 FOLLOW-UPS';
      case 'SALES_ENGINEERS':
        return '👤 SALES ENGINEERS';
      case 'WAREHOUSES':
        return '🏭 WAREHOUSES';
      default:
        return groupKey;
    }
  };

  let currentIndexCounter = 0;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-start justify-center pt-12 sm:pt-20 px-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#171918] border border-[#292E2A] rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Search Header */}
        <div className="p-4 border-b border-[#292E2A] flex items-center gap-3 bg-[#101312]">
          <span className="text-xl text-[#B8F23A]">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent text-[#F5F7F4] placeholder-[#A5AEA8] outline-none text-sm sm:text-base font-medium"
            placeholder="Search anything (e.g. 2ml, 2ml stock, QTN/2627/0001, AIC, PO/2627/0001)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {loading && <span className="text-xs text-[#B8F23A] animate-spin font-mono">⏳</span>}
          {query && (
            <button onClick={() => setQuery('')} className="text-[#A5AEA8] hover:text-[#F5F7F4] text-xs font-bold px-2 py-0.5 rounded bg-[#1D211E]">
              Clear
            </button>
          )}
          <span className="text-[10px] font-mono text-[#A5AEA8] bg-[#1D211E] px-2 py-1 rounded border border-[#292E2A] shrink-0">
            ESC
          </span>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
          {/* Query Empty - Show Recent Searches & Examples */}
          {!query.trim() && (
            <div className="space-y-4 py-2">
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-[#A5AEA8] uppercase tracking-wider mb-2 px-2">
                    <span>Recent Searches</span>
                    <button onClick={clearRecentSearches} className="text-[#E25757] hover:underline text-[10px]">
                      Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 px-2">
                    {recentSearches.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => setQuery(s)}
                        className="text-xs text-[#F5F7F4] bg-[#1D211E] border border-[#292E2A] hover:border-[#333C31] hover:bg-[#292E2A] px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>🕒</span> {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-[#101312] border border-[#292E2A] p-4 rounded-xl text-xs space-y-2">
                <div className="font-bold text-[#B8F23A] uppercase tracking-wider text-[10px]">💡 Smart Search Tips</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#A5AEA8]">
                  <div><strong className="text-[#F5F7F4]">"2ml"</strong> → Product search</div>
                  <div><strong className="text-[#F5F7F4]">"2ml stock"</strong> → Direct stock inventory</div>
                  <div><strong className="text-[#F5F7F4]">"QTN/2627/0001"</strong> → Quotation detail</div>
                  <div><strong className="text-[#F5F7F4]">"AIC"</strong> → Customer 360 page</div>
                  <div><strong className="text-[#F5F7F4]">"PO/2627/0001"</strong> → Purchase order detail</div>
                  <div><strong className="text-[#F5F7F4]">"overdue AIC"</strong> → Customer overdue followups</div>
                </div>
              </div>
            </div>
          )}

          {/* Loading Indicator State */}
          {query.trim() && loading && !searchResponse && (
            <div className="p-8 text-center text-xs text-[#A5AEA8] space-y-2">
              <div className="animate-spin text-lg text-[#B8F23A]">⏳</div>
              <div>Searching ERP database for "{query}"...</div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 border border-[#E25757]/40 bg-[#E25757]/10 text-[#E25757] rounded-xl text-xs flex justify-between items-center">
              <div>
                <span className="font-bold">Search Error: </span>
                <span>{error}</span>
              </div>
              <button
                onClick={() => {
                  setQuery(query);
                }}
                className="px-3 py-1 bg-[#1D211E] text-[#F5F7F4] hover:bg-[#292E2A] rounded border border-[#292E2A] font-semibold text-xs"
              >
                Retry
              </button>
            </div>
          )}

          {/* Query Active - No Results */}
          {query.trim() && !loading && !error && searchResponse && flatResultsList.length === 0 && (
            <div className="text-center py-12 text-xs space-y-2">
              <div className="text-2xl">🔍</div>
              <div className="font-bold text-[#F5F7F4]">No results found for "{query}"</div>
              <div className="text-[#A5AEA8] max-w-sm mx-auto leading-relaxed">
                Check spelling or try searching by Product Name, Part Number (e.g. 09923031), Customer, Quotation (QTN...), PO, or PI.
              </div>
            </div>
          )}

          {/* Grouped Search Results */}
          {!error && searchResponse && searchResponse.groups && (
            <div className="space-y-4">
              {Object.entries(searchResponse.groups).map(([groupKey, groupItems]) => {
                return (
                  <div key={groupKey} className="space-y-1">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-[#A5AEA8] px-2.5 py-1 bg-[#101312]/60 rounded">
                      {getGroupTitle(groupKey)}
                    </div>
                    <div className="space-y-1">
                      {groupItems.map((item) => {
                        const itemIdx = flatResultsList.findIndex((r) => r.type === item.type && r.id === item.id);
                        const isSelected = itemIdx === selectedIndex;
                        const globalItemIndex = currentIndexCounter++;

                        return (
                          <div
                            key={`${item.type}-${item.id}`}
                            onClick={() => handleSelectResult(item)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'bg-[#1D211E] border-[#B8F23A] shadow-[inset_2px_0_0_#B8F23A]'
                                : 'bg-[#101312]/80 border-[#292E2A] hover:bg-[#1D211E]/80 hover:border-[#333C31]'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-lg shrink-0">{getItemIcon(item.type)}</span>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-[#F5F7F4] truncate flex items-center gap-2">
                                  <span>{item.title}</span>
                                  {item.type === 'PRODUCT_STOCK' && (
                                    <span className="text-[10px] bg-[#B8F23A]/10 text-[#B8F23A] border border-[#B8F23A]/30 px-1.5 py-0.2 rounded">
                                      Inventory
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-[#A5AEA8] truncate mt-0.5">{item.subtitle}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] font-mono text-[#6D756F] group-hover:text-[#A5AEA8]">
                                Press ↵
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="p-3 bg-[#101312] border-t border-[#292E2A] flex items-center justify-between text-[11px] text-[#A5AEA8]">
          <div className="flex items-center gap-3">
            <span><kbd className="bg-[#1D211E] px-1.5 py-0.5 rounded border border-[#292E2A]">↑</kbd> <kbd className="bg-[#1D211E] px-1.5 py-0.5 rounded border border-[#292E2A]">↓</kbd> Navigate</span>
            <span><kbd className="bg-[#1D211E] px-1.5 py-0.5 rounded border border-[#292E2A]">↵</kbd> Direct Open</span>
            <span><kbd className="bg-[#1D211E] px-1.5 py-0.5 rounded border border-[#292E2A]">ESC</kbd> Close</span>
          </div>
          <span className="font-mono text-[#B8F23A] text-[10px]">Direct Navigation Engine</span>
        </div>
      </div>
    </div>
  );
};
