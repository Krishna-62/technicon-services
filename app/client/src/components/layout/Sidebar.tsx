import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  const isChildActive = item.children.some((c) => location.pathname === c.to);
  const [expanded, setExpanded] = useState(isChildActive);

  // Auto-expand whenever navigation lands on one of this group's children (direct URL, refresh,
  // or moving between child pages) — manual toggling below is independent of this.
  useEffect(() => {
    if (isChildActive) setExpanded(true);
  }, [isChildActive]);

  const Icon = item.icon;

  return (
    <div className="nav-group">
      <button
        type="button"
        className={`nav-group-toggle${isChildActive ? ' active' : ''}`}
        onClick={() => setExpanded((e) => !e)}
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
          {item.children.map((c) => (
            <NavLink
              key={c.to}
              to={c.to}
              end={c.end}
              onClick={onCloseMobile}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <span>{c.label}</span>
            </NavLink>
          ))}
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
