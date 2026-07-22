import React, { useState, useEffect } from 'react';
import AdminStatsGrid from '../../../components/organisms/AdminStatsGrid';
import AdminQuickActions from '../../../components/organisms/AdminQuickActions';
import UnifiedSchedule from '../../../components/organisms/UnifiedSchedule';
import InstituteSearchAssignModal from '../../../components/organisms/InstituteSearchAssignModal';
import { getSystemClasses } from '../../../services/api/adminService';


const AdminDashboard = ({ user, setActivePage }) => {
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      setIsLoading(true);
      try {
        const res = await getSystemClasses();
        const clsData = res?.data ?? res ?? [];
        setClasses(Array.isArray(clsData) ? clsData : []);
      } catch (err) {
        console.error('Failed to fetch system classes:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClasses();
  }, []);

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Admin Overview
          </h1>
          <p className="text-gray-500 mt-1">
            Welcome back, {user?.FirstName || 'Administrator'}. Here is what's happening today.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold uppercase rounded-full border border-blue-100">
                System Healthy
            </span>
        </div>
      </div>

      {/* 2. Stats Grid (System-wide metrics) */}
      <AdminStatsGrid />

      {/* 3. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3 width) - Recent Activity/Approvals */}
        <div className="lg:col-span-2 h-[26rem]">
          <UnifiedSchedule
            title="All System Classes"
            onNavigate={() => setActivePage('classes')}
            classes={classes}
            isLoading={isLoading}
          />
        </div>

        {/* Right Column (1/3 width) - Quick Actions & System Info */}
        <div className="space-y-6">
          <AdminQuickActions 
            setActivePage={setActivePage} 
            user={user} 
            onOpenAdminModal={() => setIsAdminModalOpen(true)} 
          />
        </div>

      </div>

      <InstituteSearchAssignModal 
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        type="Admin"
        user={user}
      />
    </div>
  );
};

export default AdminDashboard;