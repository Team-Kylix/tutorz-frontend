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
import SettingsPage from './SettingsPage';
import AboutUsContent from '../../components/organisms/AboutUsContent';

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

  if (activePage === 'financials') {
    return <FinancialsPage />;
  }

  if (activePage === 'settings') {
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

  // --- DASHBOARD RENDERING ---
  switch (user?.role) {
    case ROLES.TUTOR:
      return <TutorDashboard setActivePage={setActivePage} />;

    case ROLES.STUDENT:
      return <StudentDashboard user={user} />;

    case ROLES.INSTITUTE:
      return <InstituteDashboard user={user} setActivePage={setActivePage} />;

    case ROLES.ADMIN:
      return <AdminDashboard user={user} />;

    default:
      // Fallback
      return <TutorDashboard setActivePage={setActivePage} />;
  }
};

export default DashboardHome;