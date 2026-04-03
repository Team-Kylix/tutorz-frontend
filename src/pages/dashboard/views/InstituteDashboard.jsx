import React, { useState, useEffect } from 'react';
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
import UpcomingClasses from '../../../components/organisms/UpcomingClasses';

// --- Services ---
import { getInstituteProfile, getAssignedStudents, getAssignedTutors, getInstituteClassesToday, getRevenueSummary } from '../../../services/api/instituteService';

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

    // --- Logic States ---
    const [instituteProfile, setInstituteProfile] = useState(null);

    // NEW: Real Stats States
    const [studentCount, setStudentCount] = useState('...');
    const [tutorCount, setTutorCount] = useState('...');
    const [todayClasses, setTodayClasses] = useState([]);
    const [isClassesLoading, setIsClassesLoading] = useState(true);
    const [revenueSummary, setRevenueSummary] = useState(null);
    const [isRevenueLoading, setIsRevenueLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const [studentsRes, tutorsRes, classesRes] = await Promise.all([
                getAssignedStudents(),
                getAssignedTutors(),
                getInstituteClassesToday()
            ]);

            const studentTotal = studentsRes.data?.totalCount ?? studentsRes.data?.items?.length ?? studentsRes.data?.length ?? 0;
            const tutorTotal = tutorsRes.data?.totalCount ?? tutorsRes.data?.items?.length ?? tutorsRes.data?.length ?? 0;

            setStudentCount(studentTotal.toString());
            setTutorCount(tutorTotal.toString());
            let extractedClasses = [];
            if (Array.isArray(classesRes)) extractedClasses = classesRes;
            else if (classesRes?.items && Array.isArray(classesRes.items)) extractedClasses = classesRes.items;
            else if (classesRes?.data && Array.isArray(classesRes.data)) extractedClasses = classesRes.data;

            setTodayClasses(extractedClasses);
        } catch (err) {
            console.error("Failed to fetch real counts:", err);
            setStudentCount('Err');
            setTutorCount('Err');
        } finally {
            setIsClassesLoading(false);
        }
    };

    // Fetch Institute Profile on mount to get CityId
    useEffect(() => {
        const fetchProfile = async () => {
            if (user?.userId) {
                try {
                    const response = await getInstituteProfile(user.userId);
                    if (response.success) {
                        setInstituteProfile(response.data);
                    }
                } catch (error) {
                    console.error("Failed to fetch institute profile", error);
                }
            }
        };
        fetchProfile();
    }, [user]);

    // Fetch real stats
    useEffect(() => {
        const fetchRevenue = async () => {
            try {
                const res = await getRevenueSummary();
                if (res?.success) setRevenueSummary(res.data);
            } catch (err) {
                console.error('Failed to fetch revenue summary:', err);
            } finally {
                setIsRevenueLoading(false);
            }
        };

        fetchStats();
        fetchRevenue();
    }, []);

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
                <div className="lg:col-span-2">
                    <UpcomingClasses
                        onNavigate={() => setActivePage('classes')}
                        fetchClassesApi={getInstituteClassesToday}
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
                onAssigned={() => { fetchStats(); }}
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