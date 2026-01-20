import React, { useEffect, useState } from 'react';
import { Calendar, ArrowRight, Clock, Radio, CheckCircle, Presentation, PenTool, GraduationCap, BookOpen } from 'lucide-react';
import useApi from '../../hooks/useApi';
import * as tutorService from '../../services/api/tutorService';
import { getClassStatus, getDayIndex } from '../../utils/scheduleHelpers';

const calculateDuration = (start, end) => {
  if (!start || !end) return '';
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  let diffM = (endH * 60 + endM) - (startH * 60 + startM);
  const hours = Math.floor(diffM / 60);
  const mins = diffM % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
};

const UpcomingClasses = ({ onNavigate }) => {
  const [classes, setClasses] = useState([]);
  const [displayList, setDisplayList] = useState([]);
  const { request: fetchClasses, loading } = useApi();
  
  const getTypeIcon = (type) => {
      switch(type) {
          case 'Seminar': return <Presentation size={14} className="text-purple-500 dark:text-purple-400" />;
          case 'Workshop': return <PenTool size={14} className="text-orange-500 dark:text-orange-400" />;
          case 'Course': return <GraduationCap size={14} className="text-emerald-500 dark:text-emerald-400" />;
          default: return <BookOpen size={14} className="text-blue-500 dark:text-blue-400" />;
      }
  };

  useEffect(() => {
    const loadData = async () => {
      const { data } = await fetchClasses(tutorService.getClasses);
      if (data) setClasses(data);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (classes.length === 0) return;

    const updateSchedule = () => {
      const todayIndex = new Date().getDay();
      const processed = classes.map(cls => {
        const status = getClassStatus(cls);
        const dayIndex = getDayIndex(cls.dayOfWeek);
        
        let priority = 3; 
        if (status === 'in-progress') priority = 0;
        else if (status === 'next') priority = 1;
        else if (status === 'completed') priority = 2;
        
        if (dayIndex !== todayIndex) priority = 3;

        return { ...cls, status, priority };
      });

      const sorted = processed.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.startTime.localeCompare(b.startTime);
      });

      setDisplayList(sorted.slice(0, 4));
    };

    updateSchedule(); 
    const interval = setInterval(updateSchedule, 60000); 
    return () => clearInterval(interval); 
  }, [classes]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'in-progress':
        return <div className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-bold animate-pulse"><Radio size={12} /> Live</div>;
      case 'completed':
        return <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-full text-xs font-medium"><CheckCircle size={12} /> Done</div>;
      case 'next':
        return <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full text-xs font-semibold"><Clock size={12} /> Next</div>;
      default: return null;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm h-full flex flex-col transition-colors">
      <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-bold text-gray-900 dark:text-white">Schedule & Status</h3>
        <button onClick={onNavigate} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1">
          View All <ArrowRight size={16} />
        </button>
      </div>

      <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
           <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">Loading schedule...</p>
        ) : displayList.length === 0 ? (
           <div className="text-center py-6 text-gray-500 dark:text-gray-400">
             <Calendar size={32} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
             <p>No classes scheduled.</p>
           </div>
        ) : (
          <div className="space-y-4">
            {displayList.map((cls) => (
              <div key={cls.classId} className={`flex items-center gap-4 p-3 rounded-lg transition-colors border cursor-pointer 
                ${cls.status === 'in-progress' 
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-transparent hover:border-gray-100 dark:hover:border-gray-600'}`}>
                
                {/* Time Box */}
                <div className={`flex-shrink-0 w-16 h-16 rounded-lg flex flex-col items-center justify-center 
                    ${cls.status === 'in-progress' 
                        ? 'bg-white dark:bg-red-900/40 text-red-600 dark:text-red-400 shadow-sm' 
                        : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'}`}>
                  <span className="text-xs font-bold uppercase mb-1">
                    {cls.dayOfWeek ? cls.dayOfWeek.substring(0, 3) : 'Date'}
                  </span>
                  <span className="text-sm font-bold leading-none">{cls.startTime}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2 truncate pr-2">
                        {getTypeIcon(cls.classType)}
                        <h4 className="font-bold text-gray-900 dark:text-white truncate">
                            {cls.className || cls.subject}
                        </h4>
                    </div>
                    {getStatusBadge(cls.status)}
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-3">
                    <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                        <Clock size={10} /> 
                        {calculateDuration(cls.startTime, cls.endTime)}
                    </span>
                    <span className="truncate">{cls.hallName || 'Main Hall'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingClasses;