import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Clock, Users, Building2, Calendar, User, Eye, LogOut, BookOpen } from 'lucide-react';
import Button from '../../components/atoms/Button';
import RowActions from '../../components/molecules/RowActions';
import Input from '../../components/atoms/Input';
import ConfirmationModal from '../../components/molecules/ConfirmationModal';
import ClassViewModal from '../../components/organisms/ClassViewModal';
import useApi from '../../hooks/useApi';
import * as studentService from '../../services/api/studentService';
import { formatTime, cleanClassName } from '../../utils/helpers';
import { BASE_URL } from '../../services/api/apiClient';


const StudentClassesPage = () => {
    // State
    const [classes, setClasses] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [selectedClass, setSelectedClass] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    // API Hooks
    const { request: fetchClasses, loading: isLoading } = useApi();

    // Load Classes
    useEffect(() => {
        loadClasses();
    }, []);

    const loadClasses = async () => {
        const { data } = await fetchClasses(studentService.getStudentClasses);
        if (data && data.success) {
            setClasses(data.data || []);
        } else {
            setClasses([]);
        }
    };

    const handleRowClick = (cls) => {
        setSelectedClass(cls);
    };

    const handleLeaveRequest = () => {
        // close details modal, open confirmation
        setShowConfirm(true);
    };

    const handleConfirmLeave = async () => {
        if (!selectedClass) return;
        setIsLeaving(true);
        try {
            await studentService.leaveClass(selectedClass.classId);
            // Optimistically remove from local UI
            setClasses(prev => prev.filter(c => c.classId !== selectedClass.classId));
            setShowConfirm(false);
            setSelectedClass(null);
        } catch (err) {
            console.error('Failed to leave class', err);
        } finally {
            setIsLeaving(false);
        }
    };

    const handleCancelLeave = () => {
        setShowConfirm(false);
    };

    const filteredClasses = classes.filter(c =>
        (c.className || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.tutorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.instituteName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Joined Classes</h1>
                    <p className="text-gray-500 dark:text-gray-400">View and monitor all the classes you are enrolled in</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadClasses}
                        disabled={isLoading}
                        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Main Content Container */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm flex flex-col">
                
                {/* Top Bar with Search */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <Input
                            type="text"
                            placeholder="Search by Class Name, Subject, or Tutor..."
                            className="pl-10 shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table View */}
                <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
                    <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300 relative">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20 backdrop-blur-sm">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Class Name</th>
                                <th className="px-6 py-4 font-semibold">Subject</th>
                                <th className="px-6 py-4 font-semibold">Time</th>
                                <th className="px-6 py-4 font-semibold">Date / Day</th>
                                <th className="px-6 py-4 font-semibold">Location</th>
                                <th className="px-6 py-4 font-semibold">Fees (Rs)</th>
                                <th className="px-1 py-4 font-semibold sticky right-0 z-30 bg-gray-50 dark:bg-gray-700/50 backdrop-blur-sm"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                            {filteredClasses.length > 0 ? (
                                filteredClasses.map((cls, index) => (
                                    <tr
                                        key={cls.classId || index}
                                        onClick={() => handleRowClick(cls)}
                                        className={`cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors group ${
                                            cls.status !== 'active' ? 'opacity-60 bg-gray-50/50 dark:bg-gray-800/50' : ''
                                        }`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                <span>{cleanClassName(cls.className)}</span>
                                                {cls.status !== 'active' && (
                                                    <span className="px-2 py-0.5 text-[10px] tracking-wider font-bold bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-md">
                                                        INACTIVE
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center overflow-hidden shrink-0 border border-blue-200/50 dark:border-blue-800/50">
                                                    {(() => {
                                                        const img = cls.tutorProfileImageUrlSmall || cls.tutorImageUrl || cls.tutorImage;
                                                        if (img) {
                                                            return <img src={img.startsWith('http') ? img : `${BASE_URL}${img}`} alt="" className="w-full h-full object-cover" />;
                                                        }
                                                        return <User size={10} />;
                                                    })()}
                                                </div>
                                                <span className="font-medium">{cls.tutorName || '-'}</span>
                                                <span className="text-gray-300 dark:text-gray-600 px-0.5">•</span>
                                                <div className="flex items-center gap-1">
                                                    <Users size={12} className="text-blue-500" />
                                                    <span>{cls.studentCount || 0} enrolled</span>
                                                </div>
                                                <span className="text-blue-600 dark:text-blue-400 ml-1 opacity-75">• {cls.classType || 'Class'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-md font-medium">
                                                {cls.subject || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                                <Clock size={14} />
                                                <span>{formatTime(cls.startTime)} - {formatTime(cls.endTime)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                                <Calendar size={14} />
                                                <span className="capitalize">{cls.dayOfWeek || (cls.date ? new Date(cls.date).toLocaleDateString() : '-')}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5">
                                                <Building2 size={14} className="text-gray-400" />
                                                <span className="font-medium">{cls.instituteName || 'Online/Private'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm font-semibold text-green-500 mr-1">Rs</span>
                                                <span>{cls.fee?.toLocaleString() || '0'}</span>
                                            </div>
                                        </td>
                                        <td className="px-1 py-4 sticky right-0 z-10 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700/20 transition-colors" onClick={(e) => e.stopPropagation()}>
                                            <RowActions actions={[
                                                { label: 'View Details', icon: Eye, onClick: () => handleRowClick(cls) },
                                                { label: 'Leave Class', icon: LogOut, onClick: () => { setSelectedClass(cls); handleLeaveRequest(); }, danger: true },
                                            ]} />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        {isLoading ? (
                                            <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                                <RefreshCw size={24} className="animate-spin text-blue-500 mb-3" />
                                                <p>Loading classes...</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                                <BookOpen size={32} className="text-gray-300 dark:text-gray-600 mb-3" />
                                                <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">No Classes Found</p>
                                                <p className="max-w-md">There are no classes matching your current search criteria, or you haven't joined any classes yet.</p>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Class Details Modal */}
            <ClassViewModal
                isOpen={!!selectedClass && !showConfirm}
                onClose={() => setSelectedClass(null)}
                classData={selectedClass}
                role="student"
                enrollmentStatus="Approved"
                onLeave={handleLeaveRequest}
                isLeaving={isLeaving}
            />

            {/* Leave Confirmation Modal */}
            <ConfirmationModal
                isOpen={showConfirm}
                title="Leave this class?"
                message={`Are you sure you want to leave "${selectedClass?.className}"? You can re-join the class later if the tutor approves your request again.`}
                confirmLabel="Yes, Leave"
                cancelLabel="Cancel"
                variant="danger"
                onConfirm={handleConfirmLeave}
                onCancel={handleCancelLeave}
                onClose={handleCancelLeave}
            />
        </div>
    );
};

export default StudentClassesPage;
