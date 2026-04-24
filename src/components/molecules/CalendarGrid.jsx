import React, { useState } from 'react';
import {
    format,
    startOfMonth, endOfMonth,
    startOfWeek, endOfWeek,
    addDays, addMonths, subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CalendarDayCard from '../atoms/CalendarDayCard';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Molecule — Full monthly calendar grid with prev/next navigation.
 *
 * Props:
 *  onDateSelect {Function} – Called with a Date when the user clicks a day.
 */
const CalendarGrid = ({ onDateSelect }) => {
    const [viewMonth, setViewMonth] = useState(new Date());

    // Build the array of day cells (including off-month padding days)
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(monthStart);
    const gridStart = startOfWeek(monthStart);
    const gridEnd = endOfWeek(monthEnd);

    const calendarDays = [];
    let cursor = gridStart;
    while (cursor <= gridEnd) {
        calendarDays.push(cursor);
        cursor = addDays(cursor, 1);
    }

    return (
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-800/50 overflow-y-auto">

            {/* Month Navigation Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                    {format(viewMonth, 'MMMM yyyy')}
                </h2>
                <div className="flex items-center gap-5">
                    <button
                        onClick={() => setViewMonth(subMonths(viewMonth, 1))}
                        className="p-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800"
                    >
                        <ChevronLeft size={20} className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <button
                        onClick={() => setViewMonth(new Date())}
                        className="px-3 sm:px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                    >
                        Today
                    </button>
                    <button
                        onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                        className="p-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800"
                    >
                        <ChevronRight size={20} className="text-gray-600 dark:text-gray-300" />
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 p-3 sm:p-6 flex flex-col">
                {/* Day-of-week labels */}
                <div className="grid grid-cols-7 gap-2 mb-2 sm:mb-3">
                    {WEEK_DAYS.map((d) => (
                        <div key={d} className="text-center font-bold text-gray-500 dark:text-gray-400 text-xs sm:text-sm uppercase tracking-wider">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-1.5 sm:gap-3 flex-1 items-start">
                    {calendarDays.map((day, idx) => (
                        <CalendarDayCard
                            key={idx}
                            date={day}
                            currentMonth={viewMonth}
                            onClick={onDateSelect}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CalendarGrid;
