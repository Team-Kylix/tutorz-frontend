import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setDashboardData } from '../../../store/dashboardSlice';
import {
    Users, GraduationCap, Calendar,
    Plus, Zap, RefreshCw
} from 'lucide-react';

// --- Existing Components ---
import Button from '../../../components/atoms/Button';
import StatCard from '../../../components/molecules/StatCard';
import DetailStatusCard from '../../../components/molecules/DetailStatusCard';
import RevenueStatusCard from '../../../components/molecules/RevenueStatusCard';
import InstituteSearchAssignModal from '../../../components/organisms/InstituteSearchAssignModal';
import MarkAttendanceModal from '../../../components/organisms/MarkAttendanceModal';
import UnifiedSchedule from '../../../components/organisms/UnifiedSchedule';

// --- Services ---
import { getIncomingRequests, getAssignedStudents, getAssignedTutors, getInstituteClassesToday, getRevenueSummary } from '../../../services/api/instituteService';
import { getInstituteWithdrawalOverview } from '../../../services/api/withdrawalService';
import { fetchNotifications } from '../../../services/api/notificationService';

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
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchDashboardData = useCallback(async (bypassCache = false) => {
        if (bypassCache) setIsRefreshing(true);
        try {
            const [studentsRes, tutorsRes, classesRes, revenueRes] = await Promise.all([
                getAssignedStudents('', 1, 10, bypassCache),
                getAssignedTutors('', 1, 10, bypassCache),
                getInstituteClassesToday(),
                getRevenueSummary(bypassCache)
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

    const [richData, setRichData] = useState({ requests: [], withdrawals: [], notifications: [] });
    const [isRichLoading, setIsRichLoading] = useState(true);

    const fetchRich = useCallback(async (bypassCache = false) => {
        setIsRichLoading(true);
        if (bypassCache) setIsRefreshing(true);
        try {
            const [reqRes, wdRes, notifRes] = await Promise.all([
                getIncomingRequests(bypassCache),
                getInstituteWithdrawalOverview(null, bypassCache),
                fetchNotifications(bypassCache)
            ]);
            setRichData({
                requests: reqRes?.data || reqRes || [],
                withdrawals: wdRes?.data || wdRes || [],
                notifications: notifRes?.data || notifRes || []
            });
        } catch (err) {
            console.error("Failed to fetch rich dashboard data:", err);
        } finally {
            setIsRichLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchRich();
    }, [fetchRich]);

    const handleRefresh = async () => {
        await Promise.all([
            fetchDashboardData(true),
            fetchRich(true)
        ]);
    };

    const openAddModal = () => {
        setIsAddModalOpen(true);
    };

    const pendingTutors = richData.requests.filter(r => r.role === 'Tutor' || r.requestType === 'Tutor').length;
    const pendingStudents = richData.requests.filter(r => r.role === 'Student' || r.requestType === 'Student').length;
    
    // Only sum the available balance from pending withdrawal rows, not historical rows
    const totalAvailableBalance = richData.withdrawals
        .filter(r => r.isPendingRow)
        .reduce((sum, r) => sum + (Number(r.availableBalance) || 0), 0);
        
    const newRegistrations = richData.notifications.filter(n => n.type === 'StudentRegistration');

    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    
    let ongoing = 0, completed = 0, upcoming = 0;
    todayClasses.forEach(c => {
        const start = Number(c.startTime?.split(':')[0] || 0) + Number(c.startTime?.split(':')[1] || 0)/60;
        const end = Number(c.endTime?.split(':')[0] || 0) + Number(c.endTime?.split(':')[1] || 0)/60;
        if (currentHour < start) upcoming++;
        else if (currentHour >= start && currentHour <= end) ongoing++;
        else completed++;
    });

    return (
        <div className="p-2 md:p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Institute Overview</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back, {user?.firstName || 'Admin'}</p>
                </div>
                <div className="flex gap-3 justify-center sm:justify-end">
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors hidden sm:block"
                        title="Refresh"
                    >
                        <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                    <Button
                        variant="primary"
                        onClick={() => setIsAttendanceModalOpen(true)}
                        className="flex-1 sm:flex-none sm:min-w-[170px] group relative"
                        title="Attendance · Fees · Enroll"
                    >
                        <Zap size={18} className="mr-2" /> Student Hub
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
                <DetailStatusCard 
                    icon={Users} 
                    color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" 
                    isLoading={isRichLoading}
                    rows={[
                        { label: 'Total Tutors', value: tutorCount, valueClass: 'text-lg font-bold' },
                        { isDivider: true },
                        { label: 'Pending Requests', value: pendingTutors },
                        { label: 'Active Status', value: 'Active', valueClass: 'text-green-600 dark:text-green-400' }
                    ]} 
                />
                <DetailStatusCard 
                    icon={GraduationCap} 
                    color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" 
                    isLoading={isRichLoading}
                    rows={[
                        { label: 'Enrolled Students', value: studentCount, valueClass: 'text-lg font-bold' },
                        { isDivider: true },
                        { label: 'Pending Requests', value: pendingStudents },
                        { label: 'System Status', value: 'Active', valueClass: 'text-green-600 dark:text-green-400' }
                    ]} 
                />
                <DetailStatusCard
                    icon={Calendar}
                    color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                    isLoading={isClassesLoading}
                    rows={[
                        { label: 'Scheduled Today', value: todayClasses.length, valueClass: 'text-lg font-bold' },
                        { isDivider: true },
                        { label: 'Upcoming', value: upcoming, valueClass: 'text-blue-600 dark:text-blue-400' },
                        { label: 'Ongoing', value: ongoing, valueClass: 'text-amber-600 dark:text-amber-400' },
                        { label: 'Completed', value: completed, valueClass: 'text-green-600 dark:text-green-400' }
                    ]}
                />
                <RevenueStatusCard summary={revenueSummary} isLoading={isRevenueLoading || isRichLoading} availableBalance={totalAvailableBalance} />
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
                    {isRichLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <RefreshCw className="animate-spin text-indigo-400" size={20} />
                        </div>
                    ) : newRegistrations.length > 0 ? (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[350px] overflow-y-auto">
                            {newRegistrations.map(notif => (
                                <div key={notif.notificationId || notif.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
                                            <GraduationCap size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{notif.title}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{notif.message}</p>
                                            <p className="text-[10px] text-gray-400 mt-2">
                                                {new Date(notif.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No new registrations recently.</div>
                    )}
                </div>
            </div>

            {/* Add User Flow Modal */}
            <InstituteSearchAssignModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                type={null}
                onAssigned={() => { handleRefresh(); }}
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