import { useSelector, useDispatch } from 'react-redux';
import { loginSuccess, logout } from '../store/authSlice';
import { login as loginService, register as registerService, registerSibling as registerSiblingService } from '../services/auth/authService';

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
          // 👇 Added this mapping so Login gets the Reg No
          registrationNumber: data.registrationNumber 
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
      
      dispatch(loginSuccess({
        user: { 
          userId: data.userId, 
          email: data.email, 
          role: data.role,
          firstName: data.firstName || registrationData.firstName,
          lastName: data.lastName || registrationData.lastName,
          // 👇 Added this mapping
          registrationNumber: data.registrationNumber
        },
        token: data.token
      }));
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

            // Automatically log the user in with the new profile
            dispatch(loginSuccess({
                user: {
                    userId: data.userId,
                    email: data.email,
                    role: data.role,
                    firstName: data.profiles[0]?.firstName, 
                    lastName: "", 
                    // 👇 Added this mapping
                    registrationNumber: data.registrationNumber 
                },
                token: data.token
            }));
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
        logout: logoutUser,
    };
};

export default useAuth;