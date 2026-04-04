import React from 'react';
import AppRoutes from './routes/AppRoutes';
import { ThemeProvider } from './context/ThemeContext'; 
import SyncManager from './components/organisms/SyncManager';

function App() {
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