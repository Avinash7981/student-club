import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsAPI, registrationsAPI, Event, RegistrationPayload } from '../api';
import Navbar from '../components/Navbar';
import AnimatedButton from '../components/AnimatedButton';

const DEPARTMENTS = ['CSE', 'IT', 'AIDS', 'ECE', 'EEE', 'MECH', 'CIVIL', 'MBA', 'MCA', 'Other'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'PG 1st Year', 'PG 2nd Year'];

interface MemberForm {
  fullName: string;
  rollNumber: string;
  email: string;
  phone: string;
  department: string;
  year: string;
}

const emptyMember = (): MemberForm => ({
  fullName: '', rollNumber: '', email: '', phone: '', department: 'CSE', year: '3rd Year',
});

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ teamId: string; registrationId: string; teamName: string } | null>(null);
  const [error, setError] = useState('');

  const [teamName, setTeamName] = useState('');
  const [leader, setLeader] = useState<MemberForm>(emptyMember());
  const [members, setMembers] = useState<MemberForm[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!slug) return;
    eventsAPI.getBySlug(slug).then((res) => {
      setEvent(res.event);
    }).catch(() => navigate('/')).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="page-wrapper">
      <Navbar />
      <div style={{ padding: 80, textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto' }} />
      </div>
    </div>
  );

  if (!event) return null;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const pct = event.maxTeams > 0 ? Math.round((event.registrationCount / event.maxTeams) * 100) : 0;
  const isFull = pct >= 100;
  const isDeadlinePassed = new Date() > new Date(event.registrationDeadline);
  const canRegister = event.status === 'published' && !isFull && !isDeadlinePassed;

  const addMember = () => {
    if (members.length < event.maxTeamSize - 1) setMembers([...members, emptyMember()]);
  };

  const removeMember = (idx: number) => setMembers(members.filter((_, i) => i !== idx));

  const updateMember = (idx: number, field: keyof MemberForm, value: string) => {
    const updated = [...members];
    updated[idx] = { ...updated[idx], [field]: value };
    setMembers(updated);
  };

  const updateLeader = (field: keyof MemberForm, value: string) => {
    setLeader({ ...leader, [field]: value });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!teamName.trim()) errs.teamName = 'Team name is required';
    if (!leader.fullName.trim()) errs['leader_fullName'] = 'Required';
    if (!leader.rollNumber.trim()) errs['leader_rollNumber'] = 'Required';
    if (!leader.email.trim() || !leader.email.includes('@')) errs['leader_email'] = 'Valid email required';
    if (!leader.department) errs['leader_department'] = 'Required';
    members.forEach((m, i) => {
      if (!m.fullName.trim()) errs[`member_${i}_fullName`] = 'Required';
      if (!m.rollNumber.trim()) errs[`member_${i}_rollNumber`] = 'Required';
      if (!m.email.trim() || !m.email.includes('@')) errs[`member_${i}_email`] = 'Valid email required';
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setError('');
    try {
      const payload: RegistrationPayload = {
        eventId: event._id,
        teamName: teamName.trim(),
        teamLeader: leader,
        members,
      };
      const res = await registrationsAPI.register(payload);
      setSuccess({
        teamId: res.registration.teamId,
        registrationId: res.registration.registrationId,
        teamName: res.registration.teamName,
      });
      setShowForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const CATEGORY_BG: Record<string, string> = {
    Technical: 'linear-gradient(135deg, var(--color-brand) 0%, var(--color-brand-dark) 100%)',
    Cultural: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-text-secondary) 100%)',
    Design: 'linear-gradient(135deg, var(--color-success) 0%, var(--color-text-primary) 100%)',
    Sports: 'linear-gradient(135deg, var(--color-warning) 0%, var(--color-text-secondary) 100%)',
    Management: 'linear-gradient(135deg, var(--color-danger) 0%, var(--color-text-primary) 100%)',
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      {/* Banner */}
      <div style={{ background: CATEGORY_BG[event.category] || CATEGORY_BG.Technical, padding: '60px 24px' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
                  {event.category}
                </span>
                {event.tags.map((tag) => (
                  <span key={tag} style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', padding: '4px 12px', borderRadius: 99, fontSize: 12 }}>
                    #{tag}
                  </span>
                ))}
              </div>
              <h1 style={{ color: '#fff', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-1px', marginBottom: 10 }}>
                {event.title}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>Organized by {event.organizerName}</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {canRegister && (
                <button className="btn btn-accent btn-lg" onClick={() => setShowForm(true)}>
                  Register Now
                </button>
              )}
              {isFull && <span className="badge badge-cancelled" style={{ fontSize: 14, padding: '8px 16px' }}>Registration Full</span>}
              {isDeadlinePassed && !isFull && <span className="badge badge-draft" style={{ fontSize: 14, padding: '8px 16px' }}>Registration Closed</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {success && (
        <div style={{ background: 'var(--color-success)', padding: '20px 24px' }}>
          <div className="container" style={{ textAlign: 'center', color: '#fff' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>✓ Registration Successful!</div>
            <div style={{ fontSize: 16, marginBottom: 4 }}>Team: <strong>{success.teamName}</strong></div>
            <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', marginTop: 12 }}>
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '10px 20px' }}>
                <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Team ID</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 18 }}>{success.teamId}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '10px 20px' }}>
                <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Registration ID</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 18 }}>{success.registrationId}</div>
              </div>
            </div>
            <p style={{ opacity: 0.8, marginTop: 12, fontSize: 13 }}>Save these IDs. You can view your registration anytime from "My Registrations".</p>
          </div>
        </div>
      )}

      <div className="container section">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'start' }}>
          {/* Main Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {/* About */}
            <div className="card">
              <div className="card-body">
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>About This Event</h2>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                  {event.description}
                </p>
              </div>
            </div>

            {/* Rules */}
            {event.rules.length > 0 && (
              <div className="card">
                <div className="card-body">
                  <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Rules & Guidelines</h2>
                  <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {event.rules.map((rule, i) => (
                      <li key={i} style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{rule}</li>
                    ))}
                  </ol>
                </div>
              </div>
            )}

            {/* Prizes */}
            {event.prizes && (
              <div className="card">
                <div className="card-body">
                  <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>🏆 Prizes</h2>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: 15 }}>{event.prizes}</p>
                </div>
              </div>
            )}

            {/* Event Roadmap */}
            {event.roadmap && event.roadmap.length > 0 ? (
              <div className="card">
                <div className="card-body">
                  <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>🗓️ Event Roadmap</h2>
                  <div style={{ position: 'relative', paddingLeft: 24, borderLeft: '2px solid var(--color-border)', marginLeft: 8 }}>
                    {[...event.roadmap].sort((a, b) => a.order - b.order).map((item, idx) => (
                      <div key={item.id} style={{ position: 'relative', marginBottom: idx === event.roadmap!.length - 1 ? 0 : 32 }}>
                        {/* Timeline dot */}
                        <div style={{ position: 'absolute', left: -32, top: 4, width: 14, height: 14, borderRadius: '50%', background: 'var(--color-surface)', border: '2px solid var(--color-brand)' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>{item.title}</h3>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-brand)', background: 'var(--color-brand-light)', padding: '2px 8px', borderRadius: 4 }}>
                              {item.startTime} - {item.endTime}
                            </span>
                          </div>
                          {item.venue && <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>📍 {item.venue}</div>}
                          {item.description && <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 4, lineHeight: 1.5 }}>{item.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="card-body">
                  <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>🗓️ Event Roadmap</h2>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 15, fontStyle: 'italic' }}>The event schedule has not been published yet.</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Quick Info */}
            <div className="card">
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Event Details</h3>

                <InfoRow icon="📅" label="Date" value={formatDate(event.startDate)} />
                <InfoRow icon="⏰" label="Time" value={`${event.startTime} – ${event.endTime}`} />
                <InfoRow icon="📍" label="Venue" value={event.venue} />
                <InfoRow icon="👥" label="Team Size" value={`${event.minTeamSize}–${event.maxTeamSize} members`} />
                <InfoRow icon="🎯" label="Eligibility" value={event.eligibility} />
                <InfoRow icon="⏳" label="Deadline" value={new Date(event.registrationDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />
                {event.registrationFee === 0
                  ? <InfoRow icon="💰" label="Fee" value="Free" />
                  : <InfoRow icon="💰" label="Fee" value={`₹${event.registrationFee}`} />
                }
              </div>
            </div>

            {/* Registration Progress */}
            <div className="card">
              <div className="card-body">
                <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Registration Progress</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                    {event.registrationCount} / {event.maxTeams} Teams
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: isFull ? 'var(--color-danger)' : 'var(--color-brand)' }}>
                    {pct}%
                  </span>
                </div>
                <div className="capacity-bar" style={{ height: 8 }}>
                  <div
                    className={`capacity-fill${pct >= 100 ? ' full' : pct >= 80 ? ' high' : ''}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>
                  {isFull ? 'No spots remaining' : `${event.maxTeams - event.registrationCount} spots remaining`}
                </p>
              </div>
            </div>

            {canRegister && (
              <AnimatedButton 
                className="w-full btn-lg" 
                variant="primary" 
                label="Register Now →" 
                hoverLabel="Secure Your Spot" 
                onClick={() => setShowForm(true)} 
              />
            )}
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700 }}>Register for {event.title}</h2>
                <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 4 }}>
                  Team size: {event.minTeamSize}–{event.maxTeamSize} members
                </p>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              {error && (
                <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>
              )}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Team Name */}
                <div className="form-group">
                  <label className="form-label">Team Name <span>*</span></label>
                  <input
                    className="form-input"
                    placeholder="Enter your team name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                  />
                  {errors.teamName && <span className="form-error">{errors.teamName}</span>}
                </div>

                {/* Team Leader */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>Team Leader</h3>
                    <span className="member-role-tag">Leader</span>
                  </div>
                  <MemberFormFields
                    prefix="leader"
                    values={leader}
                    onChange={(field, value) => updateLeader(field as keyof MemberForm, value)}
                    errors={errors}
                    showPhone
                  />
                </div>

                {/* Members */}
                {members.map((m, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700 }}>Member {idx + 2}</h3>
                      </div>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeMember(idx)}>
                        Remove
                      </button>
                    </div>
                    <MemberFormFields
                      prefix={`member_${idx}`}
                      values={m}
                      onChange={(field, value) => updateMember(idx, field as keyof MemberForm, value)}
                      errors={errors}
                    />
                  </div>
                ))}

                {members.length < event.maxTeamSize - 1 && (
                  <button type="button" className="btn btn-outline" onClick={addMember}>
                    + Add Team Member
                  </button>
                )}

                <div className="modal-footer" style={{ padding: '20px 0 0', margin: '0' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                  <AnimatedButton 
                    type="submit" 
                    variant="primary" 
                    isLoading={submitting} 
                    label="Submit Registration" 
                    hoverLabel="Confirm" 
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 14, color: 'var(--color-text-primary)', fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );
}

interface MemberFormFieldsProps {
  prefix: string;
  values: { fullName: string; rollNumber: string; email: string; phone?: string; department: string; year: string };
  onChange: (field: string, value: string) => void;
  errors: Record<string, string>;
  showPhone?: boolean;
}



function MemberFormFields({ prefix, values, onChange, errors, showPhone }: MemberFormFieldsProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '16px', background: 'var(--color-bg)', borderRadius: 10, border: '1px solid var(--color-border)' }}>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Full Name <span>*</span></label>
          <input className="form-input" placeholder="Full Name" value={values.fullName} onChange={(e) => onChange('fullName', e.target.value)} />
          {errors[`${prefix}_fullName`] && <span className="form-error">{errors[`${prefix}_fullName`]}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Roll Number <span>*</span></label>
          <input className="form-input" placeholder="e.g. 25MVCSDR0186" value={values.rollNumber} onChange={(e) => onChange('rollNumber', e.target.value)} />
          {errors[`${prefix}_rollNumber`] && <span className="form-error">{errors[`${prefix}_rollNumber`]}</span>}
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Email <span>*</span></label>
          <input className="form-input" type="email" placeholder="student@college.edu" value={values.email} onChange={(e) => onChange('email', e.target.value)} />
          {errors[`${prefix}_email`] && <span className="form-error">{errors[`${prefix}_email`]}</span>}
        </div>
        {showPhone && (
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" placeholder="10-digit mobile" value={values.phone || ''} onChange={(e) => onChange('phone', e.target.value)} />
          </div>
        )}
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Department <span>*</span></label>
          <select className="form-select" value={values.department} onChange={(e) => onChange('department', e.target.value)}>
            {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Year <span>*</span></label>
          <select className="form-select" value={values.year} onChange={(e) => onChange('year', e.target.value)}>
            {YEARS.map((y) => <option key={y}>{y}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
