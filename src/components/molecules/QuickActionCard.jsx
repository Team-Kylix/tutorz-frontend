import React from 'react';

const QuickActionCard = ({ icon: Icon, label, colorClass, onClick }) => {
  return (
    <div 
      //Added onClick here
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center p-4 rounded-xl border border-gray-50 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 
        hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-sm transition-all duration-200 cursor-pointer
      `}
    >
      <div className={`p-2 rounded-full bg-white dark:bg-gray-900 shadow-sm mb-2 ${colorClass}`}>
        <Icon size={20} />
      </div>
      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center">{label}</span>
    </div>
  );
};

export default QuickActionCard;