import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OperatorLayout from '../../layouts/OperatorLayout';
import { useAuth } from '../../context/AuthContext';
import { getOperatorProfile, getEligibleTeamMembers } from '../../features/users/services/userApi';
import { getAllIncidents, removeResourceFromIncident } from '../../features/incidents/services/incidentApi';
import { addUsersToResource, getResourceUsers, removeUserFromResource, updateResourceStatus } from '../../features/resources/services/resourceApi';
import { getResourcePendingAssignments } from '../../features/assignments/services/assignmentRequestApi';

const STATUS_OPTIONS = ['AVAILABLE', 'EN_ROUTE', 'BUSY', 'STUCK'];

const STATUS_LABELS = {
  AVAILABLE: 'זמין',
  EN_ROUTE: 'בדרך',
  BUSY: 'בשטח',
  STUCK: 'תקוע',
};

function OperationsHomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectMsg, setDisconnectMsg] = useState('');
  const [availableParamedics, setAvailableParamedics] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [assigningUsers, setAssigningUsers] = useState(false);
  const [assignUsersMsg, setAssignUsersMsg] = useState('');
  const [resourceTeam, setResourceTeam] = useState([]);
  const [teamMsg, setTeamMsg] = useState('');
  const [removingUserTz, setRemovingUserTz] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [pendingAssignments, setPendingAssignments] = useState([]);

  const ownerPermission = Boolean(profile?.resourceOwner);
  // assignedResource — המשאב הרלוונטי ליוזר (מנהל או צוות)
  const assignedResource = profile?.managedResource || profile?.assignedResource || null;

  const loadProfileData = async (resourceId, orgType, isOwner, requesterTz) => {
    const canManageTeam = Boolean(isOwner && requesterTz != null && orgType && resourceId);
    const [eligibleResult, teamResult, pendingResult] = await Promise.allSettled([
      canManageTeam
        ? getEligibleTeamMembers({ requesterTz, orgType, resourceId })
        : Promise.resolve([]),
      resourceId ? getResourceUsers(resourceId) : Promise.resolve([]),
      canManageTeam && resourceId
        ? getResourcePendingAssignments(resourceId, requesterTz)
        : Promise.resolve([]),
    ]);

    const eligible = eligibleResult.status === 'fulfilled' ? eligibleResult.value : [];
    const team = teamResult.status === 'fulfilled' ? teamResult.value : [];
    const pending = pendingResult.status === 'fulfilled' ? pendingResult.value : [];

    setAvailableParamedics(Array.isArray(eligible) ? eligible : []);
    setResourceTeam(Array.isArray(team) ? team.filter((u) => u?.role === 'PARAMEDIC') : []);
    setPendingAssignments(Array.isArray(pending) ? pending : []);
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user?.tz) return;
      try {
        setLoading(true);
        setError(null);
        const [profileData, incidentsData] = await Promise.all([
          getOperatorProfile(user.tz),
          getAllIncidents(),
        ]);
        if (!mounted) return;
        setProfile(profileData);
        setIncidents(Array.isArray(incidentsData) ? incidentsData : []);
        const resourceForTeam = profileData?.managedResource || profileData?.assignedResource;
        await loadProfileData(
          resourceForTeam?.id,
          resourceForTeam?.orgType ?? profileData?.orgType,
          profileData?.resourceOwner,
          user.tz
        );
      } catch (e) {
        if (!mounted) return;
        setError('נכשלה טעינת נתוני מפעיל מהשרת.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [user?.tz]);

  const currentIncident = useMemo(() => {
    if (!assignedResource?.incidentId) return null;
    return incidents.find((incident) =>
      incident.id === assignedResource.incidentId &&
      (incident.status === 'OPEN' || incident.status === 'IN_PROGRESS')
    ) || null;
  }, [incidents, assignedResource?.incidentId]);

  const refreshAll = async () => {
    const profileData = await getOperatorProfile(user.tz);
    setProfile(profileData);
    const resourceForTeam = profileData?.managedResource || profileData?.assignedResource;
    await loadProfileData(
      resourceForTeam?.id,
      resourceForTeam?.orgType ?? profileData?.orgType,
      profileData?.resourceOwner,
      user.tz
    );
  };

  const handleDisconnectFromIncident = async () => {
    if (!currentIncident?.id || !assignedResource?.id) return;
    try {
      setDisconnecting(true);
      setDisconnectMsg('');
      await removeResourceFromIncident(currentIncident.id, assignedResource.id);
      await updateResourceStatus(assignedResource.id, 'AVAILABLE', user.tz);
      const refreshedIncidents = await getAllIncidents();
      setIncidents(Array.isArray(refreshedIncidents) ? refreshedIncidents : []);
      await refreshAll();
      setDisconnectMsg('המשאב נותק מהאירוע והוחזר לזמין.');
    } catch (e) {
      setDisconnectMsg('הניתוק מהאירוע נכשל.');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!assignedResource?.id || !ownerPermission) return;
    try {
      setStatusUpdating(true);
      setStatusMsg('');
      await updateResourceStatus(assignedResource.id, newStatus, user.tz);
      await refreshAll();
      setStatusMsg('סטטוס המשאב עודכן.');
    } catch (e) {
      setStatusMsg('עדכון הסטטוס נכשל.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleToggleUserSelection = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleAssignUsersToResource = async () => {
    if (!assignedResource?.id || selectedUserIds.length === 0) return;
    try {
      setAssigningUsers(true);
      setAssignUsersMsg('');
      await addUsersToResource(assignedResource.id, selectedUserIds, user.tz);
      await refreshAll();
      setSelectedUserIds([]);
      setAssignUsersMsg('הבקשה נשלחה לאישור מנהל המערכת. השיוך ייכנס לתוקף לאחר אישור.');
    } catch (e) {
      setAssignUsersMsg('שיוך הפרמדיקים נכשל.');
    } finally {
      setAssigningUsers(false);
    }
  };

  const handleRemoveTeamMember = async (member) => {
    if (!member?.tz || !ownerPermission || !assignedResource?.id) return;
    try {
      setRemovingUserTz(member.tz);
      setTeamMsg('');
      await removeUserFromResource(assignedResource.id, member.tz, user.tz);
      await refreshAll();
      setTeamMsg('איש הצוות הוסר מהמשאב.');
    } catch (e) {
      setTeamMsg('הסרת איש הצוות נכשלה.');
    } finally {
      setRemovingUserTz(null);
    }
  };

  return (
    <OperatorLayout>
      <h2 style={{ marginTop: 0 }}>ברוך הבא למסך התפעול</h2>
      {loading && <div>טוען נתונים...</div>}
      {error && <div style={{ color: '#b91c1c' }}>{error}</div>}
      {!loading && !error && (
        <div style={{ display: 'grid', gap: '12px' }}>
          <section style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0 }}>פרטים אישיים</h3>
            <div>שם: {profile?.name || user?.userName || '-'}</div>
            <div>ת&quot;ז: {profile?.tz || user?.tz || '-'}</div>
            <div>תפקיד: {profile?.role || user?.role || '-'}</div>
            <div>ארגון: {profile?.orgType || user?.orgType || '-'}</div>
            {ownerPermission && (
              <div style={{ marginTop: '8px', display: 'inline-block', backgroundColor: '#0f766e', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                מנהל משאב
              </div>
            )}
          </section>

          <section style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0 }}>{ownerPermission ? 'המשאב שאתה מנהל' : 'המשאב המשויך אליך'}</h3>
            {!assignedResource && <div>עדיין לא שויך לך משאב.</div>}
            {assignedResource && (
              <>
                <div>שם משאב: {assignedResource.name || `יחידה ${assignedResource.id}`}</div>
                <div>סוג משאב: {assignedResource.resourceType || '-'}</div>
                <div>סטטוס: {STATUS_LABELS[assignedResource.status] || assignedResource.status || '-'}</div>
                <div>מיקום: {assignedResource.latitude}, {assignedResource.longitude}</div>
                {!ownerPermission && assignedResource.ownerName && (
                  <div>מנהל משאב: {assignedResource.ownerName} (ת.ז: {assignedResource.ownerTz})</div>
                )}

                {ownerPermission && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>עדכון סטטוס משאב</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {STATUS_OPTIONS.map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => handleStatusChange(status)}
                          disabled={statusUpdating || assignedResource.status === status}
                          style={{
                            border: assignedResource.status === status ? '2px solid #0f766e' : '1px solid #cbd5e1',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            backgroundColor: assignedResource.status === status ? '#ecfdf5' : 'white',
                            cursor: statusUpdating || assignedResource.status === status ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {STATUS_LABELS[status] || status}
                        </button>
                      ))}
                    </div>
                    {statusMsg && (
                      <div style={{ marginTop: '8px', fontSize: '13px', color: statusMsg.includes('נכשל') ? '#b91c1c' : '#0f766e' }}>
                        {statusMsg}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </section>

          {ownerPermission && assignedResource && (
            <section style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px' }}>
              <h3 style={{ marginTop: 0 }}>בקשות שיוך ממתינות לאישור</h3>
              {pendingAssignments.length === 0 && (
                <div style={{ color: '#64748b' }}>אין בקשות ממתינות.</div>
              )}
              {pendingAssignments.length > 0 && (
                <div style={{ display: 'grid', gap: '8px' }}>
                  {pendingAssignments.map((req) => (
                    <div
                      key={req.id}
                      style={{
                        border: '1px solid #fde68a',
                        backgroundColor: '#fffbeb',
                        borderRadius: '6px',
                        padding: '10px',
                      }}
                    >
                      <div style={{ fontWeight: 'bold' }}>
                        {req.userName || `פרמדיק ${req.userTz}`}
                      </div>
                      <div style={{ fontSize: '12px', color: '#92400e' }}>
                        ממתין לאישור מנהל מערכת
                        {req.createdAt ? ` | ${new Date(req.createdAt).toLocaleString('he-IL')}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {ownerPermission && assignedResource && (
            <section style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px' }}>
              <h3 style={{ marginTop: 0 }}>בקשת שיוך פרמדיקים למשאב</h3>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: 0 }}>
                הבקשה תישלח למנהל המערכת לאישור לפני שהשיוך ייכנס לתוקף.
              </p>
              {availableParamedics.length === 0 && (
                <div style={{ color: '#64748b' }}>
                  אין פרמדיקים בארגון שלך שאינם מנהלי משאב.
                </div>
              )}
              {availableParamedics.length > 0 && (
                <>
                  <div style={{ display: 'grid', gap: '6px', marginBottom: '10px' }}>
                    {availableParamedics.map((paramedic) => (
                      <label key={paramedic.tz} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(paramedic.tz)}
                          onChange={() => handleToggleUserSelection(paramedic.tz)}
                        />
                        <span>
                          {paramedic.name || 'ללא שם'} | ת&quot;ז: {paramedic.tz}
                        </span>
                      </label>
                    ))}
                  </div>
                  <button
                    onClick={handleAssignUsersToResource}
                    disabled={assigningUsers || selectedUserIds.length === 0}
                    style={{
                      border: 'none',
                      borderRadius: '4px',
                      padding: '8px 12px',
                      backgroundColor: '#0f766e',
                      color: 'white',
                      cursor: assigningUsers || selectedUserIds.length === 0 ? 'not-allowed' : 'pointer',
                      opacity: assigningUsers || selectedUserIds.length === 0 ? 0.7 : 1,
                    }}
                  >
                    {assigningUsers ? 'שולח בקשה...' : `שלח בקשה לשיוך ${selectedUserIds.length} פרמדיקים`}
                  </button>
                </>
              )}
              {assignUsersMsg && (
                <div style={{ marginTop: '8px', fontSize: '13px', color: assignUsersMsg.includes('נכשל') ? '#b91c1c' : '#0f766e' }}>
                  {assignUsersMsg}
                </div>
              )}
            </section>
          )}

          {ownerPermission && assignedResource && (
            <section style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px' }}>
              <h3 style={{ marginTop: 0 }}>צוות המשאב</h3>
              {resourceTeam.length === 0 && (
                <div style={{ color: '#64748b' }}>אין פרמדיקים משויכים כרגע (מלבדך כמנהל).</div>
              )}
              {resourceTeam.length > 0 && (
                <div style={{ display: 'grid', gap: '8px' }}>
                  {resourceTeam.map((member) => (
                    <div key={member.tz} style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{member.name || 'ללא שם'}</div>
                        <div style={{ fontSize: '12px', color: '#475569' }}>ת&quot;ז: {member.tz}</div>
                      </div>
                      <button
                        onClick={() => handleRemoveTeamMember(member)}
                        disabled={removingUserTz === member.tz}
                        style={{ border: 'none', borderRadius: '4px', padding: '6px 10px', backgroundColor: '#b91c1c', color: 'white', cursor: removingUserTz === member.tz ? 'not-allowed' : 'pointer' }}
                      >
                        {removingUserTz === member.tz ? 'מסיר...' : 'הסר מהמשאב'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {teamMsg && (
                <div style={{ marginTop: '8px', fontSize: '13px', color: teamMsg.includes('נכשלה') ? '#b91c1c' : '#0f766e' }}>
                  {teamMsg}
                </div>
              )}
            </section>
          )}

          <section style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0 }}>שיוך לאירוע כרגע</h3>
            {!currentIncident && <div>אין שיוך פעיל לאירוע כרגע.</div>}
            {currentIncident && (
              <>
                <div>אירוע #{currentIncident.id} - {currentIncident.description}</div>
                <div>סטטוס: {currentIncident.status}</div>
                <div>מיקום: {currentIncident.locationAddress || '-'}</div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                  <button onClick={() => navigate('/operations/action-log')} style={{ border: 'none', borderRadius: '4px', padding: '8px 10px', backgroundColor: '#1d4ed8', color: 'white', cursor: 'pointer' }}>
                    שליחת Action Log
                  </button>
                  <button onClick={() => navigate('/operations/casualties')} style={{ border: 'none', borderRadius: '4px', padding: '8px 10px', backgroundColor: '#b91c1c', color: 'white', cursor: 'pointer' }}>
                    הוספת פצוע
                  </button>
                  {ownerPermission && (
                    <button
                      onClick={handleDisconnectFromIncident}
                      disabled={disconnecting}
                      style={{ border: 'none', borderRadius: '4px', padding: '8px 10px', backgroundColor: '#334155', color: 'white', cursor: disconnecting ? 'not-allowed' : 'pointer' }}
                    >
                      {disconnecting ? 'מנתק...' : 'ניתוק מהאירוע'}
                    </button>
                  )}
                </div>
                {disconnectMsg && (
                  <div style={{ marginTop: '8px', fontSize: '13px', color: disconnectMsg.includes('נכשל') ? '#b91c1c' : '#0f766e' }}>
                    {disconnectMsg}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </OperatorLayout>
  );
}

export default OperationsHomePage;
