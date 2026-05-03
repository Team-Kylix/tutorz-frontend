import React, { useState, useEffect, useCallback } from 'react';
import {
    GraduationCap, Loader2, Search,
    RefreshCw, AlertCircle, Eye
} from 'lucide-react';
import RowActions from '../../components/molecules/RowActions';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import { getAllStudents } from '../../services/api/adminService';
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

const AdminStudentsPage = () => {
    const [students, setStudents] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState('');

    // Pagination and Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const PAGE_SIZE = 10;

    // Debounce Search Term
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const fetchStudents = useCallback(async (isLoadMore = false, currentPage = 1, currentSearch = '') => {
        if (!isLoadMore) {
            setIsLoading(true);
        } else {
            setIsLoadingMore(true);
        }
        setError('');

        try {
            const res = await getAllStudents(currentSearch, currentPage, PAGE_SIZE);
            const newStudents = res.items || [];

            if (isLoadMore) {
                setStudents(prev => [...prev, ...newStudents]);
            } else {
                setStudents(newStudents);
            }

            setTotalCount(res.totalCount || 0);
            setHasMore(res.hasNextPage || false);
        } catch (err) {
            setError('Failed to load students. Please try again.');
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, []);

    // Effect for initial load and search term changes
    useEffect(() => {
        setPage(1); // Reset page on new search
        fetchStudents(false, 1, debouncedSearchTerm);
    }, [debouncedSearchTerm, fetchStudents]);

    const handleScroll = (e) => {
        const { scrollTop, clientHeight, scrollHeight } = e.target;
        // If scrolled to the bottom (allow 50px buffer)
        if (scrollHeight - scrollTop <= clientHeight + 50 && hasMore && !isLoadingMore && !isLoading) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchStudents(true, nextPage, debouncedSearchTerm);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Students</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        View and manage all students registered in the platform
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchStudents(false, 1, debouncedSearchTerm)}
                        disabled={isLoading}
                        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Main Content Container */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
                
                {/* Top Bar with Search */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <Input
                            type="text"
                            placeholder="Search students by name, reg no, or mobile..."
                            className="pl-10 shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

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
                        <Button variant="outline" onClick={() => fetchStudents(false, 1, debouncedSearchTerm)}>Retry</Button>
                    </div>
                ) : students.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50">
                        <GraduationCap size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="font-medium text-gray-600 dark:text-gray-400">
                            {debouncedSearchTerm ? 'No matching students found.' : 'No students registered in the system.'}
                        </p>
                        {debouncedSearchTerm && (
                            <p className="text-sm mt-2 text-gray-400">Try a different search term.</p>
                        )}
                    </div>
                ) : (
                    <div
                        className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar"
                        onScroll={handleScroll}
                    >
                        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300 relative">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20 backdrop-blur-sm">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Student Name</th>
                                    <th className="px-6 py-4 font-semibold">Registration No</th>
                                    <th className="px-6 py-4 font-semibold">Mobile Number</th>
                                    <th className="px-6 py-4 font-semibold">Grade</th>
                                    <th className="px-3 py-4 font-semibold sticky right-0 z-30 bg-gray-50 dark:bg-gray-900/50"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                {students.map((student) => {
                                    const initials = `${student.firstName?.charAt(0) || ''}${student.lastName ? student.lastName.charAt(0) : ''}`.toUpperCase();
                                    const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown';

                                    return (
                                        <tr key={student.studentId} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <StudentAvatar
                                                        imageUrlSmall={student.profileImageUrlSmall}
                                                        imageUrlLarge={student.profileImageUrlLarge}
                                                        initials={initials}
                                                    />
                                                    <div>
                                                        <p className="font-semibold text-gray-900 dark:text-white">{fullName}</p>
                                                        {student.email && (
                                                            <p className="text-xs text-gray-500">{student.email}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs">
                                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                                                    {student.registrationNumber || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {student.phoneNumber || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                                                    {student.grade || '-'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-4 sticky right-0 z-10 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700/20 transition-colors">
                                                <RowActions actions={[
                                                    { label: 'View Profile', icon: Eye, onClick: () => {} },
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
        </div>
    );
};

export default AdminStudentsPage;
