import React, { useState, useEffect, useCallback } from 'react';
import {
    UserPlus, Check, X, Loader2, Search,
    RefreshCw, AlertCircle, Clock
} from 'lucide-react';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import StatCard from '../../components/molecules/StatCard';
import { getIncomingRequests, processJoinRequest } from '../../services/api/instituteService';

const InstituteRequestsPage = () => {
    // State for requests
    const [requests, setRequests] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState('');

    // Pagination and Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    // Debounce Search Term
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const fetchRequests = useCallback(async (isLoadMore = false, currentPage = 1, currentSearch = '') => {
        if (!isLoadMore) {
            setIsLoading(true);
        } else {
            setIsLoadingMore(true);
        }
        setError('');

        try {
            const response = await getIncomingRequests();
            let fetchedRequests = response.data || [];

            // Client-side search (since backend might not filter incoming requests yet)
            if (currentSearch) {
                const searchLower = currentSearch.toLowerCase();
                fetchedRequests = fetchedRequests.filter(req =>
                    req.tutorName?.toLowerCase().includes(searchLower) ||
                    req.tutorId?.toLowerCase().includes(searchLower)
                );
            }

            // Client-side pagination mock
            const pageSize = 10;
            const startIdx = (currentPage - 1) * pageSize;
            const paginatedRequests = fetchedRequests.slice(startIdx, startIdx + pageSize);

            if (isLoadMore) {
                setRequests(prev => [...prev, ...paginatedRequests]);
            } else {
                setRequests(paginatedRequests);
                setTotalCount(fetchedRequests.length);
            }

            setHasMore(startIdx + pageSize < fetchedRequests.length);

        } catch (err) {
            setError(err.message || 'Failed to load requests. Please try again.');
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, []);

    // Effect for initial load and search term changes
    useEffect(() => {
        setPage(1);
        fetchRequests(false, 1, debouncedSearchTerm);
    }, [debouncedSearchTerm, fetchRequests]);

    const handleScroll = (e) => {
        const { scrollTop, clientHeight, scrollHeight } = e.target;
        if (scrollHeight - scrollTop <= clientHeight + 50 && hasMore && !isLoadingMore && !isLoading) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchRequests(true, nextPage, debouncedSearchTerm);
        }
    };

    const handleAccept = async (requestId) => {
        try {
            await processJoinRequest(requestId, 'Accept');
            // Remove from list or refetch
            setRequests(prev => prev.filter(r => r.requestId !== requestId));
            setTotalCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            setError(err.message || 'Failed to accept request.');
        }
    };

    const handleDecline = async (requestId) => {
        try {
            await processJoinRequest(requestId, 'Decline');
            setRequests(prev => prev.filter(r => r.requestId !== requestId));
            setTotalCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            setError(err.message || 'Failed to decline request.');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header (Matches HallManagement / InstituteStudentsPage) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Institute Requests</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Manage join requests from tutors
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchRequests}
                        disabled={isLoading}
                        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    {/* Optional: Add a button here if needed, consistent with other pages. 
                        For requests, a generic 'Add' button might not fit, but keeping layout consistent. */}
                </div>
            </div>

            {/* Stats Banner & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="w-full md:w-64">
                    <StatCard
                        label="Pending Requests"
                        value={totalCount}
                        change="Awaiting response"
                        icon={Clock}
                        color="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                    />
                </div>

                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <Input
                        type="text"
                        placeholder="Search requests..."
                        className="pl-10 py-3 shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Content Table */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                    <Loader2 size={32} className="animate-spin text-orange-500" />
                    <span className="text-sm font-medium">Loading requests...</span>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center gap-3 py-16 text-red-500 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                    <AlertCircle size={36} strokeWidth={1.5} />
                    <p className="text-sm font-medium">{error}</p>
                    <Button variant="outline" onClick={fetchRequests}>Retry</Button>
                </div>
            ) : requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 transition-colors">
                    <UserPlus size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-medium text-gray-600 dark:text-gray-400">
                        {debouncedSearchTerm ? 'No matching requests found.' : 'No pending requests.'}
                    </p>
                    {debouncedSearchTerm && (
                        <p className="text-sm mt-2 text-gray-400">Try a different search term.</p>
                    )}
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
                    {/* Fixed Height Scrollable Container */}
                    <div
                        className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar"
                        onScroll={handleScroll}
                    >
                        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400 relative">
                            <thead className="bg-gray-50 dark:bg-gray-800/90 border-b border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium sticky top-0 z-10 backdrop-blur-sm">
                                <tr>
                                    <th className="px-6 py-4">Tutor Name</th>
                                    <th className="px-6 py-4">Tutor ID</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                {requests.map((request) => {
                                    const initials = request.tutorName?.charAt(0).toUpperCase() || 'U';
                                    const fullName = request.tutorName || 'Unknown';

                                    return (
                                        <tr key={request.requestId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 dark:text-white">{fullName}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs">
                                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                                                    {request.tutorId || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    className="border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 py-1.5 px-3"
                                                    onClick={() => handleAccept(request.requestId)}
                                                >
                                                    <Check size={16} className="mr-1.5" /> Accept
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 py-1.5 px-3"
                                                    onClick={() => handleDecline(request.requestId)}
                                                >
                                                    <X size={16} className="mr-1.5" /> Decline
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Loading More Indicator */}
                        {isLoadingMore && (
                            <div className="flex items-center justify-center p-4 text-orange-500 space-x-2">
                                <Loader2 size={16} className="animate-spin" />
                                <span className="text-sm">Loading more requests...</span>
                            </div>
                        )}
                        {!hasMore && requests.length > 0 && (
                            <div className="text-center p-4 text-sm text-gray-400 dark:text-gray-500">
                                No more requests to load.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default InstituteRequestsPage;
