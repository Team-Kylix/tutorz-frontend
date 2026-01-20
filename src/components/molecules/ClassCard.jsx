import React from 'react';
import { Clock, Users, BookOpen, Presentation, GraduationCap, PenTool } from 'lucide-react';

const ClassCard = ({ className, subject, grade, time, students, status, fee, classType }) => {
  
  const getTypeConfig = (type) => {
    switch (type) {
      case 'Seminar':
        return { 
          icon: <Presentation size={18} />, 
          // Added dark mode variants for specific colors
          color: 'text-purple-600 dark:text-purple-400', 
          bg: 'bg-purple-50 dark:bg-purple-900/20', 
          border: 'border-purple-100 dark:border-purple-800',
          label: 'Seminar'
        };
      case 'Workshop':
        return { 
          icon: <PenTool size={18} />, 
          color: 'text-orange-600 dark:text-orange-400', 
          bg: 'bg-orange-50 dark:bg-orange-900/20', 
          border: 'border-orange-100 dark:border-orange-800',
          label: 'Workshop'
        };
      case 'Course':
        return { 
          icon: <GraduationCap size={18} />, 
          color: 'text-emerald-600 dark:text-emerald-400', 
          bg: 'bg-emerald-50 dark:bg-emerald-900/20', 
          border: 'border-emerald-100 dark:border-emerald-800',
          label: 'Course'
        };
      case 'Class':
      default:
        return { 
          icon: <BookOpen size={18} />, 
          color: 'text-blue-600 dark:text-blue-400', 
          bg: 'bg-blue-50 dark:bg-blue-900/20', 
          border: 'border-blue-100 dark:border-blue-800',
          label: 'Class'
        };
    }
  };

  const typeStyle = getTypeConfig(classType);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 group relative overflow-hidden flex flex-col h-full">
      {/* Status Stripe */}
      <div className={`absolute top-0 left-0 w-1 h-full ${status === 'active' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`} />

      <div className="p-5 flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-col items-start w-full">
            
            {/* Badges Row */}
            <div className="flex gap-2 mb-2">
                {/* Grade Badge */}
                <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] font-bold uppercase tracking-wide rounded-md">
                  {grade}
                </span>
                {/* Type Badge (Text) */}
                <span className={`inline-block px-2 py-1 ${typeStyle.bg} ${typeStyle.color} text-[10px] font-bold uppercase tracking-wide rounded-md`}>
                  {typeStyle.label}
                </span>
            </div>

            <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight pr-8">
                {className || subject}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">{subject}</p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 mt-2 flex-grow">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Clock size={16} className="mr-2 text-gray-400 dark:text-gray-500" />
            <span>{time}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Users size={16} className="mr-2 text-gray-400 dark:text-gray-500" />
            <span>{students} Students Enrolled</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700 flex justify-between items-end">
            {/* Price (Left Side) */}
            <div className="text-sm font-medium text-gray-900 dark:text-white pb-1">
                LKR {fee} <span className="text-gray-400 dark:text-gray-500 font-normal">/ month</span>
            </div>
            
            {/* Right Side: Icon + Status Stacked */}
            <div className="flex flex-col items-end gap-2">
                {/* MOVED ICON HERE */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${typeStyle.bg} ${typeStyle.color} border ${typeStyle.border}`}>
                   {typeStyle.icon}
                </div>

                {/* Status Badge */}
                <span className={`w-20 text-center inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    status === 'active' 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                    {status === 'active' ? 'Active' : 'Inactive'}
                </span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ClassCard;