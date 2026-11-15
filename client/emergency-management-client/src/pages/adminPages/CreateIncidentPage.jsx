// src/pages/adminPages/CreateIncidentPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { createIncident } from '../../features/incidents/services/incidentApi';

function CreateIncidentPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // הסטייט של שדות הטופס - מותאם בדיוק ל-Entity ב-Java
  const [formData, setFormData] = useState({
    description: '',
    locationAddress: '',
    latitude: 32.0853,  // ערך דיפולטיבי של מרכז הארץ (למשל)
    longitude: 34.7818,
    status: 'OPEN',     // סטטוס התחלתי מתוך ה-Enum
    createdBy: 'Admin_Hapak'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'latitude' || name === 'longitude' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // שליחת הנתונים ל-Spring Boot
      await createIncident(formData);
      // חזרה אוטומטית ל-Dashboard לאחר הצלחה
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('נכשלה פתיחת האירוע במערכת. ודא שהשרת תקין.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '600px', margin: '20px auto', backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#1e293b' }}>🚨 דיווח ופתיחת אירוע חירום חדש</h2>
          <button 
            onClick={() => navigate('/dashboard')}
            style={{ backgroundColor: '#e2e8f0', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
          >
            ביטול וחזרה
          </button>
        </div>

        {error && <div style={{ color: '#b91c1c', backgroundColor: '#fef2f2', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569' }}>תיאור דיווח האירוע:</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="למשל: תאונת דרכים עם מעורבות של שני רכבים, חשש ללכודים..."
              required
              rows="3"
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontFamily: 'Arial' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569' }}>כתובת / מיקום טקסטואלי:</label>
            <input
              type="text"
              name="locationAddress"
              value={formData.locationAddress}
              onChange={handleChange}
              placeholder="למשל: כביש 1 מחלף לוד למערב"
              required
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569' }}>קו רוחב (Latitude):</label>
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
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569' }}>קו אורך (Longitude):</label>
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

          <button
            type="submit"
            disabled={isSubmitting}
            style={{ 
              marginTop: '10px', 
              padding: '12px', 
              backgroundColor: '#1e293b', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer', 
              fontWeight: 'bold', 
              fontSize: '15px' 
            }}
          >
            {isSubmitting ? 'מקים אירוע במערכת...' : '🚀 שגר אירוע לחפ"ק'}
          </button>

        </form>
      </div>
    </DashboardLayout>
  );
}

export default CreateIncidentPage;