import React from 'react';
import AttendanceSquare from '../atoms/AttendanceSquare';

/**
 * @param {Array} students - Array of student objects containing id, name, regNo, mobile, and an attendance dictionary mapping date -> isPresent
 * @param {Array} classDates - Array of strings representing the dates for the month
 * @param {Function} onMarkAttendance - Callback signature (studentId, date)
 */
const AttendanceTable = ({ students = [], classDates = [], onMarkAttendance }) => {

    if (!students || students.length === 0) {
        return (
            <div className="w-full text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">No students available for the selected class.</p>
            </div>
        );
    }

    if (!classDates || classDates.length === 0) {
        return (
            <div className="w-full text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">No class dates found for this selection.</p>
            </div>
        );
    }

    // Sort dates from newest to oldest
    const sortedDates = [...classDates].sort((a, b) => new Date(b) - new Date(a));

    return (
        <div className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto relative">
                <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800/50 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 shadow-sm">
                        <tr>
                            {/* Sticky Left Column Header */}
                            <th scope="col" className="px-3 py-3 md:px-6 md:py-4 font-medium sticky left-0 z-20 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-w-[150px] md:min-w-[250px] lg:min-w-[300px] shadow-[1px_0_0_0_rgba(229,231,235,1)] dark:shadow-[1px_0_0_0_rgba(55,65,81,1)]">
                                Student Details
                            </th>

                            {/* Scrollable Dates Header */}
                            {sortedDates.map((dateString, index) => {
                                const dateObj = new Date(dateString);
                                const day = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                                const year = dateObj.getFullYear();

                                return (
                                    <th key={`header-date-${index}`} scope="col" className="px-2 py-3 md:px-4 md:py-4 font-medium text-center min-w-[60px] md:min-w-[80px]">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] md:text-xs">{day}</span>
                                            <span className="text-[8px] md:text-[10px] text-gray-400 font-normal">{year}</span>
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {students.map((student) => {
                            // Build a Set of dates the class was actually conducted for O(1) lookup
                            const conductedSet = new Set(student.classConductedDates || []);

                            return (
                            <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                {/* Sticky Student Info Column */}
                                <td className="px-3 py-3 md:px-6 md:py-4 sticky left-0 z-10 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-[1px_0_0_0_rgba(229,231,235,1)] dark:shadow-[1px_0_0_0_rgba(55,65,81,1)]">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-sm md:text-base text-gray-900 dark:text-white truncate max-w-[130px] md:max-w-none block">
                                            {student.name}
                                        </span>
                                        <div className="flex items-center text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mt-1 space-x-1 md:space-x-2">
                                            <span className="truncate max-w-[60px] md:max-w-[100px]">{student.regNo || 'N/A'}</span>
                                            <span>•</span>
                                            <span className="truncate max-w-[70px] md:max-w-[100px]">{student.mobile || 'N/A'}</span>
                                        </div>
                                    </div>
                                </td>

                                {/* Scrollable Attendance Squares */}
                                {sortedDates.map((dateString, index) => {
                                    const isPresent = !!(student.attendance && student.attendance[dateString]);
                                    // Absent = class was held that day, but this student has no present record
                                    const isAbsent = !isPresent && conductedSet.has(dateString);

                                    return (
                                        <td key={`student-${student.id}-date-${index}`} className="px-2 py-3 md:px-4 md:py-4 min-w-[60px] md:min-w-[80px]">
                                            <div className="flex justify-center">
                                                <AttendanceSquare
                                                    isPresent={isPresent}
                                                    isAbsent={isAbsent}
                                                    date={dateString}
                                                    onClick={() => {
                                                        if (!isPresent && !isAbsent && onMarkAttendance) {
                                                            onMarkAttendance(student.id, dateString);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AttendanceTable;