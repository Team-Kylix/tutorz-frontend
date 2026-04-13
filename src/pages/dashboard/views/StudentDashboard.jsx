import React, { useState, useEffect } from 'react';
import { Search, CreditCard } from 'lucide-react';
import StudentStatsGrid from '../../../components/organisms/StudentStatsGrid';
import StudentQuickActions from '../../../components/organisms/StudentQuickActions';
import UnifiedSchedule from '../../../components/organisms/UnifiedSchedule';
import ClassSearchModal from '../../../components/organisms/ClassSearchModal';
import PayFeesModal from '../../../components/organisms/PayFeesModal';
import useApi from '../../../hooks/useApi';
import * as studentService from '../../../services/api/studentService';

const StudentDashboard = ({ user, setActivePage }) => {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isPayFeesModalOpen, setIsPayFeesModalOpen] = useState(false);
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState(0);
  const { loading: isLoading } = useApi();
  
  const userGrade = user?.grade;

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [classesRes, attendanceRes] = await Promise.all([
          studentService.getStudentClasses(),
          studentService.getStudentAttendanceHistory()
        ]);
        
        if (classesRes.success) {
          setEnrolledClasses(classesRes.data || []);
        }

        if (attendanceRes.success !== false) {
           const historyData = attendanceRes.data || attendanceRes;
           
           const classesData = historyData.classes || [];
           const datesData = historyData.conductedDates || [];
           
           const totalSlots = classesData.length * datesData.length;
           let totalAttended = 0;
           
           classesData.forEach(cls => {
             if (cls.attendanceRecord) {
               Object.keys(cls.attendanceRecord).forEach(date => {
                 if (cls.attendanceRecord[date]) {
                   totalAttended++;
                 }
               });
             }
           });
           
           const visualRate = totalSlots > 0 ? Math.round((totalAttended / totalSlots) * 100) : 0;
           setAttendanceStats(visualRate);
        }
      } catch (err) {
        console.error("Dashboard error", err);
      }
    };
    loadDashboardData();
  }, []);
  
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

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => setIsSearchModalOpen(true)}  
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors shadow-sm flex-1 md:w-44"
          >
            <Search size={18} />
            <span>Find New Class</span>
          </button>

          <button 
            onClick={() => setIsPayFeesModalOpen(true)}  
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-colors shadow-sm flex-1 md:w-44"
          >
            <CreditCard size={18} />
            <span>Pay Fees</span>
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <StudentStatsGrid classesCount={enrolledClasses.length} attendanceRate={attendanceStats} isLoading={isLoading} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Schedule (Takes up 2 cols on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. Schedule */}
          <div className="h-[26rem]"> 
            <UnifiedSchedule 
              title="My Schedule"
              onNavigate={() => setActivePage('classes')} 
              classes={enrolledClasses} 
              isLoading={isLoading} 
            />
          </div>



        </div>

        {/* Right Column: Actions (Takes up 1 col) */}
        <div>
           <StudentQuickActions />
           
           {/* Notification / Info Widget */}
           <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-xl p-5 transition-colors">
              <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2">Did you know?</h4>
               <p className="text-sm text-blue-600 dark:text-blue-400">
                You have {attendanceStats}% attendance! Keep it up to earn the "Consistent Learner" medal.
              </p>
           </div>
        </div>

      </div>
      <ClassSearchModal 
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        userGrade={userGrade}
      />
      <PayFeesModal 
        isOpen={isPayFeesModalOpen}
        onClose={() => setIsPayFeesModalOpen(false)}
        setActivePage={setActivePage}
      />
    </div>
  );
};

export default StudentDashboard;