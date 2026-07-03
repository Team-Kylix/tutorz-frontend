import React from 'react';
import AppRoutes from './routes/AppRoutes';
import { ThemeProvider } from './context/ThemeContext'; 
import SyncManager from './components/organisms/SyncManager';
import useVersionGuard from './hooks/useVersionGuard';

function App() {
  // Layer 2: Version-based forced logout.
  // If APP_VERSION in src/config/version.js doesn't match what's stored
  // in localStorage, this clears all persisted state and redirects to /login.
  useVersionGuard();

  return (
    <ThemeProvider> 
      <div>
        {/* SyncManager is invisible - it runs in background uploading queued attendance records */}
        <SyncManager />
        <AppRoutes />
      </div>
    </ThemeProvider>
  );
}

export default App;