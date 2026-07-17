import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, BookOpen, Clock, Users, Building2, Calendar, User, Edit, Zap } from 'lucide-react';
import Button from '../../components/atoms/Button';
import RowActions from '../../components/molecules/RowActions';
import Input from '../../components/atoms/Input';
import ClassFormModal from '../../components/organisms/ClassFormModal';
import ConfirmationModal from '../../components/molecules/ConfirmationModal';
import MarkAttendanceModal from '../../components/organisms/MarkAttendanceModal';
import useApi from '../../hooks/useApi';
import * as instituteService from '../../services/api/instituteService';
import { useDispatch, useSelector } from 'react-redux';
import { setInstituteClasses, appendInstituteClasses, updateInstituteClass, removeInstituteClass } from '../../store/instituteSlice';

const InstituteClassesPage = () => {
    // Redux cache
    const dispatch = useDispatch();
    const { classes, isFetched } = useSelector(state => state.instituteData);

    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [hasMore, setHasMore] = useState(true);
    // Local loading: false immediately if cache exists
    const [isLoading, setIsLoading] = useState(!isFetched);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Modal States
    const [isClassModalOpen, setClassModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isSuccessOpen, setIsSuccessOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [pendingFormData, setPendingFormData] = useState(null);
    const [classFormError, setClassFormError] = useState('');

    // Delete States
    const [classToDelete, setClassToDelete] = useState(null);
    const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    // Status Change States
    const [statusCandidate, setStatusCandidate] = useState(null);
    const [isStatusConfirmOpen, setStatusConfirmOpen] = useState(false);

    // Student Hub Modal
    const [isStudentHubOpen, setIsStudentHubOpen] = useState(false);

    // Profile State for Institute Context
    const [instituteProfile, setInstituteProfile] = useState(null);

    // API Hooks
    const { request: fetchClasses } = useApi();
    const { request: fetchProfile } = useApi();
    const { request: saveClass, loading: isSaving } = useApi();
    const { request: removeClass, loading: isDeleting } = useApi();


    // Load Profile - fetchProfile is stable (from useApi useCallback), safe to omit
    useEffect(() => {
        const loadProfile = async () => {
            const res = await fetchProfile(instituteService.getInstituteProfile);
            if (res.data) {
                setInstituteProfile(res.data.data || res.data);
            }
        };
        loadProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Load Classes
    useEffect(() => {
        if (!isFetched || searchTerm !== '') {
            loadClasses(true);
        } else {
            setIsLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm]);

    const loadClasses = useCallback(async (reset = false) => {
        if (!reset) {
            setIsLoadingMore(true);
        } else {
            setIsLoading(true);
        }
        const currentPage = reset ? 1 : page + 1;
        const { data } = await fetchClasses(instituteService.getInstituteClasses, searchTerm, currentPage, pageSize);

        if (data && data.success) {
            const items = data.data?.items || data.data || [];
            if (reset) {
                dispatch(setInstituteClasses(items));
            } else {
                dispatch(appendInstituteClasses(items));
            }
            setHasMore(items.length === pageSize);
            setPage(currentPage);
        } else if (reset) {
            dispatch(setInstituteClasses([]));
        }
        setIsLoading(false);
        setIsLoadingMore(false);
    }, [page, searchTerm, pageSize, fetchClasses, dispatch]);

    const handleScroll = (e) => {
        const { scrollTop, clientHeight, scrollHeight } = e.target;
        if (scrollHeight - scrollTop <= clientHeight + 50 && hasMore && !isLoadingMore && !isLoading) {
            loadClasses(false);
        }
    };

    // --- HANDLERS ---
    const handleCreateClick = () => {
        setEditingClass(null);
        setClassModalOpen(true);
    };

    const handleEditClick = (cls) => {
        setEditingClass(cls);
        setClassModalOpen(true);
    };

    const preparePayload = (data) => {
        return {
            ...data,
            date: data.date === "" ? null : data.date,
            fee: parseFloat(data.fee),
            dayOfWeek: Array.isArray(data.dayOfWeek) ? data.dayOfWeek.join(',') : data.dayOfWeek
        };
    };

    const handleDeleteClick = (classId) => {
        setClassModalOpen(false);
        setClassToDelete(classId);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!classToDelete) return;
        const result = await removeClass(instituteService.deleteInstituteClass, classToDelete);

        if (result && result.data && result.data.success) {
            dispatch(removeInstituteClass(classToDelete));
            setDeleteConfirmOpen(false);
            setClassToDelete(null);
            setSuccessMessage("Class deleted successfully!");
            setIsSuccessOpen(true);
        } else {
            setDeleteConfirmOpen(false);
            alert(result?.error || 'Failed to delete class. Please try again.');
        }
    };

    const handleStatusChangeRequest = (currentFormData) => {
        setStatusCandidate(currentFormData);
        setStatusConfirmOpen(true);
    };

    const handleConfirmStatusChange = async () => {
        if (!statusCandidate) return;

        const newStatus = !statusCandidate.isActive;
        const result = await saveClass(instituteService.toggleInstituteClassStatus, statusCandidate.classId);

        if (result && result.data && result.data.success) {
            dispatch(updateInstituteClass({ classId: statusCandidate.classId, isActive: newStatus }));
            setStatusConfirmOpen(false);
            setEditingClass(prev => ({ ...prev, isActive: newStatus }));
            setSuccessMessage(`Class ${newStatus ? 'activated' : 'deactivated'} successfully!`);
            setIsSuccessOpen(true);
        }
    };

    const handleClassSubmit = (formData) => {
        setClassFormError('');
        setPendingFormData(formData);
        setIsConfirmOpen(true);
    };

    const handleConfirmSave = async () => {
        const cleanPayload = preparePayload(pendingFormData);

        let result;
        if (editingClass) {
            result = await saveClass(instituteService.updateInstituteClass, editingClass.classId, cleanPayload);
        } else {
            result = await saveClass(instituteService.createInstituteClass, cleanPayload);
        }

        if (result && result.data) {
            setIsConfirmOpen(false);
            setClassModalOpen(false);
            setClassFormError('');
            setPendingFormData(null);
            // Refresh from server to get real IDs and tutor name populated
            loadClasses(true);
            const msg = editingClass ? "Class updated successfully!" : "Class assigned successfully!";
            setSuccessMessage(msg);
            setIsSuccessOpen(true);
        } else {
            // Show backend error (including hall conflict) inline in the form
            const errMsg = result?.error?.message || result?.error || 'Failed to save class. Please try again.';
            setIsConfirmOpen(false);
            setClassFormError(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Institute Classes</h1>
                    <p className="text-gray-500 dark:text-gray-400">View and monitor all classes conducted in your institute</p>
                </div>
                <div className="flex w-full sm:w-auto items-center gap-2">
                    <button
                        onClick={() => { setIsLoading(true); loadClasses(true); }}
                        disabled={isLoading}
                        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors shrink-0"
                        title="Refresh"
                    >
                        <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    <Button
                        variant="outline"
                        onClick={() => setIsStudentHubOpen(true)}
                        title="Attendance · Fees · Enroll"
                        className="flex-1 sm:flex-none justify-center"
                    >
                        <Zap size={18} className="mr-2" /> Student Hub
                    </Button>
                    <Button variant="primary" onClick={handleCreateClick} disabled={!instituteProfile} className="flex-1 sm:flex-none justify-center">
                        <BookOpen size={18} className="mr-2" /> Assign Class
                    </Button>
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
                <div
                    className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar"
                    onScroll={handleScroll}
                >
                    <table className="w-full text-left text-xs md:text-sm text-gray-600 dark:text-gray-300 relative">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20 backdrop-blur-sm">
                            <tr>
                                <th className="px-4 py-3 md:px-6 md:py-4 font-semibold whitespace-nowrap">Class Name</th>
                                <th className="px-4 py-3 md:px-6 md:py-4 font-semibold whitespace-nowrap">Subject</th>
                                <th className="px-4 py-3 md:px-6 md:py-4 font-semibold whitespace-nowrap">Time</th>
                                <th className="px-4 py-3 md:px-6 md:py-4 font-semibold whitespace-nowrap">Date / Day</th>
                                <th className="px-4 py-3 md:px-6 md:py-4 font-semibold whitespace-nowrap">Hall Number</th>
                                <th className="px-4 py-3 md:px-6 md:py-4 font-semibold whitespace-nowrap">Fees (Rs)</th>
                                <th className="px-4 py-3 md:px-6 md:py-4 font-semibold text-center whitespace-nowrap">Commission %</th>
                                <th className="px-4 py-3 md:px-6 md:py-4 font-semibold text-center whitespace-nowrap">Students</th>
                                <th className="px-1 py-3 md:py-4 font-semibold sticky right-0 z-30 bg-gray-50 dark:bg-gray-700/50 backdrop-blur-sm"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                            {classes.length > 0 ? (
                                classes.map((cls, index) => (
                                    <tr
                                        key={cls.classId || index}
                                        className={`hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors group cursor-pointer ${!cls.isActive ? 'opacity-60 bg-gray-50/50 dark:bg-gray-800/50' : ''}`}
                                        onClick={() => handleEditClick(cls)}
                                    >
                                        <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                                            <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                <span>{cls.className || '-'}</span>
                                                {!cls.isActive && (
                                                    <span className="px-2 py-0.5 text-[10px] tracking-wider font-bold bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-md">
                                                        INACTIVE
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px] md:text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                <User size={12} />
                                                <span className="font-medium">{cls.tutorName || '-'}</span>
                                                <span className="text-blue-600 dark:text-blue-400 ml-1 opacity-75">• {cls.classType || 'Class'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                                            <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] md:text-xs rounded-md font-medium w-max">
                                                {cls.subject || '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                                <Clock size={14} />
                                                <span>{cls.startTime} - {cls.endTime}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                                <Calendar size={14} />
                                                <span className="capitalize">{cls.dayOfWeek || (cls.date ? new Date(cls.date).toLocaleDateString() : '-')}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <Building2 size={14} className="text-gray-400" />
                                                <span className="font-medium">{cls.hallName || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 md:px-6 md:py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm font-semibold text-green-500 mr-1">Rs</span>
                                                <span>{cls.fee?.toLocaleString() || '0'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 md:px-6 md:py-4 text-center whitespace-nowrap">
                                            <div className="inline-flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 px-2.5 py-1 rounded-full text-xs font-bold min-w-[3rem]">
                                                {Number(cls.instituteCommissionRate ?? 0).toFixed(0)}%
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 md:px-6 md:py-4 text-center whitespace-nowrap">
                                            <div className="inline-flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-bold min-w-[3rem]">
                                                {cls.studentRegisteredCount || 0}
                                            </div>
                                        </td>
                                        <td className="px-1 py-3 md:py-4 sticky right-0 z-10 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700/20 transition-colors" onClick={(e) => e.stopPropagation()}>
                                            <RowActions actions={[
                                                { label: 'Edit Class', icon: Edit, onClick: () => handleEditClick(cls) },
                                            ]} />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center">
                                        {isLoading ? (
                                            <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                                <RefreshCw size={24} className="animate-spin text-blue-500 mb-3" />
                                                <p>Loading classes...</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                                <BookOpen size={32} className="text-gray-300 dark:text-gray-600 mb-3" />
                                                <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">No Classes Found</p>
                                                <p className="max-w-md">There are no classes matching your current search criteria, or no tutors have scheduled classes in your institute yet.</p>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Infinite Scroll Loading Indicator */}
                    {isLoadingMore && (
                        <div className="flex items-center justify-center p-4 text-blue-500 space-x-2">
                            <RefreshCw size={16} className="animate-spin" />
                            <span className="text-sm">Loading more classes...</span>
                        </div>
                    )}
                    {!hasMore && classes.length > 0 && (
                        <div className="text-center p-4 text-sm text-gray-400 dark:text-gray-500">
                            No more classes to load.
                        </div>
                    )}
                </div>
            </div>

            {/* --- MODALS --- */}
            <ClassFormModal
                isOpen={isClassModalOpen}
                onClose={() => { setClassModalOpen(false); setClassFormError(''); }}
                onSubmit={handleClassSubmit}
                onDelete={handleDeleteClick}
                onStatusChange={handleStatusChangeRequest}
                initialData={editingClass}
                isSubmitting={isSaving}
                isInstituteMode={true}
                instituteProfile={instituteProfile}
                existingClasses={classes}
                backendError={classFormError}
                onClearBackendError={() => setClassFormError('')}
            />

            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmSave}
                title={editingClass ? "Update Class" : "Create Class"}
                message={editingClass
                    ? "Are you sure you want to update this class details?"
                    : "Are you sure you want to assign this new class to the selected tutor?"}
                confirmLabel={editingClass ? "Update" : "Create"}
                cancelLabel="Cancel"
                variant="primary"
            />

            <ConfirmationModal
                isOpen={isDeleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Class?"
                message="Are you sure you want to delete this class? This action cannot be undone."
                confirmLabel={isDeleting ? "Deleting..." : "Delete"}
                cancelLabel="Cancel"
                variant="danger"
            />

            <ConfirmationModal
                isOpen={isStatusConfirmOpen}
                onClose={() => setStatusConfirmOpen(false)}
                onConfirm={handleConfirmStatusChange}
                title={statusCandidate?.isActive ? "Deactivate Class?" : "Activate Class?"}
                message={statusCandidate?.isActive
                    ? "This will hide the class from the schedule. Are you sure?"
                    : "This will make the class visible in the schedule again. Are you sure?"}
                confirmLabel={statusCandidate?.isActive ? "Deactivate" : "Activate"}
                cancelLabel="Cancel"
                variant={statusCandidate?.isActive ? "danger" : "success"}
            />

            <ConfirmationModal
                isOpen={isSuccessOpen}
                onClose={() => setIsSuccessOpen(false)}
                onConfirm={() => setIsSuccessOpen(false)}
                title="Success"
                message={successMessage}
                confirmLabel="OK"
                cancelLabel="Close"
                variant="success"
            />

            {/* Student Hub Modal — Attendance · Fees · Enroll */}
            <MarkAttendanceModal
                isOpen={isStudentHubOpen}
                onClose={() => setIsStudentHubOpen(false)}
            />
        </div>
    );
};

export default InstituteClassesPage;
