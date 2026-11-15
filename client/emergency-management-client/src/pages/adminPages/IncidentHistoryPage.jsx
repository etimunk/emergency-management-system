import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getAllIncidents } from '../../features/incidents/services/incidentApi';
import { getIncidentById } from '../../features/incidents/services/incidentApi';
import ClosedIncidentModal from './ClosedIncidentModal';

function IncidentHistoryPage() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);

  useEffect(() => {
    const fetchClosedIncidents = async () => {
      try {
        const data = await getAllIncidents();
        const closed = Array.isArray(data) ? data.filter(i => i.status === 'CLOSED') : [];
        // מיון מהחדש לישן
        closed.sort((a, b) => new Date(b.creationTime) - new Date(a.creationTime));
        setIncidents(closed);
      } catch (e) {
        console.error('Failed to load closed incidents');
      } finally {
        setLoading(false);
      }
    };
    fetchClosedIncidents();
  }, []);

  const handleIncidentClick = async (incidentId) => {
    try {
      const fullIncident = await getIncidentById(incidentId);
      setSelectedIncident(fullIncident);
    } catch (e) {
      alert('נכשלה טעינת פרטי האירוע');
    }
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '24px', color: '#0f172a' }}>היסטוריית אירועים סגורים</h2>

        {loading && <div>טוען...</div>}

        {!loading && incidents.length === 0 && (
          <div style={{ color: '#64748b' }}>אין אירועים סגורים במערכת.</div>
        )}

        {!loading && incidents.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {incidents.map(incident => (
              <div
                key={incident.id}
                onClick={() => handleIncidentClick(incident.id)}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '15px' }}>
                      #{incident.id} — {incident.description || 'ללא תיאור'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                      {incident.creationTime ? new Date(incident.creationTime).toLocaleString('he-IL') : ''}
                    </div>
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '13px' }}>
                    לחץ לצפייה בפרטים →
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedIncident && (
        <ClosedIncidentModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
        />
      )}
    </DashboardLayout>
  );
}

export default IncidentHistoryPage;