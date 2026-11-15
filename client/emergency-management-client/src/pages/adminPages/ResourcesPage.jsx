import { useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useResources } from '../../features/resources/hooks/useResources';
import { deleteResource } from '../../features/resources/services/resourceApi';
import EditResourceModal from './EditResourceModal';

function ResourcesPage() {
  const { resources, loading, error, refreshResources } = useResources();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [orgFilter, setOrgFilter] = useState('ALL');

  const [editingResourceId, setEditingResourceId] = useState(null);

  const statusOptions = useMemo(
    () => ['ALL', ...new Set(resources.map((r) => r.status).filter(Boolean))],
    [resources]
  );
  const orgOptions = useMemo(
    () => ['ALL', ...new Set(resources.map((r) => r.orgType).filter(Boolean))],
    [resources]
  );

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const statusMatch = statusFilter === 'ALL' || resource.status === statusFilter;
      const orgMatch = orgFilter === 'ALL' || resource.orgType === orgFilter;
      return statusMatch && orgMatch;
    });
  }, [resources, statusFilter, orgFilter]);

  const groupedByType = useMemo(() => {
    const acc = {};
    filteredResources.forEach((resource) => {
      const key = resource.resourceType || 'לא מוגדר';
      acc[key] = (acc[key] || 0) + 1;
    });
    return Object.entries(acc).sort((a, b) => b[1] - a[1]);
  }, [filteredResources]);

  const handleDelete = async (resourceId, resourceName) => {
    if (window.confirm(`האם אתה בטוח שברצונך למחוק את המשאב ${resourceName}?`)) {
      try {
        await deleteResource(resourceId);
        refreshResources();
      } catch (err) {
        alert('מחיקת המשאב נכשלה. ייתכן שהוא עדיין מקושר לאירוע פעיל.');
      }
    }
  };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2 style={{ margin: 0, color: '#0f172a' }}>כלל המשאבים לפי קטגוריות</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => window.location.href = '/admin/create-resource'} 
            style={{ border: 'none', borderRadius: '4px', padding: '8px 12px', backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ➕ הוסף משאב חדש
          </button>
          <button onClick={refreshResources} style={{ border: 'none', borderRadius: '4px', padding: '8px 12px', backgroundColor: '#0f172a', color: 'white', cursor: 'pointer' }}>
            רענון
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '8px', borderRadius: '6px' }}>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              סטטוס: {status}
            </option>
          ))}
        </select>
        <select value={orgFilter} onChange={(e) => setOrgFilter(e.target.value)} style={{ padding: '8px', borderRadius: '6px' }}>
          {orgOptions.map((org) => (
            <option key={org} value={org}>
              ארגון: {org}
            </option>
          ))}
        </select>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '12px' }}>
        <h3 style={{ marginTop: 0 }}>פילוח לפי סוג משאב</h3>
        {groupedByType.length === 0 ? (
          <div style={{ color: '#64748b' }}>אין נתונים להצגה.</div>
        ) : (
          groupedByType.map(([type, count]) => (
            <div key={type} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', padding: '6px 0' }}>
              <span>{type}</span>
              <strong>{count}</strong>
            </div>
          ))
        )}
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h3 style={{ marginTop: 0 }}>רשימת משאבים</h3>
        {loading && <div>טוען משאבים...</div>}
        {error && <div style={{ color: '#b91c1c' }}>{error}</div>}
        {!loading && !error && (
          <div style={{ display: 'grid', gap: '8px' }}>
            {filteredResources.map((resource) => (
              <div key={resource.id} style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{resource.name || `יחידה ${resource.id}`}</div>
                  <div style={{ fontSize: '13px', color: '#475569' }}>
                    סוג: {resource.resourceType || 'לא מוגדר'} | ארגון: {resource.orgType || 'לא מוגדר'} | סטטוס: {resource.status || 'UNKNOWN'}
                  </div>
                  <div style={{ fontSize: '12px', color: resource.ownerName ? '#0f766e' : '#b91c1c', marginTop: '4px' }}>
                    מנהל: {resource.ownerName ? `${resource.ownerName} (${resource.ownerTz})` : 'חסר — לא חוקי'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => setEditingResourceId(resource.id)}
                    style={{ border: 'none', borderRadius: '4px', padding: '6px 12px', backgroundColor: '#0f766e', color: 'white', cursor: 'pointer', height: 'fit-content' }}
                  >
                    ערוך
                  </button>
                  <button 
                    onClick={() => handleDelete(resource.id, resource.name)}
                    style={{ border: 'none', borderRadius: '4px', padding: '6px 12px', backgroundColor: '#dc2626', color: 'white', cursor: 'pointer', height: 'fit-content' }}
                  >
                    מחק
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingResourceId && (
        <EditResourceModal
          resourceId={editingResourceId}
          onClose={() => setEditingResourceId(null)}
          onUpdated={refreshResources}
        />
      )}
    </DashboardLayout>
  );
}

export default ResourcesPage;

