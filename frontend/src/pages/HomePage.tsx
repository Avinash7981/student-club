import { useState, useEffect } from 'react';
import { eventsAPI, Event } from '../api';
import Navbar from '../components/Navbar';
import EventCard from '../components/EventCard';

const CATEGORIES = ['All', 'Technical', 'Cultural', 'Design', 'Sports', 'Management'];

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    eventsAPI
      .getPublished({ search: debouncedSearch, category: category === 'All' ? undefined : category })
      .then((res) => setEvents(res.events))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [debouncedSearch, category]);

  return (
    <div className="page-wrapper">
      <Navbar />

      {/* Hero */}
      <div className="hero">
        <div className="hero-eyebrow">🎓 Student Club Platform</div>
        <h1 className="hero-title">
          Discover. Register.<br /><span>Participate.</span>
        </h1>
        <p className="hero-subtitle">
          Everything happening across your campus, in one place.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#events" className="btn btn-primary btn-lg">Explore Events</a>
          <a href="/my-registrations" className="btn btn-ghost btn-lg">My Registrations</a>
        </div>
      </div>

      {/* Events Section */}
      <div id="events" className="container section">
        <div className="section-header">
          <h2 className="section-title">Upcoming Events</h2>
          <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
            {events.length} event{events.length !== 1 ? 's' : ''} found
          </span>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          <div className="search-input-wrapper" style={{ flex: '1', maxWidth: 360 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              className="form-input"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`btn btn-sm ${category === cat ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="events-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card">
                <div className="skeleton" style={{ height: 160 }} />
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="skeleton" style={{ height: 14, width: '60%', borderRadius: 4 }} />
                  <div className="skeleton" style={{ height: 22, width: '80%', borderRadius: 4 }} />
                  <div className="skeleton" style={{ height: 14, borderRadius: 4 }} />
                  <div className="skeleton" style={{ height: 14, width: '70%', borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">📅</span>
            <h3>No events found</h3>
            <p>Try changing your search or filter.</p>
          </div>
        ) : (
          <div className="events-grid">
            {events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
