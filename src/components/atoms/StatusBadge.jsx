import React from 'react';

const StatusBadge = ({ status, className = '' }) => {
  let colorStyles = "bg-gray-100 text-gray-600"; 
  
  switch (status) {
    // Green (Success)
    case 'Starting Soon':
    case 'Active':
    case 'New':
    case 'Paid':
      colorStyles = "bg-green-100 text-green-700";
      break;

    // Red (Danger/Live)
    case 'Live':
    case 'Overdue':
    case 'Cancelled':
      colorStyles = "bg-red-100 text-red-700";
      break;

    // Yellow (Warning)
    case 'On Leave':
    case 'Pending':
      colorStyles = "bg-yellow-100 text-yellow-700";
      break;

    // Blue (Primary/Info)
    case 'Upcoming':
    case 'Open':
      colorStyles = "bg-blue-100 text-blue-700";
      break;
      
    default:
      colorStyles = "bg-gray-100 text-gray-600";
  }

  return (
    <span className={`px-3 py-1 text-xs font-medium rounded-full ${colorStyles} ${className}`}>
      {status}
    </span>
  );
};

export default StatusBadge;