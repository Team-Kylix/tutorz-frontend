import React from 'react';

const StatCard = ({ label, value, icon: Icon, color, change }) => (
  <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      {/* Note: The 'color' prop comes from the parent (e.g., 'bg-blue-50 text-blue-600').
         Ideally, update your parent data to include dark variants, or rely on opacity if possible.
         For now, we leave 'color' as is to avoid breaking the layout.
      */}
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={22} />
      </div>
      
      {/* Change Badge Logic */}
      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
        change.startsWith('+') 
          ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
      }`}>
        {change}
      </span>
    </div>
    
    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</p>
  </div>
);

export default StatCard;