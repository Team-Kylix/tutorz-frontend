import React, { useState } from 'react';
import StatCard from '../molecules/StatCard';
import { STUDENT_STATS } from '../../utils/studentMockData';

const StudentStatsGrid = () => {
  // In the future, fetch this data from studentService
  const [stats] = useState(STUDENT_STATS);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default StudentStatsGrid;