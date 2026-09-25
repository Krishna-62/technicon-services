import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../auth';
import { useNavigate } from 'react-router-dom';
import { GlobalSearchModal } from './GlobalSearchModal';
import {
  getDateRangePresets,
  DATE_RANGE_EVENT,
  broadcastDateRange,
  getStoredDateRange,
  type DateRangePreset,
} from '../lib/date-presets';

export function AppHeader({
  onMobileToggle,
  onRefresh,
}: {
  onMobileToggle?: () => void;
  onRefresh?: () => void;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateRangePreset>(getStoredDateRange);
  const refreshRef = useRef<HTMLSpanElement>(null);
  const dateMenuRef = useRef<HTMLDivElement>(null);

  const presets = getDateRangePresets();

  useEffect(() => {
    const handleRangeChange = (e: Event) => {
      const customEvent = e as CustomEvent<DateRangePreset>;
      if (customEvent.detail) {
        setSelectedRange(customEvent.detail);
      }
    };
    window.addEventListener(DATE_RANGE_EVENT, handleRangeChange);
    return () => window.removeEventListener(DATE_RANGE_EVENT, handleRangeChange);
  }, []);

  useEffect(() => {
    const handleOpenSearch = () => setSearchModalOpen(true);
    window.addEventListener('open-global-search', handleOpenSearch);
    return () => window.removeEventListener('open-global-search', handleOpenSearch);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dateMenuRef.current && !dateMenuRef.current.contains(e.target as Node)) {
        setDateRangeOpen(false);
      }
    };
    if (dateRangeOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dateRangeOpen]);

  const handleSelectPreset = (preset: DateRangePreset) => {
    setSelectedRange(preset);
    broadcastDateRange(preset);
    setDateRangeOpen(false);
  };

  const getInitials = (name: string) => {
    if (!name) return 'RM';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleRefreshClick = () => {
    const el = refreshRef.current;
    if (el) {
      el.style.animation = 'none';
      void el.offsetWidth;
      el.style.animation = 'spinOnce .7s cubic-bezier(.4,0,.2,1)';
    }
    if (onRefresh) onRefresh();
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center gap-3.5 px-6 py-3 bg-[rgba(16,19,18,0.86)] backdrop-blur-md border-b border-[#1c211e] select-none">
        {/* Mobile Toggle Button */}
        <button
          type="button"
          data-navtoggle="1"
          aria-label="Open navigation"
          onClick={onMobileToggle}
          className="tablet-lg:hidden inline-flex items-center justify-center w-[34px] h-[34px] rounded-[9px] bg-[#171918] border border-[#292E2A] text-[#A5AEA8] hover:text-[#F5F7F4] hover:border-[#3a4237] cursor-pointer shrink-0 transition-colors"
        >
          ≡
        </button>

        {/* Global Command Center Search Input Button */}
        <div className="flex-1 min-w-0 max-w-[480px]">
          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="w-full flex items-center justify-between h-[36px] px-3 rounded-[9px] bg-[#171918] border border-[#292E2A] hover:border-[#B8F23A]/60 text-[#A5AEA8] hover:text-[#F5F7F4] cursor-pointer transition-all duration-150 group shadow-sm"
          >
            <div className="flex items-center gap-2.5 truncate">
              <span className="text-[#B8F23A] text-sm">🔍</span>
              <span className="text-xs font-medium text-[#A5AEA8] group-hover:text-[#F5F7F4] truncate">
                Search anything... (Products, Stock, QTN, PO, PI, Customers)
              </span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-[#A5AEA8] bg-[#101312] px-2 py-0.5 rounded border border-[#292E2A]">
              <span>⌘</span> <span>K</span>
            </kbd>
          </button>
        </div>

        {/* Header Actions & Controls */}
        <div className="ml-auto flex items-center gap-2">
          {/* Refresh Button */}
          <button
            type="button"
            aria-label="Refresh data"
            onClick={handleRefreshClick}
            className="w-[34px] h-[34px] rounded-[9px] bg-[#171918] border border-[#292E2A] text-[#A5AEA8] hover:text-[#F5F7F4] hover:border-[#3a4237] cursor-pointer grid place-items-center transition-colors"
          >
            <span ref={refreshRef} aria-hidden="true" className="block text-[14px] leading-none">
              ⟳
            </span>
          </button>

          {/* Date Range Selector Pill with Dropdown */}
          <div className="relative hidden md:block" ref={dateMenuRef}>
            <button
              type="button"
              onClick={() => setDateRangeOpen(!dateRangeOpen)}
              className="flex items-center gap-2 h-[34px] px-3 rounded-[9px] bg-[#171918] border border-[#292E2A] hover:border-[#3a4237] text-[12.5px] text-[#A5AEA8] hover:text-[#F5F7F4] cursor-pointer transition-colors"
              title="Click to change date range"
            >
              <span aria-hidden="true">▤</span>
              <span className="font-medium text-[#F5F7F4]">{selectedRange.label}</span>
              <span className="text-[9px] text-[#A5AEA8]">▼</span>
            </button>

            {dateRangeOpen && (
              <div className="absolute right-0 top-11 z-50 min-w-[180px] p-1.5 rounded-[10px] bg-[#1D211E] border border-[#333c31] shadow-[0_18px_40px_rgba(0,0,0,0.55)] animate-in fade-in duration-150">
                <div className="px-2 py-1 border-b border-[#292E2A] mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#A5AEA8]">Filter by Period</span>
                </div>
                <div className="space-y-0.5">
                  {presets.map((p) => {
                    const isActive = selectedRange.id === p.id || selectedRange.label === p.label;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPreset(p)}
                        className={`w-full text-left px-2 py-1.5 rounded-[7px] text-[12px] font-medium transition-colors flex items-center justify-between ${
                          isActive
                            ? 'bg-[#171918] text-[#B8F23A] font-bold border border-[#292E2A]'
                            : 'text-[#A5AEA8] hover:text-[#F5F7F4] hover:bg-[#292E2A]/50'
                        }`}
                      >
                        <span>{p.label}</span>
                        {isActive && <span className="text-[#B8F23A] text-xs">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Notifications Button */}
          <button
            type="button"
            aria-label="Notifications"
            className="relative w-[34px] h-[34px] rounded-[9px] bg-[#171918] border border-[#292E2A] text-[#A5AEA8] hover:text-[#F5F7F4] hover:border-[#3a4237] cursor-pointer grid place-items-center transition-colors"
          >
            <span aria-hidden="true">◔</span>
            <span className="absolute top-[6px] right-[6px] w-[6px] h-[6px] rounded-full bg-[#B8F23A]" />
          </button>

          {/* User Profile Dropdown Button */}
          {user && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 h-[34px] pl-1 pr-2.5 rounded-[9px] bg-[#171918] border border-[#292E2A] hover:border-[#3a4237] text-[#F5F7F4] text-[12.5px] cursor-pointer transition-colors"
              >
                <span className="w-[26px] h-[26px] rounded-[7px] bg-[#1D211E] text-[#B8F23A] grid place-items-center text-[11px] font-bold">
                  {getInitials(user.username)}
                </span>
                <span className="hidden sm:inline font-medium truncate max-w-[100px]">
                  {user.username}
                </span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-11 z-50 min-w-[160px] p-1.5 rounded-[10px] bg-[#1D211E] border border-[#333c31] shadow-[0_18px_40px_rgba(0,0,0,0.55)] animate-in fade-in duration-150">
                  <div className="px-2 py-1.5 border-b border-[#292E2A] mb-1">
                    <p className="text-[12px] font-bold text-[#F5F7F4]">{user.username}</p>
                    <p className="text-[10px] text-[#A5AEA8] uppercase tracking-wider">{user.role}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-2 py-1.5 text-[12.5px] text-[#E25757] hover:bg-[#23271f] rounded-[7px] transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Global Command Palette Overlay Modal */}
      <GlobalSearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </>
  );
}
