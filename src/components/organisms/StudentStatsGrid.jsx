import DetailStatusCard from '../molecules/DetailStatusCard';
import { CheckCircle, BookOpen, DollarSign, Award } from 'lucide-react';

const StudentStatsGrid = ({ classesCount = 0, attendanceRate = 0, dueAmount = 0, pendingCount = 0, paidThisMonth = 0, medalsCount = 0, isLoading = false }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <DetailStatusCard 
        icon={CheckCircle}
        color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
        isLoading={isLoading}
        rows={[
          { label: 'Attendance Rate', value: `${attendanceRate}%`, valueClass: 'text-lg font-bold' },
          { isDivider: true },
          { label: 'Status', value: 'Overall', valueClass: 'text-green-600 dark:text-green-400' }
        ]}
      />
      <DetailStatusCard 
        icon={BookOpen}
        color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        isLoading={isLoading}
        rows={[
          { label: 'Enrolled Classes', value: classesCount.toString().padStart(2, '0'), valueClass: 'text-lg font-bold' },
          { isDivider: true },
          { label: 'Status', value: 'Active', valueClass: 'text-blue-600 dark:text-blue-400' }
        ]}
      />
      <DetailStatusCard 
        icon={DollarSign}
        color="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
        isLoading={isLoading}
        rows={[
          { label: 'Total Due Fees', value: `Rs ${dueAmount.toLocaleString()}`, valueClass: 'text-lg font-bold text-red-600 dark:text-red-400' },
          { isDivider: true },
          { label: 'Pending Count', value: pendingCount, valueClass: 'text-amber-600 dark:text-amber-400' },
          { label: 'Paid This Month', value: `Rs ${paidThisMonth.toLocaleString()}`, valueClass: 'text-green-600 dark:text-green-400' }
        ]}
      />
      <DetailStatusCard 
        icon={Award}
        color="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
        isLoading={isLoading}
        rows={[
          { label: 'Medals Earned', value: medalsCount.toString(), valueClass: 'text-lg font-bold' },
          { isDivider: true },
          { label: 'Recent', value: 'See details', valueClass: 'text-yellow-600 dark:text-yellow-400' }
        ]}
      />
    </div>
  );
};

export default StudentStatsGrid;