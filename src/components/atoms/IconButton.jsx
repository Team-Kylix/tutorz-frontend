import React from 'react';

const IconButton = ({ icon: Icon, onClick, className = "", hasBadge = false }) => (
  <button 
    onClick={onClick}
    className={`relative p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors ${className}`}
  >
    <Icon size={20} />
    {hasBadge && (
      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-900"></span>
    )}
  </button>
);

export default IconButton;