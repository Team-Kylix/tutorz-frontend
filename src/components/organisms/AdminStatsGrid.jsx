import React, { useState, useEffect } from 'react';
import { TrendingUp, Building2, Users, AlertCircle } from 'lucide-react';
import StatCard from '../molecules/StatCard';
import { getAdminDashboardStats } from '../../services/api/adminService';

const AdminStatsGrid = () => {
  const [totalUsers, setTotalUsers] = useState("Loading...");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getAdminDashboardStats();
        setTotalUsers(data.totalUsers.toLocaleString());
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
        setTotalUsers("Error");
      }
    };
    fetchStats();
  }, []);

  // Mock Data based on SRS requirements mixed with real data
  const stats = [
    {
      label: "Total Platform Income",
      value: "LKR 4.2M",
      icon: TrendingUp,
      // Updated colors for dark mode compatibility
      color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
      change: "+12.5%"
    },
    {
      label: "Registered Institutes",
      value: "124",
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
      label: "Pending Approvals",
      value: "15",
      icon: AlertCircle,
      color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
      change: "Action Req"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default AdminStatsGrid;