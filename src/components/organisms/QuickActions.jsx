import React from 'react';
import { Award, FileText, Users, LogOut } from 'lucide-react';
import QuickActionCard from '../molecules/QuickActionCard';

const QuickActions = () => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm h-full transition-colors">
    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
    <div className="grid grid-cols-2 gap-3">
      <QuickActionCard icon={Award} label="Give Medals" colorClass="text-purple-500 dark:text-purple-400" />
      <QuickActionCard icon={FileText} label="Generate Invoice" colorClass="text-orange-500 dark:text-orange-400" />
      <QuickActionCard icon={Users} label="Student Request" colorClass="text-green-500 dark:text-green-400" />
      <QuickActionCard icon={LogOut} label="Withdraw Funds" colorClass="text-red-500 dark:text-red-400" />
    </div>

    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Active Coupons</span>
        <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Manage</button>
      </div>
      
      {/* Coupon Box */}
      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/50 rounded-lg p-3 flex justify-between items-center transition-colors">
        <span className="font-mono font-bold text-orange-700 dark:text-orange-400">NEWYEAR25</span>
        <span className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400">
            10% OFF
        </span>
      </div>
    </div>
  </div>
);

export default QuickActions;