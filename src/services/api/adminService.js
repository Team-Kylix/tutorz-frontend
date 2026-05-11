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

export const getAllStudents = async (searchQuery = '', page = 1, pageSize = 10) => {
  try {
    const params = new URLSearchParams({
      searchQuery: searchQuery,
      page: page.toString(),
      pageSize: pageSize.toString()
    });
    const response = await apiClient.get(`/system/students?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch students' };
  }
};

export const getAllTutors = async (searchQuery = '', page = 1, pageSize = 10) => {
  try {
    const params = new URLSearchParams({
      searchQuery: searchQuery,
      page: page.toString(),
      pageSize: pageSize.toString()
    });
    const response = await apiClient.get(`/system/tutors?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch tutors' };
  }
};

export const getAllInstitutes = async (searchQuery = '', page = 1, pageSize = 10) => {
  try {
    const params = new URLSearchParams({
      searchQuery: searchQuery,
      page: page.toString(),
      pageSize: pageSize.toString()
    });
    const response = await apiClient.get(`/system/institutes?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch institutes' };
  }
};

export const createAdmin = async (adminData) => {
  try {
    const response = await apiClient.post('/system/admin', adminData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create admin' };
  }
};

export const getAdminProfile = async () => {
  try {
    const response = await apiClient.get('/system/admin/profile');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch admin profile' };
  }
};

export const updateAdminProfile = async (formData) => {
  try {
    const response = await apiClient.put('/system/admin/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update admin profile' };
  }
};