import React, { useState, useEffect, useCallback } from 'react';
import {
    Building, Check, X, Loader2, Search,
    RefreshCw, AlertCircle, Clock
} from 'lucide-react';
import RowActions from '../../components/molecules/RowActions';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import { getInstituteRequests, processInstituteRequest, searchInstituteExact, requestJoinInstitute } from '../../services/api/tutorService';
import SearchAssignModal from '../../components/organisms/SearchAssignModal';
import ConfirmationModal from '../../components/molecules/ConfirmationModal';

const TutorRequestsPage = () => {
    const [requests, setRequests] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState('');

    const [showSearchModal, setShowSearchModal] = useState(false);
    const [isSendingRequest, setIsSendingRequest] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [selectedInstituteId, setSelectedInstituteId] = useState(null);

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
            const response = await getInstituteRequests();
            let fetchedRequests = response.data || [];

            // Client-side search (since backend might not filter incoming requests yet)
            if (currentSearch) {
                const searchLower = currentSearch.toLowerCase();
                fetchedRequests = fetchedRequests.filter(req =>
                    req.instituteName?.toLowerCase().includes(searchLower) ||
                    req.instituteId?.toLowerCase().includes(searchLower)
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
            await processInstituteRequest(requestId, 'Accept');
            setRequests(prev => prev.filter(r => r.requestId !== requestId));
            setTotalCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            setError(err.message || 'Failed to accept request.');
        }
    };

    const handleDecline = async (requestId) => {
        try {
            await processInstituteRequest(requestId, 'Decline');
            setRequests(prev => prev.filter(r => r.requestId !== requestId));
            setTotalCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            setError(err.message || 'Failed to decline request.');
        }
    };

    const handleSendRequest = (instituteId) => {
        setSelectedInstituteId(instituteId);
        setShowConfirmModal(true);
    };

    const confirmSendRequest = async () => {
        setIsSendingRequest(true);
        try {
            await requestJoinInstitute(selectedInstituteId);
            setShowConfirmModal(false);
            setShowSearchModal(false);
            setShowSuccessModal(true);
        } catch (err) {
            setError(err.message || 'Failed to send request.');
            setShowConfirmModal(false);
        } finally {
            setIsSendingRequest(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Institute Requests</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Manage join requests from institutes
                    </p>
                </div>
                <div className="flex w-full sm:w-auto items-center gap-2">
                    <button
                        onClick={fetchRequests}
                        disabled={isLoading}
                        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors shrink-0"
                        title="Refresh"
                    >
                        <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    <Button
                        onClick={() => setShowSearchModal(true)}
                        className="flex-1 sm:flex-none justify-center items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        <Building size={16} />
                        Send Request
                    </Button>
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
                            placeholder="Search institutes..."
                            className="pl-10 shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Content Area */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                        <Loader2 size={32} className="animate-spin text-purple-500" />
                        <span className="text-sm font-medium">Loading requests...</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center gap-3 py-16 text-red-500 bg-red-50 dark:bg-red-900/10">
                        <AlertCircle size={36} strokeWidth={1.5} />
                        <p className="text-sm font-medium">{error}</p>
                        <Button variant="outline" onClick={fetchRequests}>Retry</Button>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50">
                        <Building size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="font-medium text-gray-600 dark:text-gray-400">
                            {debouncedSearchTerm ? 'No matching requests found.' : 'No pending requests.'}
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
                        <table className="w-full text-left text-xs md:text-sm text-gray-600 dark:text-gray-300 relative">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20 backdrop-blur-sm">
                                <tr>
                                    <th className="px-4 py-3 md:px-6 md:py-4 font-semibold whitespace-nowrap">Institute Name</th>
                                    <th className="px-4 py-3 md:px-6 md:py-4 font-semibold whitespace-nowrap">Registration No</th>
                                    <th className="px-4 py-3 md:px-6 md:py-4 font-semibold whitespace-nowrap">Mobile Number</th>
                                    <th className="px-1 py-3 md:py-4 font-semibold sticky right-0 z-30 bg-gray-50 dark:bg-gray-700/50 backdrop-blur-sm"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                {requests.map((request) => {
                                    const initials = request.instituteName?.charAt(0).toUpperCase() || 'I';
                                    const name = request.instituteName || 'Unknown Institute';

                                    return (
                                        <tr key={request.requestId} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors group">
                                            <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 dark:text-white">{name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 md:px-6 md:py-4 font-mono text-[10px] md:text-xs whitespace-nowrap">
                                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                                                    {request.instituteRegNumber || '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap text-[11px] md:text-sm">
                                                {request.institutePhoneNumber || '-'}
                                            </td>
                                            <td className="px-1 py-3 md:py-4 sticky right-0 z-10 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700/20 transition-colors">
                                                <RowActions actions={[
                                                    { label: 'Accept', icon: Check, onClick: () => handleAccept(request.requestId), success: true },
                                                    { label: 'Decline', icon: X, onClick: () => handleDecline(request.requestId), danger: true },
                                                ]} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Loading More Indicator */}
                        {isLoadingMore && (
                            <div className="flex items-center justify-center p-4 text-purple-500 space-x-2">
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
                )}
            </div>
            <SearchAssignModal
                isOpen={showSearchModal}
                onClose={() => setShowSearchModal(false)}
                onSendRequest={handleSendRequest}
                searchFunction={searchInstituteExact}
                entityType="Institute"
                isLoadingAction={isSendingRequest}
            />

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={confirmSendRequest}
                title="Send Join Request"
                message="Are you sure you want to send a join request to this institute?"
                confirmLabel="Send Request"
                isSubmitting={isSendingRequest}
            />

            {/* Success Modal */}
            <ConfirmationModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                onConfirm={() => setShowSuccessModal(false)}
                title="Request Sent!"
                message="Your join request has been sent successfully to the institute."
                variant="success"
                confirmLabel="Got it"
            />
        </div>
    );
};

export default TutorRequestsPage;
