import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { eventsAPI, registrationsAPI, exportAPI, Event, Registration, AttendanceStats } from '../../api';
import { OrganizerSidebar } from './OrganizerDashboard';

type Tab = 'overview' | 'registrations' | 'attendance' | 'roadmap' | 'export';

export default function EventManagePage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);

  const loadEvent = useCallback(() => {
    if (!id) return;
    eventsAPI.getById(id).then((res) => setEvent(res.event)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { loadEvent(); }, [loadEvent]);

  if (loading) return (
    <div className="dashboard-layout">
      <OrganizerSidebar active="/organizer/events" />
      <div className="dashboard-main">
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>
      </div>
    </div>
  );

  if (!event) return null;

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'registrations', label: 'Registrations', icon: '👥' },
    { key: 'attendance', label: 'Attendance', icon: '✓' },
    { key: 'roadmap', label: 'Roadmap', icon: '🗓️' },
    { key: 'export', label: 'Export', icon: '⬇' },
  ];

  const statusBadge = (status: Event['status']) => {
    const labels: Record<Event['status'], string> = { published: 'Open', ongoing: 'Live', draft: 'Draft', completed: 'Ended', cancelled: 'Cancelled' };
    return <span className={`badge badge-${status}`}>{labels[status]}</span>;
  };

  return (
    <div className="dashboard-layout">
      <OrganizerSidebar active="/organizer/events" />
      <div className="dashboard-main">
        {/* Header */}
        <div className="dashboard-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Link to="/organizer/events" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: 13 }}>← Events</Link>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</h1>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              {statusBadge(event.status)}
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                {new Date(event.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {event.venue}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <EventActions event={event} onUpdate={loadEvent} />
          </div>
        </div>

        {/* Tabs */}
        <div style={{ borderBottom: '1px solid var(--color-border)', padding: '0 32px' }}>
          <div className="tabs" style={{ marginBottom: 0 }}>
            {tabs.map((t) => (
              <button key={t.key} className={`tab${activeTab === t.key ? ' active' : ''}`} onClick={() => setActiveTab(t.key)}>
                <span>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="dashboard-content">
          {activeTab === 'overview' && <OverviewTab event={event} />}
          {activeTab === 'registrations' && <RegistrationsTab eventId={event._id} />}
          {activeTab === 'attendance' && <AttendanceTab event={event} />}
          {activeTab === 'roadmap' && <RoadmapTab event={event} />}
          {activeTab === 'export' && <ExportTab event={event} />}
        </div>
      </div>
    </div>
  );
}

// ─── Event Actions ─────────────────────────────────────────────────────────────

function EventActions({ event, onUpdate }: { event: Event; onUpdate: () => void }) {
  const [loading, setLoading] = useState('');
  const [confirmEnd, setConfirmEnd] = useState(false);

  const doAction = async (action: () => Promise<unknown>, key: string) => {
    setLoading(key);
    try { await action(); onUpdate(); } catch (e) { console.error(e); } finally { setLoading(''); }
  };

  return (
    <>
      {event.status === 'draft' && (
        <button className="btn btn-success btn-sm" disabled={!!loading} onClick={() => doAction(() => eventsAPI.publish(event._id), 'publish')}>
          {loading === 'publish' ? '...' : 'Publish'}
        </button>
      )}
      {event.status === 'published' && (
        <>
          <button className="btn btn-ghost btn-sm" disabled={!!loading} onClick={() => doAction(() => eventsAPI.unpublish(event._id), 'unpublish')}>Unpublish</button>
          <button className="btn btn-primary btn-sm" disabled={!!loading} onClick={() => doAction(() => eventsAPI.startAttendance(event._id), 'start')}>
            {loading === 'start' ? '...' : '▶ Start Attendance'}
          </button>
        </>
      )}
      {event.attendanceStatus === 'active' && (
        <>
          {!confirmEnd ? (
            <button className="btn btn-danger btn-sm" onClick={() => setConfirmEnd(true)}>⏹ End Attendance</button>
          ) : (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--color-danger)', fontWeight: 600 }}>End attendance?</span>
              <button className="btn btn-danger btn-sm" disabled={!!loading} onClick={() => { setConfirmEnd(false); doAction(() => eventsAPI.endAttendance(event._id), 'end'); }}>Yes, End</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmEnd(false)}>Cancel</button>
            </div>
          )}
        </>
      )}
    </>
  );
}

// ─── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ event }: { event: Event }) {
  const [stats, setStats] = useState<AttendanceStats | null>(null);

  useEffect(() => {
    registrationsAPI.getAttendanceStats(event._id).then((res) => setStats(res.stats)).catch(console.error);
  }, [event._id]);

  return (
    <div>
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-card-value">{stats?.registeredTeams ?? event.registrationCount}</div>
          <div className="stat-card-label">Registered Teams</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value brand">{stats?.totalParticipants ?? 0}</div>
          <div className="stat-card-label">Participants</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value success">{stats?.present ?? 0}</div>
          <div className="stat-card-label">Present</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value danger">{stats?.absent ?? 0}</div>
          <div className="stat-card-label">Absent</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value warning">{stats?.notChecked ?? 0}</div>
          <div className="stat-card-label">Not Checked</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value accent">{stats?.attendanceRate ?? 0}%</div>
          <div className="stat-card-label">Attendance Rate</div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Event Info</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 32px' }}>
            <InfoRow label="Date" value={new Date(event.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />
            <InfoRow label="Time" value={`${event.startTime} – ${event.endTime}`} />
            <InfoRow label="Venue" value={event.venue} />
            <InfoRow label="Team Size" value={`${event.minTeamSize}–${event.maxTeamSize} members`} />
            <InfoRow label="Capacity" value={`${event.registrationCount} / ${event.maxTeams} teams`} />
            <InfoRow label="Deadline" value={new Date(event.registrationDeadline).toLocaleDateString('en-IN')} />
            <InfoRow label="Eligibility" value={event.eligibility} />
            <InfoRow label="Attendance" value={event.attendanceStatus === 'not_started' ? 'Not Started' : event.attendanceStatus === 'active' ? '🔴 Live' : '✓ Ended'} />
          </div>
        </div>
      </div>

      {/* QR Code Display */}
      {event.attendanceStatus === 'active' && event.attendanceQRCode && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-body" style={{ textAlign: 'center' }}>
            <h3 style={{ fontWeight: 700, marginBottom: 4 }}>🔴 Attendance QR Code — Live</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 20 }}>
              Display this QR code at the venue. Students scan to check in automatically.
            </p>
            <img src={event.attendanceQRCode} alt="Attendance QR" style={{ width: 220, height: 220, borderRadius: 12, border: '4px solid var(--color-border)' }} />
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 12 }}>
              QR encodes event ID for secure attendance tracking
            </p>
            {event.attendanceToken && (
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Or use manual check-in code:</p>
                <code style={{ fontSize: 16, background: 'var(--color-bg-inset)', padding: '8px 16px', borderRadius: 8, letterSpacing: 1 }}>{event.attendanceToken}</code>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>
                  Link: <a href={`/student/attendance/${event._id}?token=${event.attendanceToken}`} target="_blank" rel="noreferrer">/student/attendance/{event._id}?token={event.attendanceToken}</a>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>{value}</div>
    </div>
  );
}

// ─── Registrations Tab ──────────────────────────────────────────────────────────

function RegistrationsTab({ eventId }: { eventId: string }) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    registrationsAPI.getEventRegistrations(eventId, { search: debouncedSearch })
      .then((res) => setRegistrations(res.registrations))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [eventId, debouncedSearch]);

  const toggle = (id: string) => {
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <div className="search-input-wrapper" style={{ flex: 1, maxWidth: 400 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input className="form-input" placeholder="Search by team, name, or roll number..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>{registrations.length} team{registrations.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : registrations.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">👥</span>
          <h3>{search ? 'No results found' : 'No registrations yet'}</h3>
          <p>{search ? 'Try a different search term.' : 'Teams will appear here after registration.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {registrations.map((reg) => (
            <TeamCard key={reg._id} reg={reg} expanded={expandedTeams.has(reg._id)} onToggle={() => toggle(reg._id)} showAttendance={false} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Attendance Tab ──────────────────────────────────────────────────────────────

function AttendanceTab({ event }: { event: Event }) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'present' | 'absent' | 'not_checked'>('all');
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [updatingId, setUpdatingId] = useState('');

  const loadData = useCallback(() => {
    Promise.all([
      registrationsAPI.getEventRegistrations(event._id, {}),
      registrationsAPI.getAttendanceStats(event._id),
    ]).then(([regRes, statsRes]) => {
      setRegistrations(regRes.registrations);
      setStats(statsRes.stats);
    }).catch(console.error).finally(() => setLoading(false));
  }, [event._id]);

  useEffect(() => { 
    loadData(); 
    if (event.attendanceStatus === 'active') {
      const interval = setInterval(loadData, 5000);
      return () => clearInterval(interval);
    }
  }, [loadData, event.attendanceStatus]);

  const toggle = (id: string) => {
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const markAttendance = async (registrationId: string, memberIndex: number, status: 'present' | 'absent' | 'not_checked') => {
    setUpdatingId(`${registrationId}-${memberIndex}`);
    try {
      await registrationsAPI.markAttendance({ registrationId, memberIndex, status });
      loadData();
    } catch (e) { console.error(e); }
    finally { setUpdatingId(''); }
  };

  const filteredRegs = registrations.filter((reg) => {
    const allM = [reg.teamLeader, ...reg.members];
    if (filter === 'present') return allM.some((m) => m.attendanceStatus === 'present');
    if (filter === 'absent') return allM.some((m) => m.attendanceStatus === 'absent');
    if (filter === 'not_checked') return allM.some((m) => m.attendanceStatus === 'not_checked');
    return true;
  }).filter((reg) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const allM = [reg.teamLeader, ...reg.members];
    return reg.teamName.toLowerCase().includes(s) || allM.some((m) => m.fullName.toLowerCase().includes(s) || m.rollNumber.toLowerCase().includes(s));
  });

  return (
    <div>
      {/* Live stats */}
      {stats && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-card-value">{stats.totalParticipants}</div>
            <div className="stat-card-label">Participants</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value success">{stats.present}</div>
            <div className="stat-card-label">Present</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value danger">{stats.absent}</div>
            <div className="stat-card-label">Absent</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value warning">{stats.notChecked}</div>
            <div className="stat-card-label">Not Checked</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value accent">{stats.attendanceRate}%</div>
            <div className="stat-card-label">Rate</div>
          </div>
        </div>
      )}

      {event.attendanceStatus === 'not_started' && (
        <div className="alert alert-warning" style={{ marginBottom: 16 }}>
          ⚠️ Attendance has not been started yet. Go to Overview tab to start attendance.
        </div>
      )}

      {event.attendanceStatus === 'ended' && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          ✓ Attendance has been finalized. You can still view and modify records.
        </div>
      )}

      {/* QR Scanner Widget (simplified inline) */}
      {event.attendanceStatus === 'active' && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body">
            <h3 style={{ fontWeight: 700, marginBottom: 12 }}>🔴 Manual QR Check-in</h3>
            <QRCheckInWidget eventId={event._id} onCheckedIn={loadData} />
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-input-wrapper" style={{ flex: 1, maxWidth: 340 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input className="form-input" placeholder="Search name, roll, team..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {(['all', 'present', 'absent', 'not_checked'] as const).map((f) => (
          <button
            key={f}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f === 'not_checked' ? 'Not Checked' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <button className="btn btn-ghost btn-sm" onClick={loadData} title="Refresh">↻ Refresh</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : filteredRegs.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">✓</span>
          <h3>No teams match the filter</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredRegs.map((reg) => (
            <TeamCard
              key={reg._id}
              reg={reg}
              expanded={expandedTeams.has(reg._id)}
              onToggle={() => toggle(reg._id)}
              showAttendance
              onMarkAttendance={markAttendance}
              updatingId={updatingId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── QR Check-In Widget ────────────────────────────────────────────────────────

function QRCheckInWidget({ eventId, onCheckedIn }: { eventId: string; onCheckedIn: () => void }) {
  const [rollNumber, setRollNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; studentName?: string; teamName?: string; checkInTime?: string } | null>(null);

  const checkIn = async () => {
    if (!rollNumber.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await registrationsAPI.qrCheckIn({ eventId, rollNumber: rollNumber.trim() });
      setResult({ success: true, message: 'Attendance Recorded!', studentName: res.studentName, teamName: res.teamName, checkInTime: res.checkInTime });
      setRollNumber('');
      onCheckedIn();
    } catch (err: unknown) {
      setResult({ success: false, message: err instanceof Error ? err.message : 'Check-in failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, maxWidth: 320 }}>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 10 }}>
          Manually mark attendance by entering a student's roll number (simulates QR scan).
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="form-input"
            placeholder="Roll Number"
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && checkIn()}
          />
          <button className="btn btn-primary" disabled={loading || !rollNumber.trim()} onClick={checkIn}>
            {loading ? '...' : 'Check In'}
          </button>
        </div>
      </div>
      {result && (
        <div className={`alert ${result.success ? 'alert-success' : 'alert-error'}`} style={{ flex: 1 }}>
          <div>
            <div style={{ fontWeight: 700 }}>{result.message}</div>
            {result.success && result.studentName && (
              <div style={{ fontSize: 13, marginTop: 4 }}>
                {result.studentName} · {result.teamName} · {result.checkInTime}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Export Tab ───────────────────────────────────────────────────────────────

function ExportTab({ event }: { event: Event }) {
  const [exporting, setExporting] = useState('');
  const [regFormat, setRegFormat] = useState('xlsx');
  const [attFormat, setAttFormat] = useState('xlsx');

  const doExport = async (type: 'registrations' | 'attendance') => {
    setExporting(type);
    try {
      if (type === 'registrations') await exportAPI.downloadRegistrations(event._id, regFormat);
      else await exportAPI.downloadAttendance(event._id, attFormat);
    } catch (e: any) { 
      console.error(e);
      alert(e.message || 'Export failed');
    }
    finally { setExporting(''); }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 28 }}>
        Export data in Excel (.xlsx), CSV, or PDF format.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 36 }}>📋</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Export Registered Teams</h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                Team-wise list with S.No., Team No., Team Name, Names, Roll Numbers
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <select className="form-input" value={regFormat} onChange={(e) => setRegFormat(e.target.value)} style={{ padding: '8px 12px' }}>
                <option value="xlsx">Excel (.xlsx)</option>
                <option value="csv">CSV (.csv)</option>
                <option value="pdf">PDF (.pdf)</option>
              </select>
              <button
                className="btn btn-primary"
                disabled={!!exporting}
                onClick={() => doExport('registrations')}
              >
                {exporting === 'registrations' ? <><span className="spinner" style={{ width: 14, height: 14 }} />Exporting...</> : '⬇ Download'}
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 36 }}>✅</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Export Attendance Report</h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                Full attendance data with PRESENT/ABSENT status and check-in times, team-wise
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <select className="form-input" value={attFormat} onChange={(e) => setAttFormat(e.target.value)} style={{ padding: '8px 12px' }}>
                <option value="xlsx">Excel (.xlsx)</option>
                <option value="csv">CSV (.csv)</option>
                <option value="pdf">PDF (.pdf)</option>
              </select>
              <button
                className="btn btn-primary"
                disabled={!!exporting}
                onClick={() => doExport('attendance')}
              >
                {exporting === 'attendance' ? <><span className="spinner" style={{ width: 14, height: 14 }} />Exporting...</> : '⬇ Download'}
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body" style={{ background: 'var(--color-brand-light)', border: '1px solid var(--color-border)' }}>
            <h4 style={{ fontWeight: 700, marginBottom: 8, color: 'var(--color-brand-dark)' }}>📄 Export Format</h4>
            <p style={{ fontSize: 13, color: 'var(--color-brand-dark)', lineHeight: 1.7 }}>
              Each team spans multiple rows (one per member). S.No., Team No., and Team Name cells are merged.<br/>
              Headers are bold with dark primary background. PRESENT rows are highlighted green, ABSENT red.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Team Card Component ───────────────────────────────────────────────────────

interface TeamCardProps {
  reg: Registration;
  expanded: boolean;
  onToggle: () => void;
  showAttendance: boolean;
  onMarkAttendance?: (registrationId: string, memberIndex: number, status: 'present' | 'absent' | 'not_checked') => void;
  updatingId?: string;
}

function TeamCard({ reg, expanded, onToggle, showAttendance, onMarkAttendance, updatingId }: TeamCardProps) {
  const allMembers = [reg.teamLeader, ...reg.members];
  const presentCount = allMembers.filter((m) => m.attendanceStatus === 'present').length;

  const teamAttStatusColor = reg.teamAttendanceStatus === 'full'
    ? 'var(--color-success)' : reg.teamAttendanceStatus === 'partial'
    ? 'var(--color-warning)' : reg.teamAttendanceStatus === 'absent'
    ? 'var(--color-danger)' : 'var(--color-text-muted)';

  const teamAttIcon = reg.teamAttendanceStatus === 'full' ? '✓' : reg.teamAttendanceStatus === 'partial' ? '⚠' : reg.teamAttendanceStatus === 'absent' ? '✕' : '○';

  return (
    <div className="team-card">
      <div className="team-card-header" onClick={onToggle}>
        <span className="team-card-id">{reg.teamId}</span>
        <div style={{ flex: 1 }}>
          <div className="team-card-name">{reg.teamName}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
            Leader: {reg.teamLeader.fullName} · {allMembers.length} member{allMembers.length !== 1 ? 's' : ''}
          </div>
        </div>
        {showAttendance && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: teamAttStatusColor }}>
              {teamAttIcon} {presentCount}/{allMembers.length} Present
            </span>
          </div>
        )}
        <span style={{ color: 'var(--color-text-muted)', fontSize: 18, fontWeight: 300, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>⌄</span>
      </div>

      {expanded && (
        <div style={{ padding: '0 20px 16px' }}>
          {allMembers.map((member, idx) => {
            const memberIndex = idx === 0 ? -1 : idx - 1;
            const isUpdating = updatingId === `${reg._id}-${memberIndex}`;

            return (
              <div key={idx} className="member-row">
                <div className="member-info">
                  <div className="member-name">
                    {member.fullName}
                    {idx === 0 && <span className="member-role-tag" style={{ marginLeft: 8 }}>Leader</span>}
                  </div>
                  <div className="member-roll">{member.rollNumber} · {member.department} · {member.year}</div>
                  {member.attendanceStatus === 'present' && member.checkInTime && (
                    <div style={{ fontSize: 11, color: 'var(--color-success)', marginTop: 2 }}>
                      ✓ Checked in: {new Date(member.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
                {showAttendance ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isUpdating ? (
                      <div className="spinner" />
                    ) : (
                      <div className="att-toggle">
                        <button
                          className={member.attendanceStatus === 'present' ? 'active-present' : ''}
                          onClick={() => onMarkAttendance?.(reg._id, memberIndex, member.attendanceStatus === 'present' ? 'not_checked' : 'present')}
                          title="Mark Present"
                        >
                          ✓ Present
                        </button>
                        <button
                          className={member.attendanceStatus === 'absent' ? 'active-absent' : ''}
                          onClick={() => onMarkAttendance?.(reg._id, memberIndex, member.attendanceStatus === 'absent' ? 'not_checked' : 'absent')}
                          title="Mark Absent"
                        >
                          ✕ Absent
                        </button>
                      </div>
                    )}
                    <span className={`badge badge-${member.attendanceStatus === 'present' ? 'present' : member.attendanceStatus === 'absent' ? 'absent' : 'not-checked'}`}>
                      {member.attendanceStatus === 'not_checked' ? 'Not Checked' : member.attendanceStatus.charAt(0).toUpperCase() + member.attendanceStatus.slice(1)}
                    </span>
                  </div>
                ) : (
                  <span className="badge badge-published">Registered</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Roadmap Tab ──────────────────────────────────────────────────────────────

function RoadmapTab({ event }: { event: Event }) {
  const [roadmap, setRoadmap] = useState(event.roadmap || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addEntry = () => {
    setRoadmap([
      ...roadmap,
      { id: Date.now().toString(), title: '', description: '', startTime: '', endTime: '', venue: '', type: 'session', order: roadmap.length + 1 }
    ]);
  };

  const updateEntry = (index: number, key: string, value: any) => {
    const newR = [...roadmap];
    newR[index] = { ...newR[index], [key]: value };
    setRoadmap(newR);
  };

  const removeEntry = (index: number) => {
    setRoadmap(roadmap.filter((_, i) => i !== index));
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await eventsAPI.update(event._id, { roadmap });
      alert('Roadmap saved successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to save roadmap');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 800 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Event Roadmap & Schedule</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Build a chronological timeline for your event.</p>
        </div>
        <button className="btn btn-brand" onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save Roadmap'}
        </button>
      </div>

      {error && <div style={{ background: 'var(--color-danger)', color: '#fff', padding: '12px 16px', borderRadius: 8 }}>{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {roadmap.map((entry, idx) => (
          <div key={entry.id} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontWeight: 600 }}>Entry {idx + 1}</div>
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => removeEntry(idx)}>Remove</button>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Activity Title</label>
                <input className="form-input" placeholder="e.g. Opening Ceremony" value={entry.title} onChange={(e) => updateEntry(idx, 'title', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Venue / Room</label>
                <input className="form-input" placeholder="e.g. Main Hall" value={entry.venue} onChange={(e) => updateEntry(idx, 'venue', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input className="form-input" placeholder="09:00 AM" value={entry.startTime} onChange={(e) => updateEntry(idx, 'startTime', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">End Time</label>
                <input className="form-input" placeholder="10:00 AM" value={entry.endTime} onChange={(e) => updateEntry(idx, 'endTime', e.target.value)} />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Description (Optional)</label>
              <textarea className="form-textarea" placeholder="Brief description of what will happen..." value={entry.description} onChange={(e) => updateEntry(idx, 'description', e.target.value)} style={{ minHeight: 60 }} />
            </div>
            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Order</label>
              <input className="form-input" type="number" value={entry.order} onChange={(e) => updateEntry(idx, 'order', +e.target.value)} />
            </div>
          </div>
        ))}

        <button className="btn btn-outline" style={{ borderStyle: 'dashed', padding: 20, justifyContent: 'center' }} onClick={addEntry}>
          + Add Schedule Entry
        </button>
      </div>
    </div>
  );
}
