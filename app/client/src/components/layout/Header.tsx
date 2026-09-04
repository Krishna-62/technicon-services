import { useAuth } from '../../auth';
import { MenuIcon } from '../icons';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export default function Header({ onOpenMobileMenu }: HeaderProps) {
  const { user, logout } = useAuth();
  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'TS';

  return (
    <header className="header">
      <div className="flex items-center gap-3">
        <button type="button" className="header-menu-btn" onClick={onOpenMobileMenu} aria-label="Open navigation menu">
          <MenuIcon />
        </button>
        <div className="header-brand-title">
          <h1 className="header-title">TECHNICON SERVICES</h1>
          <span className="header-subtitle">Enterprise Operations</span>
        </div>
      </div>
      <div className="header-actions">
        {user && (
          <div className="user-profile-badge">
            <div className="avatar-circle">{initials}</div>
            <div className="user-info">
              <span className="username-text">{user.username}</span>
              <span className="user-role-tag">{user.role}</span>
            </div>
            <button type="button" className="btn-logout-link" onClick={logout} title="Logout">
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

