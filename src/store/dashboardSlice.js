import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  stats: {
    studentCount: '...',
    tutorCount: '...',
  },
  todayClasses: [],
  revenueSummary: null,
  isFetched: false, // True when data has been successfully loaded from DB
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setDashboardData: (state, action) => {
      state.stats.studentCount = action.payload.studentCount;
      state.stats.tutorCount = action.payload.tutorCount;
      state.todayClasses = action.payload.todayClasses;
      state.revenueSummary = action.payload.revenueSummary;
      state.isFetched = true;
    },
    // Call this when a mutation occurs (Add Student, etc)
    invalidateDashboard: (state) => {
      state.isFetched = false;
    },
    clearDashboard: () => initialState,
  },
});

export const { setDashboardData, invalidateDashboard, clearDashboard } = dashboardSlice.actions;

export default dashboardSlice.reducer;
