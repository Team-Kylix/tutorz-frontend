import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, BookOpen, Clock, Users, Building2, Calendar, User } from 'lucide-react';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import StatCard from '../../components/molecules/StatCard';
import ClassFormModal from '../../components/organisms/ClassFormModal';
import ConfirmationModal from '../../components/molecules/ConfirmationModal';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import * as instituteService from '../../services/api/instituteService';

const InstituteClassesPage = () => {
    // State
    const [classes, setClasses] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [hasMore, setHasMore] = useState(true);

    // Modal States
    const [isClassModalOpen, setClassModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isSuccessOpen, setIsSuccessOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [pendingFormData, setPendingFormData] = useState(null);

    // Delete States
    const [classToDelete, setClassToDelete] = useState(null);
    const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    // Status Change States
    const [statusCandidate, setStatusCandidate] = useState(null);
    const [isStatusConfirmOpen, setStatusConfirmOpen] = useState(false);

    // Profile State for Institute Context
    const [instituteProfile, setInstituteProfile] = useState(null);

    // API Hooks
    const { request: fetchClasses, loading: isLoading } = useApi();
    const { request: fetchProfile } = useApi();
    const { request: saveClass, loading: isSaving } = useApi();
    const { request: removeClass, loading: isDeleting } = useApi();

    const { user } = useAuth();

    // Load Profile
    useEffect(() => {
        const loadProfile = async () => {
            const res = await fetchProfile(instituteService.getInstituteProfile);
            if (res.data) {
                // The backend might return { data: { instituteId: ..., instituteName: ... }, success: true }
                setInstituteProfile(res.data.data || res.data);
            }
        };
        loadProfile();
    }, []);

    // Load Classes
    useEffect(() => {
        loadClasses(true);
    }, [searchTerm]);

    const loadClasses = async (reset = false) => {
        const currentPage = reset ? 1 : page + 1;
        // The endpoint is a mock right now to prevent errors until the backend is ready
        // We'll update this once the getInstituteClasses service is written
        const { data } = await fetchClasses(instituteService.getInstituteClasses, searchTerm, currentPage, pageSize);

        if (data && data.success) {
            // The backend wraps it in a ServiceResponse which has a Data property. 
            // Then inside that data, we have a PaginatedResultDto containing Items.
            const items = data.data?.items || data.data || [];
            if (reset) {
                setClasses(items);
            } else {
                setClasses(prev => [...prev, ...items]);
            }
            setHasMore(items.length === pageSize);
            setPage(currentPage);
        } else if (reset) {
            setClasses([]);
        }
    };

    const handleLoadMore = () => {
        if (!isLoading && hasMore) {
            loadClasses();
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

        // request returns { data: ..., error: ... }, check for success in data payload
        if (result && result.data && result.data.success) {
            setDeleteConfirmOpen(false);
            setClassToDelete(null);
            loadClasses(true);
            setSuccessMessage("Class deleted successfully!");
            setIsSuccessOpen(true);
        } else {
            // Handle error case if necessary
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
            setStatusConfirmOpen(false);
            setEditingClass(prev => ({ ...prev, isActive: result.data.data }));
            loadClasses(true);
            setSuccessMessage(`Class ${newStatus ? 'activated' : 'deactivated'} successfully!`);
            setIsSuccessOpen(true);
        }
    };

    const handleClassSubmit = (formData) => {
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
            setPendingFormData(null);
            loadClasses(true);
            const msg = editingClass ? "Class updated successfully!" : "Class assigned successfully!";
            setSuccessMessage(msg);
            setIsSuccessOpen(true);
        } else if (!editingClass) {
            alert('Failed to create class.');
            setIsConfirmOpen(false);
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
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => loadClasses(true)}
                        disabled={isLoading}
                        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    <Button variant="primary" onClick={handleCreateClick} disabled={!instituteProfile}>
                        <BookOpen size={18} className="mr-2" /> Assign Class
                    </Button>
                </div>
            </div>

            {/* Stats Banner & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="w-full md:w-64">
                    <StatCard
                        label="Total Classes"
                        value={classes.length}
                        change="Viewing loaded records"
                        icon={BookOpen}
                        color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    />
                </div>

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
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Class Name</th>
                                <th className="px-6 py-4 font-semibold">Tutor Name</th>
                                <th className="px-6 py-4 font-semibold">Subject</th>
                                <th className="px-6 py-4 font-semibold">Time</th>
                                <th className="px-6 py-4 font-semibold">Date / Day</th>
                                <th className="px-6 py-4 font-semibold">Hall Number</th>
                                <th className="px-6 py-4 font-semibold">Fees (Rs)</th>
                                <th className="px-6 py-4 font-semibold text-center">Students</th>
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
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                <span>{cls.className || '-'}</span>
                                                {!cls.isActive && (
                                                    <span className="px-2 py-0.5 text-[10px] tracking-wider font-bold bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-md">
                                                        INACTIVE
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                                                {cls.classType || 'Class'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-gray-400" />
                                                <span>{cls.tutorName || '-'}</span>
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
                                                <span>{cls.startTime} - {cls.endTime}</span>
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
                                                <span className="font-medium">{cls.hallName || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm font-semibold text-green-500 mr-1">Rs</span>
                                                <span>{cls.fee?.toLocaleString() || '0'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-bold min-w-[3rem]">
                                                {cls.studentRegisteredCount || 0}
                                            </div>
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
                </div>

                {/* Pagination / Load More Footer */}
                {classes.length > 0 && hasMore && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50 flex justify-center">
                        <Button
                            variant="outline"
                            onClick={handleLoadMore}
                            disabled={isLoading}
                            className="w-full md:w-auto"
                        >
                            {isLoading ? (
                                <><RefreshCw size={16} className="animate-spin mr-2" /> Loading...</>
                            ) : (
                                'Load More'
                            )}
                        </Button>
                    </div>
                )}
            </div>

            {/* --- MODALS --- */}
            <ClassFormModal
                isOpen={isClassModalOpen}
                onClose={() => setClassModalOpen(false)}
                onSubmit={handleClassSubmit}
                onDelete={handleDeleteClick}
                onStatusChange={handleStatusChangeRequest}
                initialData={editingClass}
                isSubmitting={isSaving}
                isInstituteMode={true}
                instituteProfile={instituteProfile}
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
        </div>
    );
};

export default InstituteClassesPage;
