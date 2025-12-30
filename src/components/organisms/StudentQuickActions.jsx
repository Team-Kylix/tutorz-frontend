import React from 'react';
import { Search, Calendar, CreditCard, FileText } from 'lucide-react';
import QuickActionCard from '../molecules/QuickActionCard';

const StudentQuickActions = () => {
  const actions = [
    { 
      icon: Search, 
      label: 'Find Tutor', 
      colorClass: 'text-blue-600 dark:text-blue-400', 
      onClick: () => console.log('Nav to Search') 
    },
    { 
      icon: Calendar, 
      label: 'My Attendance', 
      colorClass: 'text-green-600 dark:text-green-400', 
      onClick: () => console.log('Nav to Attendance') 
    },
    { 
      icon: CreditCard, 
      label: 'Pay Fees', 
      colorClass: 'text-purple-600 dark:text-purple-400', 
      onClick: () => console.log('Nav to Payments') 
    },
    { 
      icon: FileText, 
      label: 'Report Card', 
      colorClass: 'text-orange-600 dark:text-orange-400', 
      onClick: () => console.log('Nav to Reports') 
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
      <h3 className="font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <QuickActionCard key={index} {...action} />
        ))}
      </div>
    </div>
  );
};

export default StudentQuickActions;