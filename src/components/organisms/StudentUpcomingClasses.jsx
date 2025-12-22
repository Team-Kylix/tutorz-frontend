import React, { useState, useEffect } from 'react';
import { Calendar, ArrowRight, Clock, Radio } from 'lucide-react';
// We are mocking the schedule for now until studentService is ready
import { ENROLLED_CLASSES } from '../../utils/studentMockData'; 

const StudentUpcomingClasses = ({ onNavigate }) => {
  // Use mock data for now
  const [displayList, setDisplayList] = useState(ENROLLED_CLASSES);

  // Reusing the status badge logic from your existing code
  const getStatusBadge = (index) => {
    // Mocking status logic: First item is "Next", others are upcoming
    if (index === 0) return <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-semibold"><Clock size={12} /> Next</div>;
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
      <div className="p-5 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-bold text-gray-900">My Schedule</h3>
        <button onClick={onNavigate} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
          View All <ArrowRight size={16} />
        </button>
      </div>
      
      <div className="p-5 flex-1 overflow-y-auto">
        {displayList.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Calendar size={32} className="mx-auto mb-2 text-gray-300" />
            <p>No classes scheduled.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayList.map((cls, index) => (
              <div key={cls.id} className="flex items-center gap-4 p-3 rounded-lg border border-transparent hover:bg-gray-50 hover:border-gray-100 transition-colors cursor-pointer">
                
                {/* Date/Time Box */}
                <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-blue-50 text-blue-700 flex flex-col items-center justify-center">
                  <span className="text-xs font-bold uppercase mb-1">
                    {cls.time.split(' ')[0]} {/* Extract MON */}
                  </span>
                  <span className="text-sm font-bold leading-none">
                    {cls.time.split(' ')[1]} {/* Extract Time */}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-gray-900 truncate">
                      {cls.subject}
                    </h4>
                    {getStatusBadge(index)}
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-500 gap-2">
                     <span className="bg-gray-100 px-1.5 py-0.5 rounded">{cls.grade}</span>
                     <span>•</span>
                     <span className="truncate text-gray-600 font-medium">By {cls.tutorName}</span>
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

export default StudentUpcomingClasses;