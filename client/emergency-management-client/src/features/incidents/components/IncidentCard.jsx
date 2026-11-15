// src/features/incidents/components/IncidentCard.jsx
import React from 'react';

function IncidentCard({ incident, statusLabel, onClick }) {
  // חילוץ שדות בצורה בטוחה (תומך גם ב-DTO וגם ב-Entity המלא)
  const id = incident.id;
  const description = incident.description || 'אירוע ללא תיאור';
  const location = incident.locationAddress || incident.location || 'מיקום לא מוגדר';
  const status = incident.status || 'OPEN';
  
  // חישוב כמות פצועים ומשאבים בצורה בטוחה
  const casualtyCount = incident.casualtyCount !== undefined 
    ? incident.casualtyCount 
    : (incident.casualties ? incident.casualties.length : 0);

  // סופרים רק משאבים שהגיעו בפועל (BUSY)
  const resourceCount = incident.resourceCount !== undefined 
    ? incident.resourceCount 
    : (incident.assignedResources 
        ? incident.assignedResources.filter(r => r.status === 'BUSY').length 
        : 0);

  // קביעת צבעים לפי סטטוס האירוע
  const isClosed = status === 'CLOSED' || status === 'Resolved';
  const statusColor = isClosed ? '#64748b' : '#ef4444'; // אפור לסגור, אדום לפעיל
  const bgColor = isClosed ? '#f8fafc' : '#fef2f2';    // רקע בהיר מתאים

  const displayStatus = statusLabel || status;

  return (
    <div
      onClick={onClick}
      style={{ 
      padding: '15px', 
      marginBottom: onClick ? 0 : '12px', 
      backgroundColor: bgColor, 
      borderRadius: '6px', 
      borderRight: `5px solid ${statusColor}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      transition: 'all 0.2s ease',
      cursor: onClick ? 'pointer' : 'default',
    }}>
      {/* שורה עליונה: מזהה וסטטוס */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>
          אירוע #{id}
        </span>
        <span style={{ 
          fontSize: '11px', 
          fontWeight: 'bold', 
          color: 'white', 
          backgroundColor: statusColor, 
          padding: '3px 8px', 
          borderRadius: '12px' 
        }}>
          {displayStatus}
        </span>
      </div>

      {onClick && (
        <div style={{ fontSize: '12px', color: '#2563eb', marginTop: '8px' }}>
          לחץ לצפייה במשאבים, צוותים ודיווחים →
        </div>
      )}

      {/* תיאור האירוע */}
      <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', marginBottom: '5px' }}>
        {description}
      </div>

      {/* מיקום גיאוגרפי */}
      <div style={{ fontSize: '13px', color: '#475569', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
        📍 {location}
      </div>

      {/* שורת מונים תחתונה (פצועים ומשאבים) */}
      <div style={{ display: 'flex', gap: '15px', borderTop: '1px solid #e2e8f0', paddingTop: '8px', fontSize: '12px', fontWeight: '500' }}>
        <span style={{ color: casualtyCount > 0 ? '#b91c1c' : '#475569' }}>
          🚑 פצועים: <strong>{casualtyCount}</strong>
        </span>
        <span style={{ color: resourceCount > 0 ? '#1d4ed8' : '#475569' }}>
          🚒 כוחות בשטח: <strong>{resourceCount}</strong>
        </span>
      </div>
    </div>
  );
}

export default IncidentCard;