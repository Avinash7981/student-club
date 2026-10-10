
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';

interface NavbarProps {
  transparent?: boolean;
}

export default function Navbar({ transparent }: NavbarProps) {
  const { user, organizer, student, logout } = useAuth();
  const location = useLocation();

  return (
    <nav className="navbar" style={transparent ? { background: 'transparent', borderBottom: 'none' } : {}}>
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <div className="navbar-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="navbar-brand-name">Student Club</span>
        </Link>

        <ul className="navbar-nav">
          <li>
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              Events
            </Link>
          </li>
          <li>
            <Link to="/my-registrations" className={location.pathname === '/my-registrations' ? 'active' : ''}>
              My Registrations
            </Link>
          </li>
        </ul>

        <div className="navbar-actions">
          <ThemeToggle />
          {user ? (
            <>
              {student && (
                <Link to="/student/dashboard" className="btn btn-outline btn-sm">
                  Dashboard
                </Link>
              )}
              {organizer && (
                <Link to={organizer.role === 'admin' ? '/admin/dashboard' : '/organizer'} className="btn btn-outline btn-sm">
                  Dashboard
                </Link>
              )}
              <button className="btn btn-ghost btn-sm" onClick={logout}>
                Sign Out
              </button>
            </>
          ) : (
            <Link to="/auth" className="btn btn-primary btn-sm">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
