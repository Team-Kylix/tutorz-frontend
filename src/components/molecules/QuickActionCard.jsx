import React from 'react';

const QuickActionCard = ({ icon: Icon, label, colorClass, onClick }) => (
  <button 
    onClick={onClick}
    className={`
      flex flex-col items-center justify-center p-4 rounded-lg transition-all border
      bg-gray-50 dark:bg-gray-800 
      hover:bg-blue-50 dark:hover:bg-gray-700 
      hover:text-blue-600 dark:hover:text-blue-400
      border-transparent hover:border-blue-100 dark:hover:border-gray-600
      text-gray-700 dark:text-gray-300
    `.trim()}
  >
    <Icon size={24} className={`mb-2 ${colorClass}`} />
    <span className="text-xs font-medium text-center">{label}</span>
  </button>
);

export default QuickActionCard;