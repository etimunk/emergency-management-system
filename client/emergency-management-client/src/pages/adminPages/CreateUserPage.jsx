import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { createUser, getAllUsers, updateUserByTz } from '../../features/users/services/userApi';
import { assignResourceOwner, createResource, getAllResources } from '../../features/resources/services/resourceApi';
import { ROLE_OPTIONS } from '../../constants/roles';
import { ORG_OPTIONS } from '../../constants/orgTypes';
import { validateTz } from '../../utils/validators';

// MUI imports (safe addition - only TextField and Button for now)
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

const RESOURCE_STATUS_OPTIONS = ['AVAILABLE', 'UNAVAILABLE', 'BROKEN', 'STUCK'];

function CreateUserPage() {
  const [form, setForm] = useState({
    tz: '',
    name: '',
    password: '',
    role: 'PARAMEDIC',
    orgType: 'MADA',
    isResourceManager: false,
    managerTitle: '',
    managerResourceMode: 'existing',
    selectedResourceId: '',
    newResourceName: '',
    newResourceType: 'Ambulance',
    newResourceStatus: 'AVAILABLE',
  });
  const [resources, setResources] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userOrgFilter, setUserOrgFilter] = useState('ALL');
  const [userSearch, setUserSearch] = useState('');
  const [editingUserTz, setEditingUserTz] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    role: 'PARAMEDIC',
    orgType: 'MADA',
    password: '',
  });
  const [editingSubmitting, setEditingSubmitting] = useState(false);
  const [editMessage, setEditMessage] = useState('');

  useEffect(() => {
    const loadResources = async () => {
      try {
        setLoadingResources(true);
        const data = await getAllResources();
        setResources(Array.isArray(data) ? data : []);
      } catch (err) {
        setResources([]);
      } finally {
        setLoadingResources(false);
      }
    };
    loadResources();
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const data = await getAllUsers();
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };
    loadUsers();
  }, []);

  const resourceCandidates = useMemo(() => {
    if (!Array.isArray(resources)) return [];
    return resources.filter((resource) => !resource.resourceOwner);
  }, [resources]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = userSearch.trim().toLowerCase();
    return users.filter((user) => {
      const roleMatch = userRoleFilter === 'ALL' || user?.role === userRoleFilter;
      const orgMatch = userOrgFilter === 'ALL' || user?.orgType === userOrgFilter;
      const searchMatch = !normalizedSearch
        || String(user?.tz ?? '').includes(normalizedSearch)
        || String(user?.name ?? '').toLowerCase().includes(normalizedSearch);
      return roleMatch && orgMatch && searchMatch;
    });
  }, [users, userOrgFilter, userRoleFilter, userSearch]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openEditUser = (user) => {
    setEditingUserTz(user.tz);
    setEditForm({
      name: user?.name ?? '',
      role: user?.role ?? 'PARAMEDIC',
      orgType: user?.orgType ?? 'MADA',
      password: '',
    });
    setEditMessage('');
  };

  const closeEditUser = () => {
    setEditingUserTz(null);
    setEditMessage('');
  };

  const resetForm = () => {
    setForm({
      tz: '',
      name: '',
      password: '',
      role: 'PARAMEDIC',
      orgType: 'MADA',
      isResourceManager: false,
      managerTitle: '',
      managerResourceMode: 'existing',
      selectedResourceId: '',
      newResourceName: '',
      newResourceType: 'Ambulance',
      newResourceStatus: 'AVAILABLE',
    });
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdateUser = async (userRecord) => {
    try {
      setEditingSubmitting(true);
      setEditMessage('');
      await updateUserByTz(userRecord.tz, {
        name: editForm.name.trim(),
        role: editForm.role,
        orgType: editForm.orgType,
        password: editForm.password,
        resource: userRecord?.resource ?? null,
      });

      const [refreshedUsers, refreshedResources] = await Promise.all([
        getAllUsers(),
        getAllResources(),
      ]);
      setUsers(Array.isArray(refreshedUsers) ? refreshedUsers : []);
      setResources(Array.isArray(refreshedResources) ? refreshedResources : []);
      setEditMessage('המשתמש עודכן בהצלחה.');
      setEditingUserTz(null);
    } catch (err) {
      setEditMessage('עדכון המשתמש נכשל.');
    } finally {
      setEditingSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const tzValidation = validateTz(form.tz);
    if (!tzValidation.valid) {
      setMessage(tzValidation.error);
      return;
    }
    const tzNumber = Number(String(form.tz).trim());

    if (form.isResourceManager && form.managerResourceMode === 'existing' && !form.selectedResourceId) {
      setMessage('בחרי משאב קיים עבור מנהל המשאב.');
      return;
    }

    if (form.isResourceManager && form.managerResourceMode === 'new' && !form.newResourceName.trim()) {
      setMessage('יש להזין שם למשאב החדש.');
      return;
    }

    try {
      setSubmitting(true);

      const createdUser = await createUser({
        tz: tzNumber,
        name: form.name.trim(),
        password: form.password,
        role: form.role,
        orgType: form.orgType,
      });

      if (form.isResourceManager) {
        let targetResourceId = null;
        if (form.managerResourceMode === 'existing') {
          targetResourceId = Number(form.selectedResourceId);
        } else {
          const createdResource = await createResource({
            name: form.newResourceName.trim(),
            orgType: form.orgType,
            resourceType: form.newResourceType.trim(),
            status: form.newResourceStatus,
            latitude: 32.0853,
            longitude: 34.7818,
            speed: 0,
            heading: 0,
            ownerUserId: createdUser?.tz ?? tzNumber,
          });
          targetResourceId = createdResource?.id;
        }

        if (targetResourceId && form.managerResourceMode === 'existing') {
          await assignResourceOwner(targetResourceId, createdUser?.tz ?? tzNumber);
        }
      }

      setMessage('המשתמש נוצר בהצלחה.');
      resetForm();

      const [refreshedResources, refreshedUsers] = await Promise.all([
        getAllResources(),
        getAllUsers(),
      ]);
      setResources(Array.isArray(refreshedResources) ? refreshedResources : []);
      setUsers(Array.isArray(refreshedUsers) ? refreshedUsers : []);
    } catch (err) {
      const serverMsg = err?.response?.data?.message;
      const detail = err?.response?.data?.detail;
      setMessage(detail ? `${serverMsg} — ${detail}` : serverMsg || 'יצירת המשתמש נכשלה. בדקי אם ת"ז כבר קיימת או אם חסרים פרטים.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '760px', margin: '0 auto', backgroundColor: 'white', padding: '18px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h2 style={{ marginTop: 0 }}>יצירת משתמש חדש במערכת</h2>
        <p style={{ color: '#475569', marginTop: 0 }}>
          הזיני פרטים אישיים, תפקיד וארגון. ניתן להגדיר משתמש כמנהל משאב ולשייך אותו למשאב קיים או חדש.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="שם מלא" required />
            <TextField 
              value={form.tz} 
              onChange={(e) => handleChange('tz', e.target.value)} 
              placeholder='ת"ז' 
              required 
              size="small"
              label="תעודת זהות"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <input type="password" value={form.password} onChange={(e) => handleChange('password', e.target.value)} placeholder="סיסמה" required />
            <select value={form.role} onChange={(e) => handleChange('role', e.target.value)}>
              {ROLE_OPTIONS.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
          </div>

          <select value={form.orgType} onChange={(e) => handleChange('orgType', e.target.value)}>
            {ORG_OPTIONS.map((org) => <option key={org} value={org}>{org}</option>)}
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={form.isResourceManager}
              onChange={(e) => handleChange('isResourceManager', e.target.checked)}
            />
            המשתמש הוא מנהל משאב
          </label>

          {form.isResourceManager && (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', backgroundColor: '#f8fafc' }}>
              <h4 style={{ marginTop: 0 }}>הגדרות מנהל משאב</h4>
              <input
                value={form.managerTitle}
                onChange={(e) => handleChange('managerTitle', e.target.value)}
                placeholder='תיאור תפקיד מנהל (לדוגמה: "מנהל אמבולנס 21")'
              />
              <div style={{ marginTop: '10px', display: 'flex', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="radio"
                    name="managerResourceMode"
                    checked={form.managerResourceMode === 'existing'}
                    onChange={() => handleChange('managerResourceMode', 'existing')}
                  />
                  שיוך למשאב קיים
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="radio"
                    name="managerResourceMode"
                    checked={form.managerResourceMode === 'new'}
                    onChange={() => handleChange('managerResourceMode', 'new')}
                  />
                  יצירת משאב חדש
                </label>
              </div>

              {form.managerResourceMode === 'existing' && (
                <div style={{ marginTop: '10px' }}>
                  <select
                    value={form.selectedResourceId}
                    onChange={(e) => handleChange('selectedResourceId', e.target.value)}
                    disabled={loadingResources}
                  >
                    <option value="">בחרי משאב ללא מנהל</option>
                    {resourceCandidates.map((resource) => (
                      <option key={resource.id} value={resource.id}>
                        {resource.name || `משאב ${resource.id}`} | {resource.resourceType || 'ללא סוג'} | {resource.status}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {form.managerResourceMode === 'new' && (
                <div style={{ marginTop: '10px', display: 'grid', gap: '8px' }}>
                  <input
                    value={form.newResourceName}
                    onChange={(e) => handleChange('newResourceName', e.target.value)}
                    placeholder="שם המשאב החדש"
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input
                      value={form.newResourceType}
                      onChange={(e) => handleChange('newResourceType', e.target.value)}
                      placeholder="סוג משאב (למשל Ambulance)"
                    />
                    <select value={form.newResourceStatus} onChange={(e) => handleChange('newResourceStatus', e.target.value)}>
                      {RESOURCE_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            sx={{ alignSelf: 'flex-start' }}
          >
            {submitting ? 'שומר...' : 'צור משתמש'}
          </Button>
          {message && <div style={{ color: message.includes('נכשלה') || message.includes('תקינה') ? '#b91c1c' : '#0f766e' }}>{message}</div>}
        </form>
      </div>
    </DashboardLayout>
  );
}

export default CreateUserPage;

