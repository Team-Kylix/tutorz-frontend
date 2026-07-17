import React from 'react';
import { Settings, ShieldAlert, Coins, Wallet, UserPlus } from 'lucide-react';
import QuickActionCard from '../molecules/QuickActionCard';

const AdminQuickActions = ({ setActivePage, user, onOpenAdminModal }) => {
  const actions = [
    {
      icon: ShieldAlert,
      label: 'Disputes',
      colorClass: 'text-red-500 dark:text-red-400',
      onClick: () => setActivePage('disputes')
    },
    {
      icon: Settings,
      label: 'System Config',
      colorClass: 'text-blue-500 dark:text-blue-400',
      onClick: () => setActivePage('system-config')
    },
    {
      icon: Coins,
      label: 'Platform Finance',
      colorClass: 'text-indigo-500 dark:text-indigo-400',
      onClick: () => setActivePage('platform-finance')
    },
    {
      icon: Wallet,
      label: 'System Finance',
      colorClass: 'text-green-500 dark:text-green-400',
      onClick: () => setActivePage('financials')
    }
  ];

  if (user?.role === 'SuperAdmin') {
    actions.push({
      icon: UserPlus,
      label: 'Create Admin',
      colorClass: 'text-purple-500 dark:text-purple-400',
      onClick: onOpenAdminModal
    });
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
      <h3 className="font-bold text-gray-900 dark:text-white mb-4">Admin Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <QuickActionCard key={index} {...action} />
        ))}
      </div>
    </div>
  );
};

export default AdminQuickActions;