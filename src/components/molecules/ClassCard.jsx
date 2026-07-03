import React from 'react';
import { Clock, Users, BookOpen, Presentation, GraduationCap, PenTool, Building2, MapPin } from 'lucide-react';
import { BASE_URL } from '../../services/api/apiClient';

const ClassCard = ({ 
  className, subject, grade, time, students, status, 
  fee, classType, instituteName, hallName, tutorImage 
}) => {

  const getTypeConfig = (type) => {
    switch (type) {
      case 'Seminar':
        return {
          icon: <Presentation size={14} />,
          color: 'text-purple-600 dark:text-purple-400',
          bg: 'bg-purple-50 dark:bg-purple-900/20',
          border: 'border-purple-100 dark:border-purple-800',
          label: 'Seminar'
        };
      case 'Workshop':
        return {
          icon: <PenTool size={14} />,
          color: 'text-orange-600 dark:text-orange-400',
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          border: 'border-orange-100 dark:border-orange-800',
          label: 'Workshop'
        };
      case 'Course':
        return {
          icon: <GraduationCap size={14} />,
          color: 'text-emerald-600 dark:text-emerald-400',
          bg: 'bg-emerald-50 dark:bg-emerald-900/20',
          border: 'border-emerald-100 dark:border-emerald-800',
          label: 'Course'
        };
      case 'Class':
      default:
        return {
          icon: <BookOpen size={14} />,
          color: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-100 dark:border-blue-800',
          label: 'Class'
        };
    }
  };

  const typeStyle = getTypeConfig(classType);
  const resolvedImageUrl = tutorImage 
    ? (tutorImage.startsWith('http') ? tutorImage : `${BASE_URL}${tutorImage}`)
    : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 group relative overflow-hidden flex flex-col h-full min-h-[180px]">
      {/* Status Stripe */}
      <div className={`absolute top-0 left-0 w-1 h-full ${status === 'active' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`} />

      <div className="p-4 flex gap-4 h-full">
        {/* Left: Tutor Image */}
        <div className="flex-shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 shadow-inner flex items-center justify-center">
                {resolvedImageUrl ? (
                    <img src={resolvedImageUrl} alt={className} className="w-full h-full object-cover" />
                ) : (
                    <div className="text-xl font-bold text-gray-400 dark:text-gray-500">
                        {className?.charAt(0) || 'T'}
                    </div>
                )}
            </div>
            {/* Status Indicator (Mobile) */}
            <div className={`mt-2 text-[10px] text-center font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${status === 'active' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700'}`}>
                {status}
            </div>
        </div>

        {/* Right: Content */}
        <div className="flex-1 min-w-0 flex flex-col">
            {/* Badges Row */}
            <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex gap-1.5 overflow-hidden">
                    <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-[9px] font-black uppercase tracking-widest rounded">
                        {grade}
                    </span>
                    <span className={`px-1.5 py-0.5 ${typeStyle.bg} ${typeStyle.color} text-[9px] font-black uppercase tracking-widest rounded flex items-center gap-1`}>
                        {typeStyle.icon}
                        {typeStyle.label}
                    </span>
                </div>
                {/* Enrollment Status (if any) could go here */}
            </div>

            {/* Title & Subject */}
            <div className="mb-2">
                <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                    {className}
                </h3>
                <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wide">
                    {subject}
                </p>
            </div>

            {/* Info Grid */}
            <div className="space-y-1.5 mb-3 flex-1">
                <div className="flex items-center text-[11px] text-gray-600 dark:text-gray-400">
                    <Clock size={13} className="mr-1.5 text-gray-400" />
                    <span className="font-medium whitespace-nowrap overflow-hidden text-ellipsis">{time}</span>
                </div>
                {(instituteName || hallName) && (
                    <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400">
                        {instituteName && (
                            <div className="flex items-center gap-1 min-w-0">
                                <Building2 size={12} className="flex-shrink-0" />
                                <span className="truncate">{instituteName}</span>
                            </div>
                        )}
                        {hallName && (
                            <div className="flex items-center gap-1 min-w-0">
                                <MapPin size={12} className="flex-shrink-0" />
                                <span className="truncate">{hallName}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom Row: Price & Students */}
            <div className="flex items-end justify-between border-t border-gray-50 dark:border-gray-700/50 pt-2 shrink-0">
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-tight">Monthly Fee</span>
                    <div className="text-sm font-black text-gray-900 dark:text-white">
                        {fee !== undefined ? (
                            <>Rs. {fee.toLocaleString()}</>
                        ) : '---'}
                    </div>
                </div>

                <div className="flex flex-col items-end">
                    {students !== undefined && (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 px-2 py-0.5 rounded-lg border border-gray-100 dark:border-gray-800">
                            <Users size={12} className="text-blue-500" />
                            <span>{students} enrolled</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ClassCard;