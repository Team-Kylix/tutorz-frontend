import { configureStore } from '@reduxjs/toolkit';
// Import the core persistence tools
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
// Import localforage - the async IndexedDB driver (fast, non-blocking)
import storage from 'localforage'; 

import authReducer from './authSlice';
import uiReducer from './uiSlice';
import dashboardReducer from './dashboardSlice';
// The sync queue MUST be persisted so offline attendance records survive app restarts
import syncReducer from './syncSlice';
import notificationReducer from './notificationSlice';
import tutorReducer from './tutorSlice';
import instituteReducer from './instituteSlice';

// 1. Configure the persist settings for each slice
const authPersistConfig = {
  key: 'auth', 
  storage, 
};

const uiPersistConfig = {
  key: 'ui',
  storage,
};

const dashboardPersistConfig = {
  key: 'dashboard',
  storage,
};

const syncPersistConfig = {
  key: 'sync',
  storage,
  // We do NOT blacklist anything - the entire queue must survive restarts
};

const tutorPersistConfig = {
  key: 'tutorData',
  storage,
};

const institutePersistConfig = {
  key: 'instituteData',
  storage,
};

// 2. Wrap reducers with persist logic
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedUiReducer = persistReducer(uiPersistConfig, uiReducer);
const persistedDashboardReducer = persistReducer(dashboardPersistConfig, dashboardReducer);
const persistedSyncReducer = persistReducer(syncPersistConfig, syncReducer);
const persistedTutorReducer = persistReducer(tutorPersistConfig, tutorReducer);
const persistedInstituteReducer = persistReducer(institutePersistConfig, instituteReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    ui: persistedUiReducer,
    dashboard: persistedDashboardReducer,
    sync: persistedSyncReducer,
    notifications: notificationReducer,
    tutorData: persistedTutorReducer,
    instituteData: persistedInstituteReducer,
  },
  // 3. We must ignore the serialization warnings for redux-persist actions
  // because persist/REHYDRATE contains functions under the hood.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// 4. Export the persistor to wrap our app in main.jsx
export const persistor = persistStore(store);