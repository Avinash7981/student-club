import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventsAPI, Event } from '../../api';
import { OrganizerSidebar } from './OrganizerDashboard';

export default function MyEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);

  const load = () => {
    eventsAPI.getMyEvents().then((res) => setEvents(res.events)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const togglePublish = async (event: Event) => {
    setPublishing(event._id);
    try {
      if (event.status === 'published') await eventsAPI.unpublish(event._id);
      else await eventsAPI.publish(event._id);
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setPublishing(null);
    }
  };

  const getStatusBadge = (status: Event['status']) => {
    const labels: Record<Event['status'], string> = {
      published: 'Open', ongoing: 'Live', draft: 'Draft', completed: 'Ended', cancelled: 'Cancelled'
    };
    return <span className={`badge badge-${status}`}>{labels[status]}</span>;
  };

  return (
    <div className="dashboard-layout">
      <OrganizerSidebar active="/organizer/events" />
      <div className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>My Events</h1>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>{events.length} event{events.length !== 1 ? 's' : ''} created</p>
          </div>
          <Link to="/organizer/create-event" className="btn btn-primary">+ Create Event</Link>
        </div>

        <div className="dashboard-content">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
          ) : events.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">📅</span>
              <h3>No events created yet</h3>
              <p>Create your first event to get started.</p>
              <Link to="/organizer/create-event" className="btn btn-primary">Create Event</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {events.map((ev) => (
                <div key={ev._id} className="card">
                  <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                        {getStatusBadge(ev.status)}
                        <span className={`badge badge-${ev.attendanceStatus === 'active' ? 'ongoing' : 'draft'}`}>
                          {ev.attendanceStatus === 'not_started' ? 'Attendance: Not Started' : ev.attendanceStatus === 'active' ? 'Attendance: Live' : 'Attendance: Ended'}
                        </span>
                      </div>
                      <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{ev.title}</h3>
                      <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                        {new Date(ev.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {ev.venue}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: 24, padding: '0 16px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-brand)' }}>{ev.registrationCount}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Teams</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 800 }}>{ev.maxTeams}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Capacity</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      {ev.status === 'draft' && (
                        <button
                          className="btn btn-success btn-sm"
                          disabled={publishing === ev._id}
                          onClick={() => togglePublish(ev)}
                        >
                          Publish
                        </button>
                      )}
                      {ev.status === 'published' && (
                        <button
                          className="btn btn-ghost btn-sm"
                          disabled={publishing === ev._id}
                          onClick={() => togglePublish(ev)}
                        >
                          Unpublish
                        </button>
                      )}
                      <Link to={`/organizer/events/${ev._id}`} className="btn btn-primary btn-sm">Manage</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
