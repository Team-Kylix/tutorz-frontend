import axios from 'axios';
import { store, persistor } from '../../store';
import { logout } from '../../store/authSlice';
import { invalidateDashboard, clearDashboard } from '../../store/dashboardSlice';
import { clearSyncQueue } from '../../store/syncSlice';

// IMPORTANT: Update this URL to match backend!
export const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'https://localhost:7010';
export const API_BASE_URL = `${BASE_URL}/api`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// REQUEST interceptor: attach auth token from Redux store to every request
apiClient.interceptors.request.use(
  (config) => {
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

// RESPONSE interceptor: global error handling
apiClient.interceptors.response.use(
  // On success, pass the response through unchanged
  (response) => {
    // Force a cache invalidation if the user changed data (e.g. Added student)
    const method = response.config.method?.toLowerCase();
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      if ('caches' in window) {
        caches.delete('user-data-cache').catch(() => {});
      }
      // Also invalidate the Redux fast-cache so it fetches new data on next mount
      store.dispatch(invalidateDashboard());
    }
    return response;
  },

  // On error, handle specific cases globally
  (error) => {
    if (error.response) {
      // The server responded with an error status code
      if (error.response.status === 401) {
        // Session expired or invalid token — full nuclear wipe then redirect
        (async () => {
          await persistor.purge();
          store.dispatch(logout());
          store.dispatch(clearDashboard());
          store.dispatch(clearSyncQueue());
          if ('caches' in window) {
            const names = await caches.keys();
            await Promise.all(names.map((n) => caches.delete(n)));
          }
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = '/';
        })();
      }
      // For all other server errors (403, 500, etc.), reject as normal
      return Promise.reject(error);
    } else if (error.request) {
      // The request was made but NO response was received (network error,
      // backend is offline, CORS blocked, Azure cold start timeout, etc.)
      // Reject with a clear, readable error instead of hanging silently
      return Promise.reject(
        new Error('Network error: Unable to reach the server. Please check your connection and try again.')
      );
    } else {
      // Something went wrong setting up the request
      return Promise.reject(error);
    }
  }
);

export default apiClient;