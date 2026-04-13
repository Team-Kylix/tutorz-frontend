import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setDashboardData } from '../../../store/dashboardSlice';
import {
    Users, GraduationCap, Calendar,
    Plus, QrCode
} from 'lucide-react';

// --- Existing Components ---
import Button from '../../../components/atoms/Button';
import StatCard from '../../../components/molecules/StatCard';
import RevenueStatusCard from '../../../components/molecules/RevenueStatusCard';
import InstituteSearchAssignModal from '../../../components/organisms/InstituteSearchAssignModal';
import MarkAttendanceModal from '../../../components/organisms/MarkAttendanceModal';
import UnifiedSchedule from '../../../components/organisms/UnifiedSchedule';

// --- Services ---
import { getAssignedStudents, getAssignedTutors, getInstituteClassesToday, getRevenueSummary } from '../../../services/api/instituteService';

// --- Constants ---
const RsIcon = ({ size, className }) => (
    <span className={`font-bold text-[1.1em] ${className}`} style={{ fontSize: size ? `${size}px` : 'inherit' }}>
        Rs
    </span>
);

const InstituteDashboard = ({ user, setActivePage }) => {
    // --- Modal States ---
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);

    // --- Redux Fast Cache ---
    const dispatch = useDispatch();
    const { stats: { studentCount, tutorCount }, todayClasses, revenueSummary, isFetched } = useSelector(state => state.dashboard);

    const [isClassesLoading, setIsClassesLoading] = useState(!isFetched);
    const [isRevenueLoading, setIsRevenueLoading] = useState(!isFetched);

    const fetchDashboardData = useCallback(async () => {
        try {
            const [studentsRes, tutorsRes, classesRes, revenueRes] = await Promise.all([
                getAssignedStudents(),
                getAssignedTutors(),
                getInstituteClassesToday(),
                getRevenueSummary()
            ]);

            const studentTotal = studentsRes.data?.totalCount ?? studentsRes.data?.items?.length ?? studentsRes.data?.length ?? 0;
            const tutorTotal = tutorsRes.data?.totalCount ?? tutorsRes.data?.items?.length ?? tutorsRes.data?.length ?? 0;

            let extractedClasses = [];
            if (Array.isArray(classesRes)) extractedClasses = classesRes;
            else if (classesRes?.items && Array.isArray(classesRes.items)) extractedClasses = classesRes.items;
            else if (classesRes?.data && Array.isArray(classesRes.data)) extractedClasses = classesRes.data;

            dispatch(setDashboardData({
                studentCount: studentTotal.toString(),
                tutorCount: tutorTotal.toString(),
                todayClasses: extractedClasses,
                revenueSummary: revenueRes?.success ? revenueRes.data : null
            }));
        } catch (err) {
            console.error("Failed to fetch dashboard data:", err);
            dispatch(setDashboardData({
                 studentCount: 'Err',
                 tutorCount: 'Err',
                 todayClasses: [],
                 revenueSummary: null
            }));
        } finally {
            setIsClassesLoading(false);
            setIsRevenueLoading(false);
        }
    }, [dispatch]);

// Fetch real stats only if not already loaded from DB this session
    useEffect(() => {
        if (!isFetched) {
            fetchDashboardData();
        } else {
            setIsClassesLoading(false);
            setIsRevenueLoading(false);
        }
    }, [isFetched, fetchDashboardData]);

    const openAddModal = () => {
        setIsAddModalOpen(true);
    };

    return (
        <div className="p-2 md:p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Institute Overview</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back, {user?.firstName || 'Admin'}</p>
                </div>
                <div className="flex gap-3 justify-center sm:justify-end">
                    <Button
                        variant="primary"
                        onClick={() => setIsAttendanceModalOpen(true)}
                        className="flex-1 sm:flex-none sm:min-w-[170px]"
                    >
                        <QrCode size={18} className="mr-2" /> Mark Attendance
                    </Button>
                    <Button
                        variant="primary"
                        onClick={openAddModal}
                        className="flex-1 sm:flex-none sm:min-w-[170px]"
                    >
                        <Plus size={18} className="mr-2" /> Add New
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Tutors" value={tutorCount} change="Latest active" icon={Users} color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
                <StatCard label="Active Students" value={studentCount} change="Currently enrolled" icon={GraduationCap} color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" />
                <StatCard
                    label="Classes Today"
                    value={isClassesLoading ? '...' : todayClasses.length.toString()}
                    change={todayClasses.length > 0 ? `${todayClasses.length} Scheduled` : 'None Scheduled'}
                    icon={Calendar}
                    color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                />
                <RevenueStatusCard summary={revenueSummary} isLoading={isRevenueLoading} />
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-[26rem]">
                    <UnifiedSchedule
                        title="Today's Classes"
                        onNavigate={() => setActivePage('classes')}
                        classes={todayClasses}
                        isLoading={isClassesLoading}
                    />
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-fit">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                        <h3 className="font-bold text-gray-900 dark:text-white">New Registrations</h3>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No new registrations today.</div>
                </div>
            </div>

            {/* Add User Flow Modal */}
            <InstituteSearchAssignModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                type={null}
                onAssigned={() => { fetchDashboardData(); }}
                user={user}
            />

            {/* Mark Attendance Modal */}
            <MarkAttendanceModal
                isOpen={isAttendanceModalOpen}
                onClose={() => setIsAttendanceModalOpen(false)}
            />
        </div>
    );
};

export default InstituteDashboard;