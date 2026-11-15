// src/features/incidents/components/IncidentList.jsx
import React from 'react';
import IncidentCard from './IncidentCard';

function IncidentList({ incidents, loading, error, refreshIncidents }) {
  const safeIncidents = Array.isArray(incidents) ? incidents : [];

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
        🔄 טוען אירועים מחפ"ק השרת...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '15px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '6px', color: '#b91c1c', fontSize: '14px' }}>
        <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>⚠️ שגיאה בתקשורת:</p>
        <p style={{ margin: '0 0 10px 0' }}>{error}</p>
        <button 
          onClick={refreshIncidents}
          style={{ padding: '6px 12px', backgroundColor: '#b91c1c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
        >
          נסה שנית
        </button>
      </div>
    );
  }

  if (safeIncidents.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '14px', border: '1px dashed #cbd5e1', borderRadius: '6px' }}>
        ✅ אין אירועים פעילים בשטח. החפ"ק בשגרה.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '100%', overflowY: 'auto', paddingLeft: '5px' }}>
      {safeIncidents.map((incident) => (
        <IncidentCard key={incident.id} incident={incident} />
      ))}
    </div>
  );
}

export default IncidentList;