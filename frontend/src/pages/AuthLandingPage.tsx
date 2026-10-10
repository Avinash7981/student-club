import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

export default function AuthLandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>
      <div style={{ position: 'absolute', top: 24, right: 24 }}>
        <ThemeToggle />
      </div>

      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 24 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18 }}>
            SC
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)' }}>Student Club</span>
        </Link>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 8 }}>
          Welcome to Student Club
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 16 }}>Select your account type to continue</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, width: '100%', maxWidth: 640 }}>
        {/* Student Option */}
        <div className="card" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s ease' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
            🎓
          </div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: 'var(--color-text-primary)' }}>I'm a Student</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 15, lineHeight: 1.5, marginBottom: 24 }}>
              Discover campus events, register with your team, and access your digital tickets.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <Link to="/auth/student/login" className="btn btn-brand" style={{ flex: 1, justifyContent: 'center' }}>
                Student Sign In
              </Link>
              <Link to="/auth/student/register" className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>
                Student Sign Up
              </Link>
            </div>
          </div>
        </div>

        {/* Organizer Option */}
        <div className="card" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s ease' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(200, 117, 80, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
            📋
          </div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: 'var(--color-text-primary)' }}>I'm an Organizer</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 15, lineHeight: 1.5, marginBottom: 24 }}>
              Create events, manage registrations, track attendance, and export reports.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <Link to="/auth/organizer/login" className="btn btn-brand" style={{ flex: 1, justifyContent: 'center' }}>
                Organizer Sign In
              </Link>
              <Link to="/auth/organizer/register" className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>
                Organizer Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
