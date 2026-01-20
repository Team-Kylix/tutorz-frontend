import React from 'react';
import { UserPlus, Building, FileText, Settings, ShieldAlert, DollarSign } from 'lucide-react';
import QuickActionCard from '../molecules/QuickActionCard';

const AdminQuickActions = () => {
  const actions = [
    {
      icon: Building,
      label: 'Verify Institutes',
      colorClass: 'text-blue-600 dark:text-blue-400',
      onClick: () => console.log('Nav to Institute Approvals')
    },
    {
      icon: DollarSign,
      label: 'Withdrawals',
      colorClass: 'text-green-600 dark:text-green-400',
      onClick: () => console.log('Nav to Withdrawal Requests')
    },
    {
      icon: ShieldAlert,
      label: 'Disputes',
      colorClass: 'text-red-600 dark:text-red-400',
      onClick: () => console.log('Nav to Disputes')
    },
    {
      icon: UserPlus,
      label: 'Create Admin',
      colorClass: 'text-purple-600 dark:text-purple-400',
      onClick: () => console.log('Nav to User Management')
    },
    {
      icon: FileText,
      label: 'Fin. Reports',
      colorClass: 'text-orange-600 dark:text-orange-400',
      onClick: () => console.log('Nav to Reports')
    },
    {
      icon: Settings,
      label: 'System Config',
      colorClass: 'text-gray-600 dark:text-gray-400',
      onClick: () => console.log('Nav to Settings')
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
      <h3 className="font-bold text-gray-900 dark:text-white mb-4">Admin Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {actions.map((action, index) => (
          <QuickActionCard key={index} {...action} />
        ))}
      </div>
    </div>
  );
};

export default AdminQuickActions;