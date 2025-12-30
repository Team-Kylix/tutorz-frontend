import React, { useState } from 'react';
import {
  LayoutDashboard, Users, BookOpen, Calendar, DollarSign, 
  FileText, QrCode, Settings, ChevronRight, ChevronLeft, LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SidebarItem from '../molecules/SidebarItem';
import ConfirmationModal from '../molecules/ConfirmationModal'; 
import Logo from '../atoms/Logo'; // 1. Import Logo
import { useAuth } from '../../hooks/useAuth';

const Sidebar = ({ isCollapsed, toggleSidebar, activePage, setActivePage }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const displayName = user?.FirstName || "User";
  const displayRole = user?.role || "Member";
  const displayId = user?.userId || ""; 

  const handleLogoutConfirm = () => {
    logout();
    setShowLogoutModal(false);
    navigate('/login');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'classes', label: 'My Classes', icon: BookOpen },
    { id: 'students', label: 'Students & Medals', icon: Users },
    { id: 'attendance', label: 'Mark Attendance', icon: Calendar },
    { id: 'financials', label: 'Financials & Invoices', icon: DollarSign },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'profile', label: 'Profile & QR', icon: QrCode },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/20 z-20 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
        title="Sign Out?"
        message="Are you sure you want to log out of your account?"
        confirmLabel="Logout"
        variant="danger" 
      />

      <aside
        className={`
          bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen fixed left-0 top-0 z-30 transition-all duration-300 ease-in-out
          ${isCollapsed ? '-translate-x-full md:translate-x-0 md:w-20' : 'w-64'}
        `}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 dark:border-gray-700">
          
          {/* 2. REPLACED HARDCODED TEXT WITH LOGO COMPONENT */}
          <div className="flex items-center">
             {/* If sidebar is collapsed (on desktop), we can just show the Icon if we wanted, 
                 but typically we hide the whole text or keep it small. 
                 The current Logo 'small' variant works for both. */}
             {!isCollapsed ? (
                <Logo size="small" />
             ) : (
                // Optional: Just show the text 'T' or icon if collapsed?
                // For now, let's keep it simple or hide it if it overflows.
                // Since the collapsed width is 5rem (w-20), the full logo might not fit well.
                // We can force just the icon here manually or make Logo smarter.
                // Let's stick to the full small logo and let CSS handle overflow or just hiding it.
                <div className="hidden md:block">
                   <Logo size="small" className="justify-center" /> 
                </div>
             )}
             {/* Mobile specific logic handled by isCollapsed check above or CSS */}
             {isCollapsed && <span className="md:hidden"><Logo size="small" /></span>}
          </div>

          <button onClick={toggleSidebar} className="hidden md:block p-1.5 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300">
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
           <button onClick={toggleSidebar} className="md:hidden p-1.5 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300">
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50">
          <div className={`flex items-center gap-3 ${isCollapsed ? 'md:justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold shrink-0">
                {displayName.charAt(0)}
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate">{displayName}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{displayRole} {displayId && `| ${displayId}`}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 mt-2 flex-1 overflow-y-auto h-[calc(100vh-180px)] custom-scrollbar">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={activePage === item.id}
              isCollapsed={isCollapsed}
              onClick={() => {
                setActivePage(item.id);
                if (window.innerWidth < 768) toggleSidebar();
              }}
            />
          ))}
        </nav>

        {/* Logout Trigger */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
          <button 
            onClick={() => setShowLogoutModal(true)} 
            className={`
            w-full flex items-center gap-3 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors
            ${isCollapsed ? 'justify-center' : ''}
          `}>
            <LogOut size={20} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;