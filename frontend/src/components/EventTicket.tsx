import './EventTicket.css';

interface EventTicketProps {
  registration: any;
  event: any;
}

export default function EventTicket({ registration, event }: EventTicketProps) {
  const dateStr = event?.startDate 
    ? new Date(event.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Date TBD';
    
  // Generate random barcode lines for decorative purposes
  const barcodeLines = [4, 2, 6, 2, 8, 3, 2, 5, 2, 7, 2, 4, 3];
    
  return (
    <div className="ticket-wrapper">
      <div className="ticket-container">
        <div className="ticket-main">
          <div className="ticket-header">
            <div>
              <div className="ticket-label">{event?.organizerName || 'Student Club'}</div>
              <h3 className="ticket-title">{event?.title || 'Event Registration'}</h3>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: 13, fontWeight: 600 }}>
                {event?.category}
              </div>
            </div>
            {event?.status && (
              <span className={`badge badge-${event.status}`}>
                {event.status === 'published' ? 'Confirmed' : event.status}
              </span>
            )}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px', marginTop: 24 }}>
            <div>
              <div className="ticket-label">Date & Time</div>
              <div className="ticket-value highlight">{dateStr}<br/>{event?.startTime || 'TBD'}</div>
            </div>
            <div>
              <div className="ticket-label">Venue</div>
              <div className="ticket-value highlight">{event?.venue || 'TBD'}</div>
            </div>
            {registration?.teamName && (
              <div>
                <div className="ticket-label">Team</div>
                <div className="ticket-value">{registration.teamName}</div>
              </div>
            )}
            <div>
              <div className="ticket-label">Participant</div>
              <div className="ticket-value">{registration?.teamLeader?.name || 'Attendee'}</div>
            </div>
          </div>
        </div>
        
        <div className="ticket-stub">
          <div className="ticket-barcode" aria-hidden="true">
            {barcodeLines.map((width, i) => (
              <div key={i} className="ticket-barcode-line" style={{ width: `${width}px` }} />
            ))}
          </div>
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div className="ticket-label">Admit One</div>
            <div className="ticket-label" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, marginTop: 8, color: 'var(--color-text-primary)' }}>
              {registration?.registrationId || 'SC-REG-000'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
