import { useState, useEffect } from 'react';

import { useAuth } from '../../contexts/AuthContext';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:5001/api/admin/stats', {
      headers: { Authorization: `Bearer ${localStorage.getItem('sc_token')}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setStats(data.stats);
      });

    fetch('http://localhost:5001/api/admin/audit-logs', {
      headers: { Authorization: `Bearer ${localStorage.getItem('sc_token')}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setLogs(data.logs);
      });
  }, []);

  return (
    <div className="page-wrapper">
      <nav className="navbar" style={{ marginBottom: 40, borderBottom: '1px solid var(--color-border)', paddingBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--color-primary)' }}>Student Club Admin</h1>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span>Welcome, {user?.name}</span>
          <button onClick={logout} className="btn btn-outline btn-sm">Sign Out</button>
        </div>
      </nav>

      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <h2 style={{ marginBottom: 24 }}>System Overview</h2>
        
        {stats ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 40 }}>
            <div className="card"><div className="card-body"><h3>{stats.totalStudents}</h3><p>Total Students</p></div></div>
            <div className="card"><div className="card-body"><h3>{stats.totalOrganizers}</h3><p>Total Organizers</p></div></div>
            <div className="card"><div className="card-body"><h3>{stats.totalEvents}</h3><p>Total Events</p></div></div>
            <div className="card"><div className="card-body"><h3>{stats.publishedEvents}</h3><p>Published Events</p></div></div>
            <div className="card"><div className="card-body"><h3>{stats.totalRegistrations}</h3><p>Total Registrations</p></div></div>
          </div>
        ) : <p>Loading stats...</p>}

        <h2 style={{ marginBottom: 24 }}>Recent Audit Logs</h2>
        <div className="card" style={{ padding: 20, overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: 12 }}>Time</th>
                <th style={{ padding: 12 }}>Actor</th>
                <th style={{ padding: 12 }}>Action</th>
                <th style={{ padding: 12 }}>Summary</th>
                <th style={{ padding: 12 }}>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 12 }}>{new Date(log.createdAt).toLocaleString()}</td>
                  <td style={{ padding: 12 }}>{log.actorRole} ({log.actorId})</td>
                  <td style={{ padding: 12 }}>{log.action}</td>
                  <td style={{ padding: 12 }}>{log.summary}</td>
                  <td style={{ padding: 12 }}>{log.outcome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
