import React, { useState, useEffect, useRef } from 'react';
import { Menu, Search, Bell, Download, Moon, Sun, CloudOff, CheckCheck, AlertTriangle, Loader2, X, User } from 'lucide-react'; 
import { useSelector, useDispatch } from 'react-redux';
import IconButton from '../atoms/IconButton.jsx'; 
import { useThemeContext } from '../../context/ThemeContext'; 
import { selectPendingCount, selectUnseenConflictCount } from '../../store/syncSlice';
import { togglePanel, selectUnreadCount } from '../../store/notificationSlice';
import NotificationPanel from './NotificationPanel';
import NetworkStatusDot from '../atoms/NetworkStatusDot';
import { getAssignedStudents, getAssignedTutors } from '../../services/api/instituteService';
import { searchJoinedTutors } from '../../services/api/studentService';
import { searchEnrolledStudents } from '../../services/api/tutorService';
import AccountViewModal from './AccountViewModal';
import { BASE_URL } from '../../services/api/apiClient';
import DeploymentControlPanel from './DeploymentControlPanel';

const TopNavbar = ({ isCollapsed, toggleSidebar }) => {
  const { theme, toggleTheme } = useThemeContext();
  const dispatch = useDispatch();
  const pendingSyncCount = useSelector(selectPendingCount);
  const unseenConflicts = useSelector(selectUnseenConflictCount);
  const unreadCount = useSelector(selectUnreadCount);

  const user = useSelector(state => state.auth.user);
  
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Account Modal State
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // Mobile Search State
  const [isMobileSearchExpanded, setIsMobileSearchExpanded] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
        if (window.innerWidth < 768) setIsMobileSearchExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const executeGlobalSearch = async (query) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    
    const isMobileSearch = /^\d+$/.test(query);
    if (isMobileSearch && query.length < 4) {
      setSearchResults([]);
      return; // wait for 4 digits
    }

    if (user?.role === 'Institute') {
        setIsSearching(true);
        try {
            const [studentsRes, tutorsRes] = await Promise.all([
                getAssignedStudents(query, 1, 5),
                getAssignedTutors(query, 1, 5)
            ]);
            const students = studentsRes.data?.items || studentsRes.data || [];
            const tutors = tutorsRes.data?.items || tutorsRes.data || [];
            const combined = [
                ...students.map(s => ({ ...s, sysRole: 'Student', displayName: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() })),
                ...tutors.map(t => ({ ...t, sysRole: 'Tutor', displayName: t.name || `${t.firstName || ''} ${t.lastName || ''}`.trim() }))
            ].filter(Boolean);
            
            setSearchResults(combined);
        } catch (error) {
            console.error("Search failed", error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    } else if (user?.role === 'Student') {
        setIsSearching(true);
        try {
            const res = await searchJoinedTutors(query);
            const tutors = Array.isArray(res) ? res : (res?.data || []);
            setSearchResults(tutors.map(t => ({
                ...t,
                sysRole: 'Tutor',
                displayName: t.name || `${t.firstName || ''} ${t.lastName || ''}`.trim()
            })));
        } catch (error) {
            console.error("Student search failed", error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    } else if (user?.role === 'Tutor') {
        setIsSearching(true);
        try {
            const res = await searchEnrolledStudents(query);
            const students = Array.isArray(res) ? res : (res?.data || []);
            setSearchResults(students.map(s => ({
                ...s,
                sysRole: 'Student',
                displayName: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim()
            })));
        } catch (error) {
            console.error("Tutor search failed", error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }
  };

  const onSearchQueryChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setShowSearchResults(true);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    searchTimeoutRef.current = setTimeout(() => {
        executeGlobalSearch(val.trim());
    }, 400);
  };

  const getProfileUrl = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${BASE_URL}${url}`;
  };

  const handleSelectAccount = (account) => {
    // Normalizing role and name to match AccountViewModal format
    setSelectedAccount({ 
      ...account, 
      role: account.sysRole || account.role,
      name: account.displayName || account.name
    }); 
    setIsAccountModalOpen(true);
    setShowSearchResults(false);
    setSearchQuery('');
    setSearchResults([]);
    setIsMobileSearchExpanded(false);
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
      <div className={`flex items-center flex-1 gap-4 ${isMobileSearchExpanded ? 'w-full' : ''}`}>
        {!isMobileSearchExpanded && (
          <button 
            onClick={toggleSidebar}
            className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <Menu size={24} />
          </button>
        )}

        <div 
          className={`
            relative w-full max-w-lg transition-all duration-300
            ${isMobileSearchExpanded 
              ? 'absolute inset-0 bg-white dark:bg-gray-900 z-50 flex items-center px-4 animate-in fade-in slide-in-from-top-2' 
              : 'hidden md:block'}
          `} 
          ref={searchRef}
        >
          <span className={`absolute ${isMobileSearchExpanded ? 'left-6' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 z-10`}>
            {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={18} />}
          </span>
          <input 
            type="text" 
            placeholder="Search student or tutor..." 
            value={searchQuery}
            onChange={onSearchQueryChange}
            onFocus={() => setShowSearchResults(true)}
            className={`w-full py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all ${isMobileSearchExpanded ? 'pl-10 pr-10' : 'pl-10 pr-10'}`}
            autoFocus={isMobileSearchExpanded}
          />
          {searchQuery && (
            <button 
              onClick={() => { 
                setSearchQuery(''); 
                setSearchResults([]);
              }}
              className={`absolute ${isMobileSearchExpanded ? 'right-6' : 'right-3'} top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 z-10`}
            >
              <X size={16} />
            </button>
          )}

          {/* Styled Dropdown matches InstituteSearchAssignModal slightly adapted for topnav */}
          {showSearchResults && searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-50 max-h-80 overflow-y-auto custom-scrollbar">
              {!isSearching && searchResults.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-sm">
                  No results found for "{searchQuery}"
                </div>
              ) : (
                <div className="flex flex-col py-2">
                  {searchResults.map(item => {
                    const isStudent = item.sysRole === 'Student';
                    return (
                      <button 
                        key={item.id || item.roleSpecificId || item.registrationNumber}
                        onClick={() => handleSelectAccount(item)}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left w-full border-b border-gray-50 dark:border-gray-700/30 last:border-0"
                      >
                         <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden 
                           ${isStudent ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400'}`}>
                              {getProfileUrl(item.profileImageUrlSmall || item.profileImageUrlLarge) ? (
                                  <img 
                                    src={getProfileUrl(item.profileImageUrlSmall || item.profileImageUrlLarge)} 
                                    alt={item.displayName} 
                                    className="w-full h-full object-cover" 
                                    onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = `<span>${item.displayName?.charAt(0) || '?'}</span>`; }}
                                  />
                              ) : (
                                  item.displayName?.charAt(0) || '?'
                              )}
                         </div>
                         <div className="flex-1 min-w-0">
                             <p className="font-bold text-sm text-gray-900 dark:text-white truncate uppercase tracking-tight leading-none mb-1">
                                 {item.displayName || "Unknown Name"}
                             </p>
                             <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate font-medium flex items-center gap-1.5 mt-0.5">
                                 <span className={`font-bold uppercase tracking-wider ${isStudent ? "text-blue-500" : "text-purple-500"}`}>
                                     {item.sysRole}
                                 </span>
                                 &bull; {item.registrationNumber} {item.phoneNumber && `• ${item.phoneNumber}`}
                             </p>
                         </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className={`flex items-center gap-3 md:gap-4 ${isMobileSearchExpanded ? 'hidden md:flex' : 'flex'}`}>
        
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

        {/* ADMIN DEPLOY BUTTON */}
        {user?.role === 'Admin' && (
           <DeploymentControlPanel />
        )}

        {!isMobileSearchExpanded && (
          <div className="md:hidden text-gray-500 dark:text-gray-400">
             <IconButton icon={Search} onClick={() => setIsMobileSearchExpanded(true)} />
          </div>
        )}
        
        <div className="relative">
          <button 
            onClick={(e) => {
              // Stop the click from bubbling to document so the NotificationPanel's
              // outside-click handler doesn't immediately close the panel we just opened.
              e.stopPropagation();
              // On mobile, close the sidebar before opening notifications
              // to prevent two overlapping panels at the same time
              if (!isCollapsed && window.innerWidth < 768) {
                toggleSidebar();
              }
              dispatch(togglePanel());
            }}
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all relative"
            title="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-600 dark:bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center px-1 animate-pulse shadow-sm">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>
        
        {/* Notification Sliding Panel */}
        <NotificationPanel />
        
        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden md:block"></div>
        
        <div className="hidden md:block text-right">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {new Date().toDateString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Academic Term 2</p>
        </div>
      </div>
      <AccountViewModal 
        isOpen={isAccountModalOpen} 
        onClose={() => setIsAccountModalOpen(false)} 
        account={selectedAccount} 
      />
    </header>
  );
};

export default TopNavbar;