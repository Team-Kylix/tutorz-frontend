import apiClient from './apiClient';

export const getInstituteProfile = async () => {
  const response = await apiClient.get('/institute/profile');
  return response.data;
};

export const updateInstituteProfile = async (data) => {
  const response = await apiClient.put('/institute/profile', data);
  return response.data;
};

// --- Timetable ---

export const getTimetableByDate = async (date) => {
  try {
    // Use local date parts to avoid UTC offset shifting the date (e.g. UTC+5:30 midnight = prev-day UTC)
    let iso;
    if (date instanceof Date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      iso = `${y}-${m}-${d}`;
    } else {
      iso = date;
    }
    const response = await apiClient.get(`/institute/timetable?date=${iso}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch timetable' };
  }
};

// Fetch ALL institute classes without pagination (for conflict checking)
export const getAllInstituteClassesUnpaged = async () => {
  try {
    const response = await apiClient.get('/institute/classes?page=1&pageSize=9999');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch all classes' };
  }
};

// --- Classes Management ---

export const getInstituteClasses = async (searchQuery = '', page = 1, pageSize = 10) => {
  try {
    const params = new URLSearchParams({
      searchQuery: searchQuery,
      page: page.toString(),
      pageSize: pageSize.toString()
    });
    // This expects the backend to have an equivalent endpoint.
    const response = await apiClient.get(`/institute/classes?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch institute classes' };
  }
};

export const createInstituteClass = async (data) => {
  try {
    const response = await apiClient.post('/institute/classes', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create institute class' };
  }
};

export const updateInstituteClass = async (id, data) => {
  try {
    const response = await apiClient.put(`/institute/classes/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update institute class' };
  }
};

export const deleteInstituteClass = async (id) => {
  try {
    const response = await apiClient.delete(`/institute/classes/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete institute class' };
  }
};

export const toggleInstituteClassStatus = async (id) => {
  try {
    const response = await apiClient.patch(`/institute/classes/${id}/status`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to toggle institute class status' };
  }
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

// --- Member Management (Students & Tutors) ---

export const searchStudents = async (query) => {
  try {
    const response = await apiClient.get(`/institute/students/search?query=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to search students' };
  }
};

export const searchTutors = async (query) => {
  try {
    const response = await apiClient.get(`/institute/tutors/search?query=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to search tutors' };
  }
};

export const assignStudent = async (studentId) => {
  try {
    const response = await apiClient.post('/institute/students/assign', { studentId });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to assign student' };
  }
};

export const assignTutor = async (tutorId) => {
  try {
    const response = await apiClient.post('/institute/tutors/assign', { tutorId });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to assign tutor' };
  }
};

export const sendTutorRequest = async (tutorId) => {
  try {
    const response = await apiClient.post('/institute/tutors/request', { tutorId });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to send tutor request' };
  }
};

export const getIncomingRequests = async () => {
  try {
    const response = await apiClient.get('/institute/requests/incoming');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch incoming requests' };
  }
};

export const processJoinRequest = async (requestId, action) => {
  try {
    const response = await apiClient.post(`/institute/requests/${requestId}/process`, { action });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to process request' };
  }
};


export const getAssignedStudents = async (searchQuery = '', page = 1, pageSize = 10) => {
  try {
    const params = new URLSearchParams({
      searchQuery: searchQuery,
      page: page.toString(),
      pageSize: pageSize.toString()
    });
    const response = await apiClient.get(`/institute/students?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch assigned students' };
  }
};

export const getAssignedTutors = async (searchQuery = '', page = 1, pageSize = 10) => {
  try {
    const params = new URLSearchParams({
      searchQuery: searchQuery,
      page: page.toString(),
      pageSize: pageSize.toString()
    });
    const response = await apiClient.get(`/institute/tutors?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch assigned tutors' };
  }
};

// --- Attendance Management ---

export const getStudentClassesForAttendance = async (studentId) => {
  try {
    const response = await apiClient.get(`/institute/attendance/student-classes/${studentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch student classes' };
  }
};

export const markAttendance = async (studentId, classId) => {
  try {
    const response = await apiClient.post('/institute/attendance/mark', { studentId, classId });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to mark attendance' };
  }
};

export const getInstituteClassesToday = async () => {
  try {
    const response = await apiClient.get('/institute/attendance/classes-today');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch today\'s classes' };
  }
};

export const getAllInstituteClasses = async () => {
  try {
    const response = await apiClient.get('/institute/attendance/all-classes');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch all classes' };
  }
};

export const assignStudentToClass = async (studentId, classId) => {
  try {
    const response = await apiClient.post('/institute/attendance/assign-class', { studentId, classId });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to assign student to class' };
  }
};

export const getClassAttendanceHistory = async (classId, month, year, searchQuery = '') => {
  try {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    if (searchQuery) params.append('searchQuery', searchQuery);

    // Convert to string and prefix with ? if there are params
    const queryString = params.toString() ? `?${params.toString()}` : '';

    const response = await apiClient.get(`/institute/attendance/class-history/${classId}${queryString}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch class attendance history' };
  }
};
