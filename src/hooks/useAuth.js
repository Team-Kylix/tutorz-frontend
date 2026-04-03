import { useSelector, useDispatch } from 'react-redux';
import { loginSuccess, logout } from '../store/authSlice';
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