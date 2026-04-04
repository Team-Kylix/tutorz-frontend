import React, { useState, useEffect } from 'react';
import { Menu, Search, Bell, Download, Moon, Sun, CloudOff, CheckCheck, AlertTriangle } from 'lucide-react'; 
import { useSelector } from 'react-redux';
import IconButton from '../atoms/IconButton.jsx'; 
import { useThemeContext } from '../../context/ThemeContext'; 
import { selectPendingCount, selectUnseenConflictCount } from '../../store/syncSlice';
import NetworkStatusDot from '../atoms/NetworkStatusDot';

const TopNavbar = ({ isCollapsed, toggleSidebar }) => {
  const { theme, toggleTheme } = useThemeContext();
  const pendingSyncCount = useSelector(selectPendingCount);
  const unseenConflicts = useSelector(selectUnseenConflictCount);

  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <header 
      className={`
        h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 
        fixed top-0 right-0 z-20 transition-all duration-300
        flex items-center justify-between px-4 md:px-6
        /* FIXED POSITIONING LOGIC BELOW */
        left-0 
        ${isCollapsed ? 'md:left-20' : 'md:left-64'}
      `}
    >
      {/* Mobile Sidebar Toggle & Search */}
      <div className="flex items-center flex-1 gap-4">
        <button 
          onClick={toggleSidebar}
          className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        >
          <Menu size={24} />
        </button>

        <div className="relative w-full max-w-lg hidden md:block">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Search size={18} />
          </span>
          <input 
            type="text" 
            placeholder="Search student by ID, Name or QR..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3 md:gap-4">
        
        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme}
          className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Network Status Dot */}
        <NetworkStatusDot />

        {/* Sync Status Badge */}
        {(pendingSyncCount > 0 || unseenConflicts > 0) && (
          <div className="relative" title={unseenConflicts > 0 ? `${unseenConflicts} sync error(s)` : `${pendingSyncCount} record(s) pending upload`}>
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              unseenConflicts > 0
                ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 animate-pulse'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
            }`}>
              {unseenConflicts > 0 ? (
                <><AlertTriangle size={13} /><span className="hidden sm:inline">{unseenConflicts} Error{unseenConflicts > 1 ? 's' : ''}</span></>
              ) : (
                <><CloudOff size={13} /><span className="hidden sm:inline">{pendingSyncCount} Pending</span></>
              )}
            </div>
          </div>
        )}

        {/* INSTALL APP BUTTON */}
        {deferredPrompt && (
           <button
             onClick={handleInstallClick}
             className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm animate-pulse"
           >
             <Download size={16} />
             <span className="hidden sm:inline">Install App</span>
           </button>
        )}

        <div className="md:hidden text-gray-500 dark:text-gray-400">
           <IconButton icon={Search} />
        </div>
        
        <div className="text-gray-500 dark:text-gray-400">
           <IconButton icon={Bell} hasBadge={true} />
        </div>
        
        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden md:block"></div>
        
        <div className="hidden md:block text-right">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {new Date().toDateString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Academic Term 2</p>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;