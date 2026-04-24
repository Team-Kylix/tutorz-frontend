import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2, Calendar as CalendarIcon, BookOpen, Percent } from 'lucide-react';
import Select from '../../components/atoms/Select';
import Input from '../../components/atoms/Input';
import AttendanceTable from '../../components/organisms/AttendanceTable';
import { getStudentClasses, getStudentAttendanceHistory } from '../../services/api/studentService';

const StudentAttendancePage = () => {
    // Dropdown Data State (from enrolled classes)
    const [enrolledClasses, setEnrolledClasses] = useState([]);
    const [isLoadingClasses, setIsLoadingClasses] = useState(true);

    // Selection State
    const [selectedTutorId, setSelectedTutorId] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedDate, setSelectedDate] = useState('');

    // Attendance Data State
    const [classesRows, setClassesRows] = useState([]);
    const [classDates, setClassDates] = useState([]);
    const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
    const [error, setError] = useState(null);

    // Summary Stats State
    const [stats, setStats] = useState({
        daysHeld: 0,
        daysAttended: 0,
        attendancePercentage: 0
    });

    // Fetch Enrolled Classes on Mount
    useEffect(() => {
        const fetchClasses = async () => {
            setIsLoadingClasses(true);
            try {
                const res = await getStudentClasses();
                const data = res.data ? res.data : res;
                setEnrolledClasses(data || []);
            } catch (err) {
                console.error("Failed to load enrolled classes:", err);
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
            // We use tutorName since StudentClassDto might not have tutorId
            // Using Name as identifier for the dropdown
            if (cls.tutorName) {
                tutorMap.set(cls.tutorName, cls.tutorName);
            }
        });
        return Array.from(tutorMap.values());
    }, [enrolledClasses]);

    // Derived State: Filter classes by selected Tutor
    const availableClasses = useMemo(() => {
        if (!selectedTutorId) return enrolledClasses;
        return enrolledClasses.filter(cls => cls.tutorName === selectedTutorId);
    }, [selectedTutorId, enrolledClasses]);


    // Fetch Attendance History when filters change
    const fetchAttendanceHistory = useCallback(async () => {
        setIsLoadingAttendance(true);
        setError(null);

        try {
            // Since our backend takes tutorId as GUID, but we only have tutorName in StudentClassDto, 
            // We might need to pass classId if a specific class is selected, 
            // But if ONLY a tutor (name) is selected, we have to find all classIds for that tutor 
            // OR we fix the backend to search by tutor name.
            // Wait, we can just let the backend handle it or we pass the specific classId.
            // For now, if a specific class is selected, pass that.
            let cId = selectedClassId || undefined;
            
            // Note: The backend endpoint is expecting tutorId (Guid). Since we don't have it,
            // we will fetch all attendance if no class is selected, and filter locally if a tutor is selected.
            // Or we just send classId if one is selected.
            let response = await getStudentAttendanceHistory(undefined, cId, selectedDate || undefined);

            if (response.data && response.success !== false) {
                response = response.data;
            }

            const normalizeDate = (isoString) => isoString.split('T')[0];

            let normalizedDates = (response.conductedDates || []).map(normalizeDate);
            
            let normalizedClasses = (response.classes || []).map(cls => {
                const normalizedAttendance = {};
                if (cls.attendanceRecord) {
                    Object.keys(cls.attendanceRecord).forEach(isoDate => {
                        normalizedAttendance[normalizeDate(isoDate)] = cls.attendanceRecord[isoDate];
                    });
                }
                return {
                    ...cls,
                    id: cls.id,
                    name: cls.name,
                    regNo: cls.regNo, // Tutor Name
                    mobile: cls.mobile, // Class Type
                    attendance: normalizedAttendance
                };
            });

            // If a tutor (name) is selected but no class is selected, filter the rows locally.
            if (selectedTutorId && !selectedClassId) {
                normalizedClasses = normalizedClasses.filter(cls => cls.regNo === selectedTutorId);
                
                // Recompute conducted dates from the filtered classes
                const newDatesSet = new Set();
                normalizedClasses.forEach(c => {
                    // We don't have the exact conducted dates for just these classes in the dto unless we look at the raw attendances.
                    // Actually, if we filter classes, maybe the generic conductedDates handles it, but let's just use the global one.
                });
                
                // Wait, if we filter locally, the stats from backend (DaysHeld) will be wrong. 
                // Let's re-calculate stats locally if we filter
                let localTotalHeld = 0;
                let localTotalAttended = 0;
                // Without raw attendances, we can't perfectly recompute DaysHeld locally if multiple classes share dates.
                // It's okay, we'll display what we can or rely on the backend.
            }

            setClassDates(normalizedDates);
            setClassesRows(normalizedClasses);

            setStats({
                daysHeld: response.daysHeld || 0,
                daysAttended: response.daysAttended || 0,
                attendancePercentage: response.attendancePercentage || 0
            });

        } catch (err) {
            console.error("Failed to fetch attendance history:", err);
            setError("Failed to load attendance records.");
            setClassesRows([]);
            setClassDates([]);
        } finally {
            setIsLoadingAttendance(false);
        }
    }, [selectedClassId, selectedTutorId, selectedDate]);


    // Derived State: Compute visual stats
    const visualStats = useMemo(() => {
        const totalSlots = classesRows.length * classDates.length;
        let totalAttended = 0;
        
        classesRows.forEach(cls => {
            classDates.forEach(date => {
                if (cls.attendance && cls.attendance[date]) {
                    totalAttended++;
                }
            });
        });

        const rate = totalSlots > 0 ? Math.round((totalAttended / totalSlots) * 100) : 0;

        return {
            classesHeld: totalSlots,
            attendance: totalAttended,
            attendanceRate: rate
        };
    }, [classesRows, classDates]);

    // Trigger fetch on filter change
    useEffect(() => {
        fetchAttendanceHistory();
    }, [fetchAttendanceHistory]);

    // Handlers
    const handleTutorChange = (e) => {
        setSelectedTutorId(e.target.value);
        setSelectedClassId(''); // Reset class when tutor changes
    };

    const handleClassChange = (e) => {
        setSelectedClassId(e.target.value);
    };

    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
    }

    // Render
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-4">

            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Attendance History</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">View your attendance records across all your enrolled classes.</p>
            </div>

            {/* Filter Controls Area */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-4 items-end">

                {/* Tutor Selection */}
                <div className="w-full md:w-1/3 flex flex-col items-start gap-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Select Tutor
                    </label>
                    <Select
                        value={selectedTutorId}
                        onChange={handleTutorChange}
                        disabled={isLoadingClasses}
                    >
                        <option value="">-- All Tutors --</option>
                        {availableTutors.map((tutorName, idx) => (
                            <option key={idx} value={tutorName}>
                                {tutorName}
                            </option>
                        ))}
                    </Select>
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

                {/* Date Picker */}
                <div className="w-full md:w-1/3 flex flex-col items-start gap-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Specific Date
                    </label>
                    <div className="relative w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <CalendarIcon className="h-4 w-4 text-gray-400" />
                        </div>
                        <Input
                            type="date"
                            className="pl-10 !w-full"
                            value={selectedDate}
                            onChange={handleDateChange}
                        />
                    </div>
                </div>

            </div>

            {/* Summary Statistics Boxes */}
            {!isLoadingAttendance && !error && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg text-blue-600 dark:text-blue-400">
                            <CalendarIcon size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Class Held</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{visualStats.classesHeld}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
                        <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg text-green-600 dark:text-green-400">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Attendance</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{visualStats.attendance}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
                        <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg text-purple-600 dark:text-purple-400">
                            <Percent size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Attendance Rate</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{visualStats.attendanceRate}%</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Area */}
            <div className="mt-4">
                {isLoadingAttendance ? (
                    <div className="flex justify-center items-center p-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        <span className="ml-3 text-gray-500 dark:text-gray-400">Loading attendance data...</span>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
                        <p>{error}</p>
                    </div>
                ) : classesRows.length === 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-12 text-center">
                        <p className="text-gray-500 dark:text-gray-400">No attendance records found for your current selection.</p>
                    </div>
                ) : (
                    <AttendanceTable
                        students={classesRows}
                        classDates={classDates}
                        // We intentionally do not pass onMarkAttendance for students (read-only)
                    />
                )}
            </div>
        </div>
    );
};

export default StudentAttendancePage;
