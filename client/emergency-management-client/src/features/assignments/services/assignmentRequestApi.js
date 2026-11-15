import api from '../../../services/api';

export const getPendingAssignmentRequests = async () => {
  const response = await api.get('/assignment-requests/pending');
  return Array.isArray(response.data) ? response.data : [];
};

export const approveAssignmentRequest = async (requestId, adminTz) => {
  const response = await api.patch(`/assignment-requests/${requestId}/approve`, null, {
    params: { adminTz },
  });
  return response.data;
};

export const rejectAssignmentRequest = async (requestId, adminTz) => {
  const response = await api.patch(`/assignment-requests/${requestId}/reject`, null, {
    params: { adminTz },
  });
  return response.data;
};

export const getResourcePendingAssignments = async (resourceId, requesterTz) => {
  const response = await api.get(`/resources/${resourceId}/assignment-requests/pending`, {
    params: { requesterTz },
  });
  return Array.isArray(response.data) ? response.data : [];
};
