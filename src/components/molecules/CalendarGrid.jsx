import React, { useState, useEffect, useMemo } from 'react';
import {
    format,
    startOfMonth, endOfMonth,
    startOfWeek, endOfWeek,
    addDays, addMonths, subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CalendarDayCard from '../atoms/CalendarDayCard';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';
import { getClasses as getTutorClasses } from '../../services/api/tutorService';
import { getStudentClasses } from '../../services/api/studentService';
import { getAllInstituteClassesUnpaged } from '../../services/api/instituteService';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DOW_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Given a flat list of classes (each with dayOfWeek, classType, date),
 * returns a Map<'YYYY-MM-DD', number> of dates that have ≥1 class
 * for every day in [gridStart, gridEnd].
 */
const buildActiveDatesMap = (classes, gridStart, gridEnd) => {
    const map = new Map();
    let cursor = new Date(gridStart);
    while (cursor <= gridEnd) {
        const dateStr = format(cursor, 'yyyy-MM-dd');
        const dayName = DOW_NAMES[cursor.getDay()];
        const count = classes.filter(c => {
            if (c.classType === 'Class' || !c.classType) {
                return c.dayOfWeek === dayName;
            }
            // One-time session — match by exact date
            const classDate = c.date ? c.date.split('T')[0] : null;
            return classDate === dateStr;
        }).length;
        if (count > 0) map.set(dateStr, count);
        cursor = addDays(cursor, 1);
    }
    return map;
};

/**
 * Molecule — Full monthly calendar grid with prev/next navigation.
 * Fetches the user’s classes once on mount, then highlights dates that have
 * at least one class scheduled (coloured dot + count badge).
 *
 * Props:
 *  onDateSelect {Function} – Called with a Date when the user clicks a day.
 */
const CalendarGrid = ({ onDateSelect }) => {
    const { user } = useAuth();
    const [viewMonth, setViewMonth] = useState(new Date());
    const [allClasses, setAllClasses] = useState([]);

    // ─ Fetch classes once on mount (role-aware) ──────────────────────────────
    useEffect(() => {
        const load = async () => {
            try {
                let list = [];
                if (user?.role === ROLES.TUTOR) {
                    const res = await getTutorClasses();
                    list = res?.data ?? res ?? [];
                } else if (user?.role === ROLES.STUDENT) {
                    const res = await getStudentClasses();
                    // getStudentClasses returns { success, data: [...] } or an array
                    list = res?.data ?? res ?? [];
                } else if (user?.role === ROLES.INSTITUTE) {
                    const res = await getAllInstituteClassesUnpaged();
                    list = res?.data?.items ?? res?.items ?? res?.data ?? res ?? [];
                }
                setAllClasses(Array.isArray(list) ? list : []);
            } catch {
                // Silently fail — indicators just won’t show
                setAllClasses([]);
            }
        };
        load();
    }, [user?.role]); // eslint-disable-line react-hooks/exhaustive-deps

    // ─ Build the array of day cells (including off-month padding days) ─────────
    const monthStart = startOfMonth(viewMonth);
    const monthEnd   = endOfMonth(monthStart);
    const gridStart  = startOfWeek(monthStart);
    const gridEnd    = endOfWeek(monthEnd);

    const calendarDays = [];
    let cursor = gridStart;
    while (cursor <= gridEnd) {
        calendarDays.push(cursor);
        cursor = addDays(cursor, 1);
    }

    // ─ Active dates map: 'YYYY-MM-DD' → class count ───────────────────────────
    // Recomputed whenever viewMonth changes or allClasses loads.
    const activeDatesMap = useMemo(
        () => buildActiveDatesMap(allClasses, gridStart, gridEnd),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [allClasses, viewMonth]
    );

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
                    {calendarDays.map((day, idx) => {
                        const dateStr   = format(day, 'yyyy-MM-dd');
                        const classCount = activeDatesMap.get(dateStr) ?? 0;
                        return (
                            <CalendarDayCard
                                key={idx}
                                date={day}
                                currentMonth={viewMonth}
                                onClick={onDateSelect}
                                hasClass={classCount > 0}
                                classCount={classCount}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CalendarGrid;
