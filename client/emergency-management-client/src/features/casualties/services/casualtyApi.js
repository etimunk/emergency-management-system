import api from '../../../services/api';

export const createCasualty = async (payload) => {
  const response = await api.post('/casualties', payload);
  return response.data;
};

export const getCasualtiesByIncident = async (incidentId) => {
  const response = await api.get(`/casualties/search/by-incident/${incidentId}`);
  return response.data;
};

