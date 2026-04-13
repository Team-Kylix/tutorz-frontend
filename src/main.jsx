import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react'; // 1. Import PersistGate
import { store, persistor } from './store'; // 2. Import persistor
import { GoogleOAuthProvider } from '@react-oauth/google';
import { registerSW } from 'virtual:pwa-register';

// Layer 1: Auto-Update Service Worker
// When Vite builds a new app bundle, the service worker file (sw.js) changes.
// The browser detects this and downloads the new SW in the background.
// onNeedRefresh fires when the new SW is ready to take control.
// Calling updateSW(true) skips the normal "wait for old tabs to close" step
// and immediately activates the new SW + reloads the page.
// This ensures ALL users get the new code on their next visit without
// needing to manually refresh or clear their cache.
registerSW({
    onNeedRefresh(updateSW) {
        console.info('[SW] New version available — reloading...');
        updateSW(true);
    },
    onOfflineReady() {
        console.info('[SW] App is ready to work offline.');
    },
});

const GOOGLE_CLIENT_ID = "429631431589-p8icqjvm53rcqifgn259i604uh047dv8.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>

    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Provider store={store}>
        {/* 3. Wrap App in PersistGate. 
            This tells React to wait until IndexedDB has fully loaded 
            the 'auth' state into Redux BEFORE running the Router. 
            Result: No flash of "unauthenticated" state or skeletons! */}
        <PersistGate loading={null} persistor={persistor}>
          <App />
        </PersistGate>
      </Provider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);