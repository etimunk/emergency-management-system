import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useIncidents } from '../../features/incidents/hooks/useIncidents';
import { getAllResources, getResourceUsers } from '../../features/resources/services/resourceApi';
import ResourceMarker from './ResourceMarker';

import 'leaflet/dist/leaflet.css';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const MARKER_BASE =
  'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x';

const incidentIconActive = new L.Icon({
  iconUrl: `${MARKER_BASE}-red.png`,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const incidentIconClosed = new L.Icon({
  iconUrl: `${MARKER_BASE}-grey.png`,
  shadowUrl: markerShadow,
  iconSize: [22, 36],
  iconAnchor: [11, 36],
  popupAnchor: [1, -30],
  shadowSize: [36, 36],
});

const DEPLOYED_STATUSES = ['EN_ROUTE', 'BUSY', 'STUCK'];
const ACTIVE_STATUSES = ['OPEN', 'IN_PROGRESS'];

function buildIncidentByResourceId(incidents) {
  const map = new Map();
  incidents.forEach((incident) => {
    const resources = incident.assignedResources;
    if (!Array.isArray(resources)) return;
    resources.forEach((resource) => {
      if (resource?.id != null) {
        map.set(resource.id, incident);
      }
    });
  });
  return map;
}

function getMapStatus(resource, incidentByResourceId) {
  // משאב משויך לאירוע (גם אם האירוע סגור) → כתום
  if (incidentByResourceId.has(resource.id) || resource.incidentId) {
    return 'deployed';
  }
  if (DEPLOYED_STATUSES.includes(resource.status)) {
    return 'deployed';
  }
  if (resource.status === 'AVAILABLE') {
    return 'available';
  }
  return 'other';
}

function HapakMap({ onIncidentClick }) {
  const { incidents } = useIncidents();
  const safeIncidents = Array.isArray(incidents) ? incidents : [];

  const [resources, setResources] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [resourcesError, setResourcesError] = useState(null);
  const [selectedResourceId, setSelectedResourceId] = useState(null);
  const [team, setTeam] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState(null);

  const incidentByResourceId = useMemo(
    () => buildIncidentByResourceId(safeIncidents),
    [safeIncidents]
  );

  const activeIncidents = useMemo(
    () => safeIncidents.filter((incident) => ACTIVE_STATUSES.includes(incident.status)),
    [safeIncidents]
  );

  const fetchResources = useCallback(async () => {
    try {
      const data = await getAllResources();
      const list = Array.isArray(data) ? data : [];
      setResources(list);
      setResourcesError(null);
    } catch (err) {
      console.error('Error fetching resources for map:', err);
      setResources([]);
      setResourcesError('נכשלה טעינת משאבים מהשרת (בדקי התחברות)');
    } finally {
      setResourcesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResources();
    const interval = setInterval(fetchResources, 3000);
    return () => clearInterval(interval);
  }, [fetchResources]);

  const resourcesOnMap = useMemo(() => {
    return resources
      .filter((r) => {
        const lat = Number(r.latitude);
        const lon = Number(r.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;

        // הסתר משאב אם הוא משויך לאירוע **פתוח**
        if (r.incidentId) {
          const incident = safeIncidents.find((i) => i.id === r.incidentId);
          if (incident && ACTIVE_STATUSES.includes(incident.status)) {
            return false; // לא להציג על המפה
          }
        }
        return true;
      })
      .map((r) => ({
        resource: r,
        mapStatus: getMapStatus(r, incidentByResourceId),
      }));
  }, [resources, incidentByResourceId, safeIncidents]);

  const { availableCount, deployedCount, otherCount } = useMemo(() => {
    let available = 0;
    let deployed = 0;
    let other = 0;
    resourcesOnMap.forEach(({ mapStatus }) => {
      if (mapStatus === 'available') available += 1;
      else if (mapStatus === 'deployed') deployed += 1;
      else other += 1;
    });
    return { availableCount: available, deployedCount: deployed, otherCount: other };
  }, [resourcesOnMap]);

  const selectedResource = useMemo(
    () => resources.find((r) => r.id === selectedResourceId) ?? null,
    [resources, selectedResourceId]
  );

  useEffect(() => {
    if (!selectedResourceId) {
      setTeam([]);
      setTeamError(null);
      return;
    }

    let cancelled = false;
    const loadTeam = async () => {
      setTeamLoading(true);
      setTeamError(null);
      try {
        const data = await getResourceUsers(selectedResourceId);
        if (!cancelled) {
          setTeam(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setTeamError('נכשלה טעינת צוות המשאב');
          setTeam([]);
        }
      } finally {
        if (!cancelled) setTeamLoading(false);
      }
    };

    loadTeam();
    return () => {
      cancelled = true;
    };
  }, [selectedResourceId]);

  const handleSelectResource = (resourceId) => {
    setSelectedResourceId((prev) => (prev === resourceId ? null : resourceId));
  };

  const defaultCenter = [32.0853, 34.7818];
  const defaultZoom = 13;

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        minHeight: '420px',
        direction: 'rtl',
        backgroundColor: '#0f172a',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
        <MapContainer center={defaultCenter} zoom={defaultZoom} style={{ width: '100%', height: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="dark-colors-map"
          />
          <style>{`
            .dark-colors-map {
              filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
            }
          `}</style>

          {safeIncidents.map((incident) => {
            const lat = Number(incident.latitude);
            const lon = Number(incident.longitude);
            if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
            const isActive = ACTIVE_STATUSES.includes(incident.status);
            return (
              <Marker
                key={`incident-${incident.id}`}
                position={[lat, lon]}
                icon={isActive ? incidentIconActive : incidentIconClosed}
              >
                <Popup>
                  <div style={{ direction: 'rtl', textAlign: 'right', fontFamily: 'Arial', color: '#1e293b' }}>
                    <h4 style={{ margin: '0 0 5px 0', color: isActive ? '#dc2626' : '#64748b' }}>
                      {isActive ? '🚨' : '✅'} אירוע #{incident.id}
                    </h4>
                    <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{incident.description}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#475569' }}>
                      📍 {incident.locationAddress || incident.location}
                    </p>
                    <div style={{ marginTop: '5px', fontSize: '11px', fontWeight: 'bold' }}>
                      סטטוס: {incident.status}
                    </div>
                    {isActive && onIncidentClick && (
                      <button
                        type="button"
                        onClick={() => onIncidentClick(incident.id)}
                        style={{
                          marginTop: '8px',
                          width: '100%',
                          padding: '6px',
                          backgroundColor: '#2563eb',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        דיווחים והחלטות סוכן →
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {resourcesOnMap.map(({ resource, mapStatus }) => (
            <ResourceMarker
              key={`res-${resource.id}-${resource.latitude}-${resource.longitude}`}
              resource={resource}
              mapStatus={mapStatus}
              incident={incidentByResourceId.get(resource.id)}
              onSelect={handleSelectResource}
            />
          ))}
        </MapContainer>

        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            zIndex: 1000,
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            color: '#e2e8f0',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <span>🔴 אירועים: {safeIncidents.length}</span>
          <span>🟢 זמין: {availableCount}</span>
          <span>🟠 באירוע: {deployedCount}</span>
          {otherCount > 0 && <span>🔵 אחר: {otherCount}</span>}
        </div>

        {resourcesError && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              right: '10px',
              zIndex: 1000,
              backgroundColor: '#7f1d1d',
              color: '#fecaca',
              padding: '8px',
              borderRadius: '6px',
              fontSize: '12px',
            }}
          >
            {resourcesError}
          </div>
        )}
      </div>

      <aside
        style={{
          width: '300px',
          flexShrink: 0,
          backgroundColor: '#1e293b',
          color: '#f1f5f9',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #334155',
        }}
      >
        <div style={{ padding: '12px', borderBottom: '1px solid #334155' }}>
          <h3 style={{ margin: 0, fontSize: '15px' }}>אירועים פעילים</h3>
          <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#94a3b8' }}>
            לחץ לאירוע — דיווחים מהשטח והחלטות סוכן. לחץ על משאב במפה לצפייה בצוות.
          </p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {activeIncidents.length === 0 && (
            <div style={{ padding: '12px', color: '#64748b', fontSize: '13px' }}>
              אין אירועים פעילים כרגע
            </div>
          )}
          {activeIncidents.map((incident) => {
            const assignedCount = Array.isArray(incident.assignedResources)
              ? incident.assignedResources.length
              : 0;
            return (
              <button
                key={incident.id}
                type="button"
                onClick={() => onIncidentClick?.(incident.id)}
                style={{
                  width: '100%',
                  textAlign: 'right',
                  marginBottom: '8px',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  backgroundColor: '#0f172a',
                  color: '#f8fafc',
                  cursor: onIncidentClick ? 'pointer' : 'default',
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#fca5a5' }}>
                  אירוע #{incident.id}
                </div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>{incident.description || 'ללא תיאור'}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                  {incident.status} | {assignedCount} משאבים | {incident.locationAddress || '—'}
                </div>
              </button>
            );
          })}
        </div>

        {selectedResource && (
          <div
            style={{
              borderTop: '1px solid #334155',
              padding: '12px',
              maxHeight: '220px',
              overflowY: 'auto',
              backgroundColor: '#0f172a',
            }}
          >
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#38bdf8' }}>
              צוות: {selectedResource.name}
            </h4>
            <div style={{ fontSize: '11px', color: '#fdba74', marginBottom: '8px' }}>
              סטטוס: {selectedResource.status} | {selectedResource.resourceType}
            </div>
            {selectedResource.ownerName && (
              <div
                style={{
                  fontSize: '12px',
                  marginBottom: '8px',
                  padding: '6px',
                  backgroundColor: '#1e293b',
                  borderRadius: '4px',
                }}
              >
                <span style={{ color: '#94a3b8' }}>מנהל משאב: </span>
                <strong>
                  {selectedResource.ownerName}
                  {selectedResource.ownerTz ? ` (ת"ז: ${selectedResource.ownerTz})` : ''}
                </strong>
              </div>
            )}
            {teamLoading && <div style={{ fontSize: '12px', color: '#94a3b8' }}>טוען צוות...</div>}
            {teamError && <div style={{ fontSize: '12px', color: '#f87171' }}>{teamError}</div>}
            {!teamLoading && !teamError && team.length === 0 && (
              <div style={{ fontSize: '12px', color: '#64748b' }}>אין פרמדיקים משויכים למשאב</div>
            )}
            {team.map((member) => (
              <div
                key={member.tz}
                style={{
                  fontSize: '12px',
                  padding: '6px 0',
                  borderBottom: '1px solid #1e293b',
                }}
              >
                <div style={{ fontWeight: 'bold' }}>{member.name || 'ללא שם'}</div>
                <div style={{ color: '#94a3b8' }}>
                  ת&quot;ז: {member.tz} | {member.role} | {member.orgType}
                </div>
              </div>
            ))}
          </div>
        )}

        {resourcesLoading && (
          <div style={{ padding: '8px 12px', fontSize: '11px', color: '#64748b', borderTop: '1px solid #334155' }}>
            מרענן משאבים...
          </div>
        )}
      </aside>
    </div>
  );
}

export default HapakMap;
