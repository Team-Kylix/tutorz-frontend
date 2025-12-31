import React, { useState } from 'react';
import { Search } from 'lucide-react';
import ClassCard from '../../../components/molecules/ClassCard';
import StudentStatsGrid from '../../../components/organisms/StudentStatsGrid';
import StudentQuickActions from '../../../components/organisms/StudentQuickActions';
import StudentUpcomingClasses from '../../../components/organisms/StudentUpcomingClasses';
import { ENROLLED_CLASSES } from '../../../utils/studentMockData'; 
import ClassSearchModal from '../../../components/organisms/ClassSearchModal';

const StudentDashboard = ({ user, setActivePage }) => {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const userGrade = user?.grade;
  
  //Combine names safely
  const welcomeName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Student';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Dashboard</h1>
          {/*Updated Welcome Message */}
          <p className="text-gray-500 dark:text-gray-400">Welcome back, {welcomeName}!</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSearchModalOpen(true)}  
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors shadow-sm"
          >
            <Search size={18} />
            <span>Find New Class</span>
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <StudentStatsGrid />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Schedule (Takes up 2 cols on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. Schedule */}
          <div className="h-80"> 
            <StudentUpcomingClasses onNavigate={() => setActivePage('classes')} />
          </div>

          {/* 2. Enrolled Classes Preview */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">My Classes</h3>
              <button 
                onClick={() => setActivePage('classes')} 
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                See All
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ENROLLED_CLASSES.slice(0, 2).map((cls) => (
                <div key={cls.id} className="h-full">
                  <ClassCard 
                    subject={cls.subject}
                    grade={cls.grade}
                    className={cls.tutorName} 
                    time={cls.time}
                    students={24} 
                    status={cls.status}
                    fee={cls.fee}
                    classType={cls.classType}
                  />
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Actions (Takes up 1 col) */}
        <div>
           <StudentQuickActions />
           
           {/* Notification / Info Widget */}
           <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-xl p-5 transition-colors">
              <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2">Did you know?</h4>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                You have 85% attendance this month! Keep it up to earn the "Consistent Learner" medal.
              </p>
           </div>
        </div>

      </div>
      <ClassSearchModal 
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        userGrade={userGrade}
      />
    </div>
  );
};

export default StudentDashboard;