import React, { useState, useEffect } from 'react';
import { Menu, Search, Bell, Download } from 'lucide-react'; // Added Download icon
import IconButton from '../atoms/IconButton.jsx'; 

const TopNavbar = ({ isCollapsed, toggleSidebar }) => {
  // PWA INSTALL LOGIC START
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile automatically
      e.preventDefault();
      // Stash the event so it can be triggered later by the user
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    // We no longer need the prompt. Clear it up.
    setDeferredPrompt(null);
  };
  // PWA INSTALL LOGIC END

  return (
    <header 
      className={`
        h-16 bg-white border-b border-gray-200 fixed top-0 right-0 z-20 transition-all duration-300
        flex items-center justify-between px-4 md:px-6
      `}
      style={{ 
        left: 0, 
        marginLeft: isCollapsed ? '5rem' : '16rem', 
        width: 'auto'
      }}
    >
      {/* Mobile Sidebar Toggle & Search */}
      <div className="flex items-center flex-1 gap-4">
        <button 
          onClick={toggleSidebar}
          className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
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
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3 md:gap-4">
        
        {/* INSTALL APP BUTTON (Only visible if installable) */}
        {deferredPrompt && (
           <button
             onClick={handleInstallClick}
             className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm animate-pulse"
           >
             <Download size={16} />
             <span className="hidden sm:inline">Install App</span>
           </button>
        )}
        {/* ------------------------------------------------------ */}

        <div className="md:hidden">
            <IconButton icon={Search} />
        </div>
        <IconButton icon={Bell} hasBadge={true} />
        
        <div className="h-8 w-px bg-gray-200 mx-1 hidden md:block"></div>
        
        <div className="hidden md:block text-right">
          <p className="text-sm font-medium text-gray-800">{new Date().toDateString()}</p>
          <p className="text-xs text-gray-500">Academic Term 2</p>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;