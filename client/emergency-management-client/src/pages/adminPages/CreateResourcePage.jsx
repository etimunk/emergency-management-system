import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { createResource } from '../../features/resources/services/resourceApi';
import { getEligibleOwners } from '../../features/users/services/userApi';

function CreateResourcePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);

  // שדות הטופס
  const [formData, setFormData] = useState({
    name: '',
    orgType: 'MADA',
    resourceType: 'AMBULANCE',
    latitude: 32.0853,
    longitude: 34.7818,
    status: 'AVAILABLE',
    ownerId: '' // שדה עבור המשתמש שינהל את המשאב
  });

  // שליפת משתמשים פנויים (שאין להם משאב עדיין)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await getEligibleOwners(formData.orgType);
        setAvailableUsers(Array.isArray(users) ? users : []);
        if (users?.length > 0) {
          setFormData(prev => ({ ...prev, ownerId: users[0].tz }));
        } else {
          setFormData(prev => ({ ...prev, ownerId: '' }));
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('שגיאה בטעינת משתמשים זמינים למנהל משאב.');
      }
    };
    fetchUsers();
  }, [formData.orgType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'latitude' || name === 'longitude' ? parseFloat(value) : value
    }));
  };

  // חישוב מרחק בק"מ (Haversine)
  const distanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
      + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
      * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const isWithinGushDan = (lat, lon) => distanceKm(32.0853, 34.7818, lat, lon) <= 20;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!formData.ownerId) {
      setError('חובה לבחור משתמש שינהל את המשאב.');
      setIsSubmitting(false);
      return;
    }

    try {
      await createResource({
        name: formData.name,
        orgType: formData.orgType,
        resourceType: formData.resourceType,
        latitude: formData.latitude,
        longitude: formData.longitude,
        speed: 0,
        heading: 0,
        status: formData.status,
        ownerUserId: Number(formData.ownerId),
      });

      navigate('/admin/resources');
    } catch (err) {
      console.error(err);
      setError('נכשלה יצירת המשאב או שיוך המשתמש. ודא שכל הנתונים תקינים.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '600px', margin: '20px auto', backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#1e293b' }}>🚑 הוספת משאב חדש ושיוך למשתמש</h2>
          <button 
            onClick={() => navigate('/admin/resources')}
            style={{ backgroundColor: '#e2e8f0', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
          >
            ביטול וחזרה
          </button>
        </div>

        {error && <div style={{ color: '#b91c1c', backgroundColor: '#fef2f2', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569' }}>שם המשאב (למשל: נט"ן 101):</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="הכנס שם משאב..."
              required
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569' }}>ארגון משויך:</label>
              <select
                name="orgType"
                value={formData.orgType}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              >
                <option value="MADA">מד"א</option>
                <option value="POLICE">משטרה</option>
                <option value="FIRE_DEPT">כיבוי אש</option>
                <option value="MILITARY">צבא / פיקוד העורף</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569' }}>סוג משאב:</label>
              <select
                name="resourceType"
                value={formData.resourceType}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              >
                <option value="AMBULANCE">אמבולנס רגיל</option>
                <option value="MICU">ניידת טיפול נמרץ (נט"ן)</option>
                <option value="HELICOPTER">מסוק חילוץ</option>
                <option value="POLICE_CAR">ניידת משטרה</option>
                <option value="FIRE_TRUCK">כבאית</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569' }}>שיוך למשתמש מנהל (חובה):</label>
            <select
              name="ownerId"
              value={formData.ownerId}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box', backgroundColor: '#f8fafc' }}
            >
              <option value="" disabled>-- בחר משתמש פנוי --</option>
              {availableUsers.map(user => (
                <option key={user.tz} value={user.tz}>
                  {user.name} (ת.ז: {user.tz}) - {user.orgType}
                </option>
              ))}
            </select>
            {availableUsers.length === 0 && (
              <small style={{ color: '#ef4444', display: 'block', marginTop: '5px' }}>
                אין משתמשים זמינים למנהל משאב (חייבים להיות פנויים ולא מנהלי משאב אחר). צור משתמש חדש קודם.
              </small>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569' }}>קו רוחב התחלתי (Latitude):</label>
              <input
                type="number"
                step="any"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569' }}>קו אורך התחלתי (Longitude):</label>
              <input
                type="number"
                step="any"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {!isWithinGushDan(formData.latitude, formData.longitude) && (
            <div style={{ color: '#dc2626', fontSize: '13px', backgroundColor: '#fef2f2', padding: '8px 12px', borderRadius: '6px' }}>
              ⚠️ המיקום חורג מגוש דן (מרחק {distanceKm(32.0853, 34.7818, formData.latitude, formData.longitude).toFixed(1)} ק"מ ממרכז תל אביב). מותר עד 20 ק"מ בלבד.
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || availableUsers.length === 0 || !isWithinGushDan(formData.latitude, formData.longitude)}
            style={{ 
              marginTop: '10px', 
              padding: '12px', 
              backgroundColor: '#0f172a', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: (isSubmitting || availableUsers.length === 0 || !isWithinGushDan(formData.latitude, formData.longitude)) ? 'not-allowed' : 'pointer', 
              fontWeight: 'bold', 
              fontSize: '15px',
              opacity: (isSubmitting || availableUsers.length === 0 || !isWithinGushDan(formData.latitude, formData.longitude)) ? 0.7 : 1
            }}
          >
            {isSubmitting ? 'יוצר משאב...' : '➕ צור משאב ושייך למשתמש'}
          </button>

        </form>
      </div>
    </DashboardLayout>
  );
}

export default CreateResourcePage;
