import React, { useEffect, useState } from 'react';
import { Users, DollarSign, BookOpen, CreditCard } from 'lucide-react';
import StatCard from '../molecules/StatCard';
import useApi from '../../hooks/useApi';
import * as tutorService from '../../services/api/tutorService';

const INITIAL_STATS = [
  { label: "Total Students", value: "0", icon: Users, color: "bg-blue-100 text-blue-600", change: "" },
  { label: "Monthly Income", value: "LKR 0", icon: DollarSign, color: "bg-green-100 text-green-600", change: "" },
  { label: "Active Classes", value: "00", icon: BookOpen, color: "bg-purple-100 text-purple-600", change: "" },
  { label: "Pending Withdrawals", value: "LKR 0", icon: CreditCard, color: "bg-orange-100 text-orange-600", change: "" },
];

const StatsGrid = () => {

  const [stats, setStats] = useState(INITIAL_STATS);
  const { request: fetchClasses } = useApi();

  useEffect(() => {
    const calculateRealStats = async () => {
      // Fetch Real Data
      const { data: response, error } = await fetchClasses(tutorService.getDashboardStats);

      if (response && response.success && response.data) {
        const statsData = response.data;
        setStats(prevStats => prevStats.map(stat => {
          switch (stat.label) {
            case "Total Students":
              return { ...stat, value: (statsData.totalStudents || 0).toString() };
            case "Active Classes":
              return { ...stat, value: (statsData.activeClasses || 0).toString().padStart(2, '0') };
            case "Monthly Income":
              return { ...stat, value: `LKR ${(statsData.monthlyIncome || 0).toLocaleString()}` };
            case "Pending Withdrawals":
              return { ...stat, value: `LKR ${(statsData.pendingWithdrawals || 0).toLocaleString()}` };
            default:
              return stat;
          }
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