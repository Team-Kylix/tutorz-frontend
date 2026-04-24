/**
 * Extracts a readable error message from an Axios error object.
 */
export const extractErrorMessage = (error) => {
  if (error.response && error.response.data && error.response.data.message) {
    return error.response.data.message;
  }
  return error.message || 'An unexpected error occurred.';
};

/**
 * Formats a date string to a readable format (e.g., DD MMM YYYY).
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

/**
 * Formats currency (e.g., LKR 1,000.00).
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
  }).format(amount);
};

/**
 * Standardizes a time string to a readable 12-hour AM/PM format.
 * Handles: "14:30" -> "2:30 PM", "08:00 AM" -> "8:00 AM", "11:30" -> "11:30 AM"
 */
export const formatTime = (timeStr) => {
  if (!timeStr) return '';
  
  // Clean the input (remove extra spaces)
  const cleanStr = timeStr.trim();
  
  // Try to match HH:mm (optional AM/PM)
  // This regex matches "08:00", "14:30", "08:00 AM", "8:00PM"
  const match = cleanStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return cleanStr; 

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = match[3] ? match[3].toUpperCase() : null;

  if (ampm) {
    // Already has AM/PM, just ensure normalized spacing and removal of leading zero for hours 1-9
    return `${hours}:${minutes} ${ampm}`;
  } else {
    // 24-hour conversion
    const suffix = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${minutes} ${suffix}`;
  }
};