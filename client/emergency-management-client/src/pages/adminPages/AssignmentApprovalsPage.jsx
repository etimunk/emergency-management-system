import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import {
  approveAssignmentRequest,
  getPendingAssignmentRequests,
  rejectAssignmentRequest,
} from '../../features/assignments/services/assignmentRequestApi';

function AssignmentApprovalsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPendingAssignmentRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('נכשלה טעינת בקשות השיוך.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (requestId) => {
    try {
      setActionId(requestId);
      setMessage('');
      await approveAssignmentRequest(requestId, user.tz);
      setMessage('השיוך אושר.');
      await load();
    } catch (e) {
      setMessage('אישור השיוך נכשל.');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (requestId) => {
    try {
      setActionId(requestId);
      setMessage('');
      await rejectAssignmentRequest(requestId, user.tz);
      setMessage('השיוך נדחה.');
      await load();
    } catch (e) {
      setMessage('דחיית השיוך נכשלה.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <DashboardLayout>
      <h2 style={{ marginTop: 0 }}>אישור שיוך פרמדיקים למשאבים</h2>
      <p style={{ color: '#64748b' }}>
        מנהל משאב מבקש לשייך פרמדיק — השיוך נכנס לתוקף רק אחרי אישורך.
      </p>

      {loading && <div>טוען בקשות...</div>}
      {error && <div style={{ color: '#b91c1c' }}>{error}</div>}
      {message && (
        <div style={{ marginBottom: '12px', color: message.includes('נכשל') ? '#b91c1c' : '#0f766e' }}>
          {message}
        </div>
      )}

      {!loading && !error && requests.length === 0 && (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', color: '#64748b' }}>
          אין בקשות שיוך ממתינות לאישור.
        </div>
      )}

      {!loading && requests.length > 0 && (
        <div style={{ display: 'grid', gap: '10px' }}>
          {requests.map((req) => (
            <div
              key={req.id}
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '14px',
                borderRight: '4px solid #f59e0b',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>
                {req.userName || `פרמדיק ${req.userTz}`} → {req.resourceName || `משאב ${req.resourceId}`}
              </div>
              <div style={{ fontSize: '13px', color: '#475569', marginBottom: '4px' }}>
                מבקש: {req.requesterName || req.requesterTz} | ת&quot;ז פרמדיק: {req.userTz}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                נשלח: {req.createdAt ? new Date(req.createdAt).toLocaleString('he-IL') : '—'}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleApprove(req.id)}
                  disabled={actionId === req.id}
                  style={{
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 14px',
                    backgroundColor: '#0f766e',
                    color: 'white',
                    cursor: actionId === req.id ? 'not-allowed' : 'pointer',
                  }}
                >
                  {actionId === req.id ? '...' : 'אשר שיוך'}
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(req.id)}
                  disabled={actionId === req.id}
                  style={{
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 14px',
                    backgroundColor: '#b91c1c',
                    color: 'white',
                    cursor: actionId === req.id ? 'not-allowed' : 'pointer',
                  }}
                >
                  דחה
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

export default AssignmentApprovalsPage;
