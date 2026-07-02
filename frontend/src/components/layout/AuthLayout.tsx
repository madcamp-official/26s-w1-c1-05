import { Link, Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <Link className="brand" to="/login">
          Scrum Helper
        </Link>
        <Outlet />
      </section>
    </main>
  );
}
