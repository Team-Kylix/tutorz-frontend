import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  darkMode: false,
  sidebarCollapsed: false,
  language: 'en',
  fontSize: 'medium', // small, medium, large
  lastVisitedPath: '/dashboard',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
    },
    setDarkMode: (state, action) => {
      state.darkMode = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebar: (state, action) => {
      state.sidebarCollapsed = action.payload;
    },
    setLanguage: (state, action) => {
      state.language = action.payload;
    },
    setFontSize: (state, action) => {
      state.fontSize = action.payload;
    },
    setLastVisitedPath: (state, action) => {
      state.lastVisitedPath = action.payload;
    },
    resetUI: () => initialState,
  },
});

export const { 
  toggleDarkMode, 
  setDarkMode, 
  toggleSidebar, 
  setSidebar, 
  setLanguage, 
  setFontSize, 
  setLastVisitedPath,
  resetUI 
} = uiSlice.actions;

export default uiSlice.reducer;