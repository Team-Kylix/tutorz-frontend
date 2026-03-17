import axios from 'axios';
// FIX: Import your Redux store
import { store } from '../../store'; // Adjust this path if your store/index.js is elsewhere

// IMPORTANT: Update this URL to match backend!
export const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'https://localhost:7010';
export const API_BASE_URL = `${BASE_URL}/api`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Optional: Add interceptor to include auth token in future requests
apiClient.interceptors.request.use(
  (config) => {
    // Get token from your Redux store or localStorage
    // This line will now work because 'store' is imported
    const token = store.getState().auth.token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;