import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  classes: [],
  isFetched: false,
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
    invalidateClasses: (state) => {
      state.isFetched = false;
    },
    clearTutorData: () => initialState,
  },
});

export const { 
  setClassesData, 
  addTutorClass, 
  updateTutorClass, 
  removeTutorClass, 
  invalidateClasses, 
  clearTutorData 
} = tutorSlice.actions;

export default tutorSlice.reducer;