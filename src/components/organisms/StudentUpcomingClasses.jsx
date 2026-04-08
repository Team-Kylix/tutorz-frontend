import { Calendar, ArrowRight, Clock, Loader2 } from 'lucide-react';

const StudentUpcomingClasses = ({ onNavigate, classes = [], isLoading = false }) => {
  // Reusing the status badge logic
  const getStatusBadge = (index) => {
    // For now, mark the first one as "Next"
    if (index === 0) return (
      <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full text-[10px] font-bold">
        <Clock size={10} /> NEXT
      </div>
    );
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm h-full flex flex-col transition-colors">
      <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-bold text-gray-900 dark:text-white">My Schedule</h3>
        <button onClick={onNavigate} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1">
          View All <ArrowRight size={16} />
        </button>
      </div>
      
      <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Loader2 size={24} className="animate-spin text-blue-500 mb-2" />
            <p className="text-xs">Loading schedule...</p>
          </div>
        ) : classes.length === 0 ? (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            <Calendar size={32} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <p>No classes scheduled.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {classes.slice(0, 5).map((cls, index) => (
              <div key={cls.classId || index} className="flex items-center gap-4 p-3 rounded-lg border border-transparent hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-100 dark:hover:border-gray-600 transition-colors cursor-pointer">
                
                {/* Date/Time Box */}
                <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold uppercase mb-0.5 min-w-0 truncate px-1">
                    {cls.dayOfWeek?.substring(0, 3) || (cls.date ? new Date(cls.date).toLocaleDateString('en-US', { weekday: 'short' }) : '---')}
                  </span>
                  <span className="text-xs font-bold leading-none">
                    {cls.startTime?.split(' ')[0]}
                  </span>
                  <span className="text-[9px] mt-0.5 opacity-75 uppercase">
                    {cls.startTime?.split(' ')[1]}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-gray-900 dark:text-white truncate text-sm">
                      {cls.subject}
                    </h4>
                    {getStatusBadge(index)}
                  </div>
                  
                  <div className="flex items-center text-[10px] text-gray-500 dark:text-gray-400 gap-2">
                      <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">{cls.grade}</span>
                      <span>•</span>
                      <span className="truncate text-gray-600 dark:text-gray-400 font-medium">{cls.tutorName}</span>
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