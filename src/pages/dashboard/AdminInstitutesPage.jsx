import React, { useState, useEffect, useCallback } from 'react';
import {
    Building, Loader2, Search,
    RefreshCw, AlertCircle
} from 'lucide-react';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import StatCard from '../../components/molecules/StatCard';
import { getAllInstitutes } from '../../services/api/adminService';
import { BASE_URL } from '../../services/api/apiClient';

/**
 * Small circular avatar for an institute row.
 */
const InstituteAvatar = ({ imageUrlSmall, imageUrlLarge, initials }) => {
    const [imgError, setImgError] = React.useState(false);
    const rawUrl = imageUrlSmall || imageUrlLarge;
    const resolvedUrl = rawUrl
        ? (rawUrl.startsWith('http') ? rawUrl : `${BASE_URL}${rawUrl}`)
        : null;

    return (
        <div className="w-9 h-9 rounded-full shrink-0 overflow-hidden bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center font-bold text-xs text-purple-600 dark:text-purple-400 ring-2 ring-white dark:ring-gray-800">
            {resolvedUrl && !imgError ? (
                <img
                    src={resolvedUrl}
                    alt="Institute"
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                />
            ) : (
                initials || <Building size={14} />
            )}
        </div>
    );
};

const AdminInstitutesPage = () => {
    const [institutes, setInstitutes] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const PAGE_SIZE = 10;

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const fetchInstitutes = useCallback(async (isLoadMore = false, currentPage = 1, currentSearch = '') => {
        if (!isLoadMore) {
            setIsLoading(true);
        } else {
            setIsLoadingMore(true);
        }
        setError('');

        try {
            const res = await getAllInstitutes(currentSearch, currentPage, PAGE_SIZE);
            const newInstitutes = res.items || [];

            if (isLoadMore) {
                setInstitutes(prev => [...prev, ...newInstitutes]);
            } else {
                setInstitutes(newInstitutes);
            }

            setTotalCount(res.totalCount || 0);
            setHasMore(res.hasNextPage || false);
        } catch (err) {
            setError('Failed to load institutes. Please try again.');
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        setPage(1);
        fetchInstitutes(false, 1, debouncedSearchTerm);
    }, [debouncedSearchTerm, fetchInstitutes]);

    const handleScroll = (e) => {
        const { scrollTop, clientHeight, scrollHeight } = e.target;
        if (scrollHeight - scrollTop <= clientHeight + 50 && hasMore && !isLoadingMore && !isLoading) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchInstitutes(true, nextPage, debouncedSearchTerm);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Institutes</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        View and manage all institutes registered in the platform
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchInstitutes(false, 1, debouncedSearchTerm)}
                        disabled={isLoading}
                        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="w-full md:w-64">
                    <StatCard
                        label="Total Registered"
                        value={totalCount}
                        change="All institutes"
                        icon={Building}
                        color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                    />
                </div>

                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <Input
                        type="text"
                        placeholder="Search institutes by name, reg no, or email..."
                        className="pl-10 shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                    <Loader2 size={32} className="animate-spin text-purple-500" />
                    <span className="text-sm font-medium">Loading institutes...</span>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center gap-3 py-16 text-red-500 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                    <AlertCircle size={36} strokeWidth={1.5} />
                    <p className="text-sm font-medium">{error}</p>
                    <Button variant="outline" onClick={() => fetchInstitutes(false, 1, debouncedSearchTerm)}>Retry</Button>
                </div>
            ) : institutes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 transition-colors">
                    <Building size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-medium text-gray-600 dark:text-gray-400">
                        {debouncedSearchTerm ? 'No matching institutes found.' : 'No institutes registered in the system.'}
                    </p>
                    {debouncedSearchTerm && (
                        <p className="text-sm mt-2 text-gray-400">Try a different search term.</p>
                    )}
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
                    <div
                        className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar"
                        onScroll={handleScroll}
                    >
                        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300 relative">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 backdrop-blur-sm">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Institute Name</th>
                                    <th className="px-6 py-4 font-semibold">Registration No</th>
                                    <th className="px-6 py-4 font-semibold">Contact Area</th>
                                    <th className="px-6 py-4 font-semibold">Commission</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                {institutes.map((institute) => {
                                    const initials = institute.instituteName?.substring(0, 2).toUpperCase() || 'IN';

                                    return (
                                        <tr key={institute.instituteId} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <InstituteAvatar
                                                        imageUrlSmall={institute.profileImageUrlSmall}
                                                        imageUrlLarge={institute.profileImageUrlLarge}
                                                        initials={initials}
                                                    />
                                                    <div>
                                                        <p className="font-semibold text-gray-900 dark:text-white">{institute.instituteName}</p>
                                                        {institute.email && (
                                                            <p className="text-xs text-gray-500">{institute.email}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs">
                                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                                                    {institute.registrationNumber || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs">{institute.contactNumber || '-'}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[200px] truncate" title={institute.address}>
                                                    {institute.address || ''}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium">
                                                <span className="inline-flex items-center px-2 py-1 rounded bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                                                    {institute.commissionPercentage}%
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {isLoadingMore && (
                            <div className="flex items-center justify-center p-4 text-purple-500 space-x-2">
                                <Loader2 size={16} className="animate-spin" />
                                <span className="text-sm">Loading more institutes...</span>
                            </div>
                        )}
                        {!hasMore && institutes.length > 0 && (
                            <div className="text-center p-4 text-sm text-gray-400 dark:text-gray-500">
                                No more institutes to load.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminInstitutesPage;
