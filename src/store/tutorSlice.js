import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  classes: [],
  isFetched: false,
  studentRequests: [],
  requestsFetched: false,
};

const tutorSlice = createSlice({
  name: 'tutorData',
  initialState,
  reducers: {
    setClassesData: (state, action) => {
      state.classes = action.payload;
      state.isFetched = true;
    },
    addTutorClass: (state, action) => {
      state.classes.push(action.payload);
    },
    updateTutorClass: (state, action) => {
      state.classes = state.classes.map(c => 
        c.classId === action.payload.classId ? { ...c, ...action.payload } : c
      );
    },
    removeTutorClass: (state, action) => {
      state.classes = state.classes.filter(c => c.classId !== action.payload);
    },
    setStudentRequestsData: (state, action) => {
      state.studentRequests = action.payload;
      state.requestsFetched = true;
    },
    removeStudentRequests: (state, action) => {
      // action.payload is an array of IDs to remove
      state.studentRequests = state.studentRequests.filter(req => !action.payload.includes(req.enrollmentId));
    },
    invalidateClasses: (state) => {
      state.isFetched = false;
    },
    invalidateRequests: (state) => {
      state.requestsFetched = false;
    },
    clearTutorData: () => initialState,
  },
});

export const { 
  setClassesData, 
  addTutorClass, 
  updateTutorClass, 
  removeTutorClass, 
  setStudentRequestsData,
  removeStudentRequests,
  invalidateClasses, 
  invalidateRequests,
  clearTutorData 
} = tutorSlice.actions;

export default tutorSlice.reducer;