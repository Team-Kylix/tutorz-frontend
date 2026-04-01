import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux'; // Added Redux Dispatch
import {
  LayoutDashboard, Users, BookOpen, Calendar, DollarSign,
  FileText, QrCode, Settings, ChevronRight, ChevronLeft, LogOut,
  Building, ShieldAlert, UserCog, CheckSquare, GraduationCap, UserCheck, UserPlus, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SidebarItem from '../molecules/SidebarItem';
import ConfirmationModal from '../molecules/ConfirmationModal';
import Logo from '../atoms/Logo';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';
import { BASE_URL } from '../../services/api/apiClient';

// Added API and Redux actions to fetch data on load
import { updateUser } from '../../store/authSlice';
import { getTutorProfile } from '../../services/api/tutorService';
import { getStudentProfile } from '../../services/api/studentService';
import { getInstituteProfile } from '../../services/api/instituteService';

const Sidebar = ({ isCollapsed, toggleSidebar, activePage, setActivePage }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, logout } = useAuth();

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // User Display Logic
  const firstName = user?.firstName || "User";
  const lastName = user?.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim();
  const displayRole = user?.role || "Member";
  const displayId = user?.registrationNumber || user?.userId || "";

  // Look for Small, then Large, then any profile picture URL available in Redux
  const profileImage = user?.profileImageUrlSmall || user?.profileImageUrlLarge || user?.profilePictureUrl;

  // --- CRITICAL FIX: Fetch profile quietly on Dashboard load ---
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
          // Send fresh data to Redux immediately so the Sidebar updates
          dispatch(updateUser({
            firstName: result.data.firstName || result.data.instituteName,
            lastName: result.data.lastName || '',
            profileImageUrlSmall: result.data.profileImageUrlSmall || result.data.profileImageUrlLarge || result.data.profilePictureUrl,
            profileImageUrlLarge: result.data.profileImageUrlLarge || result.data.profilePictureUrl
          }));
        }
      } catch (error) {
        console.error("Sidebar failed to fetch fresh profile data:", error);
      }
    };

    initProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs exactly once when the Sidebar mounts

  const handleLogoutConfirm = () => {
    logout();
    setShowLogoutModal(false);
    navigate('/login');
  };

  // --- 1. Define Menus for Different Roles ---

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

  // --- 2. Switch Logic ---
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

        {/* User Profile */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50">
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
            
            {/* Avatar container */}
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
              <div className="overflow-hidden">
                <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate" title={fullName}>
                  {fullName}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize truncate">
                  {displayRole} {displayId && `| ${displayId}`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 pb-6 space-y-1 mt-2 flex-1 overflow-y-auto h-[calc(100vh-190px)] custom-scrollbar">
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