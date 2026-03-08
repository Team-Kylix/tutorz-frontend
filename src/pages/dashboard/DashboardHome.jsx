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
// Import only the unified profile page
import UserProfile from './UserProfile';
import InstituteStudentsPage from './InstituteStudentsPage';
import InstituteTutorsPage from './InstituteTutorsPage';
import InstituteRequestsPage from './InstituteRequestsPage';
import TutorRequestsPage from './TutorRequestsPage';
import StudentRequestsPage from './StudentRequestsPage';
import AttendancePage from './AttendancePage';
import SettingsPage from './SettingsPage';

const DashboardHome = ({ activePage, setActivePage }) => {
  const { user } = useAuth();

  // --- NAVIGATION SWITCHER ---

  if (activePage === 'classes') {
    if (user?.role === ROLES.INSTITUTE) {
      return <InstituteClassesPage />;
    }
    return <ClassesPage />;
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
    return <AttendancePage />;
  }

  if (activePage === 'settings') {
    return <SettingsPage user={user} />;
  }

  // --- DASHBOARD RENDERING ---
  switch (user?.role) {
    case ROLES.TUTOR:
      return <TutorDashboard setActivePage={setActivePage} />;

    case ROLES.STUDENT:
      return <StudentDashboard user={user} />;

    case ROLES.INSTITUTE:
      return <InstituteDashboard user={user} />;

    case ROLES.ADMIN:
      return <AdminDashboard user={user} />;

    default:
      // Fallback
      return <TutorDashboard setActivePage={setActivePage} />;
  }
};

export default DashboardHome;