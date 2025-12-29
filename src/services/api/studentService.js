import apiClient from './apiClient';

export const getStudentProfile = async () => {
  const response = await apiClient.get('/student/profile');
  return response.data;
};

export const updateStudentProfile = async (data) => {
  const response = await apiClient.put('/student/profile', data);
  return response.data;
};

/**
 * Searches for classes based on grade and query string.
 * @param {string} grade - User's grade (e.g., 'Grade 8')
 * @param {string} query - Search term (Subject, Tutor Name, TUT ID)
 */
export const searchClasses = async (grade, query) => {
  const response = await apiClient.get('/student/search-classes', {
    params: { grade, query }
  });
  return response.data;
};

/**
 * Sends a request to join a specific class.
 * @param {string} classId - The GUID of the class
 */
export const requestJoinClass = async (classId) => {
  const response = await apiClient.post('/student/join-class', { classId });
  return response.data;
};