import React from 'react';
import AdminStatsGrid from '../../../components/organisms/AdminStatsGrid';
import AdminQuickActions from '../../../components/organisms/AdminQuickActions';
import PendingApprovals from '../../../components/organisms/PendingApprovals';


const AdminDashboard = ({ user, setActivePage }) => {
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
        <div className="lg:col-span-2 space-y-6">
           {/* Pending Approvals Widget */}
           <PendingApprovals />

        </div>

        {/* Right Column (1/3 width) - Quick Actions & System Info */}
        <div className="space-y-6">
          <AdminQuickActions setActivePage={setActivePage} />
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;