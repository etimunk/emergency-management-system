import DashboardLayout from '../../layouts/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import HapakMap from '../../components/Map/HapakMap';
import { useIncidents } from '../../features/incidents/hooks/useIncidents';
import { useResources } from '../../features/resources/hooks/useResources';
import { getIncidentById } from '../../features/incidents/services/incidentApi';
import { useMemo, useState } from 'react';
import ClosedIncidentModal from './ClosedIncidentModal';

const DEPLOYED_STATUSES = ['EN_ROUTE', 'BUSY', 'STUCK'];

function DashboardPage() {
  const navigate = useNavigate();
  const { incidents, loading: incidentsLoading } = useIncidents();
  const { resources, loading: resourcesLoading } = useResources();

  const [showHistory, setShowHistory] = useState(false);
  const [selectedClosedIncident, setSelectedClosedIncident] = useState(null);

  const safeIncidents = Array.isArray(incidents) ? incidents : [];
  const safeResources = Array.isArray(resources) ? resources : [];

  const openCount = safeIncidents.filter((i) => i.status === 'OPEN').length;
  const inProgressCount = safeIncidents.filter((i) => i.status === 'IN_PROGRESS').length;
  const closedCount = safeIncidents.filter((i) => i.status === 'CLOSED').length;
  const activeCount = openCount + inProgressCount;

  const { availableCount, deployedCount } = useMemo(() => {
    let available = 0;
    let deployed = 0;
    safeResources.forEach((resource) => {
      if (resource.status === 'AVAILABLE' && !resource.incidentId) {
        available += 1;
      } else if (DEPLOYED_STATUSES.includes(resource.status) || resource.incidentId) {
        deployed += 1;
      }
    });
    return { availableCount: available, deployedCount: deployed };
  }, [safeResources]);

  const handleIncidentClick = (incidentId) => {
    navigate(`/admin/incidents/${incidentId}`);
  };

  return (
    <DashboardLayout>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(100px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '12px' }}>אירועים פתוחים</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>{openCount}</div>
        </div>
        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '12px' }}>בטיפול עכשיו</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d97706' }}>{inProgressCount}</div>
        </div>
        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '12px' }}>משאבים זמינים</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>{resourcesLoading ? '…' : availableCount}</div>
        </div>
        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '12px' }}>משאבים באירוע</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f97316' }}>{resourcesLoading ? '…' : deployedCount}</div>
        </div>
        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '12px' }}>אירועים סגורים</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f766e' }}>{closedCount}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a' }}>מפת חפ&quot;ק — תמונת מצב</h2>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
            🔴 אירועים | 🟢 משאבים פנויים | 🟠 משאבים באירוע — לחץ על אירוע ברשימה לדיווחים והחלטות סוכן
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/create-incident')}
          style={{ padding: '8px 14px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          ➕ פתח אירוע חדש
        </button>
      </div>

      <div style={{ backgroundColor: '#0f172a', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', minHeight: '620px', height: 'calc(100vh - 280px)', position: 'relative' }}>
        {!incidentsLoading && activeCount === 0 && (
          <div style={{ position: 'absolute', top: '12px', right: '320px', zIndex: 1000, backgroundColor: 'rgba(255,255,255,0.95)', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', color: '#475569' }}>
            אין אירועים פעילים — המפה מציגה משאבים זמינים
          </div>
        )}
        <HapakMap onIncidentClick={handleIncidentClick} />

        {/* כפתור פתח/סגור היסטוריית אירועים */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 2000,
            backgroundColor: '#0f172a',
            color: 'white',
            border: 'none',
            padding: '8px 14px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
          }}
        >
          {showHistory ? 'סגור היסטוריה' : 'היסטוריית אירועים'}
        </button>

        {/* פאנל היסטוריית אירועים סגורים */}
        {showHistory && (
          <div style={{
            position: 'absolute',
            top: '60px',
            right: '16px',
            zIndex: 2000,
            width: '320px',
            maxHeight: '70vh',
            backgroundColor: 'white',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            overflowY: 'auto',
            padding: '16px'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#0f172a' }}>היסטוריית אירועים סגורים</h3>

            {safeIncidents.filter(i => i.status === 'CLOSED').length === 0 && (
              <div style={{ color: '#64748b', fontSize: '13px' }}>אין אירועים סגורים עדיין.</div>
            )}

            {safeIncidents
              .filter(i => i.status === 'CLOSED')
              .sort((a, b) => new Date(b.creationTime) - new Date(a.creationTime))
              .map(incident => (
                <div key={incident.id} style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '10px',
                  backgroundColor: '#f8fafc'
                }}>
                  <div style={{ fontWeight: 'bold', color: '#0f172a' }}>
                    #{incident.id} — {incident.description || 'ללא תיאור'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                    {incident.creationTime ? new Date(incident.creationTime).toLocaleString('he-IL') : ''}
                  </div>
                  <div style={{ fontSize: '12px', marginTop: '6px' }}>
                    משאבים: <strong>{incident.assignedResources?.length || 0}</strong> &nbsp;|&nbsp;
                    פצועים: <strong>{incident.casualtyCount || 0}</strong>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {selectedClosedIncident && (
        <ClosedIncidentModal
          incident={selectedClosedIncident}
          onClose={() => setSelectedClosedIncident(null)}
        />
      )}
    </DashboardLayout>
  );
}

export default DashboardPage;
