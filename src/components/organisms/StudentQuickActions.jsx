import React from 'react';
import { Calendar, DollarSign, UserCheck, User } from 'lucide-react';
import QuickActionCard from '../molecules/QuickActionCard';

const StudentQuickActions = ({ onActionClick }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm h-full transition-colors">
    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
    <div className="grid grid-cols-2 gap-3">
      <QuickActionCard 
        icon={Calendar} 
        label="Today Timetable" 
        colorClass="text-purple-500 dark:text-purple-400" 
        onClick={() => onActionClick && onActionClick('timetable')} 
      />
      <QuickActionCard 
        icon={DollarSign} 
        label="Finance Page" 
        colorClass="text-orange-500 dark:text-orange-400" 
        onClick={() => onActionClick && onActionClick('financials')} 
      />
      
      <QuickActionCard 
        icon={UserCheck} 
        label="My Attendance" 
        colorClass="text-green-500 dark:text-green-400"
        onClick={() => onActionClick && onActionClick('attendance')} 
      />
      
      <QuickActionCard 
        icon={User} 
        label="My Profile" 
        colorClass="text-blue-500 dark:text-blue-400" 
        onClick={() => onActionClick && onActionClick('profile')} 
      />
    </div>
  </div>
);

export default StudentQuickActions;