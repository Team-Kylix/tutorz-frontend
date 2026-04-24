import { useSelector, useDispatch } from 'react-redux';
import { loginSuccess, logout } from '../store/authSlice';
import { clearDashboard } from '../store/dashboardSlice';
import { clearSyncQueue } from '../store/syncSlice';
import { persistor } from '../store/index';
import { login as loginService, register as registerService, registerSibling as registerSiblingService, switchProfile as switchProfileService } from '../services/auth/authService';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated } = useSelector((state) => state.auth);

  // Wrapper for Login
  const login = async (email, password) => {
    try {
      const data = await loginService(email, password);
      dispatch(loginSuccess({
        user: {
          userId: data.userId,
          email: data.email,
          role: data.role,
          firstName: data.firstName,
          lastName: data.lastName,
          registrationNumber: data.registrationNumber,
          profileImageUrlSmall: data.profileImageUrlSmall,
          profileImageUrlLarge: data.profileImageUrlLarge,
          currentStudentId: data.currentStudentId,
          profiles: data.profiles || [],
        },
        token: data.token
      }));
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  // Wrapper for Register
  const register = async (registrationData) => {
    try {
      const data = await registerService(registrationData);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const logoutUser = () => {
    dispatch(logout());
    dispatch(clearDashboard());
    // CRITICAL: Wipe all queued offline actions so they are NOT
    // uploaded under a new user's session after logout.
    dispatch(clearSyncQueue());
    // Clear the service worker cache to ensure the next user doesn't see stale data
    if ('caches' in window) {
      caches.delete('user-data-cache');
      caches.delete('transactional-api-cache');
    }
  };

  const registerSibling = async (siblingData) => {
    try {
      const data = await registerSiblingService(siblingData);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  /**
   * Switches the active student profile. Updates Redux token + user, then reloads
   * the page so all components fetch fresh data for the newly selected student.
   */
  const switchAccount = async (studentId) => {
    try {
      const data = await switchProfileService(studentId);
      dispatch(loginSuccess({
        user: {
          userId: data.userId,
          email: data.email,
          role: data.role,
          firstName: data.firstName,
          lastName: data.lastName,
          registrationNumber: data.registrationNumber,
          profileImageUrlSmall: data.profileImageUrlSmall,
          profileImageUrlLarge: data.profileImageUrlLarge,
          currentStudentId: data.currentStudentId,
          profiles: data.profiles || [],
        },
        token: data.token
      }));
      
      // We must wait for the asynchronous IndexedDB write to complete 
      // before destroying the DOM context and hard reloading.
      await persistor.flush();
      
      // Clear the PWA user-data cache so the new student doesn't see the old student's 
      // Stale-While-Revalidate cached data.
      if ('caches' in window) {
        await caches.delete('user-data-cache');
      }
      
      // Clear persistent dashboard data to prevent Student A's totals flashing on Student B's screen
      dispatch(clearDashboard());
      // CRITICAL: Wipe all queued actions so they are NOT uploaded under the new account.
      dispatch(clearSyncQueue());
      
      // Force full reload so all cached API calls and component state reset for new student
      window.location.href = '/';
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    login,
    register,
    registerSibling,
    switchAccount,
    logout: logoutUser,
  };
};

export default useAuth;