import apiClient from './apiClient';

export const getClasses = async () => {
  const response = await apiClient.get('/tutor/classes');
  return response.data;
};

export const createClass = async (data) => {
  const response = await apiClient.post('/tutor/classes', data);
  return response.data;
};

export const updateClass = async (id, data) => {
  const response = await apiClient.put(`/tutor/classes/${id}`, data);
  return response.data;
};

export const addStudentToClass = async (data) => {
  const response = await apiClient.post('/tutor/classes/add-student', data);
  return response.data;
};

export const deleteClass = async (id) => {
  const response = await apiClient.delete(`/tutor/classes/${id}`);
  return response.data;
};

export const getTutorProfile = async () => {
  const response = await apiClient.get('/tutor/profile');
  return response.data;
};

export const updateTutorProfile = async (formData) => {
  // NOTE: Do NOT set Content-Type manually here.
  // Axios auto-sets 'multipart/form-data; boundary=...' when it receives FormData.
  // Overriding it would break the boundary and cause [FromForm] binding to fail on ASP.NET Core.
  const response = await apiClient.put('/tutor/profile', formData);
  return response.data;
};

export const getStudentRequests = async () => {
  const response = await apiClient.get('/tutor/requests');
  return response.data;
};

export const processStudentRequests = async (enrollmentIds, action) => {
  const response = await apiClient.post('/tutor/requests/process', {
    enrollmentIds,
    action
  });
  return response.data;
};

export const getStudentProfileForTutor = async (studentId) => {
  const response = await apiClient.get(`/tutor/student-profile/${studentId}`);
  return response.data;
};

// --- Institute Join Requests ---

export const requestJoinInstitute = async (instituteId) => {
  try {
    const response = await apiClient.post(`/tutor/institutes/${instituteId}/request`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to send institute join request' };
  }
};

export const getInstituteRequests = async () => {
  try {
    const response = await apiClient.get('/tutor/requests/institutes');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch institute requests' };
  }
};

export const processInstituteRequest = async (requestId, action) => {
  try {
    const response = await apiClient.post(`/tutor/requests/institutes/${requestId}/process`, { action });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to process institute request' };
  }
};

// --- Institutes & Halls ---

export const getJoinedInstitutes = async () => {
  try {
    const response = await apiClient.get('/tutor/institutes');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch joined institutes' };
  }
};

export const getInstituteHalls = async (instituteId) => {
  try {
    const response = await apiClient.get(`/institute/halls/${instituteId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch institute halls' };
  }
};