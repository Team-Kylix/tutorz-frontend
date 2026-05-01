import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard, Users, BookOpen, Calendar, DollarSign,
  FileText, QrCode, Settings, ChevronRight, ChevronLeft, LogOut,
  Building, ShieldAlert, UserCog, CheckSquare, GraduationCap, UserCheck, UserPlus, Clock, Info, CloudOff, MessageSquareWarning,
  Bell, Receipt, CreditCard, HelpCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SidebarItem from '../molecules/SidebarItem';
import ConfirmationModal from '../molecules/ConfirmationModal';
import UserProfileSwitcher from '../molecules/UserProfileSwitcher';
import Logo from '../atoms/Logo';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';
import { selectPendingCount } from '../../store/syncSlice';

import { updateUser } from '../../store/authSlice';
import { getTutorProfile } from '../../services/api/tutorService';
import { getStudentProfile } from '../../services/api/studentService';
import { getInstituteProfile } from '../../services/api/instituteService';
import { getAdminProfile } from '../../services/api/adminService';

const Sidebar = ({ isCollapsed, toggleSidebar, activePage, setActivePage }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, logout } = useAuth();
  const pendingSyncCount = useSelector(selectPendingCount);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPendingWarning, setShowPendingWarning] = useState(false);

  // Fetch fresh profile data on load
  useEffect(() => {
    const initProfileData = async () => {
      if (!user?.role) return;
      try {
        let result;
        switch (user.role) {
          case ROLES.TUTOR: result = await getTutorProfile(); break;
          case ROLES.STUDENT: result = await getStudentProfile(); break;
          case ROLES.INSTITUTE: result = await getInstituteProfile(); break;
          case ROLES.ADMIN:
          case ROLES.SUPERADMIN: result = await getAdminProfile(); break;
          default: return;
        }

        if (result?.success) {
          let smallUrl = result.data.profileImageUrlSmall || result.data.profileImageUrlLarge || result.data.profilePictureUrl;
          let largeUrl = result.data.profileImageUrlLarge || result.data.profilePictureUrl;

          if (smallUrl) smallUrl = `${smallUrl}${smallUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
          if (largeUrl) largeUrl = `${largeUrl}${largeUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;

          dispatch(updateUser({
            firstName: result.data.firstName || result.data.instituteName,
            lastName: result.data.lastName || '',
            profileImageUrlSmall: smallUrl,
            profileImageUrlLarge: largeUrl,
            profiles: result.data.profiles || []
          }));
        }
      } catch (error) {
        console.error('Sidebar failed to fetch fresh profile data:', error);
      }
    };

    initProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogoutClick = () => {
    // If there are unsynced records, show the data-loss warning first
    if (pendingSyncCount > 0) {
      setShowPendingWarning(true);
    } else {
      setShowLogoutModal(true);
    }
  };

  const handleLogoutConfirm = () => {
    logout();
    setShowLogoutModal(false);
    setShowPendingWarning(false);
    navigate('/');
  };

  // --- Menu Definitions ---
  const tutorMenu = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'classes', label: 'My Classes', icon: BookOpen },
    { id: 'timetable', label: 'Timetable', icon: Clock },
    { id: 'student-requests', label: 'Student Requests', icon: Users },
    { id: 'tutor-requests', label: 'Institute Requests', icon: Building },
    { id: 'students', label: 'Students & Medals', icon: GraduationCap },
    { id: 'attendance', label: 'Mark Attendance', icon: Calendar },
    { id: 'financials', label: 'Financials & Invoices', icon: DollarSign },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'profile', label: 'Profile & QR', icon: QrCode },
    { id: 'complains', label: 'Complains', icon: MessageSquareWarning },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const studentMenu = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'classes', label: 'My Classes', icon: BookOpen },
    { id: 'timetable', label: 'Timetable', icon: Clock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'platform-finance', label: 'Platform Finance', icon: Receipt },
    { id: 'financials', label: 'Financials', icon: CreditCard },
    { id: 'attendance', label: 'My Attendance', icon: Calendar },
    { id: 'profile', label: 'My Profile', icon: QrCode },
    { id: 'complains', label: 'Complains', icon: MessageSquareWarning },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const instituteMenu = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'classes', label: 'My Classes', icon: BookOpen },
    { id: 'timetable', label: 'Timetable', icon: Clock },
    { id: 'hall-management', label: 'Hall Management', icon: Building },
    { id: 'institute-requests', label: 'Requests', icon: UserPlus },
    { id: 'institute-students', label: 'Students', icon: GraduationCap },
    { id: 'institute-tutors', label: 'Tutors', icon: UserCheck },
    { id: 'attendance', label: 'Mark Attendance', icon: Calendar },
    { id: 'financials', label: 'Financials & Invoices', icon: DollarSign },
    { id: 'profile', label: 'Profile & QR', icon: QrCode },
    { id: 'complains', label: 'Complains', icon: MessageSquareWarning },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const adminMenu = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'institutes', label: 'Institutes', icon: Building },
    { id: 'admin-students', label: 'Students', icon: GraduationCap },
    { id: 'admin-teachers', label: 'Teachers', icon: UserCheck },
    { id: 'users', label: 'User Management', icon: UserCog },
    { id: 'approvals', label: 'Pending Approvals', icon: CheckSquare },
    { id: 'financials', label: 'Financials', icon: CreditCard },
    { id: 'platform-finance', label: 'Platform Finance', icon: DollarSign },
    { id: 'system-config', label: 'System Configuration', icon: Settings },
    { id: 'disputes', label: 'Disputes', icon: HelpCircle },
    { id: 'reports', label: 'System Reports', icon: FileText },
    { id: 'profile', label: 'My Profile', icon: QrCode },
    { id: 'settings', label: 'System Config', icon: Settings },
  ];

  const getMenuItems = () => {
    switch (user?.role) {
      case ROLES.ADMIN:
      case ROLES.SUPERADMIN: return adminMenu;
      case ROLES.TUTOR: return tutorMenu;
      case ROLES.INSTITUTE: return instituteMenu;
      case ROLES.STUDENT: return studentMenu;
      default: return tutorMenu;
    }
  };

  const menuItems = getMenuItems();

  return (
    <>
      {!isCollapsed && (
        <div className="fixed inset-0 bg-black/20 z-20 md:hidden" onClick={toggleSidebar}></div>
      )}

      {/* Standard Logout Confirmation */}
      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
        title="Sign Out?"
        message="Are you sure you want to log out of your account?"
        confirmLabel="Logout"
        variant="danger"
      />

      {/* Data-Loss Warning — uses standard modal but with custom content */}
      <ConfirmationModal
        isOpen={showPendingWarning}
        onClose={() => setShowPendingWarning(false)}
        onCancel={() => setShowPendingWarning(false)}
        onConfirm={handleLogoutConfirm}
        title="Data Not Yet Uploaded"
        confirmLabel="Logout Anyway"
        cancelLabel="Stay & Sync"
        variant="danger"
      >
        <div className="flex items-center gap-3 p-3.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl mb-4">
          <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{pendingSyncCount}</span>
          <p className="text-sm text-amber-800 dark:text-amber-300 leading-snug">
            {pendingSyncCount === 1 ? 'record is' : 'records are'} waiting to be uploaded to the server.
          </p>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
          Please ensure you have a <strong>stable internet connection</strong> and wait for the upload to complete before logging out. If you log out now, this data <strong>will be permanently lost</strong>.
        </p>

        {/* Online status hint */}
        {!navigator.onLine && (
          <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 font-medium">
            <CloudOff size={14} />
            <span>You are currently offline. Connect to the internet first.</span>
          </div>
        )}
      </ConfirmationModal>

      <aside className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen fixed left-0 top-0 z-30 transition-all duration-300 ease-in-out scrollbar-hide ${isCollapsed ? '-translate-x-full md:translate-x-0 md:w-20' : 'w-64'}`}>

        {/* Header */}
        <div className={`h-16 flex items-center px-4 border-b border-gray-100 dark:border-gray-700 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <Logo size="small" collapsed={isCollapsed} />
          {!isCollapsed && (
            <button onClick={toggleSidebar} className="hidden md:block p-1.5 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300">
              <ChevronLeft size={20} />
            </button>
          )}
          <button onClick={toggleSidebar} className="md:hidden ml-auto p-1.5 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300">
            <ChevronLeft size={20} />
          </button>
        </div>

        {isCollapsed && (
          <div className="hidden md:flex justify-center py-2 border-b border-gray-100 dark:border-gray-700">
            <button onClick={toggleSidebar} className="p-1.5 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300">
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* ─── User Profile Section ─── */}
        <UserProfileSwitcher isCollapsed={isCollapsed} />

        {/* Navigation */}
        <nav className="p-3 pb-6 space-y-1 mt-2 flex-1 overflow-y-auto h-[calc(100vh-240px)] scrollbar-hide">
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

        {/* Footer Actions */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-2">
          <button
            onClick={() => {
              setActivePage('about');
              if (window.innerWidth < 768) toggleSidebar();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors ${isCollapsed ? 'justify-center' : ''}`}
          >
            <Info size={20} />
            {!isCollapsed && <span>About & Policies</span>}
          </button>

          <button
            onClick={handleLogoutClick}
            className={`w-full flex items-center gap-3 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={20} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;