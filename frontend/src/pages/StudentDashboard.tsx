import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { eventsAPI, registrationsAPI, Event, Registration } from '../api';
import Navbar from '../components/Navbar';
import EventCard from '../components/EventCard';
import EventTicket from '../components/EventTicket';

export default function StudentDashboard() {
  const { student } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student) return;
    Promise.all([
      eventsAPI.getPublished(),
      registrationsAPI.getByRoll(student.rollNumber)
    ]).then(([eventsRes, regsRes]) => {
      setEvents(eventsRes.events);
      setRegistrations(regsRes.registrations);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [student]);

  if (!student) return null;

  if (loading) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>
      </div>
    );
  }

  const upcomingEvents = registrations.filter(r => new Date((r.event as Event).startDate) > new Date());

  return (
    <div className="page-wrapper">
      <Navbar />

      <div className="container section">
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Welcome back, {student.name.split(' ')[0]} 👋</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 32, fontSize: 15 }}>
          Here is what's happening around campus.
        </p>

        {/* Overview Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 40 }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Available Events</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-brand)', marginTop: 8 }}>{events.length}</div>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>My Registrations</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-text-primary)', marginTop: 8 }}>{registrations.length}</div>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Upcoming Events</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-text-primary)', marginTop: 8 }}>{upcomingEvents.length}</div>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Tickets Available</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-text-primary)', marginTop: 8 }}>{registrations.filter(r => r.status === 'registered').length}</div>
          </div>
        </div>

        {/* Upcoming Tickets / Registrations */}
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>My Registrations & Tickets</h2>
        {registrations.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🎟️</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No events on your schedule yet.</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>Discover upcoming events, find your community, and reserve your place.</p>
            <Link to="/" className="btn btn-brand">Explore Events</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, marginBottom: 40 }}>
            {registrations.map(reg => (
              <div key={reg._id} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <EventTicket
                  event={reg.event as Event}
                  registration={reg}
                />
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <Link to={`/events/${(reg.event as Event).slug}`} className="btn btn-outline btn-sm">View Event</Link>
                  {(reg.event as Event).attendanceStatus === 'active' && (
                    <Link to={`/student/attendance/${(reg.event as Event)._id}`} className="btn btn-brand btn-sm">Mark Attendance</Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Discover Events */}
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20, marginTop: 40 }}>Discover Events</h2>
        {events.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>No published events at the moment.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
