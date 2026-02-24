import React from 'react';

const StatCard = ({ label, value, icon: Icon, color, change }) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-3">
      {/* Note: The 'color' prop comes from the parent (e.g., 'bg-blue-50 text-blue-600').
         Ideally, update your parent data to include dark variants, or rely on opacity if possible.
         For now, we leave 'color' as is to avoid breaking the layout.
      */}
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon size={20} />
      </div>

      {/* Change Badge Logic */}
      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${change.startsWith('+')
          ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
        }`}>
        {change}
      </span>
    </div>

    <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{value}</h3>
    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
  </div>
);

export default StatCard;