import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import type { AuthUser } from '../../api';
import { ChevronIcon, CollapseIcon } from '../icons';
import { isNavGroup, type NavItem } from './navLinks';

interface SidebarProps {
  links: NavItem[];
  user: AuthUser;
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

function NavGroup({
  item,
  collapsed,
  onCloseMobile,
}: {
  item: Extract<NavItem, { children: unknown[] }>;
  collapsed: boolean;
  onCloseMobile: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const checkChildActive = (c: { to: string; end?: boolean }) => {
    if (c.to === '/sale-reports/detail') {
      return (
        location.pathname.startsWith('/sale-reports/') &&
        location.pathname !== '/sale-reports' &&
        !location.pathname.startsWith('/sale-reports/new')
      );
    }
    if (c.to === '/product-intelligence') {
      return (
        location.pathname === '/product-intelligence' ||
        location.pathname === '/products/intelligence' ||
        (location.pathname.startsWith('/products/') && location.pathname.endsWith('/intelligence'))
      );
    }
    if (c.to === '/procurement/requirements') {
      return location.pathname.startsWith('/procurement/requirements');
    }
    if (c.to === '/procurement/suppliers') {
      return location.pathname.startsWith('/procurement/suppliers');
    }
    return location.pathname === c.to || (c.to !== '/' && location.pathname.startsWith(c.to + '/'));
  };

  const isChildActive = item.children.some(checkChildActive);
  const [expanded, setExpanded] = useState(isChildActive);

  // Auto-expand whenever navigation lands on one of this group's children (direct URL, refresh,
  // or moving between child pages) — manual toggling below is independent of this.
  useEffect(() => {
    if (isChildActive) setExpanded(true);
  }, [isChildActive]);

  const Icon = item.icon;

  const handleParentClick = () => {
    setExpanded((e) => !e);
    if (item.label === 'Procurement') {
      navigate('/procurement');
    }
  };

  return (
    <div className="nav-group">
      <button
        type="button"
        className={`nav-group-toggle${isChildActive ? ' active' : ''}`}
        onClick={handleParentClick}
        title={collapsed ? item.label : undefined}
        aria-expanded={expanded}
      >
        <Icon />
        <span>{item.label}</span>
        <span className={`nav-group-chevron${expanded ? ' expanded' : ''}`}>
          <ChevronIcon />
        </span>
      </button>
      {expanded && !collapsed && (
        <div className="nav-group-children">
          {item.children.map((c) => {
            const active = checkChildActive(c);
            const toPath = c.to === '/sale-reports/detail' && active ? location.pathname : (c.to === '/sale-reports/detail' ? '/sale-reports' : c.to);
            return (
              <NavLink
                key={c.to}
                to={toPath}
                end={c.end}
                onClick={onCloseMobile}
                className={active ? 'active' : ''}
              >
                <span>{c.label}</span>
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ links, user, onLogout, collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: SidebarProps) {
  return (
    <>
      {mobileOpen && <div className="sidebar-backdrop" onClick={onCloseMobile} />}
      <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}${mobileOpen ? ' sidebar--open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">TS</div>
          {!collapsed && (
            <div className="brand-text">
              TECHNICON
              <span>SERVICES</span>
            </div>
          )}
        </div>
        <nav>
          {links.map((item) =>
            isNavGroup(item) ? (
              <NavGroup key={item.label} item={item} collapsed={collapsed} onCloseMobile={onCloseMobile} />
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onCloseMobile}
                className={({ isActive }) => (isActive ? 'active' : '')}
                title={collapsed ? item.label : undefined}
              >
                {item.icon && <item.icon />}
                <span>{item.label}</span>
              </NavLink>
            )
          )}
        </nav>

        <button type="button" className="sidebar-collapse-toggle" onClick={onToggleCollapse} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <CollapseIcon />
          {!collapsed && <span>Collapse</span>}
        </button>

        <div className="sidebar-footer">
          {!collapsed && (
            <div>
              <div className="username">{user.username}</div>
              <div className="role-tag">{user.role}</div>
            </div>
          )}
          <button onClick={onLogout} title="Logout">
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
