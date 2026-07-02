import { LogOut } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { Button } from '../common/Button';

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink className="brand" to="/teams">
          Scrum Helper
        </NavLink>
        <div className="topbar-actions">
          <span className="current-user">{user?.name}</span>
          <Button variant="ghost" type="button" onClick={handleLogout}>
            <LogOut size={16} aria-hidden="true" />
            로그아웃
          </Button>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
