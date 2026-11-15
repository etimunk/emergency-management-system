import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useIncidentDetail } from '../../features/incidents/hooks/useIncidentDetail';
import { getAllResources, assignResourceToIncident } from '../../features/resources/services/resourceApi';

const STATUS_LABELS = {
  OPEN: 'פתוח',
  IN_PROGRESS: 'בטיפול',
  CLOSED: 'סגור',
};

function Section({ title, icon, children, accent = '#0f172a', style = {} }) {
  return (
    <div style={{ backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '420px', ...style }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
        <h3 style={{ margin: 0, color: accent, fontSize: '16px', fontWeight: 600 }}>{icon} {title}</h3>
      </div>
      <div style={{ padding: '16px 18px', flex: 1, overflowY: 'auto' }}>{children}</div>
    </div>
  );
}

function IncidentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { detail, resources, actionLogs, agentLogs, casualties, loading, error, refresh } = useIncidentDetail(id);

  const [showCasualties, setShowCasualties] = useState(false);
  const [showAddResource, setShowAddResource] = useState(false);
  const [availableResources, setAvailableResources] = useState([]);
  const [resourceFilter, setResourceFilter] = useState('ALL');
  const [adding, setAdding] = useState(false);

  const assignedResourceIds = new Set((resources || []).map(r => r.resource?.id).filter(Boolean));

  const loadAvailableResources = async () => {
    try {
      const all = await getAllResources();
      const free = all.filter(r => !r.incidentId && !assignedResourceIds.has(r.id));
      setAvailableResources(free);
    } catch (e) {
      alert('שגיאה בטעינת משאבים');
    }
  };

  const handleAddResource = async (resourceId) => {
    if (!window.confirm('לשייך את המשאב לאירוע זה?')) return;
    try {
      setAdding(true);
      await assignResourceToIncident(resourceId, Number(id));
      setShowAddResource(false);
      refresh();
    } catch (e) {
      alert('שיוך נכשל');
    } finally {
      setAdding(false);
    }
  };

  const filteredResources = (resources || []).filter(entry => {
    if (resourceFilter === 'ALL') return true;
    return entry.resource?.orgType === resourceFilter;
  });

  const orgOptions = ['ALL', ...new Set((resources || []).map(e => e.resource?.orgType).filter(Boolean))];

  if (loading && !detail) {
    return (
      <DashboardLayout>
        <div style={{ color: '#64748b' }}>טוען פרטי אירוע...</div>
      </DashboardLayout>
    );
  }

  if (error && !detail) {
    return (
      <DashboardLayout>
        <div style={{ padding: '12px', backgroundColor: '#fef2f2', borderRadius: '8px', color: '#b91c1c' }}>{error}</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', gap: '12px' }}>
        <div>
          <button type="button" onClick={() => navigate('/dashboard')} style={{ border: 'none', background: 'transparent', color: '#2563eb', cursor: 'pointer', padding: 0, marginBottom: '6px', fontSize: '13px' }}>← חזרה למפת הדשבורד</button>
          <h2 style={{ margin: 0, color: '#991b1b' }}>אירוע #{detail?.id} — {detail?.description || 'ללא תיאור'}</h2>
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#475569', display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
            <span>📍 {detail?.locationAddress || 'מיקום לא הוגדר'}</span>
            <span>סטטוס: <strong>{STATUS_LABELS[detail?.status] || detail?.status}</strong></span>
            <span>פצועים: <strong>{detail?.casualtyCount ?? 0}</strong></span>
            <span>נפתח: {detail?.creationTime ? new Date(detail.creationTime).toLocaleString('he-IL') : '—'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={() => setShowCasualties(true)} style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 14px', backgroundColor: 'white', color: '#334155', cursor: 'pointer', fontSize: '13px' }}>
            פצועים ({casualties.length})
          </button>
          {(detail?.status === 'OPEN' || detail?.status === 'IN_PROGRESS') && (
            <button onClick={async () => {
              try {
                const token = localStorage.getItem('token');
                const res = await fetch(`http://localhost:8082/api/incidents/${detail.id}/status?status=CLOSED`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } });
                if (res.ok) refresh(); else alert('שגיאה בסגירה');
              } catch { alert('שגיאת תקשורת'); }
            }} style={{ border: 'none', borderRadius: '6px', padding: '8px 14px', backgroundColor: '#dc2626', color: 'white', cursor: 'pointer', fontSize: '13px' }}>
              סגור אירוע
            </button>
          )}
          <button onClick={refresh} style={{ border: 'none', borderRadius: '6px', padding: '8px 14px', backgroundColor: '#0f172a', color: 'white', cursor: 'pointer' }}>רענון</button>
        </div>
      </div>

      {/* 3 Big Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.4fr 1fr', gap: '18px' }}>
        {/* Agent Decisions */}
        <Section title="החלטות סוכן AI" icon="🤖" accent="#0369a1" style={{ gridColumn: '1 / 2' }}>
          {!agentLogs || agentLogs.length === 0 ? <div style={{ color: '#64748b' }}>אין החלטות סוכן.</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[...agentLogs].map(log => (
                <div key={log.id} style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderRadius: '8px', padding: '12px', borderRight: '4px solid #38bdf8' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>{log.timestamp ? new Date(log.timestamp).toLocaleString('he-IL') : '—'}</div>
                  <div style={{ fontWeight: 600, color: '#f8fafc', marginBottom: '3px' }}>{log.decision}</div>
                  <div style={{ fontSize: '13px', color: '#cbd5e1' }}>{log.reason}</div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Resources Table */}
        <Section title="משאבים באירוע" icon="🚑" accent="#0f766e" style={{ gridColumn: '2 / 3' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <select value={resourceFilter} onChange={e => setResourceFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              {orgOptions.map(o => <option key={o} value={o}>{o === 'ALL' ? 'כל הארגונים' : o}</option>)}
            </select>
            <button onClick={() => { loadAvailableResources(); setShowAddResource(true); }} style={{ backgroundColor: '#0f766e', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
              + הוסף משאב
            </button>
          </div>

          {filteredResources.length === 0 ? <div style={{ color: '#64748b' }}>אין משאבים משויכים.</div> : (
            <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', textAlign: 'right' }}>
                  <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>משאב</th>
                  <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>ארגון</th>
                  <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>סטטוס</th>
                  <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>מנהל</th>
                  <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>צוות</th>
                </tr>
              </thead>
              <tbody>
                {filteredResources.map((entry, idx) => {
                  const r = entry.resource || {};
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px' }}>{r.name} <span style={{ color: '#94a3b8' }}>#{r.id}</span></td>
                      <td style={{ padding: '8px' }}>{r.orgType}</td>
                      <td style={{ padding: '8px' }}>
                        <span style={{ backgroundColor: r.status === 'AVAILABLE' ? '#dcfce7' : r.status === 'BUSY' ? '#fee2e2' : '#f1f5f9', color: r.status === 'AVAILABLE' ? '#166534' : '#991b1b', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{r.status}</span>
                      </td>
                      <td style={{ padding: '8px' }}>{entry.resource?.ownerName || '—'}</td>
                      <td style={{ padding: '8px' }}>{entry.team?.length || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Section>

        {/* Field Reports */}
        <Section title="הודעות מהשטח" icon="📡" accent="#b45309" style={{ gridColumn: '3 / 4' }}>
          {actionLogs.length === 0 ? <div style={{ color: '#64748b' }}>עדיין לא התקבלו דיווחים.</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[...actionLogs].reverse().map(log => (
                <div key={log.id} style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#92400e', marginBottom: '4px' }}>{log.timestamp ? new Date(log.timestamp).toLocaleString('he-IL') : '—'} {log.senderName ? `| ${log.senderName}` : ''}</div>
                  <div style={{ color: '#1e293b' }}>{log.messageContent || '—'}</div>
                  {log.requiresAction && <div style={{ marginTop: '6px', fontSize: '11px', color: '#dc2626', fontWeight: 600 }}>⚠️ דורש טיפול</div>}
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Casualties Modal */}
      {showCasualties && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: 'white', width: '90%', maxWidth: 620, borderRadius: 12, padding: 24, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>פצועים באירוע #{detail?.id}</h3>
              <button onClick={() => setShowCasualties(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            {casualties.length === 0 ? <div style={{ color: '#64748b' }}>אין פצועים משויכים.</div> : (
              <table style={{ width: '100%', fontSize: '13px' }}>
                <thead><tr style={{ background: '#f8fafc' }}><th>שם</th><th>מצב</th><th>מיקום</th><th>זמן</th></tr></thead>
                <tbody>
                  {casualties.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px' }}>{c.name || 'ללא שם'}</td>
                      <td style={{ padding: '8px' }}>{c.condition || '—'}</td>
                      <td style={{ padding: '8px' }}>{c.location || '—'}</td>
                      <td style={{ padding: '8px' }}>{c.timestamp ? new Date(c.timestamp).toLocaleString('he-IL') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <button onClick={() => setShowCasualties(false)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #cbd5e1' }}>סגור</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Resource Modal */}
      {showAddResource && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: 'white', width: '90%', maxWidth: 560, borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ margin: 0 }}>הוסף משאב לאירוע</h3>
              <button onClick={() => setShowAddResource(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            {availableResources.length === 0 ? <div style={{ color: '#64748b' }}>אין משאבים פנויים להוספה.</div> : (
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {availableResources.map(r => (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                    <div>{r.name} <span style={{ color: '#94a3b8' }}>#{r.id}</span> — {r.orgType} — {r.status}</div>
                    <button disabled={adding} onClick={() => handleAddResource(r.id)} style={{ background: '#0f766e', color: 'white', border: 'none', padding: '4px 12px', borderRadius: 4, cursor: 'pointer' }}>שייך</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <button onClick={() => setShowAddResource(false)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #cbd5e1' }}>ביטול</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default IncidentDetailPage;