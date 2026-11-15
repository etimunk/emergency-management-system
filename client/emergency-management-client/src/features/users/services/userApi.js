import api from '../../../services/api';

export const getUserByTz = async (tz) => {
  const response = await api.get(`/users/${tz}`);
  return response.data;
};

export const getOperatorProfile = async (tz) => {
  const response = await api.get(`/users/${tz}/operator-profile`);
  return response.data;
};

export const createUser = async (payload) => {
  const response = await api.post('/users', payload);
  return response.data;
};

export const getAllUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

export const isResourceOwner = async (tz) => {
  const response = await api.get(`/users/is-owner/${tz}`);
  return Boolean(response.data);
};

export const getUsersWithoutResource = async () => {
  const response = await api.get('/users/no-resource');
  return response.data;
};

export const getEligibleOwners = async (orgType) => {
  const response = await api.get('/users/eligible-owners', {
    params: orgType ? { orgType } : {},
  });
  return response.data;
};

export const getEligibleTeamMembers = async ({ requesterTz, orgType, resourceId }) => {
  const response = await api.get('/assignment-requests/eligible-members', {
    params: {
      requesterTz,
      orgType,
      resourceId: resourceId ?? undefined,
    },
  });
  return response.data;
};

export const updateUserByTz = async (tz, payload) => {
  const response = await api.put(`/users/${tz}`, payload);
  return response.data;
};

export const deleteUser = async (tz) => {
  const response = await api.delete(`/users/${tz}`);
  return response.data;
};

export const removeUserFromResourceByTz = async (tz) => {
  const current = await getUserByTz(tz);
  const payload = {
    name: current?.name ?? '',
    orgType: current?.orgType ?? null,
    password: current?.password ?? '',
    resource: null,
  };
  return updateUserByTz(tz, payload);
};

