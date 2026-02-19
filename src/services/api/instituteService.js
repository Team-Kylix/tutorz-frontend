import apiClient from './apiClient';

export const getInstituteProfile = async () => {
  const response = await apiClient.get('/institute/profile');
  return response.data;
};


export const updateInstituteProfile = async (data) => {
  const response = await apiClient.put('/institute/profile', data);
  return response.data;
};

// --- Hall Management ---

export const getHalls = async () => {
  try {
    const response = await apiClient.get('/institute/halls');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch halls' };
  }
};

export const addHall = async (hallData) => {
  try {
    const response = await apiClient.post('/institute/halls', hallData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to add hall' };
  }
};

export const updateHall = async (id, hallData) => {
  try {
    const response = await apiClient.put(`/institute/halls/${id}`, hallData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update hall' };
  }
};

export const deleteHall = async (id) => {
  try {
    const response = await apiClient.delete(`/institute/halls/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete hall' };
  }
};

export const toggleHallStatus = async (id) => {
  try {
    const response = await apiClient.patch(`/institute/halls/${id}/status`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update hall status' };
  }
};