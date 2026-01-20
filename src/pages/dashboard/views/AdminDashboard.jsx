import React from 'react';
import AdminStatsGrid from '../../../components/organisms/AdminStatsGrid';
import AdminQuickActions from '../../../components/organisms/AdminQuickActions';
import PendingApprovals from '../../../components/organisms/PendingApprovals';
import { BarChart3, Wallet } from 'lucide-react';

const AdminDashboard = ({ user }) => {
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
           
           {/* Recent Financial Activity Stub */}
           <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Wallet size={20} className="text-gray-400"/> Recent Withdrawal Requests
                    </h3>
                </div>
                {/* Simple List for visual representation */}
                <div className="space-y-4">
                    {[1,2].map((i) => (
                        <div key={i} className="flex justify-between items-center border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                            <div>
                                <p className="font-medium text-gray-800">Mr. Nimal Perera (Tutor)</p>
                                <p className="text-xs text-gray-500">Bank Transfer • Ends in 8890</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-gray-900">LKR 45,000.00</p>
                                <span className="text-xs text-orange-500 font-medium">Pending Review</span>
                            </div>
                        </div>
                    ))}
                </div>
           </div>
        </div>

        {/* Right Column (1/3 width) - Quick Actions & System Info */}
        <div className="space-y-6">
          <AdminQuickActions />
          
          {/* System Health / Mini Report */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-5 text-white shadow-lg">
             <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/10 rounded-lg">
                    <BarChart3 size={20} className="text-blue-300"/>
                </div>
                <div>
                    <h3 className="font-bold">Commission Rate</h3>
                    <p className="text-xs text-gray-400">Current Platform Setting</p>
                </div>
             </div>
             <div className="text-3xl font-bold mb-2">10%</div>
             <p className="text-xs text-gray-400 leading-relaxed">
                 Applied to all institute transactions unless overridden manually in Institute Settings.
             </p>
             <button className="mt-4 w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
                 Adjust Rates
             </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;