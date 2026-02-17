import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    isLoading: false,
    error: null,
    modals: {
        duplicateUser: false,
        editProfile: false,
        addStudent: false,
    },
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setLoading: (state, action) => {
            state.isLoading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
        openModal: (state, action) => {
            const modalName = action.payload;
            if (state.modals.hasOwnProperty(modalName)) {
                state.modals[modalName] = true;
            }
        },
        closeModal: (state, action) => {
            const modalName = action.payload;
            if (state.modals.hasOwnProperty(modalName)) {
                state.modals[modalName] = false;
            }
        },
        closeAllModals: (state) => {
            Object.keys(state.modals).forEach((key) => {
                state.modals[key] = false;
            });
        },
    },
});

export const { setLoading, setError, clearError, openModal, closeModal, closeAllModals } = uiSlice.actions;
export default uiSlice.reducer;