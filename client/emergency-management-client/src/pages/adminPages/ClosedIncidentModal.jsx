import React from 'react';

function ClosedIncidentModal({ incident, onClose }) {
  if (!incident) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000
    }}>
      <div style={{
        background: 'white', width: '90%', maxWidth: '900px', borderRadius: '12px',
        padding: '24px', maxHeight: '85vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>אירוע #{incident.id} — {incident.description}</h2>
          <button onClick={onClose} style={{ fontSize: '20px', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

          {/* פצועים */}
          <div>
            <h4>פצועים ({incident.casualties?.length || 0})</h4>
            {incident.casualties?.length > 0 ? (
              incident.casualties.map((c, idx) => (
                <div key={idx} style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  {c.name} — {c.condition} — {c.location}
                </div>
              ))
            ) : <div style={{ color: '#94a3b8' }}>אין פצועים</div>}
          </div>

          {/* משאבים */}
          <div>
            <h4>משאבים ({incident.assignedResources?.length || 0})</h4>
            {incident.assignedResources?.length > 0 ? (
              incident.assignedResources.map((r, idx) => (
                <div key={idx} style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  {r.name} ({r.resourceType}) — {r.status}
                </div>
              ))
            ) : <div style={{ color: '#94a3b8' }}>אין משאבים</div>}
          </div>

          {/* אנשי צוות */}
          <div>
            <h4>אנשי צוות</h4>
            {incident.teamMembers?.length > 0 ? (
              incident.teamMembers.map((t, idx) => (
                <div key={idx}>{t.name} — {t.role}</div>
              ))
            ) : <div style={{ color: '#94a3b8' }}>אין צוות</div>}
          </div>

          {/* החלטות סוכן */}
          <div>
            <h4>החלטות סוכן</h4>
            {incident.agentLogs?.length > 0 ? (
              incident.agentLogs.map((log, idx) => (
                <div key={idx} style={{ background: '#0f172a', color: 'white', padding: '8px', borderRadius: '6px', marginBottom: '6px' }}>
                  <strong>{log.decision}</strong><br />
                  <span style={{ fontSize: '12px' }}>{log.reason}</span>
                </div>
              ))
            ) : <div style={{ color: '#94a3b8' }}>אין החלטות</div>}
          </div>

          {/* דיווחים מהשטח */}
          <div style={{ gridColumn: '1 / -1' }}>
            <h4>דיווחים מהשטח</h4>
            {incident.actionLogs?.length > 0 ? (
              incident.actionLogs.map((log, idx) => (
                <div key={idx} style={{ padding: '10px', background: '#fefce8', borderRadius: '6px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#854d0e' }}>
                    {log.senderName || 'לא ידוע'} • {log.timestamp ? new Date(log.timestamp).toLocaleString('he-IL') : ''}
                  </div>
                  <div>{log.messageContent}</div>
                </div>
              ))
            ) : <div style={{ color: '#94a3b8' }}>אין דיווחים</div>}
          </div>

          {/* הודעה ראשונית מהמנהל */}
          {incident.initialAdminMessage && (
            <div style={{ gridColumn: '1 / -1', background: '#f0fdf4', padding: '12px', borderRadius: '8px' }}>
              <strong>הודעה ראשונית מהמנהל לסוכן:</strong>
              <div>{incident.initialAdminMessage}</div>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'right', marginTop: '24px' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
            סגור
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClosedIncidentModal;