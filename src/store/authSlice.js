import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // We no longer manually load from localStorage on boot.
  // redux-persist will intercept the store initialization and 
  // automatically rehydrate 'user' and 'token' from IndexedDB 
  // asynchronously, preventing the UI thread from blocking.
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      // We only update the Redux state in memory. 
      // redux-persist will detect this change and automatically push 
      // the new state into the background IndexedDB storage.
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      // Updating state to null automatically wipes it from the 
      // persisted store as well.
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;

      // Clear Service Worker Caches so the next logged-in user 
      // doesn't instantly see old cached dashboard data.
      if ('caches' in window) {
        caches.delete('user-data-cache').catch(() => {});
        caches.delete('transactional-api-cache').catch(() => {});
      }
    },
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const { loginSuccess, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;