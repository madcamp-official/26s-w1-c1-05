import { Outlet } from 'react-router-dom';

export function AppLayout() {
<<<<<<< HEAD
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
          <span className="brand-mark">SH</span>
          <span>Scrum Helper</span>
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
=======
  return <Outlet />;
>>>>>>> 593071400011d7790d80c28dea2ef37d10699e92
}
