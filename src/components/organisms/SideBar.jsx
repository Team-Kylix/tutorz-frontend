import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import {
  LayoutDashboard, Users, BookOpen, Calendar, DollarSign,
  FileText, QrCode, Settings, ChevronRight, ChevronLeft, LogOut,
  Building, ShieldAlert, UserCog, CheckSquare, GraduationCap, UserCheck, UserPlus, Clock, Info,
  ArrowLeftRight, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SidebarItem from '../molecules/SidebarItem';
import ConfirmationModal from '../molecules/ConfirmationModal';
import Logo from '../atoms/Logo';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';
import { BASE_URL } from '../../services/api/apiClient';

import { updateUser } from '../../store/authSlice';
import { getTutorProfile } from '../../services/api/tutorService';
import { getStudentProfile } from '../../services/api/studentService';
import { getInstituteProfile } from '../../services/api/instituteService';

const Sidebar = ({ isCollapsed, toggleSidebar, activePage, setActivePage }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, logout, switchAccount } = useAuth();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [isSwitching, setIsSwitching] = useState(null);
  const switcherRef = useRef(null);

  // User Display Logic
  const firstName = user?.firstName || 'User';
  const lastName = user?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const displayRole = user?.role || 'Member';
  const displayId = user?.registrationNumber || user?.userId || '';
  const profileImage = user?.profileImageUrlSmall || user?.profileImageUrlLarge || user?.profilePictureUrl;

  // Sibling profiles
  const siblingProfiles = user?.profiles || [];
  const hasSiblings = user?.role === ROLES.STUDENT && siblingProfiles.length > 1;
  const currentStudentId = user?.currentStudentId;

  // Close switcher on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target)) {
        setShowSwitcher(false);
      }
    };
    if (showSwitcher) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSwitcher]);

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

  const handleLogoutConfirm = () => {
    logout();
    setShowLogoutModal(false);
    navigate('/login');
  };

  const handleSwitchAccount = async (studentId) => {
    if (studentId === currentStudentId || isSwitching) return;
    setIsSwitching(studentId);
    try {
      await switchAccount(studentId);
    } catch (err) {
      console.error('Failed to switch account:', err);
      setIsSwitching(null);
    }
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
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const studentMenu = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'classes', label: 'My Classes', icon: BookOpen },
    { id: 'timetable', label: 'Timetable', icon: Clock },
    { id: 'attendance', label: 'My Attendance', icon: Calendar },
    { id: 'profile', label: 'My Profile', icon: QrCode },
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
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const adminMenu = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'institutes', label: 'Institutes', icon: Building },
    { id: 'users', label: 'User Management', icon: UserCog },
    { id: 'approvals', label: 'Pending Approvals', icon: CheckSquare },
    { id: 'financials', label: 'Platform Finance', icon: DollarSign },
    { id: 'disputes', label: 'Disputes', icon: ShieldAlert },
    { id: 'reports', label: 'System Reports', icon: FileText },
    { id: 'settings', label: 'System Config', icon: Settings },
  ];

  const getMenuItems = () => {
    switch (user?.role) {
      case ROLES.ADMIN: return adminMenu;
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

      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
        title="Sign Out?"
        message="Are you sure you want to log out of your account?"
        confirmLabel="Logout"
        variant="danger"
      />

      <aside className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen fixed left-0 top-0 z-30 transition-all duration-300 ease-in-out ${isCollapsed ? '-translate-x-full md:translate-x-0 md:w-20' : 'w-64'}`}>

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
        <div
          className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50 relative"
          ref={switcherRef}
        >
          <div
            className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''} ${hasSiblings ? 'cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors -mx-1 px-1 py-1' : ''}`}
            onClick={() => hasSiblings && setShowSwitcher(prev => !prev)}
            title={hasSiblings ? 'Switch student account' : undefined}
          >
            {/* Avatar */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 overflow-hidden
                ${user?.role === ROLES.ADMIN ? 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300' : 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'}`}
            >
              {profileImage ? (
                <img
                  src={profileImage.startsWith('http') ? profileImage : `${BASE_URL}${profileImage}`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{firstName.charAt(0)}</span>
              )}
            </div>

            {!isCollapsed && (
              <>
                <div className="overflow-hidden flex-1">
                  <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate" title={fullName}>
                    {fullName}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize truncate">
                    {displayRole} {displayId && `| ${displayId}`}
                  </p>
                </div>

                {/* Switch icon — only for students with siblings */}
                {hasSiblings && (
                  <div
                    className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200
                      ${showSwitcher
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900'
                        : 'text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40'
                      }`}
                  >
                    <ArrowLeftRight size={14} />
                  </div>
                )}
              </>
            )}
          </div>

          {/* ─── Sibling Switcher Popout Panel ─── */}
          {showSwitcher && hasSiblings && !isCollapsed && (
            <div
              className={`absolute z-50 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl shadow-gray-300/40 dark:shadow-black/40 overflow-hidden 
                md:left-full md:top-0 md:ml-2 
                left-2 right-2 top-full mt-2 md:w-64 w-[calc(100%-1rem)] mx-auto
              `}
              style={{ animation: 'fadeSlideIn 0.18s ease-out forwards' }}
            >
              {/* Panel Header */}
              <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-b border-gray-100 dark:border-gray-700">
                <p className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Switch Profile</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Select a student account</p>
              </div>

              {/* Profile List */}
              <div className="p-2 space-y-1 max-h-72 overflow-y-auto custom-scrollbar">
                {siblingProfiles.map((profile) => {
                  const isActive = profile.studentId === currentStudentId;
                  const isLoading = isSwitching === profile.studentId;
                  const initial = (profile.firstName || '?').charAt(0).toUpperCase();
                  const thumbUrl = profile.profileImageUrlSmall || profile.profileImageUrlLarge;

                  return (
                    <button
                      key={profile.studentId}
                      onClick={() => !isActive && handleSwitchAccount(profile.studentId)}
                      disabled={isActive || !!isSwitching}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all duration-150 border
                        ${isActive
                          ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 cursor-default'
                          : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/60 cursor-pointer'
                        }
                        ${isSwitching && !isLoading ? 'opacity-50 pointer-events-none' : ''}
                      `}
                    >
                      {/* Mini Avatar */}
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden
                          ${isActive
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                      >
                        {thumbUrl ? (
                          <img
                            src={thumbUrl.startsWith('http') ? thumbUrl : `${BASE_URL}${thumbUrl}`}
                            alt={profile.firstName}
                            className="w-full h-full object-cover"
                          />
                        ) : initial}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm truncate flex items-center gap-1.5 ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>
                          {profile.firstName}
                          {profile.isPrimary && (
                            <span className="text-[10px] font-medium bg-blue-100 dark:bg-blue-800/50 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded-full leading-none">
                              Primary
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{profile.grade || 'Student'}</p>
                      </div>

                      {/* Status indicator */}
                      {isLoading ? (
                        <Loader2 size={15} className="shrink-0 text-blue-500 animate-spin" />
                      ) : isActive ? (
                        <span className="shrink-0 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-blue-200 dark:ring-blue-800"></span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-3 pb-6 space-y-1 mt-2 flex-1 overflow-y-auto h-[calc(100vh-240px)] custom-scrollbar">
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
            onClick={() => setShowLogoutModal(true)}
            className={`w-full flex items-center gap-3 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={20} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  );
};

export default Sidebar;