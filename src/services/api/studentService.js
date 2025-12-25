import apiClient from './apiClient';

/**
 * Searches for classes based on grade and query string.
 * @param {string} grade - User's grade (e.g., 'Grade 8')
 * @param {string} query - Search term (Subject, Tutor Name, TUT ID)
 */
export const searchClasses = async (grade, query) => {
    // Backend expects: /api/Student/search-classes?grade=...&query=...
    // We use encodeURIComponent to handle spaces/special chars safely
    const q = query ? encodeURIComponent(query) : '';
    const g = grade ? encodeURIComponent(grade) : '';
    
    const response = await apiClient.get(`/Student/search-classes?grade=${g}&query=${q}`);
    return response.data; // Returns List<ClassSearchDto>
};

/**
 * Sends a request to join a specific class.
 * @param {string} classId - The GUID of the class
 */
export const requestJoinClass = async (classId) => {
    const response = await apiClient.post('/Student/join-class', { classId });
    return response.data;
};