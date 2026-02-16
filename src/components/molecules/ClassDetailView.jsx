import React from 'react';
import { ArrowLeft, Clock, DollarSign, Calendar, User, BookOpen } from 'lucide-react';
import Button from '../atoms/Button';
import StatusBadge from '../atoms/StatusBadge';

import { formatCurrency } from '../../utils/helpers';

const ClassDetailView = ({ classData, onBack, onRequestJoin }) => {
  if (!classData) return null;

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header / Back Button */}
      <button
        onClick={onBack}
        className="flex items-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-4 text-sm font-medium transition-colors"
      >
        <ArrowLeft size={16} className="mr-1" /> Back to Search
      </button>

      {/* Main Content */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-100 dark:border-gray-800">

        {/* Title Section */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold rounded uppercase">
                {classData.classType}
              </span>
              <StatusBadge status="Starting Soon" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{classData.subject}</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium">{classData.grade}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(classData.fee)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">per month</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Tutor Info (Left Col) */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xl flex-shrink-0">
                  {(classData.tutorName || "T").charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{classData.tutorName}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mb-2">{classData.tutorId}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {classData.bio || "An experienced tutor dedicated to helping students achieve their academic goals. Focuses on practical understanding and exam preparation."}
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                <BookOpen size={16} className="text-gray-400" /> Class Syllabus / Description
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                This class covers the complete syllabus for {classData.grade} {classData.subject}.
                We provide monthly tests, printed tutorials, and past paper discussions.
              </p>
            </div>
          </div>

          {/* Schedule & Action (Right Col) */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">Schedule</h4>

              <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <Calendar size={18} className="text-blue-500 dark:text-blue-400" />
                <span className="font-medium">{classData.dayOfWeek}s</span>
              </div>

              <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <Clock size={18} className="text-blue-500 dark:text-blue-400" />
                <span>{classData.startTime} - {classData.endTime}</span>
              </div>
            </div>

            <Button
              variant="primary"
              fullWidth
              size="large"
              // Use classId (or check your DTO if it's named 'id')
              onClick={() => onRequestJoin(classData.classId || classData.id)}
            >
              Request to Join
            </Button>
            <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-2">
              Approval required by Tutor
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ClassDetailView;