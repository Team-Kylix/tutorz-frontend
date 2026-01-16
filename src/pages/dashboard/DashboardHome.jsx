import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';

// Import the specific views
import TutorDashboard from './views/TutorDashboard';
import StudentDashboard from './views/StudentDashboard';
import InstituteDashboard from './views/InstituteDashboard';
import AdminDashboard from './views/AdminDashboard';

// Import Pages for Navigation Switching
import ClassesPage from './ClassesPage';
import TutorProfile from './TutorProfile';
import StudentProfile from './StudentProfile';


const DashboardHome = ({ activePage, setActivePage }) => {
  const { user } = useAuth();
  
  // --- NAVIGATION SWITCHER ---
  // If Sidebar selected 'classes', show the Classes Page immediately
  if (activePage === 'classes') {
      return <ClassesPage />;
  }
  if (activePage === 'profile') {
      switch (user?.role) {
        case ROLES.STUDENT:
           return <StudentProfile />;
        case ROLES.TUTOR:
           return <TutorProfile />;
        // Add InstituteProfile later if needed
        default:
           return <TutorProfile />;
      }
  }
  // --- ROLE BASED RENDERING ---
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