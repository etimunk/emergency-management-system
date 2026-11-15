import { useEffect, useMemo, useState } from 'react';
import OperatorLayout from '../../layouts/OperatorLayout';
import { useAuth } from '../../context/AuthContext';
import { getOperatorProfile } from '../../features/users/services/userApi';
import { getAllIncidents } from '../../features/incidents/services/incidentApi';
import { createCasualty, getCasualtiesByIncident } from '../../features/casualties/services/casualtyApi';

function OperatorCasualtiesPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [casualties, setCasualties] = useState([]);
  const [form, setForm] = useState({ tz: '', fullName: '', condition: 'RED', medicalNotes: '' });
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user?.tz) return;
      const [userData, incidentsData] = await Promise.all([getOperatorProfile(user.tz), getAllIncidents()]);
      setProfile(userData);
      setIncidents(Array.isArray(incidentsData) ? incidentsData : []);
    };
    load();
  }, [user?.tz]);

  const assignedResource = profile?.managedResource || null;

  const currentIncident = useMemo(() => {
    if (!assignedResource?.incidentId) return null;
    return incidents.find((incident) =>
      incident.id === assignedResource.incidentId &&
      (incident.status === 'OPEN' || incident.status === 'IN_PROGRESS')
    ) || null;
  }, [incidents, assignedResource?.incidentId]);

  useEffect(() => {
    const loadCasualties = async () => {
      if (!currentIncident?.id) {
        setCasualties([]);
        return;
      }
      const data = await getCasualtiesByIncident(currentIncident.id);
      setCasualties(Array.isArray(data) ? data : []);
    };
    loadCasualties();
  }, [currentIncident?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentIncident?.id) return;
    try {
      setSaving(true);
      setMsg('');
      await createCasualty({
        tz: form.tz ? Number(form.tz) : null,
        fullName: form.fullName || 'אלמוני',
        condition: form.condition,
        medicalNotes: form.medicalNotes,
        incident: { id: currentIncident.id },
      });
      setForm({ tz: '', fullName: '', condition: 'RED', medicalNotes: '' });
      setMsg('הפצוע נוסף בהצלחה.');
      const updated = await getCasualtiesByIncident(currentIncident.id);
      setCasualties(Array.isArray(updated) ? updated : []);
    } catch (err) {
      setMsg('הוספת הפצוע נכשלה.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <OperatorLayout>
      <h2 style={{ marginTop: 0 }}>ניהול פצועים באירוע</h2>
      {!currentIncident && <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px' }}>אין אירוע פעיל משויך כרגע.</div>}
      {currentIncident && (
        <>
          <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
            אירוע פעיל: #{currentIncident.id} - {currentIncident.description}
          </div>
          <form onSubmit={handleSubmit} style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px', marginBottom: '12px', display: 'grid', gap: '8px' }}>
            <input value={form.tz} onChange={(e) => setForm((prev) => ({ ...prev, tz: e.target.value }))} placeholder="תעודת זהות פצוע (אופציונלי)" />
            <input value={form.fullName} onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))} placeholder="שם מלא" />
            <select value={form.condition} onChange={(e) => setForm((prev) => ({ ...prev, condition: e.target.value }))}>
              <option value="RED">RED</option>
              <option value="YELLOW">YELLOW</option>
              <option value="GREEN">GREEN</option>
              <option value="BLACK">BLACK</option>
            </select>
            <textarea value={form.medicalNotes} onChange={(e) => setForm((prev) => ({ ...prev, medicalNotes: e.target.value }))} rows={3} placeholder="הערות רפואיות" />
            <button disabled={saving} type="submit" style={{ border: 'none', borderRadius: '4px', padding: '8px 12px', backgroundColor: '#b91c1c', color: 'white', cursor: 'pointer' }}>
              {saving ? 'שומר...' : 'הוסף פצוע'}
            </button>
            {msg && <div>{msg}</div>}
          </form>
          <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0 }}>פצועים באירוע</h3>
            {casualties.length === 0 && <div>אין פצועים רשומים כרגע.</div>}
            {casualties.map((casualty) => (
              <div key={casualty.id} style={{ borderBottom: '1px solid #e2e8f0', padding: '8px 0' }}>
                <strong>{casualty.fullName || 'אלמוני'}</strong>
                <div style={{ fontSize: '12px', color: '#475569' }}>
                  דרגת פציעה: {casualty.condition} | ת"ז: {casualty.tz || '-'}
                </div>
                <div style={{ fontSize: '12px' }}>{casualty.medicalNotes || 'ללא הערות'}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </OperatorLayout>
  );
}

export default OperatorCasualtiesPage;

