import React, { useState, useEffect, useCallback } from 'react';
import {
    GraduationCap, UserPlus, Loader2, Search, X, Users,
    RefreshCw, AlertCircle, Eye
} from 'lucide-react';
import RowActions from '../../components/molecules/RowActions';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import Select from '../../components/atoms/Select';
import InstituteSearchAssignModal from '../../components/organisms/InstituteSearchAssignModal';
import AccountViewModal from '../../components/organisms/AccountViewModal';
import RemoveStudentModal from '../../components/organisms/RemoveStudentModal';
import ReassignStudentModal from '../../components/organisms/ReassignStudentModal';
import { getAssignedStudents, getAssignedTutors, getInstituteClasses } from '../../services/api/instituteService';
import { useAuth } from '../../hooks/useAuth';
import { BASE_URL } from '../../services/api/apiClient';

/**
 * Small circular avatar for a student row.
 * Shows the profile photo when available, falls back to coloured initials.
 */
const StudentAvatar = ({ imageUrlSmall, imageUrlLarge, initials }) => {
    const [imgError, setImgError] = React.useState(false);
    const rawUrl = imageUrlSmall || imageUrlLarge;
    const resolvedUrl = rawUrl
        ? (rawUrl.startsWith('http') ? rawUrl : `${BASE_URL}${rawUrl}`)
        : null;

    return (
        <div className="w-9 h-9 rounded-full shrink-0 overflow-hidden bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center font-bold text-xs text-blue-600 dark:text-blue-400 ring-2 ring-white dark:ring-gray-800">
            {resolvedUrl && !imgError ? (
                <img
                    src={resolvedUrl}
                    alt="Student"
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                />
            ) : (
                initials || <GraduationCap size={14} />
            )}
        </div>
    );
};

