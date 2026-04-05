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
  // Ensure the body matches the JoinClassRequest DTO on the backend
  // Backend expects: public class JoinClassRequest { public Guid ClassId { get; set; } }
  const response = await apiClient.post('/student/join-class', { classId: classId });
  return response.data;
};

/**
 * Gets all classes the student has joined with Approved status.
 */
export const getStudentClasses = async () => {
  const response = await apiClient.get('/student/classes');
  return response.data;
};

/**
 * Gets student timetable for a specific date
 * @param {string} date - The date to fetch the timetable for (YYYY-MM-DD or ISO string)
 */
export const getTimetableByDate = async (date) => {
  let targetDate;
  if (date instanceof Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    targetDate = `${y}-${m}-${d}`;
  } else {
    targetDate = date;
  }
  const response = await apiClient.get('/student/timetable', {
    params: { date: targetDate }
  });
  return response.data;
};