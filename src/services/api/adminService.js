import apiClient from './apiClient';

export const getMinTokenDate = async () => {
  const response = await apiClient.get('/system/min-token-date');
  return response.data;
};

export const getOnlineCount = async () => {
  const response = await apiClient.get('/system/online-count');
  return response.data;
};

export const forceLogoutAll = async (versionNumber, releaseNotes) => {
  const response = await apiClient.post('/system/force-logout', {
    versionNumber,
    releaseNotes
  });
  return response.data;
};

export const getAdminDashboardStats = async () => {
  const response = await apiClient.get('/system/dashboard-stats');
  return response.data;
};