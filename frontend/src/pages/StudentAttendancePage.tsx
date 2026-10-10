import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsAPI } from '../api';
import Navbar from '../components/Navbar';

export default function StudentAttendancePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // If token is passed in URL query param, auto-fill it
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const t = urlParams.get('token');
    if (t) setToken(t);
  }, []);

  const handleMark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    setStatus('loading');
    setMessage('');
    try {
      const res = await eventsAPI.markAttendance(id as string, token.trim());
      setStatus('success');
      setMessage(res.message || 'Attendance marked successfully');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Failed to mark attendance');
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="container" style={{ maxWidth: 400, paddingTop: 60 }}>
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📱</div>
          <h2 style={{ marginBottom: 8 }}>Event Check-in</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 24, fontSize: 14 }}>
            Enter the attendance code displayed by the organizer.
          </p>

          <form onSubmit={handleMark}>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
              value={token}
              onChange={e => setToken(e.target.value)}
              style={{ marginBottom: 16, textAlign: 'center', letterSpacing: 1 }}
              required
            />
            <button
              type="submit"
              className="btn btn-brand w-full"
              disabled={status === 'loading'}
              style={{ justifyContent: 'center' }}
            >
              {status === 'loading' ? 'Checking in...' : 'Mark Present'}
            </button>
          </form>

          {status === 'success' && (
            <div style={{ marginTop: 24, padding: 16, background: 'rgba(46, 125, 50, 0.1)', color: '#2E7D32', borderRadius: 8, fontWeight: 600 }}>
              ✅ {message}
              <div style={{ marginTop: 12 }}>
                <button className="btn btn-sm btn-outline" onClick={() => navigate('/student/dashboard')}>Back to Dashboard</button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div style={{ marginTop: 24, padding: 16, background: 'rgba(198, 40, 40, 0.1)', color: '#c62828', borderRadius: 8 }}>
              ❌ {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
