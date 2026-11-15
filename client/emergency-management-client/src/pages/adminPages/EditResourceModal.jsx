import React, { useState, useEffect } from 'react';
import {
  getResourceDetails,
  updateResourceStatus,
  updateResourceDetails,
  assignResourceOwner,
  removeUserFromResource,
  getResourceUsers,
  assignResourceToIncident,
  adminAddTeamMembers,
  adminRemoveTeamMember,
} from '../../features/resources/services/resourceApi';
import { getEligibleOwners, getEligibleTeamMembers } from '../../features/users/services/userApi';
import { getAllIncidents } from '../../features/incidents/services/incidentApi';

function EditResourceModal({ resourceId, onClose, onUpdated }) {
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('details'); // details | owner | team | incident

  // General details
  const [formData, setFormData] = useState({ name: '', resourceType: '', status: '', latitude: 0, longitude: 0 });

  // Owner change
  const [ownerSearch, setOwnerSearch] = useState('');
  const [eligibleOwners, setEligibleOwners] = useState([]);

  // Team
  const [team, setTeam] = useState([]);
  const [teamSearch, setTeamSearch] = useState('');
  const [eligibleTeam, setEligibleTeam] = useState([]);

  // Incident
  const [incidents, setIncidents] = useState([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const details = await getResourceDetails(resourceId);
      setResource(details);
      setFormData({
        name: details.name || '',
        resourceType: details.resourceType || '',
        status: details.status || 'AVAILABLE',
        latitude: details.latitude || 0,
        longitude: details.longitude || 0,
      });

      // Load eligible owners for this org
      const owners = await getEligibleOwners(details.orgType);
      setEligibleOwners(Array.isArray(owners) ? owners : []);

      // Load current team
      const currentTeam = await getResourceUsers(resourceId);
      setTeam(Array.isArray(currentTeam) ? currentTeam : []);

      // Load eligible team members (using current owner if exists)
      if (details.owner) {
        const teamCandidates = await getEligibleTeamMembers({
          requesterTz: details.owner.tz,
          orgType: details.orgType,
          resourceId,
        });
        setEligibleTeam(Array.isArray(teamCandidates) ? teamCandidates : []);
      }

      // Load open incidents
      const allIncidents = await getAllIncidents();
      setIncidents(Array.isArray(allIncidents) ? allIncidents.filter(i => i.status !== 'CLOSED') : []);
    } catch (err) {
      setError('שגיאה בטעינת נתוני המשאב');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resourceId) loadData();
  }, [resourceId]);

  const handleSaveDetails = async () => {
    if (!window.confirm('האם אתה בטוח שברצונך לעדכן את פרטי המשאב?')) return;
    try {
      await updateResourceDetails(resourceId, {
        name: formData.name,
        resourceType: formData.resourceType,
        orgType: resource.orgType,
        latitude: formData.latitude,
        longitude: formData.longitude,
        status: formData.status, // תיקון — עכשיו שולחים גם את הסטטוס
      });
      await loadData();   // רענון הנתונים במודאל
      onUpdated();        // רענון הרשימה בדף האב
      onClose();
    } catch (err) {
      alert('עדכון נכשל');
    }
  };

  const handleChangeOwner = async (newOwnerTz) => {
    if (!window.confirm('האם אתה בטוח שברצונך להחליף את מנהל המשאב? המנהל הקודם ינותק מהמשאב.')) return;
    try {
      await assignResourceOwner(resourceId, newOwnerTz);
      await loadData();
      onUpdated();
    } catch (err) {
      alert('החלפת מנהל נכשלה');
    }
  };

  const handleAddTeamMember = async (userTz) => {
    if (!window.confirm('האם אתה בטוח שברצונך להוסיף את המשתמש לצוות?')) return;
    try {
      await adminAddTeamMembers(resourceId, [userTz]);
      await loadData();
      onUpdated();
    } catch (err) {
      alert('הוספה נכשלה — ודא שהיוזר מאותו ארגון ופנוי');
    }
  };

  const handleRemoveTeamMember = async (userTz) => {
    if (!window.confirm('האם אתה בטוח שברצונך להסיר את המשתמש מהצוות?')) return;
    try {
      await adminRemoveTeamMember(resourceId, userTz);
      await loadData();
      onUpdated();
    } catch (err) {
      alert('הסרה נכשלה');
    }
  };

  const handleAssignIncident = async () => {
    if (!selectedIncidentId) return;
    if (!window.confirm('לשייך משאב זה לאירוע?')) return;
    try {
      await assignResourceToIncident(resourceId, Number(selectedIncidentId));
      await loadData();
      onUpdated();
    } catch (err) {
      alert('שיוך לאירוע נכשל');
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>טוען...</div>;
  if (error) return <div style={{ padding: 20, color: '#b91c1c' }}>{error}</div>;
  if (!resource) return null;

  const filteredOwners = eligibleOwners.filter(u =>
    u.name?.toLowerCase().includes(ownerSearch.toLowerCase()) || String(u.tz).includes(ownerSearch)
  );

  const filteredTeamCandidates = eligibleTeam.filter(u =>
    u.name?.toLowerCase().includes(teamSearch.toLowerCase()) || String(u.tz).includes(teamSearch)
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ background: 'white', width: '92%', maxWidth: 720, borderRadius: 12, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>עריכת משאב #{resource.id} — {resource.name}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '2px solid #e2e8f0' }}>
          {['details', 'owner', 'team', 'incident'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: activeTab === tab ? '#0f172a' : 'transparent',
                color: activeTab === tab ? 'white' : '#475569',
                borderRadius: '6px 6px 0 0',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              {tab === 'details' && 'פרטים כלליים'}
              {tab === 'owner' && 'מנהל משאב'}
              {tab === 'team' && 'צוות'}
              {tab === 'incident' && 'שיוך לאירוע'}
            </button>
          ))}
        </div>

        {/* DETAILS TAB */}
        {activeTab === 'details' && (
          <div style={{ display: 'grid', gap: 14 }}>
            <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="שם משאב" />
            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="BUSY">BUSY</option>
              <option value="UNAVAILABLE">UNAVAILABLE</option>
            </select>
            <div style={{ display: 'flex', gap: 12 }}>
              <input type="number" value={formData.latitude} onChange={e => setFormData({ ...formData, latitude: parseFloat(e.target.value) })} />
              <input type="number" value={formData.longitude} onChange={e => setFormData({ ...formData, longitude: parseFloat(e.target.value) })} />
            </div>
            <button onClick={handleSaveDetails} style={{ background: '#0f172a', color: 'white', padding: 10, borderRadius: 6 }}>שמור פרטים</button>
          </div>
        )}

        {/* OWNER TAB */}
        {activeTab === 'owner' && (
          <div>
            <div style={{ marginBottom: 12, padding: 12, background: '#f0fdfa', borderRadius: 8 }}>
              <strong>מנהל נוכחי:</strong> {resource.owner ? `${resource.owner.name} (${resource.owner.tz})` : 'ללא מנהל'}
            </div>

            <input
              placeholder="חפש יוזר חדש לפי שם או ת.ז..."
              value={ownerSearch}
              onChange={e => setOwnerSearch(e.target.value)}
              style={{ width: '100%', padding: 8, marginBottom: 10 }}
            />

            <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 6 }}>
              {filteredOwners.length === 0 && <div style={{ padding: 10, color: '#94a3b8' }}>אין תוצאות</div>}
              {filteredOwners.map(u => (
                <div key={u.tz} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
                  <span>{u.name} ({u.tz}) — {u.role}</span>
                  <button
                    onClick={() => handleChangeOwner(u.tz)}
                    disabled={resource.owner && resource.owner.tz === u.tz}
                    style={{ background: '#0f766e', color: 'white', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}
                  >
                    בחר כמנהל
                  </button>
                </div>
              ))}
            </div>
            <small style={{ color: '#64748b', display: 'block', marginTop: 8 }}>החלפה תנתק את המנהל הקודם מהמשאב (לא תעביר אותו לצוות).</small>
          </div>
        )}

        {/* TEAM TAB */}
        {activeTab === 'team' && (
          <div>
            <div style={{ marginBottom: 12 }}>
              <strong>צוות נוכחי ({team.length})</strong>
              {team.length === 0 && <div style={{ color: '#94a3b8' }}>אין חברי צוות</div>}
              {team.map(u => (
                <div key={u.tz} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span>{u.name} ({u.tz}) — {u.role}</span>
                  <button onClick={() => handleRemoveTeamMember(u.tz)} style={{ color: '#dc2626', border: 'none', background: 'none', cursor: 'pointer' }}>הסר</button>
                </div>
              ))}
            </div>

            <input
              placeholder="חפש יוזר להוספה (מאותו ארגון)..."
              value={teamSearch}
              onChange={e => setTeamSearch(e.target.value)}
              style={{ width: '100%', padding: 8, marginBottom: 8 }}
            />

            <div style={{ maxHeight: 180, overflowY: 'auto' }}>
              {filteredTeamCandidates.map(u => (
                <div key={u.tz} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span>{u.name} ({u.tz})</span>
                  <button onClick={() => handleAddTeamMember(u.tz)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '2px 8px', borderRadius: 4 }}>הוסף</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INCIDENT TAB */}
        {activeTab === 'incident' && (
          <div>
            <div style={{ marginBottom: 12 }}>
              <strong>אירוע נוכחי:</strong> {resource.incidentId ? `#${resource.incidentId}` : 'לא משויך'}
            </div>

            <select value={selectedIncidentId} onChange={e => setSelectedIncidentId(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 12 }}>
              <option value="">בחר אירוע...</option>
              {incidents.map(i => (
                <option key={i.id} value={i.id}>#{i.id} — {i.description || i.address || 'ללא תיאור'}</option>
              ))}
            </select>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleAssignIncident} disabled={!selectedIncidentId} style={{ flex: 1, background: '#0f766e', color: 'white', padding: 10, borderRadius: 6 }}>שייך לאירוע</button>
              <button onClick={() => alert('פונקציונליות ביטול שיוך תושלם')} style={{ flex: 1, background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 6 }}>בטל שיוך</button>
            </div>
          </div>
        )}

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #cbd5e1' }}>סגור</button>
        </div>
      </div>
    </div>
  );
}

export default EditResourceModal;