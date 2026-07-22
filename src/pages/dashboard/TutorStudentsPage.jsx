import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    GraduationCap, Loader2, Search,
    RefreshCw, AlertCircle, Eye
} from 'lucide-react';
import RowActions from '../../components/molecules/RowActions';
import Input from '../../components/atoms/Input';
import Select from '../../components/atoms/Select';
import AccountViewModal from '../../components/organisms/AccountViewModal';
import RemoveStudentModal from '../../components/organisms/RemoveStudentModal';
import ReassignStudentModal from '../../components/organisms/ReassignStudentModal';
import { getTutorStudents, getClasses, getJoinedInstitutes } from '../../services/api/tutorService';
import { useAuth } from '../../hooks/useAuth';
import { BASE_URL } from '../../services/api/apiClient';

/**
 * Small circular avatar for a student row.
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

const TutorStudentsPage = () => {
    const { user } = useAuth();
    
    // Dropdown Data State
    const [tutorClasses, setTutorClasses] = useState([]);
    const [institutes, setInstitutes] = useState([]);
    const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true);

    // Filter State
    const [selectedInstituteId, setSelectedInstituteId] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');

    // Students Data State
    const [students, setStudents] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState('');
    
    // Search & Pagination State
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const pageSize = 10;

    // View Profile Modal
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    
    // Class Management State
    const [manageStudent, setManageStudent] = useState(null);
    const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
    const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);

    // Initial Load: Fetch Classes for Dropdowns
    useEffect(() => {
        const fetchDropdownData = async () => {
            setIsLoadingDropdowns(true);
            try {
                const [classesRes, instRes] = await Promise.all([
                    getClasses(),
                    getJoinedInstitutes()
                ]);

                const clsData = classesRes?.data ?? classesRes;
                setTutorClasses(Array.isArray(clsData) ? clsData : (clsData?.data ?? clsData?.items ?? []));

                const instData = instRes?.data ?? instRes;
                setInstitutes(Array.isArray(instData) ? instData : (instData?.data ?? []));
            } catch (err) {
                console.error("Failed to load dropdown data", err);
            } finally {
                setIsLoadingDropdowns(false);
            }
        };
        fetchDropdownData();
    }, []);

    const classOptions = useMemo(() => {
        let filteredClasses = tutorClasses;
        if (selectedInstituteId) {
            filteredClasses = filteredClasses.filter(c => c.instituteId === selectedInstituteId);
        }
        return filteredClasses.map(c => ({
            value: c.classId || c.id,
            label: `${c.subject} - ${c.grade} (${c.className})`
        }));
    }, [tutorClasses, selectedInstituteId]);

    // Handle Dropdown Changes
    const handleInstituteChange = (e) => {
        const val = e.target.value;
        setSelectedInstituteId(val);
        setSelectedClassId(''); // Reset class when institute changes
        setPage(1);
    };

    const handleClassChange = (e) => {
        setSelectedClassId(e.target.value);
        setPage(1);
    };

    // Debounce Search Term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setPage(1); // Reset page on new search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch Students Function
    const fetchStudents = useCallback(async (isLoadMore = false, currentPage = 1, currentSearch = '', forceRefresh = false) => {
        if (!isLoadMore) {
            setIsLoading(true);
        } else {
            setIsLoadingMore(true);
        }
        setError('');

        try {
            const params = {
                instituteId: selectedInstituteId === 'own' ? undefined : (selectedInstituteId || undefined),
                classId: selectedClassId || undefined,
                searchQuery: currentSearch,
                page: currentPage,
                pageSize: pageSize
            };
            const response = await getTutorStudents(params);
            
            const fetchedStudents = response?.items || [];
            
            if (isLoadMore) {
                setStudents(prev => [...prev, ...fetchedStudents]);
            } else {
                setStudents(fetchedStudents);
            }
            
            setTotalCount(response?.totalCount || 0);
            setHasMore(fetchedStudents.length === pageSize);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch students. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [selectedInstituteId, selectedClassId]);

    // Effect to Trigger Fetching
    useEffect(() => {
        fetchStudents(false, page, debouncedSearchTerm);
    }, [fetchStudents, debouncedSearchTerm, selectedInstituteId, selectedClassId]);

    // Handle Scroll for Pagination
    const handleScroll = () => {
        const scrollPosition = window.innerHeight + window.scrollY;
        const documentHeight = document.documentElement.offsetHeight;

        if (scrollPosition >= documentHeight - 200 && hasMore && !isLoadingMore && !isLoading) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchStudents(true, nextPage, debouncedSearchTerm);
        }
    };

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    const handleViewProfile = (student) => {
        setSelectedAccount(student);
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

    const handleRefresh = () => {
        setPage(1);
        fetchStudents(false, 1, debouncedSearchTerm, true);
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Students</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        View students across all your classes.
                    </p>
                </div>
                <div className="flex w-full sm:w-auto items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="w-full sm:w-auto flex justify-center items-center p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
                        <span className="ml-2 sm:hidden">Refresh Data</span>
                    </button>
                </div>
            </div>

            {/* Filter Controls */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-4 items-end">
                {/* Select Institute */}
                <div className="w-full md:w-1/3 flex flex-col items-start gap-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Select Institute
                    </label>
                    <Select
                        value={selectedInstituteId}
                        onChange={handleInstituteChange}
                        disabled={isLoadingDropdowns}
                    >
                        <option value="">-- All Institutes --</option>
                        <option value="own">My Own Place</option>
                        {institutes.map(inst => {
                            const iId = inst.instituteId ?? inst.id;
                            return (
                                <option key={iId} value={iId}>
                                    {inst.name ?? inst.instituteName ?? `Institute ${String(iId).substring(0, 4)}`}
                                </option>
                            );
                        })}
                    </Select>
                </div>

                {/* Select Class */}
                <div className="w-full md:w-1/3 flex flex-col items-start gap-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Select Class
                    </label>
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

                {/* Search Student */}
                <div className="w-full md:flex-1 flex flex-col items-start gap-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Search Student
                    </label>
                    <div className="relative w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <Input
                            type="text"
                            placeholder="Search by Name, Reg No, or Mobile..."
                            className="pl-10 relative !w-full"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="mt-4">
                {isLoading && page === 1 ? (
                    <div className="flex justify-center items-center p-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        <span className="ml-3 text-gray-500 dark:text-gray-400">Loading students...</span>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
                        <p>{error}</p>
                    </div>
                ) : students.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        <GraduationCap size={48} className="mx-auto mb-4 opacity-20 text-gray-400" />
                        <p className="font-medium text-gray-600 dark:text-gray-400">
                            {debouncedSearchTerm || selectedInstituteId || selectedClassId ? 'No matching students found.' : 'No students found.'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
                                <table className="w-full text-left text-xs md:text-sm text-gray-600 dark:text-gray-300 relative">
                                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20 backdrop-blur-sm">
                                        <tr>
                                            <th className="px-4 py-3 md:px-6 md:py-4 font-semibold whitespace-nowrap">Student Name</th>
                                            <th className="px-4 py-3 md:px-6 md:py-4 font-semibold whitespace-nowrap">Registration No</th>
                                            <th className="px-4 py-3 md:px-6 md:py-4 font-semibold whitespace-nowrap">Mobile Number</th>
                                            <th className="px-4 py-3 md:px-6 md:py-4 font-semibold whitespace-nowrap">Grade</th>
                                            <th className="px-4 py-3 md:px-6 md:py-4 font-semibold whitespace-nowrap">School</th>
                                            <th className="px-1 py-3 md:py-4 font-semibold sticky right-0 z-30 bg-gray-50 dark:bg-gray-700/50 backdrop-blur-sm"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                        {students.map((student) => {
                                            const initials = `${student.firstName?.charAt(0) || ''}${student.lastName ? student.lastName.charAt(0) : ''}`.toUpperCase();
                                            const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown';

                                            return (
                                                <tr key={student.studentId} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors group">
                                                    <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <StudentAvatar
                                                                imageUrlSmall={student.profileImageUrlSmall}
                                                                imageUrlLarge={student.profileImageUrlLarge}
                                                                initials={initials}
                                                            />
                                                            <div>
                                                                <p className="font-semibold text-gray-900 dark:text-white">{fullName}</p>
                                                                {student.email && (
                                                                    <p className="text-[10px] md:text-xs text-gray-500">{student.email}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 md:px-6 md:py-4 font-mono text-[10px] md:text-xs whitespace-nowrap">
                                                        <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                                                            {student.registrationNumber || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                                                        {student.phoneNumber || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] md:text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                                                            {student.grade || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                                                        {student.schoolName || '-'}
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
                            </div>
                        </div>

                        {/* Loading More Indicator */}
                        {isLoadingMore && (
                            <div className="flex justify-center items-center py-6">
                                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                <span className="ml-2 text-sm text-gray-500">Loading more students...</span>
                            </div>
                        )}
                        {!hasMore && students.length > 0 && (
                            <div className="text-center p-4 text-sm text-gray-400 dark:text-gray-500">
                                No more students to load.
                            </div>
                        )}
                    </>
                )}
            </div>

            <AccountViewModal 
                isOpen={isAccountModalOpen} 
                onClose={() => setIsAccountModalOpen(false)} 
                account={selectedAccount} 
            />

            <RemoveStudentModal
                isOpen={isRemoveModalOpen}
                onClose={() => setIsRemoveModalOpen(false)}
                student={manageStudent}
                type="Tutor"
                onUpdated={() => fetchStudents(true)}
            />

            <ReassignStudentModal
                isOpen={isReassignModalOpen}
                onClose={() => setIsReassignModalOpen(false)}
                student={manageStudent}
                type="Tutor"
                onUpdated={() => fetchStudents(true)}
            />
        </div>
    );
};

export default TutorStudentsPage;
