import React, { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getAllUsers, deleteUser, updateUserByTz } from '../../features/users/services/userApi';
import { getAllResources, getResourceDetails } from '../../features/resources/services/resourceApi';
import { ROLE_OPTIONS } from '../../constants/roles';
import { ORG_OPTIONS } from '../../constants/orgTypes';

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', role: '', orgType: '', password: '' });
  
  // Modal state
  const [selectedResource, setSelectedResource] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersData, resourcesData] = await Promise.all([
        getAllUsers(),
        getAllResources()
      ]);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setResources(Array.isArray(resourcesData) ? resourcesData : []);
    } catch (err) {
      setError('שגיאה בטעינת הנתונים.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (tz, name) => {
    if (window.confirm(`האם אתה בטוח שברצונך למחוק את המשתמש ${name}?`)) {
      try {
        await deleteUser(tz);
        fetchData();
      } catch (err) {
        alert('שגיאה במחיקת המשתמש. וודא שהוא מנותק ממשאבים פעילים אם נדרש.');
      }
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user.tz);
    setEditForm({
      name: user.name || '',
      role: user.role || 'PARAMEDIC',
      orgType: user.orgType || 'MADA',
      password: ''
    });
  };

  const handleSaveEdit = async () => {
    try {
      const payload = {
        name: editForm.name,
        role: editForm.role,
        orgType: editForm.orgType,
      };
      if (editForm.password) {
        payload.password = editForm.password;
      }
      await updateUserByTz(editingUser, payload);
      setEditingUser(null);
      fetchData();
    } catch (err) {
      alert('שגיאה בעדכון המשתמש.');
    }
  };

  const handleViewResource = async (resourceId) => {
    try {
      const details = await getResourceDetails(resourceId);
      setSelectedResource(details);
    } catch (err) {
      alert('שגיאה בטעינת פרטי המשאב.');
    }
  };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: '24px' }}>ניהול משתמשים</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b' }}>צפייה, עריכה ומחיקה של משתמשי המערכת</p>
        </div>
        <button 
          onClick={() => window.location.href = '/admin/create-user'} 
          style={{ border: 'none', borderRadius: '6px', padding: '10px 16px', backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)' }}
        >
          <span>➕</span> צור משתמש חדש
        </button>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>טוען נתונים...</div>}
      {error && <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>{error}</div>}

      {!loading && !error && (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600', width: '20%' }}>שם משתמש</th>
                <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600', width: '15%' }}>תעודת זהות</th>
                <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600', width: '15%' }}>ארגון</th>
                <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600', width: '15%' }}>תפקיד</th>
                <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600', width: '15%' }}>שיוך למשאב</th>
                <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600', width: '20%', textAlign: 'left' }}>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const managedResource = resources.find(r => r?.ownerTz === user.tz);
                const isManager = Boolean(managedResource);
                const assignedResId = managedResource ? managedResource.id : user.assignedResourceId;
                
                return (
                  <React.Fragment key={user.tz}>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', transition: 'background-color 0.2s' }}>
                      <td style={{ padding: '16px', fontWeight: '500', color: '#0f172a' }}>{user.name || 'ללא שם'}</td>
                      <td style={{ padding: '16px', color: '#475569' }}>{user.tz}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', color: '#334155' }}>
                          {user.orgType}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: '#475569' }}>{user.role}</td>
                      <td style={{ padding: '16px' }}>
                        {assignedResId ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ color: isManager ? '#0f766e' : '#3b82f6', fontWeight: '500', fontSize: '13px' }}>
                              {isManager ? 'מנהל משאב' : 'צוות משאב'}
                            </span>
                            <button 
                              onClick={() => handleViewResource(assignedResId)}
                              style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: 0, textAlign: 'right', fontSize: '13px', textDecoration: 'underline' }}
                            >
                              צפה במשאב {assignedResId}
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '13px' }}>לא משויך</span>
                        )}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => handleEditClick(user)}
                            style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px 12px', backgroundColor: 'white', color: '#334155', cursor: 'pointer', fontSize: '13px', fontWeight: '500', transition: 'all 0.2s' }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#f8fafc'}
                            onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
                          >
                            ערוך
                          </button>
                          <button 
                            onClick={() => handleDelete(user.tz, user.name)}
                            style={{ border: 'none', borderRadius: '4px', padding: '6px 12px', backgroundColor: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontSize: '13px', fontWeight: '500', transition: 'all 0.2s' }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#fca5a5'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#fee2e2'}
                          >
                            מחק
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* עריכת משתמש - שורה נפתחת */}
                    {editingUser === user.tz && (
                      <tr style={{ backgroundColor: '#f8fafc' }}>
                        <td colSpan="6" style={{ padding: '16px', borderBottom: '1px solid #cbd5e1' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
                            <label style={{ display: 'flex', flexDirection: 'column', fontSize: '13px', color: '#475569' }}>
                              שם מלא:
                              <input 
                                value={editForm.name} 
                                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                style={{ marginTop: '4px', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                              />
                            </label>
                            
                            <label style={{ display: 'flex', flexDirection: 'column', fontSize: '13px', color: '#475569' }}>
                              ארגון:
                              <select 
                                value={editForm.orgType} 
                                onChange={(e) => setEditForm(prev => ({ ...prev, orgType: e.target.value }))}
                                style={{ marginTop: '4px', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}
                              >
                                {ORG_OPTIONS.map((org) => (
                                  <option key={org} value={org}>{org}</option>
                                ))}
                              </select>
                            </label>

                            <label style={{ display: 'flex', flexDirection: 'column', fontSize: '13px', color: '#475569' }}>
                              תפקיד:
                              <select 
                                value={editForm.role} 
                                onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                                style={{ marginTop: '4px', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}
                              >
                                {ROLE_OPTIONS.map((role) => (
                                  <option key={role} value={role}>{role}</option>
                                ))}
                              </select>
                            </label>

                            <label style={{ display: 'flex', flexDirection: 'column', fontSize: '13px', color: '#475569' }}>
                              סיסמה חדשה (אופציונלי):
                              <input 
                                type="password"
                                value={editForm.password} 
                                onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                                placeholder="השאר ריק אם אין שינוי"
                                style={{ marginTop: '4px', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                              />
                            </label>

                            <div style={{ display: 'flex', gap: '8px', height: '35px' }}>
                              <button onClick={handleSaveEdit} style={{ border: 'none', borderRadius: '4px', padding: '0 16px', backgroundColor: '#10b981', color: 'white', cursor: 'pointer', fontWeight: '500' }}>
                                שמור שינויים
                              </button>
                              <button onClick={() => setEditingUser(null)} style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '0 16px', backgroundColor: 'white', color: '#475569', cursor: 'pointer', fontWeight: '500' }}>
                                ביטול
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal - Resource Details (expanded with owner + team) */}
      {selectedResource && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '560px', 
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            maxHeight: '85vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, color: '#0f172a' }}>פרטי משאב #{selectedResource.id}</h3>
              <button 
                onClick={() => setSelectedResource(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Basic info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>שם המשאב</div>
                <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '15px' }}>{selectedResource.name || 'ללא שם'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>סוג משאב</div>
                <div style={{ fontWeight: '500', color: '#1e293b' }}>{selectedResource.resourceType}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>ארגון</div>
                <div style={{ fontWeight: '500', color: '#1e293b' }}>{selectedResource.orgType}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>סטטוס</div>
                <span style={{ 
                  backgroundColor: selectedResource.status === 'AVAILABLE' ? '#dcfce7' : 
                                  selectedResource.status === 'BUSY' ? '#fee2e2' : '#f1f5f9',
                  color: selectedResource.status === 'AVAILABLE' ? '#166534' : 
                         selectedResource.status === 'BUSY' ? '#991b1b' : '#334155',
                  padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500'
                }}>
                  {selectedResource.status}
                </span>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>מיקום (נ.צ)</div>
                <div style={{ color: '#1e293b', fontSize: '13px' }}>
                  {selectedResource.latitude?.toFixed(4)}, {selectedResource.longitude?.toFixed(4)}
                </div>
              </div>
            </div>

            {/* Owner */}
            <div style={{ marginBottom: '18px', padding: '12px', backgroundColor: '#f0fdfa', borderRadius: '8px', border: '1px solid #99f6e4' }}>
              <div style={{ fontSize: '12px', color: '#0f766e', marginBottom: '4px', fontWeight: '600' }}>מנהל המשאב</div>
              {selectedResource.owner ? (
                <div style={{ fontWeight: '600', color: '#134e4b' }}>
                  {selectedResource.owner.name || 'ללא שם'} (ת"ז: {selectedResource.owner.tz})
                  {selectedResource.owner.role && <span style={{ fontWeight: '400', color: '#0f766e' }}> — {selectedResource.owner.role}</span>}
                </div>
              ) : (
                <div style={{ color: '#ef4444', fontWeight: '500' }}>ללא מנהל פעיל</div>
              )}
            </div>

            {/* Team members */}
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px', fontWeight: '600' }}>
                צוות משויך ({selectedResource.users?.length || 0})
              </div>
              {selectedResource.users && selectedResource.users.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedResource.users.map((u, idx) => (
                    <div key={idx} style={{ 
                      padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', 
                      border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div>
                        <span style={{ fontWeight: '500', color: '#1e293b' }}>{u.name || 'ללא שם'}</span>
                        <span style={{ color: '#64748b', fontSize: '12px', marginRight: '8px' }}>(ת"ז: {u.tz})</span>
                      </div>
                      {u.role && <span style={{ fontSize: '12px', color: '#475569', backgroundColor: '#e0e7ff', padding: '1px 6px', borderRadius: '3px' }}>{u.role}</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: '#94a3b8', fontSize: '13px', padding: '8px 0' }}>אין חברי צוות משויכים</div>
              )}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setSelectedResource(null)}
                style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 16px', backgroundColor: 'white', color: '#334155', cursor: 'pointer', fontWeight: '500' }}
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}

export default UsersPage;
