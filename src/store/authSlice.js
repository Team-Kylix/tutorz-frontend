import { createSlice } from '@reduxjs/toolkit';

// 1. Helper to safely read from localStorage
const loadUserFromStorage = () => {
  try {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (user && token) {
      return {
        user: JSON.parse(user),
        token: token,
        isAuthenticated: true
      };
    }
  } catch (e) {
    console.error("Failed to load auth state", e);
  }
  return {
    user: null,
    token: null,
    isAuthenticated: false
  };
};

// 2. Initialize state using the helper
const initialState = loadUserFromStorage();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      
      // 3. Save to Local Storage
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      localStorage.setItem('token', action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;

      // 4. Clear Local Storage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;