import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import Select from '../../components/atoms/Select';
import Input from '../../components/atoms/Input';
import FinancialsTable from '../../components/organisms/FinancialsTable';
import { searchTutors, getInstituteClasses } from '../../services/api/instituteService';
import { getClassPaymentHistory } from '../../services/api/paymentService'; // NEW

// Fallback toast
const toast = {
    success: (msg) => console.log(msg),
    error: (msg) => console.error(msg)
};

const FinancialsPage = () => {
    // Dropdown Data State
    const [classes, setClasses] = useState([]);
    const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true);

    // Selection State
    const [selectedTutorId, setSelectedTutorId] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');

    // Tutor Search State
    const [tutorSearchQuery, setTutorSearchQuery] = useState('');
    const [debouncedTutorQuery, setDebouncedTutorQuery] = useState('');
    const [tutorSuggestions, setTutorSuggestions] = useState([]);
    const [isSearchingTutors, setIsSearchingTutors] = useState(false);
    const [showTutorDropdown, setShowTutorDropdown] = useState(false);

    // Financial Data State
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

    const [payments, setPayments] = useState([]);
    const [isLoadingFinancials, setIsLoadingFinancials] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(null);

    // Summary Stats State
    const [stats, setStats] = useState({
        totalReceived: 0,
        teacherShare: 0,
        instituteShare: 0,
        totalStudents: 0
    });

    // Pagination State
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Debounce search query
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    // Debounce tutor search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedTutorQuery(tutorSearchQuery);
        }, 500);
        return () => clearTimeout(handler);
    }, [tutorSearchQuery]);

    // Fetch Tutor Suggestions
    useEffect(() => {
        const fetchTutors = async () => {
            if (!debouncedTutorQuery.trim()) {
                setTutorSuggestions([]);
                return;
            }
            // Skip search if we just selected a tutor
            if (selectedTutorId) return;

            setIsSearchingTutors(true);
            try {
                const res = await searchTutors(debouncedTutorQuery);
                const data = res.data ? res.data : res;
                setTutorSuggestions(data || []);
                setShowTutorDropdown(true);
            } catch (err) {
                console.error("Failed to search tutors:", err);
            } finally {
                setIsSearchingTutors(false);
            }
        };

        fetchTutors();
    }, [debouncedTutorQuery, selectedTutorId]);

    // Fetch Classes on Mount
    useEffect(() => {
        const fetchDropdownData = async () => {
            setIsLoadingDropdowns(true);
            try {
                // Fetch up to 100 classes to populate the dropdowns
                const classesRes = await getInstituteClasses('', 1, 100);
                const classesData = classesRes.data ? classesRes.data : classesRes;
                setClasses(classesData.items || classesData || []);
            } catch (err) {
                console.error("Failed to fetch dropdown data:", err);
                toast?.error?.("Failed to load classes.");
            } finally {
                setIsLoadingDropdowns(false);
            }
        };

        fetchDropdownData();
    }, []);

    // Derived State: Filter classes by the selected tutor
    const availableClasses = useMemo(() => {
        if (!selectedTutorId) return [];
        return classes.filter(cls => !cls.tutorId || cls.tutorId === selectedTutorId || cls.tutor?.tutorId === selectedTutorId);
    }, [selectedTutorId, classes]);

    // Fetch Payment History when Class, Search, or Page changes
    const fetchPaymentHistory = useCallback(async (currentPage = 1) => {
        if (!selectedClassId) {
            setPayments([]);
            return;
        }

        if (currentPage === 1) setIsLoadingFinancials(true);
        else setIsLoadingMore(true);

        setError(null);

        try {
            let response = await getClassPaymentHistory(selectedTutorId, selectedClassId, debouncedSearchQuery, currentPage, 10);

            if (response.data && response.success !== false) {
                response = response.data;
            }

            const items = response.paginatedPayments?.items || response.items || response || [];

            if (currentPage === 1) {
                setPayments(items);
                // Extract summary statistics
                setStats({
                    totalReceived: response.totalReceived || 0,
                    teacherShare: response.teacherShare || 0,
                    instituteShare: response.instituteShare || 0,
                    totalStudents: response.totalStudents || 0
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
    }, [selectedClassId, debouncedSearchQuery, selectedTutorId]);

    // Trigger fetch on filter change
    useEffect(() => {
        setPage(1);
        setHasMore(true);
        fetchPaymentHistory(1);
    }, [selectedClassId, debouncedSearchQuery, fetchPaymentHistory]);

    // Trigger fetch on page increment
    useEffect(() => {
        if (page > 1) {
            fetchPaymentHistory(page);
        }
    }, [page, fetchPaymentHistory]);

    // Infinite Scroll Listener
    const handleScroll = useCallback(() => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
            if (hasMore && !isLoadingFinancials && !isLoadingMore && selectedClassId) {
                setPage(prev => prev + 1);
            }
        }
    }, [hasMore, isLoadingFinancials, isLoadingMore, selectedClassId]);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    // Handlers
    const handleClassChange = (e) => {
        setSelectedClassId(e.target.value);
        setSearchQuery(''); // Reset search when class changes
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    // Render
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-2">

            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Class Financials</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">View class fee records and payment history.</p>
            </div>

            {/* Filter Controls Area */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-4 items-end">

                {/* Tutor Selection (Search) */}
                <div className="w-full md:w-1/4 flex flex-col items-start gap-1 relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Search Tutor
                    </label>
                    <div className="relative w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <Input
                            type="text"
                            placeholder="Type name, reg no or mobile..."
                            className="pl-10 relative !w-full"
                            value={tutorSearchQuery}
                            onFocus={() => setShowTutorDropdown(true)}
                            onBlur={() => setTimeout(() => setShowTutorDropdown(false), 200)}
                            onChange={(e) => {
                                setTutorSearchQuery(e.target.value);
                                if (selectedTutorId) {
                                    setSelectedTutorId(''); // Clear selection on new typing
                                    setSelectedClassId(''); // Reset class
                                }
                            }}
                            disabled={isLoadingDropdowns}
                        />
                        {isSearchingTutors && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                            </div>
                        )}
                    </div>

                    {/* Tutor Autocomplete Dropdown */}
                    {showTutorDropdown && tutorSuggestions.length > 0 && tutorSearchQuery && !selectedTutorId && (
                        <ul className="absolute z-50 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm top-[100%] mt-1">
                            {tutorSuggestions.map((tutor) => {
                                const tId = tutor.roleSpecificId || tutor.tutorId || tutor.id;
                                return (
                                    <li
                                        key={tId}
                                        className="text-gray-900 dark:text-gray-100 cursor-pointer select-none relative py-2 pl-3 pr-4 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        onMouseDown={() => {
                                            setSelectedTutorId(tId);
                                            setTutorSearchQuery(tutor.name || `${tutor.firstName || ''} ${tutor.lastName || ''}`.trim() || tutor.registrationNumber);
                                            setShowTutorDropdown(false);
                                            setSelectedClassId('');
                                        }}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-semibold">{tutor.name || `${tutor.firstName || ''} ${tutor.lastName || ''}`.trim()}</span>
                                            <div className="flex text-[10px] md:text-xs space-x-1 text-gray-500">
                                                <span>{tutor.registrationNumber || 'N/A'}</span>
                                                <span>•</span>
                                                <span>{tutor.phoneNumber || tutor.mobileNumber || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                    {showTutorDropdown && tutorSuggestions.length === 0 && !isSearchingTutors && tutorSearchQuery && !selectedTutorId && (
                        <div className="absolute z-50 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-md py-3 px-3 text-sm text-center text-gray-500 top-[100%] mt-1">
                            No tutors found.
                        </div>
                    )}
                </div>

                {/* Class Selection */}
                <div className="w-full md:w-1/4 flex flex-col items-start gap-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Select Class
                    </label>
                    <Select
                        value={selectedClassId}
                        onChange={handleClassChange}
                        disabled={!selectedTutorId || isLoadingDropdowns}
                    >
                        <option value="">-- Choose a Class --</option>
                        <option value="all">All Classes</option>
                        {availableClasses.map(cls => {
                            const cId = cls.classId || cls.id;
                            return (
                                <option key={cId} value={cId}>
                                    {cls.className || cls.name || `Class ${String(cId || '').substring(0, 4)}`}
                                </option>
                            );
                        })}
                    </Select>
                </div>

                {/* Search Bar - Flex Grow to take remaining space */}
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
                            onChange={handleSearchChange}
                            disabled={!selectedClassId}
                        />
                    </div>
                </div>

            </div>

            {/* Summary Statistics Boxes */}
            {selectedClassId && !isLoadingFinancials && !error && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Children</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalStudents}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Received</p>
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400">Rs. {stats.totalReceived.toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Teacher Share</p>
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">Rs. {stats.teacherShare.toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Institute Share</p>
                        <p className="text-xl font-bold text-purple-600 dark:text-purple-400">Rs. {stats.instituteShare.toLocaleString()}</p>
                    </div>
                </div>
            )}

            {/* Content Area */}
            <div className="mt-4">
                {!selectedClassId ? (
                    <div className="bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-12 text-center">
                        <p className="text-gray-500 dark:text-gray-400">Please select a tutor and a class to view financial records.</p>
                    </div>
                ) : isLoadingFinancials ? (
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

export default FinancialsPage;
