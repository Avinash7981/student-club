import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../api';
import ThemeToggle from '../components/ThemeToggle';

export default function OrganizerLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = window.location.pathname;
  const [tab, setTab] = useState<'login' | 'register'>(location.includes('register') ? 'register' : 'login');

  // Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register
  const [regData, setRegData] = useState({ name: '', email: '', password: '', organization: '', phone: '' });
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      await login(email, password);
      navigate('/organizer');
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError('');
    try {
      const res = await authAPI.register(regData);
      localStorage.setItem('sc_token', res.token);
      window.location.href = '/organizer';
    } catch (err: unknown) {
      setRegError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>
      <div style={{ position: 'absolute', top: 24, right: 24 }}>
        <ThemeToggle />
      </div>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 24 }}>
            <div className="navbar-logo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="navbar-brand-name" style={{ fontSize: 20 }}>Student Club</span>
          </Link>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
            {tab === 'login' ? 'Organizer Login' : 'Create Account'}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
            {tab === 'login' ? 'Sign in to manage your events' : 'Register as an event organizer'}
          </p>
        </div>

        <div className="card">
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
            <button
              onClick={() => setTab('login')}
              style={{
                flex: 1, padding: '14px', background: 'none', border: 'none', fontFamily: 'var(--font-sans)',
                fontSize: 14, fontWeight: 600, cursor: 'pointer', color: tab === 'login' ? 'var(--color-brand)' : 'var(--color-text-muted)',
                borderBottom: tab === 'login' ? '2px solid var(--color-brand)' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => setTab('register')}
              style={{
                flex: 1, padding: '14px', background: 'none', border: 'none', fontFamily: 'var(--font-sans)',
                fontSize: 14, fontWeight: 600, cursor: 'pointer', color: tab === 'register' ? 'var(--color-brand)' : 'var(--color-text-muted)',
                borderBottom: tab === 'register' ? '2px solid var(--color-brand)' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              Register
            </button>
          </div>

          <div className="card-body">
            {tab === 'login' ? (
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {loginError && <div className="alert alert-error">{loginError}</div>}
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" placeholder="organizer@college.edu" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input className="form-input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button className="btn btn-primary w-full btn-lg" type="submit" disabled={loginLoading}>
                  {loginLoading ? <><span className="spinner" style={{ width: 16, height: 16 }} />Signing in...</> : 'Sign In'}
                </button>
                <div style={{ padding: '12px', background: 'var(--color-brand-light)', borderRadius: 8, fontSize: 12, color: 'var(--color-brand)' }}>
                  <strong>Demo credentials:</strong><br />
                  tech@college.edu / password123<br />
                  cultural@college.edu / password123
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {regError && <div className="alert alert-error">{regError}</div>}
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" placeholder="Your Name" value={regData.name} onChange={(e) => setRegData({ ...regData, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" placeholder="organizer@college.edu" value={regData.email} onChange={(e) => setRegData({ ...regData, email: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Organization / Club Name</label>
                  <input className="form-input" placeholder="e.g. Technical Club" value={regData.organization} onChange={(e) => setRegData({ ...regData, organization: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input className="form-input" type="password" placeholder="Min 6 characters" value={regData.password} onChange={(e) => setRegData({ ...regData, password: e.target.value })} required minLength={6} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone (optional)</label>
                  <input className="form-input" placeholder="9876543210" value={regData.phone} onChange={(e) => setRegData({ ...regData, phone: e.target.value })} />
                </div>
                <button className="btn btn-primary w-full btn-lg" type="submit" disabled={regLoading}>
                  {regLoading ? <><span className="spinner" style={{ width: 16, height: 16 }} />Creating account...</> : 'Create Account'}
                </button>
              </form>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--color-text-muted)' }}>
          <Link to="/" style={{ color: 'var(--color-brand)', textDecoration: 'none' }}>← Back to Events</Link>
        </p>
      </div>
    </div>
  );
}
