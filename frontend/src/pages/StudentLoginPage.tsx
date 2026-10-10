import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../api';
import ThemeToggle from '../components/ThemeToggle';

export default function StudentLoginPage() {
  const { studentLogin } = useAuth();
  const navigate = useNavigate();
  const location = window.location.pathname;
  const [tab, setTab] = useState<'login' | 'register'>(location.includes('register') ? 'register' : 'login');

  // Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register
  const [regData, setRegData] = useState({ name: '', email: '', rollNumber: '', department: '', year: '', password: '', confirmPassword: '' });
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      await studentLogin(email, password);
      navigate('/student/dashboard');
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regData.password !== regData.confirmPassword) {
      setRegError('Passwords do not match');
      return;
    }
    setRegLoading(true);
    setRegError('');
    try {
      const res = await authAPI.studentRegister({ ...regData });
      localStorage.setItem('sc_token', res.token);
      localStorage.setItem('sc_role', 'student');
      window.location.href = '/student/dashboard';
    } catch (err: unknown) {
      setRegError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>
      <div style={{ position: 'absolute', top: 24, left: 24 }}>
        <Link to="/auth" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>← Back</Link>
      </div>
      <div style={{ position: 'absolute', top: 24, right: 24 }}>
        <ThemeToggle />
      </div>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 24 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18 }}>SC</div>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)' }}>Student Club</span>
          </Link>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text-primary)' }}>Student Portal</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 15 }}>Discover events and manage your registrations</p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
            <button
              style={{ flex: 1, padding: '16px', background: 'none', border: 'none', borderBottom: tab === 'login' ? '2px solid var(--color-brand)' : '2px solid transparent', color: tab === 'login' ? 'var(--color-brand)' : 'var(--color-text-secondary)', fontWeight: 600, cursor: 'pointer' }}
              onClick={() => setTab('login')}
            >
              Log In
            </button>
            <button
              style={{ flex: 1, padding: '16px', background: 'none', border: 'none', borderBottom: tab === 'register' ? '2px solid var(--color-brand)' : '2px solid transparent', color: tab === 'register' ? 'var(--color-brand)' : 'var(--color-text-secondary)', fontWeight: 600, cursor: 'pointer' }}
              onClick={() => setTab('register')}
            >
              Sign Up
            </button>
          </div>

          <div className="card-body">
            {tab === 'login' ? (
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {loginError && <div style={{ background: 'var(--color-danger)', color: '#fff', padding: 12, borderRadius: 8, fontSize: 14 }}>{loginError}</div>}
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-brand w-full" disabled={loginLoading} style={{ marginTop: 8, justifyContent: 'center' }}>
                  {loginLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {regError && <div style={{ background: 'var(--color-danger)', color: '#fff', padding: 12, borderRadius: 8, fontSize: 14 }}>{regError}</div>}
                
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" value={regData.name} onChange={(e) => setRegData({ ...regData, name: e.target.value })} required />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" value={regData.email} onChange={(e) => setRegData({ ...regData, email: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Roll Number</label>
                    <input className="form-input" value={regData.rollNumber} onChange={(e) => setRegData({ ...regData, rollNumber: e.target.value })} required />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select className="form-input" value={regData.department} onChange={(e) => setRegData({ ...regData, department: e.target.value })} required>
                      <option value="">Select...</option>
                      <option value="CSE">CSE</option>
                      <option value="CSE - Data Science">CSE - Data Science</option>
                      <option value="CSE - AI & ML">CSE - AI & ML</option>
                      <option value="IT">IT</option>
                      <option value="ECE">ECE</option>
                      <option value="EEE">EEE</option>
                      <option value="Mechanical">Mechanical</option>
                      <option value="Civil">Civil</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Year</label>
                    <select className="form-input" value={regData.year} onChange={(e) => setRegData({ ...regData, year: e.target.value })} required>
                      <option value="">Select...</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input className="form-input" type="password" value={regData.password} onChange={(e) => setRegData({ ...regData, password: e.target.value })} required minLength={6} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm Password</label>
                    <input className="form-input" type="password" value={regData.confirmPassword} onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })} required minLength={6} />
                  </div>
                </div>

                <button type="submit" className="btn btn-brand w-full" disabled={regLoading} style={{ marginTop: 8, justifyContent: 'center' }}>
                  {regLoading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
