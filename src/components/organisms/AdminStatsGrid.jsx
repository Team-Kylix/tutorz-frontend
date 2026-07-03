import React, { useState, useEffect } from 'react';
import { TrendingUp, Building2, Users, GraduationCap, DollarSign } from 'lucide-react';
import StatCard from '../molecules/StatCard';
import { getAdminDashboardStats } from '../../services/api/adminService';

// ─── Custom Card for Income Chart ─────────────────────────────────────────────
const IncomeChartCard = () => {
  // Mock data for the last 6 months
  const data = [
    { month: 'Jan', value: 400 },
    { month: 'Feb', value: 650 },
    { month: 'Mar', value: 500 },
    { month: 'Apr', value: 900 },
    { month: 'May', value: 750 },
    { month: 'Jun', value: 1200 },
  ];
  
  const maxVal = Math.max(...data.map(d => d.value));

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
          <TrendingUp size={20} />
        </div>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400">
          +12.5%
        </span>
      </div>

      <div className="flex items-end justify-between gap-4">
        {/* Value & Label */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">LKR 4.2M</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Total Platform Income</p>
        </div>

        {/* Inline Sparkline Bar Chart */}
        <div className="flex items-end gap-1 h-8 flex-1 max-w-[80px]">
          {data.map((item, idx) => {
            const heightPercent = (item.value / maxVal) * 100;
            return (
              <div key={idx} className="w-full relative h-full bg-gray-50 dark:bg-gray-700/50 rounded-t-sm flex items-end group">
                <div 
                  className="w-full bg-emerald-400 dark:bg-emerald-500 rounded-t-sm transition-all duration-500 group-hover:bg-emerald-500 dark:group-hover:bg-emerald-400"
                  style={{ height: `${heightPercent}%` }}
                ></div>
                {/* Tooltip on hover */}
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block px-1 py-0.5 text-[8px] font-bold text-white bg-gray-900 dark:bg-gray-700 rounded shadow-sm z-10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity leading-none">
                  {item.value}k
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const AdminStatsGrid = () => {
  const [totalUsers, setTotalUsers] = useState("Loading...");
  const [totalInstitutes, setTotalInstitutes] = useState("Loading...");
  const [totalTutors, setTotalTutors] = useState("Loading...");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getAdminDashboardStats();
        setTotalUsers(data.totalUsers.toLocaleString());
        if (data.totalInstitutes !== undefined) {
          setTotalInstitutes(data.totalInstitutes.toLocaleString());
        }
        if (data.totalTutors !== undefined) {
          setTotalTutors(data.totalTutors.toLocaleString());
        }
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
        setTotalUsers("Error");
        setTotalInstitutes("Error");
        setTotalTutors("Error");
      }
    };
    fetchStats();
  }, []);

  // Mock Data based on SRS requirements mixed with real data
  const stats = [
    {
      label: "Registered Institutes",
      value: totalInstitutes,
      icon: Building2,
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      change: "+4"
    },
    {
      label: "Total Users",
      value: totalUsers,
      icon: Users,
      color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
      change: "+120"
    },
    {
      label: "Total Tutors",
      value: totalTutors,
      icon: GraduationCap,
      color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
      change: "+12"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <IncomeChartCard />
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default AdminStatsGrid;