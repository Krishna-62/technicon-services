import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

interface NavSubItemDef {
  label: string;
  path: string;
  exact?: boolean;
  isDetailPattern?: boolean;
}

interface NavItemDef {
  label: string;
  path: string;
  children?: NavSubItemDef[];
}

const MAIN_NAV: NavItemDef[] = [
  { label: 'Dashboard', path: '/' },
  { label: 'Quotations', path: '/quotations' },
  { label: 'Purchase Orders', path: '/purchase-orders' },
  { label: 'Performa Invoices', path: '/performa-invoices' },
  {
    label: 'Sale Reports',
    path: '/sale-reports',
    children: [
      { label: 'Sale Report List', path: '/sale-reports', exact: true },
      { label: 'Create Sale Report', path: '/sale-reports/new' },
      { label: 'Sale Report Detail', path: '/sale-reports/detail', isDetailPattern: true },
    ],
  },
  {
    label: 'Sales Pipeline',
    path: '/sales/pipeline',
    children: [
      { label: 'Pipeline Control', path: '/sales/pipeline', exact: true },
      { label: 'Due Today Follow-ups', path: '/follow-ups/due-today' },
      { label: 'Overdue Follow-ups', path: '/follow-ups/overdue' },
      { label: 'Sales Overview', path: '/sales' },
      { label: 'Sales Activity Log', path: '/sales/activity' },
    ],
  },
  { label: 'Sales Engineers', path: '/sales/engineers' },
  { label: 'Companies', path: '/companies' },
  { label: 'Products', path: '/products' },
];

const INVENTORY_NAV: NavItemDef[] = [
  {
    label: 'Inventory',
    path: '/inventory',
    children: [
      { label: 'Overview', path: '/inventory', exact: true },
      { label: 'Warehouses', path: '/inventory/warehouses' },
      { label: 'Stock', path: '/inventory/stock' },
      { label: 'Stock Inward', path: '/inventory/stock-inward' },
      { label: 'Reservations', path: '/inventory/reservations' },
      { label: 'Stock Intelligence', path: '/inventory/intelligence' },
    ],
  },
];

const REPORTS_NAV: NavItemDef[] = [
  {
    label: 'Reports',
    path: '/reports',
    children: [
      { label: 'Business Health', path: '/business-health' },
      { label: 'Customer Health', path: '/customer-health' },
      { label: 'Engineer Sales', path: '/reports/engineer-sales' },
      { label: 'Growth Opportunities', path: '/opportunities' },
      { label: 'Product Intelligence', path: '/product-intelligence' },
      { label: 'Chat with AI', path: '/chat-with-ai' },
    ],
  },
];

const SYSTEM_NAV: NavItemDef[] = [
  { label: 'Settings', path: '/settings' },
  { label: 'Multi-Firm & Branches', path: '/settings/multi-firm' },
  { label: 'Admin', path: '/admin' },
];

