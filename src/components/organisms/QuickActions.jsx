import { Clock, Zap, FileText, MessageSquareWarning } from 'lucide-react';
import QuickActionCard from '../molecules/QuickActionCard';

const QuickActions = ({ onActionClick }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm h-full transition-colors">
    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
    <div className="grid grid-cols-2 gap-3">
      <QuickActionCard
        icon={Clock}
        label="Today Timetable"
        colorClass="text-blue-500 dark:text-blue-400"
        onClick={() => onActionClick('timetable')}
      />
      <QuickActionCard
        icon={Zap}
        label="Student Hub"
        colorClass="text-green-500 dark:text-green-400"
        onClick={() => onActionClick('attendance')}
      />
      <QuickActionCard
        icon={FileText}
        label="Reports"
        colorClass="text-indigo-500 dark:text-indigo-400"
        onClick={() => onActionClick('reports')}
      />
      <QuickActionCard
        icon={MessageSquareWarning}
        label="Complaints"
        colorClass="text-red-500 dark:text-red-400"
        onClick={() => onActionClick('complains')}
      />
    </div>
  </div>
);

export default QuickActions;