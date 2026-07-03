import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Loader2, Building2, User } from 'lucide-react';
import Select from '../../components/atoms/Select';
import Input from '../../components/atoms/Input';
import FinancialsTable from '../../components/organisms/FinancialsTable';
import { getSystemPaymentHistory, getSystemClasses, getAllInstitutes, getAllTutors } from '../../services/api/adminService';

const AdminFinancialsPage = () => {
    // ─── Selection State ──────────────────────────────────────────
    const [selectedInstituteId, setSelectedInstituteId] = useState('');
    const [selectedTutorId, setSelectedTutorId] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');

    // ─── Search State ─────────────────────────────────────────────
    const [studentSearchQuery, setStudentSearchQuery] = useState('');
    const [debouncedStudentSearch, setDebouncedStudentSearch] = useState('');

    // Institute Search
    const [instituteSearchQuery, setInstituteSearchQuery] = useState('');
    const [showInstituteDropdown, setShowInstituteDropdown] = useState(false);
    const [instituteOptions, setInstituteOptions] = useState([]);
    const [isSearchingInstitutes, setIsSearchingInstitutes] = useState(false);

    // Tutor Search
    const [tutorSearchQuery, setTutorSearchQuery] = useState('');
    const [showTutorDropdown, setShowTutorDropdown] = useState(false);
    const [tutorOptions, setTutorOptions] = useState([]);
    const [isSearchingTutors, setIsSearchingTutors] = useState(false);

    // Classes
    const [classes, setClasses] = useState([]);
    const [isLoadingClasses, setIsLoadingClasses] = useState(false);

    // ─── Financial Data ───────────────────────────────────────────
    const [payments, setPayments] = useState([]);
    const [isLoadingFinancials, setIsLoadingFinancials] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(null);

    // ─── Pagination ───────────────────────────────────────────────
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // ─── Debounce student search ──────────────────────────────────
    useEffect(() => {
        const t = setTimeout(() => setDebouncedStudentSearch(studentSearchQuery), 500);
        return () => clearTimeout(t);
    }, [studentSearchQuery]);

    // ─── Search Institutes (Autocomplete) ─────────────────────────
    useEffect(() => {
        const fetchInstitutes = async () => {
            if (!showInstituteDropdown && !instituteSearchQuery) return;
            setIsSearchingInstitutes(true);
            try {
                const res = await getAllInstitutes(instituteSearchQuery, 1, 20);
                const items = res?.data?.items ?? res?.items ?? res ?? [];
                setInstituteOptions(Array.isArray(items) ? items : []);
            } catch (err) {
                console.error('Failed to search institutes:', err);
            } finally {
                setIsSearchingInstitutes(false);
            }
        };

        const t = setTimeout(fetchInstitutes, 300);
        return () => clearTimeout(t);
    }, [instituteSearchQuery, showInstituteDropdown]);

    const handleInstituteSelect = (inst) => {
        const iId = inst.instituteId ?? inst.id;
        setSelectedInstituteId(iId);
        setInstituteSearchQuery(inst.instituteName || `Institute ${String(iId).substring(0, 4)}`);
        setShowInstituteDropdown(false);
        // Reset downstream filters
        setSelectedTutorId('');
        setTutorSearchQuery('');
        setSelectedClassId('');
    };

    const handleInstituteInputChange = (e) => {
        setInstituteSearchQuery(e.target.value);
        if (selectedInstituteId) {
            setSelectedInstituteId('');
            setSelectedTutorId('');
            setTutorSearchQuery('');
            setSelectedClassId('');
        }
    };

    // ─── Search Tutors (Autocomplete) ─────────────────────────────
    useEffect(() => {
        const fetchTutors = async () => {
            if (!showTutorDropdown && !tutorSearchQuery) return;
            setIsSearchingTutors(true);
            try {
                const res = await getAllTutors(tutorSearchQuery, 1, 20, selectedInstituteId || null);
                const items = res?.data?.items ?? res?.items ?? res ?? [];
                setTutorOptions(Array.isArray(items) ? items : []);
            } catch (err) {
                console.error('Failed to search tutors:', err);
            } finally {
                setIsSearchingTutors(false);
            }
        };

        const t = setTimeout(fetchTutors, 300);
        return () => clearTimeout(t);
    }, [tutorSearchQuery, showTutorDropdown, selectedInstituteId]);

    const handleTutorSelect = (tutor) => {
        const tId = tutor.tutorId ?? tutor.id;
        setSelectedTutorId(tId);
        const name = tutor.firstName || tutor.lastName ? `${tutor.firstName || ''} ${tutor.lastName || ''}`.trim() : `Tutor ${String(tId).substring(0, 4)}`;
        setTutorSearchQuery(name);
        setShowTutorDropdown(false);
        // Reset downstream filter
        setSelectedClassId('');
    };

    const handleTutorInputChange = (e) => {
        setTutorSearchQuery(e.target.value);
        if (selectedTutorId) {
            setSelectedTutorId('');
            setSelectedClassId('');
        }
    };

    // ─── Fetch Classes Dropdown ───────────────────────────────────
    useEffect(() => {
        const loadClasses = async () => {
            setIsLoadingClasses(true);
            try {
                const res = await getSystemClasses(selectedInstituteId || null, selectedTutorId || null);
                const clsData = res?.data ?? res ?? [];
                setClasses(Array.isArray(clsData) ? clsData : []);
            } catch (err) {
                console.error('Failed to fetch classes:', err);
            } finally {
                setIsLoadingClasses(false);
            }
        };
        loadClasses();
    }, [selectedInstituteId, selectedTutorId]);

    // ─── Fetch payment history ────────────────────────────────────
    const fetchPaymentHistory = useCallback(async (currentPage = 1) => {
        if (currentPage === 1) setIsLoadingFinancials(true);
        else setIsLoadingMore(true);
        setError(null);

        try {
            let response = await getSystemPaymentHistory(
                selectedInstituteId || null,
                selectedTutorId || null,
                selectedClassId || null,
                debouncedStudentSearch,
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
            console.error('Failed to fetch system payment history:', err);
            setError('Failed to load payment records.');
            if (currentPage === 1) setPayments([]);
        } finally {
            setIsLoadingFinancials(false);
            setIsLoadingMore(false);
        }
    }, [selectedInstituteId, selectedTutorId, selectedClassId, debouncedStudentSearch]);

    useEffect(() => {
        setPage(1);
        setHasMore(true);
        fetchPaymentHistory(1);
    }, [selectedInstituteId, selectedTutorId, selectedClassId, debouncedStudentSearch, fetchPaymentHistory]);

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
        <div className="p-6 max-w-7xl mx-auto space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Financials</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    View student payment history across all institutes and tutors in the system.
                </p>
            </div>

            {/* Filter Controls */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-4 items-end flex-wrap">
                
                {/* Search Institute */}
                <div className="w-full md:flex-1 min-w-[200px] flex flex-col items-start gap-1 relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Institute
                    </label>
                    <div className="relative w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Building2 className="h-4 w-4 text-gray-400" />
                        </div>
                        <Input
                            type="text"
                            placeholder="All Institutes (Search...)"
                            className="pl-10 !w-full"
                            value={instituteSearchQuery}
                            onFocus={() => setShowInstituteDropdown(true)}
                            onBlur={() => setTimeout(() => setShowInstituteDropdown(false), 200)}
                            onChange={handleInstituteInputChange}
                        />
                    </div>
                    {showInstituteDropdown && instituteOptions.length > 0 && !selectedInstituteId && (
                        <ul className="absolute z-50 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto top-[100%] mt-1">
                            {instituteOptions.map(inst => (
                                <li
                                    key={inst.instituteId ?? inst.id}
                                    className="cursor-pointer py-2 pl-3 pr-4 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                    onMouseDown={() => handleInstituteSelect(inst)}
                                >
                                    {inst.instituteName} {inst.registrationNumber ? `(${inst.registrationNumber})` : ''}
                                </li>
                            ))}
                        </ul>
                    )}
                    {showInstituteDropdown && instituteSearchQuery && instituteOptions.length === 0 && !isSearchingInstitutes && !selectedInstituteId && (
                        <div className="absolute z-50 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-md py-3 px-3 text-sm text-center text-gray-500 top-[100%] mt-1">
                            No institutes found.
                        </div>
                    )}
                </div>

                {/* Search Tutor */}
                <div className="w-full md:flex-1 min-w-[200px] flex flex-col items-start gap-1 relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Tutor
                    </label>
                    <div className="relative w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-4 w-4 text-gray-400" />
                        </div>
                        <Input
                            type="text"
                            placeholder="All Tutors (Search...)"
                            className="pl-10 !w-full"
                            value={tutorSearchQuery}
                            onFocus={() => setShowTutorDropdown(true)}
                            onBlur={() => setTimeout(() => setShowTutorDropdown(false), 200)}
                            onChange={handleTutorInputChange}
                        />
                    </div>
                    {showTutorDropdown && tutorOptions.length > 0 && !selectedTutorId && (
                        <ul className="absolute z-50 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto top-[100%] mt-1">
                            {tutorOptions.map(tutor => {
                                const name = tutor.firstName || tutor.lastName ? `${tutor.firstName || ''} ${tutor.lastName || ''}`.trim() : `Tutor ${String(tutor.tutorId ?? tutor.id).substring(0, 4)}`;
                                return (
                                    <li
                                        key={tutor.tutorId ?? tutor.id}
                                        className="cursor-pointer py-2 pl-3 pr-4 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                        onMouseDown={() => handleTutorSelect(tutor)}
                                    >
                                        {name} {tutor.user?.phoneNumber ? `(${tutor.user.phoneNumber})` : ''}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                    {showTutorDropdown && tutorSearchQuery && tutorOptions.length === 0 && !isSearchingTutors && !selectedTutorId && (
                        <div className="absolute z-50 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-md py-3 px-3 text-sm text-center text-gray-500 top-[100%] mt-1">
                            No tutors found.
                        </div>
                    )}
                </div>

                {/* Select Class */}
                <div className="w-full md:flex-1 min-w-[200px] flex flex-col items-start gap-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Class
                    </label>
                    <Select
                        value={selectedClassId}
                        onChange={e => setSelectedClassId(e.target.value)}
                        disabled={isLoadingClasses}
                    >
                        <option value="">-- All Classes --</option>
                        {classes.map(cls => (
                            <option key={cls.classId} value={cls.classId}>
                                {cls.className ?? cls.subject ?? `Class ${String(cls.classId).substring(0, 4)}`}
                                {cls.tutorName ? ` - ${cls.tutorName}` : ''}
                            </option>
                        ))}
                    </Select>
                </div>

                {/* Search Student */}
                <div className="w-full md:flex-1 min-w-[200px] flex flex-col items-start gap-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Student Search
                    </label>
                    <div className="relative w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <Input
                            type="text"
                            placeholder="Name, Reg No, Mobile..."
                            className="pl-10 relative !w-full"
                            value={studentSearchQuery}
                            onChange={e => setStudentSearchQuery(e.target.value)}
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
                        {/* FinancialsTable handles the PDF download via paymentService */}
                        <FinancialsTable payments={payments} />
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

export default AdminFinancialsPage;
