export const getDayIndex = (dayName) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days.indexOf(dayName);
};

export const getClassStatus = (cls) => {
  const now = new Date();
  const currentDayIndex = now.getDay(); 
  const classDayIndex = getDayIndex(cls.dayOfWeek);

  // If today is NOT the class day, it's just "Upcoming" (or "Later")
  if (currentDayIndex !== classDayIndex) {
    return 'upcoming'; 
  }

  // Parse Time (assuming "HH:mm" format, e.g., "14:30")
  const [startH, startM] = cls.startTime.split(':').map(Number);
  const [endH, endM] = cls.endTime.split(':').map(Number);

  const startTime = new Date();
  startTime.setHours(startH, startM, 0);

  const endTime = new Date();
  endTime.setHours(endH, endM, 0);

  // Determine Status
  if (now >= startTime && now <= endTime) {
    return 'in-progress';
  } else if (now > endTime) {
    return 'completed';
  } else {
    return 'next'; 
  }
};