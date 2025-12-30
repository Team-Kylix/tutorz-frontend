import React from 'react';

const StatusBadge = ({ status, className = '' }) => {
  let colorStyles = "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"; 
  
  switch (status) {
    // Green (Success)
    case 'Starting Soon':
    case 'Active':
    case 'New':
    case 'Paid':
      colorStyles = "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      break;

    // Red (Danger/Live)
    case 'Live':
    case 'Overdue':
    case 'Cancelled':
      colorStyles = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      break;

    // Yellow (Warning)
    case 'On Leave':
    case 'Pending':
      colorStyles = "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      break;

    // Blue (Primary/Info)
    case 'Upcoming':
    case 'Open':
      colorStyles = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      break;
      
    default:
      colorStyles = "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
  }

  return (
    <span className={`px-3 py-1 text-xs font-medium rounded-full border border-transparent dark:border-white/5 ${colorStyles} ${className}`}>
      {status}
    </span>
  );
};

export default StatusBadge;