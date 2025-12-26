import apiClient from './apiClient'; 

export const getStudentProfile = async () => {
  const response = await apiClient.get('/student/profile');
  return response.data;
};

export const updateStudentProfile = async (data) => {
  const response = await apiClient.put('/student/profile', data);
  return response.data;
};

export const searchClasses = async (grade, query) => {
  const response = await apiClient.get('/student/search-classes', {
    params: { grade, query }
  });
  return response.data;
};

export const requestJoinClass = async (classId) => {
  const response = await apiClient.post('/student/join-class', { classId });
  return response.data;
};