import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';

// Import the specific DASHBOARD views
import TutorDashboard from './views/TutorDashboard';
import StudentDashboard from './views/StudentDashboard';
import InstituteDashboard from './views/InstituteDashboard';
import AdminDashboard from './views/AdminDashboard';
import HallManagement from './views/HallManagement';

// Import Pages for Navigation Switching
import ClassesPage from './ClassesPage';
import InstituteClassesPage from './InstituteClassesPage';
import StudentClassesPage from './StudentClassesPage';
import TimetablePage from './TimetablePage';
// Import only the unified profile page
import UserProfile from './UserProfile';
import InstituteStudentsPage from './InstituteStudentsPage';
import InstituteTutorsPage from './InstituteTutorsPage';
import InstituteRequestsPage from './InstituteRequestsPage';
import TutorRequestsPage from './TutorRequestsPage';
import StudentRequestsPage from './StudentRequestsPage';
import AttendancePage from './AttendancePage';
import StudentAttendancePage from './StudentAttendancePage';
import FinancialsPage from './FinancialsPage';
import StudentFinancialsPage from './StudentFinancialsPage';
import InstituteFinancialsPage from './InstituteFinancialsPage';
import AdminFinancialsPage from './AdminFinancialsPage';
import SettingsPage from './SettingsPage';
import AdminStudentsPage from './AdminStudentsPage';
import AdminTeachersPage from './AdminTeachersPage';
import AdminInstitutesPage from './AdminInstitutesPage';
import AdminPlatformFinancePage from './AdminPlatformFinancePage';
import UserPlatformFinancePage from './UserPlatformFinancePage';
import AdminSystemConfigPage from './AdminSystemConfigPage';
import AboutUsContent from '../../components/organisms/AboutUsContent';
import DisputesPage from './DisputesPage';
import ReportsPage from './ReportsPage';

const DashboardHome = ({ activePage, setActivePage }) => {
  const { user } = useAuth();

  // --- NAVIGATION SWITCHER ---

  if (activePage === 'classes') {
    if (user?.role === ROLES.INSTITUTE) {
      return <InstituteClassesPage />;
    }
    if (user?.role === ROLES.STUDENT) {
      return <StudentClassesPage />;
    }
    return <ClassesPage />;
  }

  if (activePage === 'timetable') {
    return <TimetablePage />;
  }

  if (activePage === 'hall-management') {
    return <HallManagement />;
  }

  if (activePage === 'institute-students') {
    return <InstituteStudentsPage />;
  }

  if (activePage === 'institute-tutors') {
    return <InstituteTutorsPage />;
  }

  if (activePage === 'institutes') {
    return <AdminInstitutesPage />;
  }

  if (activePage === 'admin-students') {
    return <AdminStudentsPage />;
  }

  if (activePage === 'admin-teachers') {
    return <AdminTeachersPage />;
  }

  if (activePage === 'institute-requests') {
    return <InstituteRequestsPage />;
  }

  if (activePage === 'tutor-requests') {
    return <TutorRequestsPage />;
  }

  if (activePage === 'student-requests') {
    return <StudentRequestsPage />;
  }

  // No switch case needed here anymore.
  // The UserProfile component inside handles the logic internally based on user.role
  if (activePage === 'profile') {
    return <UserProfile />;
  }

  if (activePage === 'attendance') {
    if (user?.role === ROLES.STUDENT) {
      return <StudentAttendancePage />;
    }
    return <AttendancePage />;
  }

  if (activePage === 'reports') {
    return <ReportsPage />;
  }

  if (activePage === 'financials') {
    if (user?.role === ROLES.STUDENT) {
      return <StudentFinancialsPage setActivePage={setActivePage} />;
    }
    if (user?.role === ROLES.INSTITUTE) {
      return <InstituteFinancialsPage />;
    }
    if (user?.role === ROLES.ADMIN || user?.role === ROLES.SUPERADMIN) {
      return <AdminFinancialsPage />;
    }
    return <FinancialsPage />;
  }

  if (activePage === 'settings') {
    return <SettingsPage user={user} />;
  }

  if (activePage === 'platform-finance') {
    if (user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'superadmin') {
      return <AdminPlatformFinancePage />;
    }
    return <UserPlatformFinancePage setActivePage={setActivePage} />;
  }

  if (activePage === 'system-config') {
    if (user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'superadmin') {
      return <AdminSystemConfigPage />;
    }
    return <SettingsPage user={user} />;
  }

  if (activePage === 'about') {
    return (
      <div className="max-w-6xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">About & Policies</h2>
        <AboutUsContent />
      </div>
    );
  }

  // Complaints & Disputes — unified view for all roles
  if (activePage === 'complains' || activePage === 'disputes') {
    return <DisputesPage />;
  }

  // --- DASHBOARD RENDERING ---
  switch (user?.role) {
    case ROLES.TUTOR:
      return <TutorDashboard setActivePage={setActivePage} />;

    case ROLES.STUDENT:
      return <StudentDashboard user={user} setActivePage={setActivePage} />;

    case ROLES.INSTITUTE:
      return <InstituteDashboard user={user} setActivePage={setActivePage} />;

    case ROLES.ADMIN:
    case ROLES.SUPERADMIN:
      return <AdminDashboard user={user} setActivePage={setActivePage} />;

    default:
      // Fallback
      return <TutorDashboard setActivePage={setActivePage} />;
  }
};

export default DashboardHome;