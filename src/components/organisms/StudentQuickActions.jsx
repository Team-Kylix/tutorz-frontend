import React from 'react';
import { Search, Calendar, CreditCard, FileText } from 'lucide-react';
import QuickActionCard from '../molecules/QuickActionCard';

const StudentQuickActions = () => {
  const actions = [
    { 
      icon: Search, 
      label: 'Find Tutor', 
      color: 'text-blue-600', 
      onClick: () => console.log('Nav to Search') 
    },
    { 
      icon: Calendar, 
      label: 'My Attendance', 
      color: 'text-green-600', 
      onClick: () => console.log('Nav to Attendance') 
    },
    { 
      icon: CreditCard, 
      label: 'Pay Fees', 
      color: 'text-purple-600', 
      onClick: () => console.log('Nav to Payments') 
    },
    { 
      icon: FileText, 
      label: 'Report Card', 
      color: 'text-orange-600', 
      onClick: () => console.log('Nav to Reports') 
    },
  ];

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <QuickActionCard key={index} {...action} />
        ))}
      </div>
    </div>
  );
};

export default StudentQuickActions;