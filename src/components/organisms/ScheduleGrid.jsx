import React, { useState, useEffect, useRef } from 'react';
import { format, isSameDay } from 'date-fns';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { HALLS, HOUR_HEIGHT, generateMockClassesForDate } from '../../data/timetableMockData';
import HallColumn from '../molecules/HallColumn';

/**
 * Organism — The full master schedule grid view.
 * Displays a sticky time axis on the left and scrollable hall columns.
 * Also renders a red current-time indicator line when today is selected.
 *
 * Props:
 *  selectedDate {Date}     – The date currently being viewed.
 *  onBack       {Function} – Called when the user clicks "Back to Calendar".
 */
const ScheduleGrid = ({ selectedDate, onBack }) => {
    // Local view date — starts from the prop but can be changed by "Jump to Today"
    const [viewDate, setViewDate] = useState(selectedDate);
    const [classes, setClasses] = useState([]);
    const [currentTimeOffset, setCurrentTimeOffset] = useState(0);
    const scrollContainerRef = useRef(null);

    // Scroll to current time
    const scrollToNow = () => {
        if (scrollContainerRef.current) {
            const top = Math.max(0, (new Date().getHours() - 1) * HOUR_HEIGHT);
            scrollContainerRef.current.scrollTop = top;
        }
    };

    // Load classes whenever viewDate changes
    useEffect(() => {
        setClasses(generateMockClassesForDate(viewDate));
    }, [viewDate]);

    // Keep the current-time line updated every minute
    useEffect(() => {
        const tick = () => {
            const now = new Date();
            setCurrentTimeOffset((now.getHours() + now.getMinutes() / 60) * HOUR_HEIGHT);
        };
        tick();
        const id = setInterval(tick, 60_000);
        return () => clearInterval(id);
    }, []);

    // Auto-scroll to 1 hour before current time on first mount
    useEffect(() => {
        scrollToNow();
    }, []);

    return (
        <div className="flex flex-col flex-1 h-full">

            {/* ── Schedule Toolbar ── */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-3 px-4 sm:px-6 shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                {/* Date title — full width on mobile, left on desktop */}
                <h2 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100 text-center sm:text-left">
                    {format(viewDate, 'EEEE, MMMM d, yyyy')}
                </h2>

                {/* Action buttons — stacked full-width on mobile, row on right on desktop */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
                    <button
                        onClick={onBack}
                        className="flex items-center justify-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg transition-colors shadow-sm w-full sm:w-auto"
                    >
                        <ArrowLeft size={16} />
                        Back to Calendar
                    </button>
                    <button
                        onClick={() => {
                            const today = new Date();
                            setViewDate(today);
                            scrollToNow();
                        }}
                        className="flex items-center justify-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg transition-colors shadow-sm w-full sm:w-auto"
                    >
                        <CalendarDays size={16} />
                        Jump to Today
                    </button>
                </div>
            </div>


            {/* ── Master Grid ── */}
            <div
                className="flex-1 overflow-auto relative bg-gray-50 dark:bg-gray-900 custom-scrollbar"
                ref={scrollContainerRef}
            >
                <div className="flex min-w-max relative pb-10">

                    {/* Red current-time line (shown only when today is viewed) */}
                    {isSameDay(viewDate, new Date()) && (
                        <div
                            className="absolute left-[80px] right-0 h-0.5 bg-red-500/80 z-[5] pointer-events-none transition-top duration-1000"
                            style={{ top: `${currentTimeOffset + 48}px` }}
                        >
                            <div className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                        </div>
                    )}

                    {/* ── Left Time Axis (sticky left + corner sticky top) ── */}
                    <div className="sticky left-0 z-20 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 w-[80px] shrink-0">
                        {/* Top-left intersection corner — sticky in BOTH axes */}
                        <div className="h-12 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 sticky top-0 z-30" />

                        {Array.from({ length: 24 }).map((_, i) => (
                            <div
                                key={`hour-${i}`}
                                className="relative border-b border-gray-200 dark:border-gray-700"
                                style={{ height: `${HOUR_HEIGHT}px` }}
                            >
                                {/* Hour label — positioned inside the top of its own row */}
                                <span className="absolute top-2 right-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-1 leading-none">
                                    {format(new Date().setHours(i, 0, 0, 0), 'h:mm a')}
                                </span>

                                {/* 30-minute sub-line + faint label */}
                                <div
                                    className="absolute left-0 right-0 border-b border-dashed border-gray-200 dark:border-gray-700/60"
                                    style={{ top: `${HOUR_HEIGHT / 2}px` }}
                                >
                                    <span className="absolute top-0.5 right-2 text-[10px] text-gray-300 dark:text-gray-600 leading-none">
                                        {format(new Date().setHours(i, 30, 0, 0), 'h:mm')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── Hall Columns ── */}
                    {HALLS.map((hall, hallIndex) => (
                        <HallColumn
                            key={hall}
                            hallName={hall}
                            hallIndex={hallIndex}
                            classes={classes.filter((c) => c.hall === hall)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ScheduleGrid;
