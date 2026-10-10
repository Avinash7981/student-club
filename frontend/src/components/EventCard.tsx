
import { Event } from '../api';
import { Link } from 'react-router-dom';
import AnimatedButton from './AnimatedButton';

interface EventCardProps {
  event: Event;
}

const CATEGORY_COLORS: Record<string, string> = {
  Technical: 'var(--color-brand)',
  Cultural: 'var(--color-accent)',
  Design: 'var(--color-success)',
  Sports: 'var(--color-warning)',
  Management: 'var(--color-danger)',
};

const CATEGORY_BG: Record<string, string> = {
  Technical: 'linear-gradient(135deg, var(--color-brand) 0%, var(--color-brand-dark) 100%)',
  Cultural: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-text-secondary) 100%)',
  Design: 'linear-gradient(135deg, var(--color-success) 0%, var(--color-text-primary) 100%)',
  Sports: 'linear-gradient(135deg, var(--color-warning) 0%, var(--color-text-secondary) 100%)',
  Management: 'linear-gradient(135deg, var(--color-danger) 0%, var(--color-text-primary) 100%)',
};

function StatusBadge({ status }: { status: Event['status'] }) {
  const labels: Record<Event['status'], string> = {
    published: 'Open',
    ongoing: 'Live Now',
    draft: 'Draft',
    completed: 'Ended',
    cancelled: 'Cancelled',
  };
  return <span className={`badge badge-${status}`}>{labels[status]}</span>;
}

export default function EventCard({ event }: EventCardProps) {
  const pct = event.maxTeams > 0 ? Math.round((event.registrationCount / event.maxTeams) * 100) : 0;
  const isFull = pct >= 100;
  const isDeadlinePassed = new Date() > new Date(event.registrationDeadline);
  const canRegister = event.status === 'published' && !isFull && !isDeadlinePassed;
  const catColor = CATEGORY_COLORS[event.category] || 'var(--color-brand)';
  const catBg = CATEGORY_BG[event.category] || CATEGORY_BG.Technical;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <Link to={`/events/${event.slug}`} className="event-card" style={{ textDecoration: 'none' }}>
      <div className="event-card-banner-placeholder" style={{ background: catBg }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: 38, fontWeight: 900, color: 'rgba(255,255,255,0.15)', letterSpacing: '-1px', lineHeight: 1 }}>
            {event.category.toUpperCase()}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginTop: 8, letterSpacing: '1px', textTransform: 'uppercase' }}>
            {event.organizerName}
          </div>
        </div>
      </div>

      <div className="event-card-body">
        <div className="flex items-center justify-between gap-2">
          <span className="event-card-organizer" style={{ color: catColor }}>{event.organizerName}</span>
          <StatusBadge status={event.status} />
        </div>

        <h3 className="event-card-title">{event.title}</h3>
        <p className="event-card-desc">{event.shortDescription}</p>

        <div className="event-card-meta">
          <div className="event-card-meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>{formatDate(event.startDate)} · {event.startTime}</span>
          </div>
          <div className="event-card-meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            <span>{event.venue}</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              {event.registrationCount} / {event.maxTeams} Teams
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: isFull ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
              {isFull ? 'Full' : `${event.maxTeams - event.registrationCount} spots left`}
            </span>
          </div>
          <div className="capacity-bar">
            <div
              className={`capacity-fill${pct >= 100 ? ' full' : pct >= 80 ? ' high' : ''}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        </div>

        <div className="event-card-footer">
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            Team size: {event.minTeamSize}–{event.maxTeamSize} members
          </span>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <AnimatedButton
              label={isFull ? 'Full' : isDeadlinePassed ? 'Closed' : 'Register'}
              hoverLabel={isFull ? 'Full' : isDeadlinePassed ? 'Closed' : 'Join Now'}
              variant={canRegister ? 'primary' : 'secondary'}
              onClick={(e) => {
                if (!canRegister) e.preventDefault();
              }}
              style={{ pointerEvents: canRegister ? 'auto' : 'none' }}
              className="btn-sm"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
