import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  classes: [],
  isFetched: false,
};

const instituteSlice = createSlice({
  name: 'instituteData',
  initialState,
  reducers: {
    setInstituteClasses: (state, action) => {
      state.classes = action.payload;
      state.isFetched = true;
    },
    appendInstituteClasses: (state, action) => {
      state.classes = [...state.classes, ...action.payload];
    },
    addInstituteClass: (state, action) => {
      state.classes.push(action.payload);
    },
    updateInstituteClass: (state, action) => {
      state.classes = state.classes.map(c =>
        c.classId === action.payload.classId ? { ...c, ...action.payload } : c
      );
    },
    removeInstituteClass: (state, action) => {
      state.classes = state.classes.filter(c => c.classId !== action.payload);
    },
    invalidateInstituteClasses: (state) => {
      state.isFetched = false;
    },
    clearInstituteData: () => initialState,
  },
});

export const {
  setInstituteClasses,
  appendInstituteClasses,
  addInstituteClass,
  updateInstituteClass,
  removeInstituteClass,
  invalidateInstituteClasses,
  clearInstituteData,
} = instituteSlice.actions;

export default instituteSlice.reducer;