function CollapsibleNavItem({
  item,
  currentPath,
  onMobileClose,
}: {
  item: NavItemDef;
  currentPath: string;
  onMobileClose?: () => void;
}) {
  const navigate = useNavigate();

  const isChildActive = (child: NavSubItemDef) => {
    if (child.isDetailPattern) {
      return (
        currentPath.startsWith('/sale-reports/') &&
        currentPath !== '/sale-reports' &&
        !currentPath.startsWith('/sale-reports/new')
      );
    }
    if (child.path === '/product-intelligence') {
      return (
        currentPath === '/product-intelligence' ||
        currentPath === '/products/intelligence' ||
        (currentPath.startsWith('/products/') && currentPath.endsWith('/intelligence'))
      );
    }
    if (child.exact) {
      return currentPath === child.path;
    }
    return currentPath === child.path || currentPath.startsWith(child.path + '/');
  };

  const isGroupActive = Boolean(
    item.children?.some(isChildActive) || (item.path && currentPath.startsWith(item.path))
  );

  const [expanded, setExpanded] = useState(isGroupActive);

  useEffect(() => {
    if (isGroupActive) {
      setExpanded(true);
    }
  }, [isGroupActive]);

  if (!item.children) return null;

  const handleParentClick = () => {
    setExpanded((prev) => !prev);
    if (item.path && currentPath !== item.path) {
      navigate(item.path);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleParentClick}
        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[13.5px] transition-all duration-200 border cursor-pointer select-none ${
          isGroupActive
            ? 'bg-[#1D211E] text-[#F5F7F4] border-[#333c31] shadow-[inset_2px_0_0_#B8F23A]'
            : 'bg-transparent text-[#A5AEA8] border-transparent hover:bg-[#161A18] hover:text-[#F5F7F4]'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className={`w-1.5 h-1.5 rounded-[2px] shrink-0 ${isGroupActive ? 'bg-[#B8F23A]' : 'bg-[#3c443d]'}`}
          />
          <span className="font-medium">{item.label}</span>
        </div>
        <svg
          className={`w-3.5 h-3.5 text-[#A5AEA8] transition-transform duration-200 ${expanded ? 'rotate-90 text-[#B8F23A]' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {expanded && (
        <div className="flex flex-col gap-1 pl-3.5 ml-2.5 border-l border-[#242e27]">
          {item.children.map((child) => {
            const active = isChildActive(child);
            const targetPath = child.isDetailPattern && active ? currentPath : (child.isDetailPattern ? '/sale-reports' : child.path);
            return (
              <Link
                key={child.label}
                to={targetPath}
                onClick={() => onMobileClose && onMobileClose()}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12.5px] no-underline transition-all duration-150 ${
                  active
                    ? 'bg-[#1e251d] text-[#B8F23A] font-semibold'
                    : 'text-[#A5AEA8] hover:text-[#F5F7F4] hover:bg-[#161A18]'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`w-1 h-1 rounded-full shrink-0 ${active ? 'bg-[#B8F23A]' : 'bg-[#4b554d]'}`}
                />
                <span>{child.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AppSidebar({ mobileOpen = false, onMobileClose }: { mobileOpen?: boolean; onMobileClose?: () => void }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isCurrent = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const renderNavGroup = (title: string, items: NavItemDef[]) => (
    <nav aria-label={title} className="flex flex-col gap-1">
      <div className="text-[10.5px] tracking-[.14em] text-[#6d756f] px-2 pb-1.5 uppercase font-medium">
        {title}
      </div>
      {items.map((item) => {
        if (item.path === '/admin' && user.role !== 'admin') return null;

        if (item.children) {
          return (
            <CollapsibleNavItem
              key={item.label}
              item={item}
              currentPath={location.pathname}
              onMobileClose={onMobileClose}
            />
          );
        }

        const active = isCurrent(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => onMobileClose && onMobileClose()}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13.5px] no-underline transition-all duration-200 border ${
              active
                ? 'bg-[#1D211E] text-[#F5F7F4] border-[#333c31] shadow-[inset_2px_0_0_#B8F23A]'
                : 'bg-transparent text-[#A5AEA8] border-transparent hover:bg-[#161A18] hover:text-[#F5F7F4]'
            }`}
          >
            <span
              aria-hidden="true"
              className={`w-1.5 h-1.5 rounded-[2px] shrink-0 ${active ? 'bg-[#B8F23A]' : 'bg-[#3c443d]'}`}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const getInitials = (name: string) => {
    if (!name) return 'TS';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const sidebarContent = (
    <aside
      data-nav="1"
      data-scroll="1"
      className="w-[246px] shrink-0 bg-[#0B0D0D] border-r border-[#292E2A] flex flex-col p-[18px_14px_14px] gap-[22px] h-screen sticky top-0 overflow-y-auto z-50 select-none no-scrollbar"
    >
      {/* Brand Header */}
      <div className="flex items-center gap-2.5 px-1 py-0.5">
        <div className="w-[30px] h-[30px] rounded-[9px] border border-[#3a4a1f] bg-[#1D211E] text-[#B8F23A] grid place-items-center text-[12px] font-semibold tracking-[.02em] shrink-0">
          TS
        </div>
        <div className="flex flex-col leading-[1.1]">
          <span className="text-[13.5px] font-semibold tracking-[.04em] text-[#F5F7F4]">TECHNICON</span>
          <span className="text-[10.5px] tracking-[.18em] text-[#A5AEA8]">SERVICES</span>
        </div>
      </div>

      {/* Navigation Sections */}
      {renderNavGroup('MAIN', MAIN_NAV)}
      {renderNavGroup('INVENTORY', INVENTORY_NAV)}
      {renderNavGroup('REPORTS', REPORTS_NAV)}
      {renderNavGroup('SYSTEM', SYSTEM_NAV)}

      {/* User Profile Block */}
      <div className="mt-auto border-t border-[#1c211e] pt-3 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-[#1D211E] border border-[#333c31] grid place-items-center text-[12px] font-bold text-[#B8F23A] shrink-0">
          {getInitials(user.username)}
        </div>
        <div className="flex flex-col leading-[1.25] min-w-0">
          <span className="text-[12.5px] font-medium text-[#F5F7F4] truncate">{user.username}</span>
          <span className="text-[11px] text-[#6d756f] capitalize">{user.role} Operations</span>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <div className="hidden tablet-lg:block">{sidebarContent}</div>

      {/* Mobile Off-Canvas Drawer */}
      {mobileOpen && (
        <div className="tablet-lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={onMobileClose}
          />
          <div className="relative z-10 w-[246px] h-full shadow-[40px_0_80px_rgba(0,0,0,0.6)] animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