const InstituteStudentsPage = () => {
    const { user } = useAuth();
    const [students, setStudents] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState('');
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

    // Profile Modal State
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [manageStudent, setManageStudent] = useState(null);
    const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
    const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);

    // Filters State
    const [filterTutors, setFilterTutors] = useState([]);
    const [instituteClasses, setInstituteClasses] = useState([]);
    const [selectedTutorId, setSelectedTutorId] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [tutorFilterSearch, setTutorFilterSearch] = useState('');
    const [isTutorFilterOpen, setIsTutorFilterOpen] = useState(false);
    const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true);

    // Pagination and Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const PAGE_SIZE = 10;

    // Fetch dropdown data
    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                setIsLoadingDropdowns(true);
                const tutorData = await getAssignedTutors('', 1, 100);
                setFilterTutors(tutorData?.data?.items || []);
                const classData = await getInstituteClasses('', 1, 100);
                setInstituteClasses(classData?.data?.items || []);
            } catch (err) {
                console.error("Failed to load dropdown data", err);
            } finally {
                setIsLoadingDropdowns(false);
            }
        };
        fetchDropdownData();
    }, []);

    const classOptions = React.useMemo(() => {
        let filteredClasses = instituteClasses;
        if (selectedTutorId) {
            filteredClasses = filteredClasses.filter(c => c.tutor?.tutorId === selectedTutorId || c.tutorId === selectedTutorId);
        }
        return filteredClasses.map(c => ({
            value: c.classId,
            label: `${c.subject} - ${c.grade} (${c.tutor?.firstName || ''} ${c.tutor?.lastName || ''})`
        }));
    }, [instituteClasses, selectedTutorId]);

    const handleTutorChange = (tutorId) => {
        setSelectedTutorId(tutorId);
        setSelectedClassId('');
        setPage(1);
        fetchStudents(false, 1, debouncedSearchTerm);
    };

    const handleClassChange = (e) => {
        setSelectedClassId(e.target.value);
        setPage(1);
        fetchStudents(false, 1, debouncedSearchTerm);
    };

    // Debounce Search Term
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const fetchStudents = useCallback(async (isLoadMore = false, currentPage = 1, currentSearch = '', bypassCache = false) => {
        if (!isLoadMore) {
            setIsLoading(true);
        } else {
            setIsLoadingMore(true);
        }
        setError('');

        try {
            const res = await getAssignedStudents(currentSearch, currentPage, PAGE_SIZE, bypassCache);
            const newStudents = res.data?.items || [];

            if (isLoadMore) {
                setStudents(prev => [...prev, ...newStudents]);
            } else {
                setStudents(newStudents);
            }

            setTotalCount(res.data?.totalCount || 0);
            setHasMore(res.data?.hasNextPage || false);
        } catch (err) {
            setError('Failed to load students. Please try again.');
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, []);

    // Effect for initial load and search term changes
    useEffect(() => {
        setPage(1);
        fetchStudents(false, 1, debouncedSearchTerm);
    }, [debouncedSearchTerm, fetchStudents]);

    const handleAssigned = () => {
        setSearchTerm('');
        setPage(1);
        fetchStudents(false, 1, '', true);
    };

    const handleScroll = (e) => {
        const { scrollTop, clientHeight, scrollHeight } = e.target;
        if (scrollHeight - scrollTop <= clientHeight + 50 && hasMore && !isLoadingMore && !isLoading) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchStudents(true, nextPage, debouncedSearchTerm);
        }
    };

    const handleViewProfile = (student) => {
        setSelectedAccount({
            ...student,
            role: 'Student',
            name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown',
            profileImageUrlLarge: student.profileImageUrlLarge,
            profileImageUrlSmall: student.profileImageUrlSmall
        });
        setIsAccountModalOpen(true);
    };

    const handleRemoveStudent = (student) => {
        setManageStudent(student);
        setIsRemoveModalOpen(true);
    };

    const handleReassignStudent = (student) => {
        setManageStudent(student);
        setIsReassignModalOpen(true);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Institute Students</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        View and manage all students across all tutors and classes
                    </p>
                </div>
                <div className="flex w-full sm:w-auto items-center gap-2">
                    <button
                        onClick={() => fetchStudents(false, 1, debouncedSearchTerm, true)}
                        disabled={isLoading}
                        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors shrink-0"
                        title="Refresh"
                    >
                        <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    <Button variant="primary" onClick={() => setIsAssignModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none justify-center">
                        <UserPlus size={18} className="mr-2" />
                        Assign Student
                    </Button>
                </div>
            </div>

            {/* Filter Bar — sits outside the overflow container so dropdowns aren't clipped */}
            <div className="bg-white dark:bg-gray-800 rounded-t-xl border border-b-0 border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="p-4 flex flex-col md:flex-row gap-3 items-end">
                    {/* Tutor Combobox */}
                    <div className="w-full md:w-1/3 relative z-20">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Filter by tutor..."
                                value={tutorFilterSearch}
                                onChange={(e) => {
                                    setTutorFilterSearch(e.target.value);
                                    setIsTutorFilterOpen(true);
                                    if (!e.target.value) {
                                        handleTutorChange('');
                                    }
                                }}
                                onFocus={() => setIsTutorFilterOpen(true)}
                                className="w-full pl-9 pr-8 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                                disabled={isLoadingDropdowns}
                            />
                            {selectedTutorId && (
                                <button
                                    onClick={() => {
                                        handleTutorChange('');
                                        setTutorFilterSearch('');
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {isTutorFilterOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setIsTutorFilterOpen(false)}
                                />
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto z-20">
                                    <div
                                        className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                                        onClick={() => {
                                            handleTutorChange('');
                                            setTutorFilterSearch('');
                                            setIsTutorFilterOpen(false);
                                        }}
                                    >
                                        -- All Tutors --
                                    </div>
                                    {filterTutors
                                        .filter(t => (t.firstName + ' ' + t.lastName).toLowerCase().includes(tutorFilterSearch.toLowerCase()))
                                        .map(tutor => {
                                            const tId = tutor.tutorId ?? tutor.id;
                                            return (
                                                <div
                                                    key={tId}
                                                    onClick={() => {
                                                        handleTutorChange(tId);
                                                        setTutorFilterSearch(`${tutor.firstName} ${tutor.lastName}`);
                                                        setIsTutorFilterOpen(false);
                                                    }}
                                                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 ${selectedTutorId === tId ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                                                >
                                                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400">
                                                        {tutor.firstName?.[0]}{tutor.lastName?.[0]}
                                                    </div>
                                                    {tutor.firstName} {tutor.lastName}
                                                </div>
                                            );
                                        })}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Class Dropdown */}
                    <div className="w-full md:w-1/3">
                        <Select
                            value={selectedClassId}
                            onChange={handleClassChange}
                            disabled={isLoadingDropdowns || classOptions.length === 0}
                        >
                            <option value="">-- All Classes --</option>
                            {classOptions.map(cls => (
                                <option key={cls.value} value={cls.value}>
                                    {cls.label}
                                </option>
                            ))}
                        </Select>
                    </div>

                    {/* Search Students */}
                    <div className="relative w-full md:flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <Input
                            type="text"
                            placeholder="Search students..."
                            className="pl-10 shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content Container */}
            <div className="bg-white dark:bg-gray-800 rounded-b-xl border border-t-0 border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">

                {/* Content Area */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                        <Loader2 size={32} className="animate-spin text-blue-500" />
                        <span className="text-sm font-medium">Loading students...</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center gap-3 py-16 text-red-500 bg-red-50 dark:bg-red-900/10">
                        <AlertCircle size={36} strokeWidth={1.5} />
                        <p className="text-sm font-medium">{error}</p>
                        <Button variant="outline" onClick={fetchStudents}>Retry</Button>
                    </div>
                ) : students.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50">
                        <GraduationCap size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="font-medium text-gray-600 dark:text-gray-400">
                            {debouncedSearchTerm || selectedTutorId || selectedClassId ? 'No matching students found.' : 'No students found.'}
                        </p>
                        {debouncedSearchTerm || selectedTutorId || selectedClassId ? (
                            <p className="text-sm mt-2 text-gray-400">Try adjusting your search or filters.</p>
                        ) : (
                            <Button variant="primary" className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={() => setIsAssignModalOpen(true)}>
                                <UserPlus size={16} className="mr-2" /> Add First Student
                            </Button>
                        )}
                    </div>
                ) : (
                    <div
                        className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar"
                        onScroll={handleScroll}
                    >
                        <table className="w-full text-left text-xs md:text-sm text-gray-600 dark:text-gray-300 relative">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20 backdrop-blur-sm">
                                <tr>
                                    <th className="px-4 py-3 md:px-6 md:py-4 font-semibold whitespace-nowrap">Student Name</th>
                                    <th className="px-4 py-3 md:px-6 md:py-4 font-semibold whitespace-nowrap">Registration No</th>
                                    <th className="px-4 py-3 md:px-6 md:py-4 font-semibold whitespace-nowrap">Mobile Number</th>
                                    <th className="px-4 py-3 md:px-6 md:py-4 font-semibold whitespace-nowrap">Grade</th>
                                    <th className="px-1 py-3 md:py-4 font-semibold sticky right-0 z-30 bg-gray-50 dark:bg-gray-700/50 backdrop-blur-sm"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                {students.map((student) => {
                                    const u = student.user || student;
                                    const s = student;
                                    const initials = `${u.firstName?.charAt(0) || ''}${u.lastName ? u.lastName.charAt(0) : ''}`.toUpperCase();
                                    const fullName = s.studentName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unknown';

                                    return (
                                        <tr key={student.studentId} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors group">
                                            <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <StudentAvatar
                                                        imageUrlSmall={u.profileImageUrlSmall}
                                                        imageUrlLarge={u.profileImageUrlLarge}
                                                        initials={initials}
                                                    />
                                                    <div>
                                                        <p className="font-semibold text-gray-900 dark:text-white">{fullName}</p>
                                                        {u.email && (
                                                            <p className="text-[10px] md:text-xs text-gray-500">{u.email}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 md:px-6 md:py-4 font-mono text-[10px] md:text-xs whitespace-nowrap">
                                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                                                    {s.registrationNumber || '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                                                {u.phoneNumber || '-'}
                                            </td>
                                            <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] md:text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                                                    {s.grade || '-'}
                                                </span>
                                            </td>
                                            <td className="px-1 py-3 md:py-4 sticky right-0 z-10 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700/20 transition-colors">
                                                <RowActions actions={[
                                                    { label: 'View Profile', icon: Eye, onClick: () => handleViewProfile(student) },
                                                    { label: 'Remove Student', icon: GraduationCap, onClick: () => handleRemoveStudent(student), variant: 'danger' },
                                                    { label: 'Assign / Reassign Class', icon: GraduationCap, onClick: () => handleReassignStudent(student) }
                                                ]} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Loading More Indicator */}
                        {isLoadingMore && (
                            <div className="flex items-center justify-center p-4 text-blue-500 space-x-2">
                                <Loader2 size={16} className="animate-spin" />
                                <span className="text-sm">Loading more students...</span>
                            </div>
                        )}
                        {!hasMore && students.length > 0 && (
                            <div className="text-center p-4 text-sm text-gray-400 dark:text-gray-500">
                                No more students to load.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Assign Modal */}
            <InstituteSearchAssignModal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                type="Student"
                onAssigned={handleAssigned}
                user={user}
            />

            <AccountViewModal
                isOpen={isAccountModalOpen}
                onClose={() => setIsAccountModalOpen(false)}
                account={selectedAccount}
            />

            <RemoveStudentModal
                isOpen={isRemoveModalOpen}
                onClose={() => setIsRemoveModalOpen(false)}
                student={manageStudent}
                type="Institute"
                onUpdated={() => fetchStudents(false, 1, debouncedSearchTerm, true)}
            />

            <ReassignStudentModal
                isOpen={isReassignModalOpen}
                onClose={() => setIsReassignModalOpen(false)}
                student={manageStudent}
                type="Institute"
                onUpdated={() => fetchStudents(false, 1, debouncedSearchTerm, true)}
            />
        </div>
    );
};

export default InstituteStudentsPage;
