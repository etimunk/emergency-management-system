import { useCallback, useEffect, useState } from 'react';
import { getIncidentById } from '../services/incidentApi';
import { getActionLogsByIncident } from '../../actionLogs/services/actionLogApi';
import { getAgentLogsByIncident } from '../../actionLogs/services/agentLogApi';
import { getCasualtiesByIncident } from '../../casualties/services/casualtyApi';

export const useIncidentDetail = (incidentId) => {
  const [detail, setDetail] = useState(null);
  const [actionLogs, setActionLogs] = useState([]);
  const [agentLogs, setAgentLogs] = useState([]);
  const [casualties, setCasualties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!incidentId) {
      return;
    }
    try {
      setError(null);
      const [incidentData, logsData, agentData, casualtiesData] = await Promise.all([
        getIncidentById(incidentId),
        getActionLogsByIncident(incidentId),
        getAgentLogsByIncident(incidentId),
        getCasualtiesByIncident(incidentId).catch(() => []),
      ]);
      setDetail(incidentData);
      setActionLogs(Array.isArray(logsData) ? logsData : []);
      setAgentLogs(Array.isArray(agentData) ? agentData : []);
      setCasualties(Array.isArray(casualtiesData) ? casualtiesData : []);
    } catch (err) {
      console.error('Error loading incident detail:', err);
      setError(err.message || 'שגיאה בטעינת פרטי האירוע');
    } finally {
      setLoading(false);
    }
  }, [incidentId]);

  useEffect(() => {
    setLoading(true);
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  const resources = Array.isArray(detail?.assignedResources) ? detail.assignedResources : [];
  const teamMembers = resources.flatMap((entry) => {
    const team = Array.isArray(entry?.team) ? entry.team : [];
    return team.map((member) => ({
      ...member,
      resourceName: entry?.resource?.name || `משאב ${entry?.resource?.id}`,
    }));
  });

  return {
    detail,
    resources,
    teamMembers,
    actionLogs,
    agentLogs,
    casualties,
    loading,
    error,
    refresh,
  };
};
