import apiClient from './apiClient'; 

export const getInstituteProfile = async () => {
  const response = await apiClient.get('/institute/profile');
  return response.data;
};

export const updateInstituteProfile = async (data) => {
  const response = await apiClient.put('/institute/profile', data);
  return response.data;
};