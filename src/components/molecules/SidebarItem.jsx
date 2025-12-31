import React from 'react';

const SidebarItem = ({ icon: Icon, label, isActive, isCollapsed, onClick }) => (
  <button
    onClick={onClick}
    className={`
      w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors duration-200
      ${isActive 
        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium' 
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'}
      ${isCollapsed ? 'justify-center' : ''}
    `}
    title={isCollapsed ? label : ''}
  >
    <Icon size={20} />
    {!isCollapsed && <span>{label}</span>}
  </button>
);

export default SidebarItem;