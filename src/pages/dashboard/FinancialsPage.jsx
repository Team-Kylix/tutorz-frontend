import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Loader2, RefreshCw } from 'lucide-react';
import Select from '../../components/atoms/Select';
import Input from '../../components/atoms/Input';
import TutorFinancialsTable from '../../components/organisms/TutorFinancialsTable';
import { getClasses, getJoinedInstitutes } from '../../services/api/tutorService';
import { getTutorPaymentHistory } from '../../services/api/paymentService';

const FinancialsPage = () => {
    // ─── Dropdown Data ────────────────────────────────────────────
    const [institutes, setInstitutes] = useState([]);
    const [allClasses, setAllClasses] = useState([]);
    const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true);

    // ─── Selection State ──────────────────────────────────────────
    // '' = All Institutes, 'own' = My Own Place, GUID = specific institute
    const [selectedInstituteId, setSelectedInstituteId] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');

    // ─── Search State ─────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

    // ─── Financial Data ───────────────────────────────────────────
    const [payments, setPayments] = useState([]);
    const [isLoadingFinancials, setIsLoadingFinancials] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(null);

    // ─── Pagination ───────────────────────────────────────────────
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // ─── Debounce search ──────────────────────────────────────────
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearchQuery(searchQuery), 500);
        return () => clearTimeout(t);
    }, [searchQuery]);

    // ─── Fetch dropdown data on mount ─────────────────────────────
    useEffect(() => {
        const load = async () => {
            setIsLoadingDropdowns(true);
            try {
                const [instRes, clsRes] = await Promise.all([
                    getJoinedInstitutes(),
                    getClasses()
                ]);

                const instData = instRes?.data ?? instRes;
                setInstitutes(
                    Array.isArray(instData) ? instData : (instData?.data ?? [])
                );

                const clsData = clsRes?.data ?? clsRes;
                setAllClasses(
                    Array.isArray(clsData) ? clsData : (clsData?.data ?? clsData?.items ?? [])
                );
            } catch (err) {
                console.error('Failed to fetch dropdown data:', err);
            } finally {
                setIsLoadingDropdowns(false);
            }
        };
        load();
    }, []);

    // ─── Derived: classes filtered by selected institute ──────────
    const availableClasses = useMemo(() => {
        if (!selectedInstituteId) return allClasses;
        if (selectedInstituteId === 'own') return allClasses.filter(c => !c.instituteId);
        return allClasses.filter(c => c.instituteId === selectedInstituteId);
    }, [selectedInstituteId, allClasses]);

    // Reset class when institute changes
    useEffect(() => {
        setSelectedClassId('');
    }, [selectedInstituteId]);

    // ─── Fetch payment history ────────────────────────────────────
    const fetchPaymentHistory = useCallback(async (currentPage = 1) => {
        if (currentPage === 1) setIsLoadingFinancials(true);
        else setIsLoadingMore(true);
        setError(null);

        try {
            let response = await getTutorPaymentHistory(
                selectedInstituteId || null,
                selectedClassId || null,
                debouncedSearchQuery,
                currentPage,
                10
            );

            if (response?.data && response?.success !== false) response = response.data;

            const items = response?.paginatedPayments?.items
                ?? response?.items
                ?? response
                ?? [];

            if (currentPage === 1) {
                setPayments(items);
            } else {
                setPayments(prev => [...prev, ...items]);
            }

            setHasMore(items.length === 10);
        } catch (err) {
            console.error('Failed to fetch payment history:', err);
            setError('Failed to load payment records.');
            if (currentPage === 1) setPayments([]);
        } finally {
            setIsLoadingFinancials(false);
            setIsLoadingMore(false);
        }
    }, [selectedInstituteId, selectedClassId, debouncedSearchQuery]);

    useEffect(() => {
        setPage(1);
        setHasMore(true);
        fetchPaymentHistory(1);
    }, [selectedInstituteId, selectedClassId, debouncedSearchQuery, fetchPaymentHistory]);

    useEffect(() => {
        if (page > 1) fetchPaymentHistory(page);
    }, [page, fetchPaymentHistory]);

    // ─── Infinite scroll ─────────────────────────────────────────
    const handleScroll = useCallback(() => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
            if (hasMore && !isLoadingFinancials && !isLoadingMore) {
                setPage(prev => prev + 1);
            }
        }
    }, [hasMore, isLoadingFinancials, isLoadingMore]);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    // ─── Render ───────────────────────────────────────────────────
    return (
        <div className="space-y-6">

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financials &amp; Invoices</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        View student payment history across all your classes.
                    </p>
                </div>
                <div className="flex w-full sm:w-auto items-center gap-2">
                    <button
                        onClick={() => fetchPaymentHistory(1)}
                        disabled={isLoadingFinancials}
                        className="w-full sm:w-auto flex justify-center items-center p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={17} className={isLoadingFinancials ? 'animate-spin' : ''} />
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
                        onChange={e => {
                            setSelectedInstituteId(e.target.value);
                            setSearchQuery('');
                        }}
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
                        onChange={e => {
                            setSelectedClassId(e.target.value);
                            setSearchQuery('');
                        }}
                        disabled={isLoadingDropdowns}
                    >
                        <option value="">-- All Classes --</option>
                        {availableClasses.map(cls => {
                            const cId = cls.classId ?? cls.id;
                            return (
                                <option key={cId} value={cId}>
                                    {cls.className ?? cls.name ?? cls.subject ?? `Class ${String(cId).substring(0, 4)}`}
                                </option>
                            );
                        })}
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
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="mt-4">
                {isLoadingFinancials ? (
                    <div className="flex justify-center items-center p-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        <span className="ml-3 text-gray-500 dark:text-gray-400">Loading payment history...</span>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
                        <p>{error}</p>
                    </div>
                ) : (
                    <>
                        <TutorFinancialsTable payments={payments} />
                        {isLoadingMore && (
                            <div className="flex justify-center items-center py-6">
                                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                <span className="ml-2 text-sm text-gray-500">Loading more payments...</span>
                            </div>
                        )}
                    </>
                )}
            </div>

        </div>
    );
};

export default FinancialsPage;
