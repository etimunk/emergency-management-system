import api from '../../../services/api';

export const createActionLog = async (payload) => {
  const response = await api.post('/action-logs', payload);
  return response.data;
};

export const getActionLogsByIncident = async (incidentId) => {
  const response = await api.get(`/action-logs/search/by-incident/${incidentId}`);
  return response.data;
};

