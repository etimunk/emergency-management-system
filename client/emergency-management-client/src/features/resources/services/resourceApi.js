import api from '../../../services/api';

export const getAllResources = async () => {
  const response = await api.get('/resources');
  const data = response.data;
  return Array.isArray(data) ? data : [];
};

export const getResourceDetails = async (resourceId) => {
  const response = await api.get(`/resources/${resourceId}/details`);
  return response.data;
};

/** payload חייב לכלול ownerUserId */
export const createResource = async (payload) => {
  const response = await api.post('/resources', payload);
  return response.data;
};

export const updateResourceStatus = async (resourceId, status, requesterTz) => {
  const params = { status };
  if (requesterTz != null) {
    params.requesterTz = requesterTz;
  }
  const response = await api.patch(`/resources/${resourceId}/status`, null, { params });
  return response.data;
};

export const assignResourceOwner = async (resourceId, userId) => {
  const response = await api.patch(`/resources/${resourceId}/owner`, null, {
    params: { userId },
  });
  return response.data;
};

export const addUsersToResource = async (resourceId, userIds, requesterTz) => {
  const response = await api.post(`/resources/${resourceId}/users`, userIds, {
    params: { requesterTz },
  });
  return response.data;
};

export const removeUserFromResource = async (resourceId, userTz, requesterTz) => {
  const response = await api.delete(`/resources/${resourceId}/users/${userTz}`, {
    params: { requesterTz },
  });
  return response.data;
};

export const getResourceUsers = async (resourceId) => {
  const response = await api.get(`/resources/${resourceId}/users`);
  return response.data;
};

export const deleteResource = async (resourceId) => {
  const response = await api.delete(`/resources/${resourceId}`);
  return response.data;
};

export const assignResourceToIncident = async (resourceId, incidentId) => {
  const response = await api.patch(`/resources/${resourceId}/assign-incident`, null, {
    params: { incidentId },
  });
  return response.data;
};

export const updateResourceDetails = async (resourceId, payload) => {
  const response = await api.put(`/resources/${resourceId}/details`, payload);
  return response.data;
};

export const adminAddTeamMembers = async (resourceId, userIds) => {
  const response = await api.post(`/resources/${resourceId}/team/direct`, userIds);
  return response.data;
};

export const adminRemoveTeamMember = async (resourceId, userTz) => {
  const response = await api.delete(`/resources/${resourceId}/team/${userTz}/direct`);
  return response.data;
};
