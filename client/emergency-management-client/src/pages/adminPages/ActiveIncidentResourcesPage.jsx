import { useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useIncidents } from '../../features/incidents/hooks/useIncidents';

function ActiveIncidentResourcesPage() {
  const { incidents, loading, error, refreshIncidents } = useIncidents();

  const activeIncidents = useMemo(() => {
    const safe = Array.isArray(incidents) ? incidents : [];
    return safe.filter((incident) => incident.status === 'OPEN' || incident.status === 'IN_PROGRESS');
  }, [incidents]);

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2 style={{ margin: 0, color: '#0f172a' }}>משאבים פעילים לפי אירוע</h2>
        <button onClick={refreshIncidents} style={{ border: 'none', borderRadius: '4px', padding: '8px 12px', backgroundColor: '#0f172a', color: 'white', cursor: 'pointer' }}>
          רענון
        </button>
      </div>

      {loading && <div>טוען אירועים...</div>}
      {error && <div style={{ color: '#b91c1c' }}>{error}</div>}

      {!loading && !error && (
        <div style={{ display: 'grid', gap: '12px' }}>
          {activeIncidents.length === 0 && (
            <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px' }}>אין אירועים פעילים כרגע.</div>
          )}

          {activeIncidents.map((incident) => {
            const assigned = Array.isArray(incident.assignedResources) ? incident.assignedResources : [];
            return (
              <div key={incident.id} style={{ backgroundColor: 'white', borderRadius: '8px', padding: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontWeight: 'bold', color: '#991b1b' }}>
                  אירוע #{incident.id} - {incident.description || 'ללא תיאור'}
                </div>
                <div style={{ fontSize: '13px', color: '#475569', marginBottom: '8px' }}>
                  סטטוס: {incident.status} | מיקום: {incident.locationAddress || 'לא הוגדר'}
                </div>

                {assigned.length === 0 ? (
                  <div style={{ color: '#64748b' }}>אין משאבים משויכים כרגע.</div>
                ) : (
                  <div style={{ display: 'grid', gap: '6px' }}>
                    {assigned.map((resource) => (
                      <div key={resource.id} style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px' }}>
                        <strong>{resource.name || `יחידה ${resource.id}`}</strong>
                        <div style={{ fontSize: '12px', color: '#475569' }}>
                          סוג: {resource.resourceType || 'לא מוגדר'} | סטטוס: {resource.status || 'UNKNOWN'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}

export default ActiveIncidentResourcesPage;

