export const getDayIndex = (dayName) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days.indexOf(dayName);
};

export const getClassStatus = (cls) => {
  const now = new Date();
  const currentDayIndex = now.getDay();
  const classDayIndex = getDayIndex(cls.dayOfWeek);

  // If today is NOT the class day or if class day is missing
  if (currentDayIndex !== classDayIndex || classDayIndex === -1) {
    return 'upcoming';
  }

  // Parse Time (assuming "HH:mm" format, e.g., "14:30")
  const startStr = cls.startTime || "00:00";
  const endStr = cls.endTime || "23:59";
  const [startH, startM] = startStr.split(':').map(Number);
  const [endH, endM] = endStr.split(':').map(Number);

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