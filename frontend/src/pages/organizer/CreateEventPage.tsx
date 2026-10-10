import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsAPI } from '../../api';
import { OrganizerSidebar } from './OrganizerDashboard';
import { useAuth } from '../../contexts/AuthContext';

const DEPARTMENTS = ['Technical', 'Cultural', 'Design', 'Sports', 'Management', 'Academic'];

interface EventFormData {
  title: string;
  shortDescription: string;
  description: string;
  organizerName: string;
  venue: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  registrationDeadline: string;
  maxTeams: number;
  minTeamSize: number;
  maxTeamSize: number;
  eligibility: string;
  category: string;
  prizes: string;
  registrationFee: number;
  rules: string[];
  tags: string;
}

export default function CreateEventPage() {
  const navigate = useNavigate();
  const { organizer } = useAuth();

  const [form, setForm] = useState<EventFormData>({
    title: '',
    shortDescription: '',
    description: '',
    organizerName: organizer?.organization || '',
    venue: '',
    startDate: '',
    startTime: '09:00 AM',
    endDate: '',
    endTime: '05:00 PM',
    registrationDeadline: '',
    maxTeams: 100,
    minTeamSize: 2,
    maxTeamSize: 4,
    eligibility: 'Open to all students',
    category: 'Technical',
    prizes: '',
    registrationFee: 0,
    rules: [''],
    tags: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [publishNow, setPublishNow] = useState(false);

  const update = (field: keyof EventFormData, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateRule = (idx: number, value: string) => {
    const updated = [...form.rules];
    updated[idx] = value;
    setForm((prev) => ({ ...prev, rules: updated }));
  };

  const addRule = () => setForm((prev) => ({ ...prev, rules: [...prev.rules, ''] }));
  const removeRule = (idx: number) => setForm((prev) => ({ ...prev, rules: prev.rules.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.venue.trim() || !form.startDate || !form.endDate || !form.registrationDeadline) {
      setError('Please fill in all required fields');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        rules: form.rules.filter((r) => r.trim()),
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        registrationDeadline: new Date(form.registrationDeadline).toISOString(),
        status: (publishNow ? 'published' : 'draft') as "draft" | "published" | "ongoing" | "completed" | "cancelled",
      };
      const res = await eventsAPI.create(payload);
      navigate(`/organizer/events/${res.event._id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <OrganizerSidebar active="/organizer/create-event" />
      <div className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>Create Event</h1>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Fill in the details below to create a new event</p>
          </div>
        </div>

        <div className="dashboard-content">
          {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Basic Info */}
              <div className="card">
                <div className="card-body">
                  <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>Basic Information</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="form-group">
                      <label className="form-label">Event Title <span>*</span></label>
                      <input className="form-input" placeholder="e.g. AI Hackathon 2026" value={form.title} onChange={(e) => update('title', e.target.value)} required />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Organizer / Club Name <span>*</span></label>
                        <input className="form-input" placeholder="e.g. Technical Club" value={form.organizerName} onChange={(e) => update('organizerName', e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Category</label>
                        <select className="form-select" value={form.category} onChange={(e) => update('category', e.target.value)}>
                          {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Short Description <span>*</span></label>
                      <input className="form-input" placeholder="One-line description shown on event cards" value={form.shortDescription} onChange={(e) => update('shortDescription', e.target.value)} required maxLength={200} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Full Description <span>*</span></label>
                      <textarea className="form-textarea" placeholder="Detailed description of the event..." value={form.description} onChange={(e) => update('description', e.target.value)} style={{ minHeight: 140 }} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tags (comma-separated)</label>
                      <input className="form-input" placeholder="e.g. hackathon, AI, ML, tech" value={form.tags} onChange={(e) => update('tags', e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Date & Venue */}
              <div className="card">
                <div className="card-body">
                  <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>Date, Time & Venue</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="form-group">
                      <label className="form-label">Venue <span>*</span></label>
                      <input className="form-input" placeholder="e.g. MRTC Auditorium, Block A" value={form.venue} onChange={(e) => update('venue', e.target.value)} required />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Start Date <span>*</span></label>
                        <input className="form-input" type="date" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Start Time</label>
                        <input className="form-input" placeholder="9:00 AM" value={form.startTime} onChange={(e) => update('startTime', e.target.value)} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">End Date <span>*</span></label>
                        <input className="form-input" type="date" value={form.endDate} onChange={(e) => update('endDate', e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">End Time</label>
                        <input className="form-input" placeholder="5:00 PM" value={form.endTime} onChange={(e) => update('endTime', e.target.value)} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Registration Deadline <span>*</span></label>
                      <input className="form-input" type="date" value={form.registrationDeadline} onChange={(e) => update('registrationDeadline', e.target.value)} required />
                    </div>
                  </div>
                </div>
              </div>

              {/* Registration Settings */}
              <div className="card">
                <div className="card-body">
                  <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>Registration Settings</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="form-row-3">
                      <div className="form-group">
                        <label className="form-label">Maximum Teams</label>
                        <input className="form-input" type="number" min={1} value={form.maxTeams} onChange={(e) => update('maxTeams', +e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Min Team Size</label>
                        <input className="form-input" type="number" min={1} value={form.minTeamSize} onChange={(e) => update('minTeamSize', +e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Max Team Size</label>
                        <input className="form-input" type="number" min={1} value={form.maxTeamSize} onChange={(e) => update('maxTeamSize', +e.target.value)} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Eligibility</label>
                        <input className="form-input" placeholder="e.g. Open to all B.Tech students" value={form.eligibility} onChange={(e) => update('eligibility', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Registration Fee (₹)</label>
                        <input className="form-input" type="number" min={0} value={form.registrationFee} onChange={(e) => update('registrationFee', +e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rules */}
              <div className="card">
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h2 style={{ fontSize: 17, fontWeight: 700 }}>Rules & Guidelines</h2>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={addRule}>+ Add Rule</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {form.rules.map((rule, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 8 }}>
                        <span style={{ padding: '9px 0', color: 'var(--color-text-muted)', fontSize: 14, minWidth: 20 }}>{idx + 1}.</span>
                        <input className="form-input" placeholder={`Rule ${idx + 1}`} value={rule} onChange={(e) => updateRule(idx, e.target.value)} style={{ flex: 1 }} />
                        {form.rules.length > 1 && (
                          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => removeRule(idx)} style={{ color: 'var(--color-danger)' }}>✕</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Prizes */}
              <div className="card">
                <div className="card-body">
                  <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Prizes (Optional)</h2>
                  <textarea className="form-textarea" placeholder="e.g. 1st: ₹15,000 | 2nd: ₹10,000 | 3rd: ₹5,000" value={form.prizes} onChange={(e) => update('prizes', e.target.value)} style={{ minHeight: 80 }} />
                </div>
              </div>

              {/* Submit */}
              <div className="card">
                <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
                    <input type="checkbox" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} style={{ width: 16, height: 16 }} />
                    Publish immediately (visible to students)
                  </label>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
                    <button type="button" className="btn btn-ghost" onClick={() => navigate('/organizer/events')}>Cancel</button>
                    <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
                      {saving ? <><span className="spinner" style={{ width: 16, height: 16 }} />Creating...</> : publishNow ? 'Create & Publish Event' : 'Save as Draft'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
