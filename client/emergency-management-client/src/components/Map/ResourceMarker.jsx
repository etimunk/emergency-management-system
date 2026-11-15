import { CircleMarker, Popup } from 'react-leaflet';

const COLORS = {
  available: '#22c55e',
  deployed: '#f97316',
  other: '#38bdf8',
};

function hasValidCoords(resource) {
  const lat = Number(resource?.latitude);
  const lon = Number(resource?.longitude);
  return Number.isFinite(lat) && Number.isFinite(lon);
}

function ResourceMarker({ resource, mapStatus, incident, onSelect }) {
  if (!hasValidCoords(resource)) {
    return null;
  }

  const lat = Number(resource.latitude);
  const lon = Number(resource.longitude);
  const color = COLORS[mapStatus] || COLORS.other;

  return (
    <CircleMarker
      center={[lat, lon]}
      radius={mapStatus === 'deployed' ? 9 : 7}
      pathOptions={{
        color,
        fillColor: color,
        fillOpacity: 0.9,
        weight: 2,
      }}
      eventHandlers={{
        click: () => onSelect(resource.id),
      }}
    >
      <Popup>
        <div style={{ direction: 'rtl', textAlign: 'right', fontFamily: 'Arial', color: '#1e293b' }}>
          <h4 style={{ margin: '0 0 6px 0', color }}>
            {resource.name}
          </h4>
          <div style={{ fontSize: '12px' }}>סוג: {resource.resourceType || '-'}</div>
          <div style={{ fontSize: '12px' }}>ארגון: {resource.orgType || '-'}</div>
          <div style={{ fontSize: '12px' }}>סטטוס: {resource.status || '-'}</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            {lat.toFixed(5)}, {lon.toFixed(5)}
          </div>
          {incident && (
            <div style={{ fontSize: '12px', marginTop: '4px', fontWeight: 'bold' }}>
              אירוע #{incident.id}: {incident.description}
            </div>
          )}
        </div>
      </Popup>
    </CircleMarker>
  );
}

export default ResourceMarker;
