import React, { useEffect, useState } from 'react';
import StatCard from '../molecules/StatCard';
import { STATS_DATA } from '../../utils/mockData'; 
import useApi from '../../hooks/useApi';
import * as tutorService from '../../services/api/tutorService';

const StatsGrid = () => {

  const [stats, setStats] = useState(STATS_DATA);
  const { request: fetchClasses } = useApi();

  useEffect(() => {
    const calculateRealStats = async () => {
      // Fetch Real Data
      const { data } = await fetchClasses(tutorService.getClasses);

      if (data) {
        // Calculate Active Classes
        const activeCount = data.filter(c => c.isActive).length;

        // Update the specific card in our stats array
        setStats(prevStats => prevStats.map(stat => {
          if (stat.label === "Active Classes") {
            return {
              ...stat,
              // Convert to string and pad with 0 if single digit (e.g., 5 -> "05")
              value: activeCount.toString().padStart(2, '0') 
            };
          }
          return stat;
        }));
      }
    };

    calculateRealStats();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default StatsGrid;