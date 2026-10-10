import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { eventsAPI, Event, OrganizerStats } from '../../api';

interface SidebarProps {
  active: string;
}

export function OrganizerSidebar({ active }: SidebarProps) {
  const { organizer, logout } = useAuth();


  const navItems = [
    { href: '/organizer', label: 'Dashboard', icon: '🏠' },
    { href: '/organizer/events', label: 'My Events', icon: '📅' },
    { href: '/organizer/create-event', label: 'Create Event', icon: '➕' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div className="navbar-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="navbar-brand-name">Student Club</span>
        </Link>
      </div>

      <div className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={`sidebar-nav-item${active === item.href ? ' active' : ''}`}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </Link>
        ))}

        <div className="sidebar-section-label" style={{ marginTop: 16 }}>Account</div>
        <div style={{ padding: '12px 12px', background: 'var(--color-bg)', borderRadius: 8, marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{organizer?.name}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{organizer?.organization}</div>
        </div>
        <button
          className="sidebar-nav-item"
          onClick={logout}
          style={{ cursor: 'pointer', border: 'none', background: 'none', width: '100%', textAlign: 'left', color: 'var(--color-danger)' }}
        >
          <span style={{ fontSize: 16 }}>🚪</span>
          Sign Out
        </button>
      </div>
    </div>
  );
}

// ─── Dashboard Home ──────────────────────────────────────────────────────────

export default function OrganizerDashboard() {
  const { organizer } = useAuth();
  const [stats, setStats] = useState<OrganizerStats | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([eventsAPI.getStats(), eventsAPI.getMyEvents()])
      .then(([statsRes, eventsRes]) => {
        setStats(statsRes.stats);
        setEvents(eventsRes.events.slice(0, 5));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (status: Event['status']) => {
    const labels: Record<Event['status'], string> = {
      published: 'Open', ongoing: 'Live', draft: 'Draft', completed: 'Ended', cancelled: 'Cancelled'
    };
    return <span className={`badge badge-${status}`}>{labels[status]}</span>;
  };

  return (
    <div className="dashboard-layout">
      <OrganizerSidebar active="/organizer" />
      <div className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>Dashboard</h1>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Welcome back, {organizer?.name}</p>
          </div>
          <Link to="/organizer/create-event" className="btn btn-primary">
            + Create Event
          </Link>
        </div>

        <div className="dashboard-content">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
          ) : (
            <>
              {/* Stats */}
              <div className="stats-grid" style={{ marginBottom: 32 }}>
                <div className="stat-card">
                  <div className="stat-card-value brand">{stats?.totalEvents ?? 0}</div>
                  <div className="stat-card-label">Total Events</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-value accent">{stats?.activeEvents ?? 0}</div>
                  <div className="stat-card-label">Active Events</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-value">{stats?.registeredTeams ?? 0}</div>
                  <div className="stat-card-label">Registered Teams</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-value">{stats?.totalParticipants ?? 0}</div>
                  <div className="stat-card-label">Total Participants</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-value success">{stats?.present ?? 0}</div>
                  <div className="stat-card-label">Present</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-value danger">{stats?.absent ?? 0}</div>
                  <div className="stat-card-label">Absent</div>
                </div>
              </div>

              {/* Recent Events */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>Recent Events</h2>
                <Link to="/organizer/events" className="btn btn-ghost btn-sm">View All</Link>
              </div>

              {events.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-state-icon">📅</span>
                  <h3>No events yet</h3>
                  <p>Create your first event to get started.</p>
                  <Link to="/organizer/create-event" className="btn btn-primary">Create Event</Link>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Date</th>
                        <th>Teams</th>
                        <th>Status</th>
                        <th>Attendance</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((ev) => (
                        <tr key={ev._id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{ev.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{ev.venue}</div>
                          </td>
                          <td style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                            {new Date(ev.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td style={{ fontSize: 14, fontWeight: 600 }}>
                            {ev.registrationCount} / {ev.maxTeams}
                          </td>
                          <td>{getStatusBadge(ev.status)}</td>
                          <td>
                            <span className={`badge badge-${ev.attendanceStatus === 'active' ? 'ongoing' : ev.attendanceStatus === 'ended' ? 'completed' : 'draft'}`}>
                              {ev.attendanceStatus === 'not_started' ? 'Not Started' : ev.attendanceStatus === 'active' ? 'Live' : 'Ended'}
                            </span>
                          </td>
                          <td>
                            <Link to={`/organizer/events/${ev._id}`} className="btn btn-outline btn-sm">Manage</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
