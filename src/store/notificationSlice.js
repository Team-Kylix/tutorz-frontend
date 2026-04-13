import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as notificationService from '../services/api/notificationService';

export const fetchNotificationsThunk = createAsyncThunk(
  'notifications/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await notificationService.fetchNotifications();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const markAsReadThunk = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      await notificationService.markAsRead(notificationId);
      return notificationId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const markAllAsReadThunk = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await notificationService.markAllAsRead();
      return true;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  items: [],
  unreadCount: 0,
  isOpen: false,
  isLoading: false,
  error: null,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      // Add to the top of the list
      state.items.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
      // Keep only latest 50
      if (state.items.length > 50) {
        state.items = state.items.slice(0, 50);
      }
    },
    togglePanel: (state) => {
      state.isOpen = !state.isOpen;
    },
    closePanel: (state) => {
      state.isOpen = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchNotificationsThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchNotificationsThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
        state.unreadCount = action.payload.filter((n) => !n.isRead).length;
      })
      .addCase(fetchNotificationsThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Mark one as read
      .addCase(markAsReadThunk.fulfilled, (state, action) => {
        const item = state.items.find((n) => n.notificationId === action.payload);
        if (item && !item.isRead) {
          item.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      // Mark all as read
      .addCase(markAllAsReadThunk.fulfilled, (state) => {
        state.items.forEach((n) => {
          n.isRead = true;
        });
        state.unreadCount = 0;
      });
  },
});

export const { addNotification, togglePanel, closePanel } = notificationSlice.actions;

// Selectors
export const selectNotifications = (state) => state.notifications.items;
export const selectUnreadCount = (state) => state.notifications.unreadCount;
export const selectIsPanelOpen = (state) => state.notifications.isOpen;
export const selectIsLoading = (state) => state.notifications.isLoading;

export default notificationSlice.reducer;
