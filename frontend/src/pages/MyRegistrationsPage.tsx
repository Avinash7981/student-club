import { useState } from 'react';
import { registrationsAPI, Registration } from '../api';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';
import EventTicket from '../components/EventTicket';

export default function MyRegistrationsPage() {
  const [rollNumber, setRollNumber] = useState('');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const search = async () => {
    if (!rollNumber.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await registrationsAPI.getByRoll(rollNumber.trim());
      setRegistrations(res.registrations);
      setSearched(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch registrations');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="page-wrapper">
      <Navbar />

      <div className="container section">
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>My Registrations</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 32, fontSize: 15 }}>
          Enter your roll number to view all your event registrations.
        </p>

        {/* Search */}
        <div className="card" style={{ maxWidth: 560, marginBottom: 32 }}>
          <div className="card-body">
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Roll Number</label>
              <input
                className="form-input"
                placeholder="e.g. 25MVCSDR0186"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && search()}
              />
            </div>
            <button
              className="btn btn-primary w-full"
              onClick={search}
              disabled={loading || !rollNumber.trim()}
            >
              {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} />Searching...</> : 'Find My Registrations'}
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error" style={{ maxWidth: 560, marginBottom: 20 }}>{error}</div>}

        {searched && registrations.length === 0 && (
          <div className="empty-state">
            <span className="empty-state-icon">📋</span>
            <h3>No registrations found</h3>
            <p>No registrations found for roll number <strong>{rollNumber}</strong>.</p>
            <Link to="/" className="btn btn-primary">Browse Events</Link>
          </div>
        )}

        {registrations.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>
              Found {registrations.length} registration{registrations.length !== 1 ? 's' : ''}
            </h2>
            {registrations.map((reg) => {
              const event = reg.event as unknown as {
                title: string; startDate: string; venue: string; status: string; slug: string; organizerName: string;
              };
              const allMembers = [reg.teamLeader, ...reg.members];


              return (
                <div key={reg._id} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <EventTicket registration={reg} event={event} />
                  <div className="card">
                    <div className="card-body">

                    <div style={{ background: 'var(--color-bg)', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--color-text-secondary)' }}>
                        Team: {reg.teamName} ({allMembers.length} member{allMembers.length !== 1 ? 's' : ''})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {allMembers.map((m, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <span style={{ fontSize: 13, fontWeight: m.rollNumber === rollNumber.trim() ? 700 : 400 }}>{m.fullName}</span>
                              {i === 0 && <span className="member-role-tag" style={{ fontSize: 10 }}>Leader</span>}
                              {m.rollNumber === rollNumber.trim() && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-accent)', background: 'var(--color-accent-light)', padding: '1px 6px', borderRadius: 4 }}>You</span>}
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--color-text-muted)' }}>{m.rollNumber}</span>
                              <span className={`badge badge-${m.attendanceStatus === 'present' ? 'present' : m.attendanceStatus === 'absent' ? 'absent' : 'not-checked'}`}>
                                {m.attendanceStatus === 'not_checked' ? 'Not Checked' : m.attendanceStatus.charAt(0).toUpperCase() + m.attendanceStatus.slice(1)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                        Registered: {new Date(reg.registrationTime).toLocaleDateString('en-IN')}
                      </div>
                      {typeof event === 'object' && event.slug && (
                        <Link to={`/events/${event.slug}`} className="btn btn-outline btn-sm">
                          View Event
                        </Link>
                      )}
                    </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
