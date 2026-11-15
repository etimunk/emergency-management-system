import { useEffect, useMemo, useState } from 'react';
import OperatorLayout from '../../layouts/OperatorLayout';
import { useAuth } from '../../context/AuthContext';
import { getOperatorProfile } from '../../features/users/services/userApi';
import { getAllIncidents } from '../../features/incidents/services/incidentApi';
import { createActionLog, getActionLogsByIncident } from '../../features/actionLogs/services/actionLogApi';
import { getAgentLogsByIncident } from '../../features/actionLogs/services/agentLogApi';

function OperatorActionLogPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [agentLogs, setAgentLogs] = useState([]);
  const [message, setMessage] = useState('');
  const [requiresAction, setRequiresAction] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!user?.tz) return;
      const [userData, incidentsData] = await Promise.all([getOperatorProfile(user.tz), getAllIncidents()]);
      setProfile(userData);
      setIncidents(Array.isArray(incidentsData) ? incidentsData : []);
    };
    load();
  }, [user?.tz]);

  const assignedResource = profile?.managedResource || null;

  const currentIncident = useMemo(() => {
    if (!assignedResource?.incidentId) return null;
    return incidents.find((incident) =>
      incident.id === assignedResource.incidentId &&
      (incident.status === 'OPEN' || incident.status === 'IN_PROGRESS')
    ) || null;
  }, [incidents, assignedResource?.incidentId]);

  useEffect(() => {
    const loadLogs = async () => {
      if (!currentIncident?.id) {
        setLogs([]);
        setAgentLogs([]);
        return;
      }
      const [actionData, agentData] = await Promise.all([
        getActionLogsByIncident(currentIncident.id),
        getAgentLogsByIncident(currentIncident.id)
      ]);
      setLogs(Array.isArray(actionData) ? actionData : []);
      setAgentLogs(Array.isArray(agentData) ? agentData : []);
    };
    loadLogs();
  }, [currentIncident?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentIncident?.id || !profile?.tz) return;
    try {
      setSubmitting(true);
      setStatusMsg('');
      await createActionLog({
        incident: { id: currentIncident.id },
        sender: { tz: profile.tz },
        messageContent: message,
        targetOrganization: null,
        requiresAction,
        timestamp: new Date().toISOString(),
      });
      setMessage('');
      setRequiresAction(false);
      setStatusMsg('הדיווח נשלח בהצלחה.');
      const [updatedActionLogs, updatedAgentLogs] = await Promise.all([
        getActionLogsByIncident(currentIncident.id),
        getAgentLogsByIncident(currentIncident.id)
      ]);
      setLogs(Array.isArray(updatedActionLogs) ? updatedActionLogs : []);
      setAgentLogs(Array.isArray(updatedAgentLogs) ? updatedAgentLogs : []);
    } catch (err) {
      setStatusMsg('שליחת הדיווח נכשלה.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <OperatorLayout>
      <h2 style={{ marginTop: 0 }}>דיווח Action Log והחלטות סוכן AI</h2>
      {!currentIncident && <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px' }}>אין אירוע פעיל משויך כרגע.</div>}
      {currentIncident && (
        <>
          <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
            אירוע פעיל: #{currentIncident.id} - {currentIncident.description}
          </div>
          <form onSubmit={handleSubmit} style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
            <div style={{ marginBottom: '8px', fontSize: '13px', color: '#475569' }}>
              יעד הדיווח: חפ"ק ראשי
            </div>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} required placeholder="כתוב דיווח מהשטח..." style={{ width: '100%', marginBottom: '8px' }} />
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <input type="checkbox" checked={requiresAction} onChange={(e) => setRequiresAction(e.target.checked)} /> דורש פעולה מיידית
            </label>
            <button disabled={submitting} type="submit" style={{ border: 'none', borderRadius: '4px', padding: '8px 12px', backgroundColor: '#1d4ed8', color: 'white', cursor: 'pointer' }}>
              {submitting ? 'שולח...' : 'שלח דיווח'}
            </button>
            {statusMsg && <div style={{ marginTop: '8px' }}>{statusMsg}</div>}
          </form>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px' }}>
              <h3 style={{ marginTop: 0 }}>דיווחים אחרונים לאירוע</h3>
              {logs.length === 0 && <div>אין דיווחים עדיין.</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {logs.map((log) => (
                  <div key={log.id} style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '10px' }}>
                    <div style={{ fontWeight: 'bold' }}>{log.messageContent}</div>
                    <div style={{ fontSize: '12px', color: '#475569' }}>
                      {log.timestamp ? new Date(log.timestamp).toLocaleString('he-IL') : ''} | דורש פעולה: {log.requiresAction ? 'כן' : 'לא'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px' }}>
              <h3 style={{ marginTop: 0 }}>החלטות סוכן AI לאירוע</h3>
              {!agentLogs || agentLogs.length === 0 ? <div style={{ color: '#64748b' }}>אין החלטות סוכן שמורות לאירוע זה.</div> :
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[...agentLogs].map((log) => (
                  <div key={log.id} style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderRadius: '6px', padding: '10px', borderRight: '3px solid #38bdf8' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                      {log.timestamp ? new Date(log.timestamp).toLocaleString('he-IL') : '—'}
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#f8fafc', marginBottom: '4px' }}>
                      {log.decision}
                    </div>
                    <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                      {log.reason}
                    </div>
                  </div>
                ))}
              </div>}
            </div>
          </div>
        </>
      )}
    </OperatorLayout>
  );
}

export default OperatorActionLogPage;

