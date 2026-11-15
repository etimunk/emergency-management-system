import api from '../../../services/api';

export const getAgentLogsByIncident = async (incidentId) => {
  const response = await api.get(`/agent-logs/by-incident/${incidentId}`);
  return Array.isArray(response.data) ? response.data : [];
};
