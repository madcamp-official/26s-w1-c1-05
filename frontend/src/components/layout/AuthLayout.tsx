import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="auth-shell">
      <div className="auth-container">
        <div className="auth-brand">
          <span className="auth-brand-name">Scrum Helper</span>
          <span className="auth-tagline">Plan sprints, track tasks, ship together.</span>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
