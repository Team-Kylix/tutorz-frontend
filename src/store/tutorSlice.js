import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    profile: null,
    classes: [],
    students: [],
    isLoading: false,
    error: null,
};

const tutorSlice = createSlice({
    name: 'tutor',
    initialState,
    reducers: {
        setTutorProfile: (state, action) => {
            state.profile = action.payload;
        },
        setClasses: (state, action) => {
            state.classes = action.payload;
        },
        addClass: (state, action) => {
            state.classes.push(action.payload);
        },
        setStudents: (state, action) => {
            state.students = action.payload;
        },
        setTutorLoading: (state, action) => {
            state.isLoading = action.payload;
        },
        setTutorError: (state, action) => {
            state.error = action.payload;
        },
    },
});

export const {
    setTutorProfile,
    setClasses,
    addClass,
    setStudents,
    setTutorLoading,
    setTutorError
} = tutorSlice.actions;

export default tutorSlice.reducer;