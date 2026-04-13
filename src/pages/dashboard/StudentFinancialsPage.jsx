import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Loader2, DollarSign, TrendingUp, TrendingDown, BookOpen } from 'lucide-react';
import Select from '../../components/atoms/Select';
import Input from '../../components/atoms/Input';
import StudentFinancialsTable from '../../components/organisms/StudentFinancialsTable';
import { getStudentClasses, getStudentPaymentHistory } from '../../services/api/studentService';

const StudentFinancialsPage = () => {
    // Dropdown Data State
    const [enrolledClasses, setEnrolledClasses] = useState([]);
    const [isLoadingClasses, setIsLoadingClasses] = useState(true);

    // Selection State
    const [selectedTutorId, setSelectedTutorId] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedMonthYear, setSelectedMonthYear] = useState('');

    // Tutor Search
    const [tutorSearchQuery, setTutorSearchQuery] = useState('');
    const [showTutorDropdown, setShowTutorDropdown] = useState(false);

    // Financial Data State
    const [payments, setPayments] = useState([]);
    const [isLoadingFinancials, setIsLoadingFinancials] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(null);

    // Summary Stats State
    const [stats, setStats] = useState({
        totalAmountPaid: 0,
        totalDueAmount: 0,
        totalClassFees: 0,
    });

    // Pagination State
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Fetch Classes on Mount
    useEffect(() => {
        const fetchClasses = async () => {
            setIsLoadingClasses(true);
            try {
                const res = await getStudentClasses();
                const data = res.data ? res.data : res;
                setEnrolledClasses(data || []);
            } catch (err) {
                console.error("Failed to fetch classes:", err);
            } finally {
                setIsLoadingClasses(false);
            }
        };
        fetchClasses();
    }, []);

    // Derived State: Unique Tutors from enrolled classes
    const availableTutors = useMemo(() => {
        const tutorMap = new Map();
        enrolledClasses.forEach(cls => {
            if (cls.tutorId && cls.tutorName) {
                tutorMap.set(cls.tutorId, { id: cls.tutorId, name: cls.tutorName });
            }
        });
        return Array.from(tutorMap.values());
    }, [enrolledClasses]);

    // Filtered tutor suggestions based on search query
    const tutorSuggestions = useMemo(() => {
        if (!tutorSearchQuery.trim()) return [];
        const q = tutorSearchQuery.toLowerCase();
        return availableTutors.filter(t => t.name.toLowerCase().includes(q));
    }, [tutorSearchQuery, availableTutors]);

    // Derived State: Filter classes by selected tutor
    const availableClasses = useMemo(() => {
        if (!selectedTutorId) return enrolledClasses;
        return enrolledClasses.filter(cls => cls.tutorId === selectedTutorId);
    }, [selectedTutorId, enrolledClasses]);

    // Fetch Payment History
    const fetchPaymentHistory = useCallback(async (currentPage = 1) => {
        if (currentPage === 1) setIsLoadingFinancials(true);
        else setIsLoadingMore(true);

        setError(null);

        try {
            let response = await getStudentPaymentHistory(
                selectedTutorId || undefined,
                selectedClassId || undefined,
                selectedMonthYear || undefined,
                currentPage,
                10
            );

            // Unwrap ServiceResponse wrapper if present
            if (response.data && response.success !== false) {
                response = response.data;
            }

            const items = response.paginatedPayments?.items || response.items || [];

            if (currentPage === 1) {
                setPayments(items);
                setStats({
                    totalAmountPaid: response.totalAmountPaid || 0,
                    totalDueAmount: response.totalDueAmount || 0,
                    totalClassFees: response.totalClassFees || 0,
                });
            } else {
                setPayments(prev => [...prev, ...items]);
            }

            setHasMore(items.length === 10);

        } catch (err) {
            console.error("Failed to fetch payment history:", err);
            setError("Failed to load payment records.");
            if (currentPage === 1) setPayments([]);
        } finally {
            setIsLoadingFinancials(false);
            setIsLoadingMore(false);
        }
    }, [selectedTutorId, selectedClassId, selectedMonthYear]);

    // Trigger fetch on filter change
    useEffect(() => {
        setPage(1);
        setHasMore(true);
        fetchPaymentHistory(1);
    }, [selectedTutorId, selectedClassId, selectedMonthYear, fetchPaymentHistory]);

    // Trigger fetch on page increment
    useEffect(() => {
        if (page > 1) fetchPaymentHistory(page);
    }, [page, fetchPaymentHistory]);

    // Infinite Scroll
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

    // Handlers
    const handleTutorSelect = (tutor) => {
        setSelectedTutorId(tutor.id);
        setTutorSearchQuery(tutor.name);
        setShowTutorDropdown(false);
        setSelectedClassId('');
    };

    const handleTutorInputChange = (e) => {
        setTutorSearchQuery(e.target.value);
        if (selectedTutorId) {
            setSelectedTutorId('');
            setSelectedClassId('');
        }
    };

    const handleClassChange = (e) => setSelectedClassId(e.target.value);
    const handleMonthChange = (e) => setSelectedMonthYear(e.target.value);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-2">

            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Financials</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">View your class fee payment history across all enrolled classes.</p>
            </div>

            {/* Filter Controls Area */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-4 items-end">

                {/* Tutor Search */}
                <div className="w-full md:w-1/3 flex flex-col items-start gap-1 relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Search Tutor
                    </label>
                    <div className="relative w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <Input
                            type="text"
                            placeholder="Type tutor name..."
                            className="pl-10 !w-full"
                            value={tutorSearchQuery}
                            onFocus={() => setShowTutorDropdown(true)}
                            onBlur={() => setTimeout(() => setShowTutorDropdown(false), 200)}
                            onChange={handleTutorInputChange}
                            disabled={isLoadingClasses}
                        />
                    </div>

                    {/* Tutor Autocomplete Dropdown */}
                    {showTutorDropdown && tutorSuggestions.length > 0 && !selectedTutorId && (
                        <ul className="absolute z-50 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto top-[100%] mt-1">
                            {tutorSuggestions.map(tutor => (
                                <li
                                    key={tutor.id}
                                    className="cursor-pointer py-2 pl-3 pr-4 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                    onMouseDown={() => handleTutorSelect(tutor)}
                                >
                                    {tutor.name}
                                </li>
                            ))}
                        </ul>
                    )}
                    {showTutorDropdown && tutorSearchQuery && tutorSuggestions.length === 0 && !selectedTutorId && (
                        <div className="absolute z-50 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-md py-3 px-3 text-sm text-center text-gray-500 top-[100%] mt-1">
                            No tutors found.
                        </div>
                    )}
                </div>

                {/* Class Selection */}
                <div className="w-full md:w-1/3 flex flex-col items-start gap-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Select Class
                    </label>
                    <Select
                        value={selectedClassId}
                        onChange={handleClassChange}
                        disabled={isLoadingClasses}
                    >
                        <option value="">-- All Classes --</option>
                        {availableClasses.map(cls => (
                            <option key={cls.classId} value={cls.classId}>
                                {cls.className || cls.subject || 'Unknown Class'}
                            </option>
                        ))}
                    </Select>
                </div>

                {/* Month Picker */}
                <div className="w-full md:w-1/3 flex flex-col items-start gap-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Filter By Fee Month
                    </label>
                    <Input
                        type="month"
                        className="!w-full"
                        value={selectedMonthYear}
                        onChange={handleMonthChange}
                    />
                </div>

            </div>

            {/* Summary Statistics Boxes */}
            {!isLoadingFinancials && !error && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                    {/* Total Classes */}
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Enrolled Classes</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {selectedClassId ? 1 : enrolledClasses.filter(c => !selectedTutorId || c.tutorId === selectedTutorId).length}
                            </p>
                        </div>
                        <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
                            <BookOpen size={20} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                    </div>

                    {/* Total Amount Paid */}
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Amount Paid</p>
                            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                Rs. {stats.totalAmountPaid.toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                            <TrendingUp size={20} className="text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>

                    {/* Total Due Amount */}
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Due Amount</p>
                            <p className={`text-xl font-bold ${stats.totalDueAmount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                Rs. {stats.totalDueAmount.toLocaleString()}
                            </p>
                        </div>
                        <div className={`p-2 rounded-lg ${stats.totalDueAmount > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                            <TrendingDown size={20} className={stats.totalDueAmount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'} />
                        </div>
                    </div>

                </div>
            )}

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
                        <StudentFinancialsTable payments={payments} />
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

export default StudentFinancialsPage;
