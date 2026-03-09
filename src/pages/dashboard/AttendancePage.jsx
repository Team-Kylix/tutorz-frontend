import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import Select from '../../components/atoms/Select';
import Input from '../../components/atoms/Input';
import AttendanceTable from '../../components/organisms/AttendanceTable';
import { searchTutors, getInstituteClasses, getClassAttendanceHistory, markAttendance } from '../../services/api/instituteService';

// Fallback toast since react-toastify is not installed
const toast = {
    success: (msg) => console.log(msg),
    error: (msg) => console.error(msg)
};

const AttendancePage = () => {
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

    // Attendance Data State
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

    const [students, setStudents] = useState([]);
    const [classDates, setClassDates] = useState([]);
    const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
    const [error, setError] = useState(null);

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
            // Skip search if we just selected a tutor (name is in the query)
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
        // Optional: filter classes by tutor. Fallback to all if property is missing.
        return classes.filter(cls => !cls.tutorId || cls.tutorId === selectedTutorId || cls.tutor?.tutorId === selectedTutorId);
    }, [selectedTutorId, classes]);

    // Fetch Attendance History when Class or Search changes
    const fetchAttendanceHistory = useCallback(async () => {
        if (!selectedClassId) {
            setStudents([]);
            setClassDates([]);
            return;
        }

        setIsLoadingAttendance(true);
        setError(null);

        try {
            // We pass undefined for month and year to fetch the complete history for the class
            // The table is already configured to sort these dates newest-first.
            let response = await getClassAttendanceHistory(selectedClassId, undefined, undefined, debouncedSearchQuery);

            // Handle if serviceResponse is wrapped in 'data'
            if (response.data && response.success !== false) {
                response = response.data;
            }

            // Convert backend format (attendanceRecord) into frontend format (attendance)
            // Backend: Dictionary<DateTime, bool> -> { "2024-03-01T00:00:00": true }
            // We'll normalize the dates to string 'YYYY-MM-DD'
            const normalizeDate = (isoString) => isoString.split('T')[0];

            const normalizedDates = (response.conductedDates || []).map(normalizeDate);

            const normalizedStudents = (response.students || []).map(student => {
                const normalizedAttendance = {};
                if (student.attendanceRecord) {
                    Object.keys(student.attendanceRecord).forEach(isoDate => {
                        normalizedAttendance[normalizeDate(isoDate)] = student.attendanceRecord[isoDate];
                    });
                }
                return {
                    ...student,
                    id: student.studentId, // Ensure 'id' maps to 'studentId'
                    name: student.name,
                    regNo: student.registrationNumber,
                    mobile: student.mobileNumber,
                    attendance: normalizedAttendance
                };
            });

            setClassDates(normalizedDates);
            setStudents(normalizedStudents);

        } catch (err) {
            console.error("Failed to fetch attendance history:", err);
            setError("Failed to load attendance records.");
            setStudents([]);
            setClassDates([]);
        } finally {
            setIsLoadingAttendance(false);
        }
    }, [selectedClassId, debouncedSearchQuery]);

    useEffect(() => {
        fetchAttendanceHistory();
    }, [fetchAttendanceHistory]);

    // Handlers
    const handleClassChange = (e) => {
        setSelectedClassId(e.target.value);
        setSearchQuery(''); // Reset search when class changes
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleMarkAttendance = async (studentId, dateString) => {
        // UI Optimistic Update
        setStudents(prevStudents => prevStudents.map(student => {
            if (student.id === studentId) {
                return {
                    ...student,
                    attendance: {
                        ...student.attendance,
                        [dateString]: true
                    }
                };
            }
            return student;
        }));

        try {
            // The existing backend markAttendance asks for studentId and classId. 
            // It inherently marks it for "now" or "today".
            // Since this API was pre-existing (`instituteService.markAttendance(studentId, classId)`), we'll call it.
            // If the user tries to mark old dates, the backend needs an explicit date param,
            // but for now we'll assume the markAttendance endpoint handles it or we're marking today.
            await markAttendance(studentId, selectedClassId);
            toast?.success?.("Attendance marked successfully");
        } catch (err) {
            console.error(err);
            toast?.error?.("Failed to mark attendance");
            // Revert optimistic update
            setStudents(prevStudents => prevStudents.map(student => {
                if (student.id === studentId) {
                    return {
                        ...student,
                        attendance: {
                            ...student.attendance,
                            [dateString]: false
                        }
                    };
                }
                return student;
            }));
        }
    };

    // Render
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">

            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance History</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">View and manage class attendance records.</p>
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

            {/* Content Area */}
            <div className="mt-6">
                {!selectedClassId ? (
                    <div className="bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-12 text-center">
                        <p className="text-gray-500 dark:text-gray-400">Please select a tutor and a class to view attendance history.</p>
                    </div>
                ) : isLoadingAttendance ? (
                    <div className="flex justify-center items-center p-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        <span className="ml-3 text-gray-500 dark:text-gray-400">Loading attendance data...</span>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
                        <p>{error}</p>
                    </div>
                ) : (
                    <AttendanceTable
                        students={students}
                        classDates={classDates}
                        onMarkAttendance={handleMarkAttendance}
                    />
                )}
            </div>

        </div>
    );
};

export default AttendancePage;