import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useIncidents } from '../../features/incidents/hooks/useIncidents';
import IncidentCard from '../../features/incidents/components/IncidentCard';

const STATUS_LABELS = {
  OPEN: 'פתוח',
  IN_PROGRESS: 'בטיפול',
  CLOSED: 'סגור',
};

function IncidentsHubPage() {
  const navigate = useNavigate();
  const { incidents, loading, error, refreshIncidents } = useIncidents();

  const activeIncidents = useMemo(() => {
    const safe = Array.isArray(incidents) ? incidents : [];
    return safe
      .filter((incident) => incident.status === 'OPEN' || incident.status === 'IN_PROGRESS')
      .sort((a, b) => (b.id || 0) - (a.id || 0));
  }, [incidents]);

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a' }}>אירועים פתוחים</h2>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
            בחר אירוע לצפייה בצוות, הודעות מהשטח והחלטות סוכן. משאבים וסטטוס — במפת הדשבורד.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigate('/admin/create-incident')}
            style={{ border: 'none', borderRadius: '6px', padding: '8px 14px', backgroundColor: '#dc3545', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ➕ פתח אירוע חדש
          </button>
          <button
            onClick={refreshIncidents}
            style={{ border: 'none', borderRadius: '6px', padding: '8px 14px', backgroundColor: '#0f172a', color: 'white', cursor: 'pointer' }}
          >
            רענון
          </button>
        </div>
      </div>

      {loading && <div style={{ color: '#64748b' }}>טוען אירועים...</div>}
      {error && (
        <div style={{ padding: '12px', backgroundColor: '#fef2f2', borderRadius: '8px', color: '#b91c1c' }}>
          {error}
        </div>
      )}

      {!loading && !error && activeIncidents.length === 0 && (
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', textAlign: 'center', color: '#64748b' }}>
          ✅ אין אירועים פתוחים כרגע. החפ&quot;ק בשגרה.
        </div>
      )}

      {!loading && !error && activeIncidents.length > 0 && (
        <div style={{ display: 'grid', gap: '12px' }}>
          {activeIncidents.map((incident) => (
            <button
              key={incident.id}
              type="button"
              onClick={() => navigate(`/admin/incidents/${incident.id}`)}
              style={{
                border: '1px solid #fecaca',
                background: 'transparent',
                padding: 0,
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'right',
                width: '100%',
              }}
            >
              <IncidentCard incident={incident} statusLabel={STATUS_LABELS[incident.status] || incident.status} />
            </button>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

export default IncidentsHubPage;
