import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import Sidebar from '../organisms/SideBar'; 
import TopNavbar from '../organisms/TopNavbar'; 
import { closePanel } from '../../store/notificationSlice';

const DashboardLayout = ({ children }) => {
  const dispatch = useDispatch();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 768);
  const [activePage, setActivePage] = useState('dashboard'); // State lives here

  const toggleSidebar = () => {
    const willOpen = isSidebarCollapsed; // true = sidebar is about to open
    if (willOpen) {
      // Sidebar is opening — close the notification panel to avoid overlap on mobile
      dispatch(closePanel());
    }
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  // Prevent body scroll when sidebar is open on mobile
  React.useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (!isSidebarCollapsed && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarCollapsed]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-900 dark:text-white transition-colors">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={toggleSidebar}
        activePage={activePage}
        setActivePage={setActivePage}
      />

      <TopNavbar
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={toggleSidebar}
      />

      <main
        className={`
          pt-20 px-4 md:px-6 pb-8 min-h-screen transition-all duration-300
          ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}
        `}
      >
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
             return React.cloneElement(child, { activePage, setActivePage });
          }
          return child;
        })}
      </main>
    </div>
  );
};

export default DashboardLayout;