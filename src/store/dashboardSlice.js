import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // We keep counts and small summaries for instant loading 
  // until the background sync finishes.
  stats: {
    studentCount: 0,
    classCount: 0,
    attendanceRate: 0,
    thisMonthIncome: 0,
  },
  recentNotifications: [],
  activeTab: 'overview', // 'overview', 'classes', 'students', etc.
  lastSyncTimestamp: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    updateStats: (state, action) => {
      state.stats = { ...state.stats, ...action.payload };
      state.lastSyncTimestamp = new Date().toISOString();
    },
    setNotifications: (state, action) => {
      state.recentNotifications = action.payload;
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    clearDashboard: () => initialState,
  },
});

export const { updateStats, setNotifications, setActiveTab, clearDashboard } = dashboardSlice.actions;

export default dashboardSlice.reducer;
