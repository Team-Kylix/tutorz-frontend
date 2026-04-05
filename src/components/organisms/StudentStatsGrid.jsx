import StatCard from '../molecules/StatCard';
import { CheckCircle, BookOpen, DollarSign, Award } from 'lucide-react';

const StudentStatsGrid = ({ classesCount = 0, attendanceRate = 0, isLoading = false }) => {
  const stats = [
    {
      label: "Attendance Rate",
      value: isLoading ? "..." : `${attendanceRate}%`,
      icon: CheckCircle,
      color: "bg-green-100 text-green-600",
      change: "Overall"
    },
    {
      label: "Enrolled Classes",
      value: isLoading ? "..." : classesCount.toString().padStart(2, '0'),
      icon: BookOpen,
      color: "bg-blue-100 text-blue-600",
      change: "Active"
    },
    {
      label: "Due Fees",
      value: "LKR 2,500",
      icon: DollarSign,
      color: "bg-red-100 text-red-600",
      change: "1 Pending"
    },
    {
      label: "Medals Earned",
      value: "12",
      icon: Award,
      color: "bg-yellow-100 text-yellow-600",
      change: "+1 New"
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

export default StudentStatsGrid;