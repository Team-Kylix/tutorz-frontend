import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react'; // 1. Import PersistGate
import { store, persistor } from './store'; // 2. Import persistor
import { GoogleOAuthProvider } from '@react-oauth/google';

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