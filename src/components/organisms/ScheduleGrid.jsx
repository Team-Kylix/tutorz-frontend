import React, { useState, useEffect, useRef } from 'react';
import { format, isSameDay } from 'date-fns';
import { ArrowLeft, CalendarDays, RefreshCw } from 'lucide-react';
import { getTimetableByDate as getInstituteTimetable } from '../../services/api/instituteService';
import { getTimetableByDate as getStudentTimetable } from '../../services/api/studentService';
import HallColumn from '../molecules/HallColumn';
import ClassFormModal from './ClassFormModal';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';

const HOUR_HEIGHT = 80; // px per hour

// Colour palette for subjects — deterministic by subject name hash
const SUBJECT_COLORS = [
    'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-200',
    'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-200',
    'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-200',
    'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-900/30 dark:border-rose-700 dark:text-rose-200',
    'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-200',
    'bg-indigo-50 border-indigo-200 text-indigo-800 dark:bg-indigo-900/30 dark:border-indigo-700 dark:text-indigo-200',
    'bg-teal-50 border-teal-200 text-teal-800 dark:bg-teal-900/30 dark:border-teal-700 dark:text-teal-200',
    'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-200',
];

const getSubjectColor = (subject = '') => {
    let hash = 0;
    for (let i = 0; i < subject.length; i++) hash = subject.charCodeAt(i) + ((hash << 5) - hash);
    return SUBJECT_COLORS[Math.abs(hash) % SUBJECT_COLORS.length];
};

/**
 * Converts an "HH:MM" time string to fractional hours (e.g. "09:30" → 9.5)
 */
const timeToHours = (hhmm) => {
    if (!hhmm) return 0;
    const [h, m] = hhmm.split(':').map(Number);
    return h + m / 60;
};

/**
 * Maps a raw InstituteClassDto from the backend into the shape used by ClassCard.
 */
const mapClassToCard = (cls) => {
    const startH = timeToHours(cls.startTime);
    const endH = timeToHours(cls.endTime);
    return {
        id: cls.classId,
        name: cls.className || cls.subject,
        teacher: cls.tutorName || 'Unknown',
        instituteName: cls.instituteName || null,
        subject: cls.subject,
        hallName: cls.hallName || 'Unknown Hall',
        startHour: startH,
        durationHours: Math.max(endH - startH, 0.25),
        timeString: `${cls.startTime} – ${cls.endTime}`,
        colors: getSubjectColor(cls.subject),
        grade: cls.grade,
        classType: cls.classType,
    };
};

/**
 * Organism — The full master schedule grid view.
 * Fetches real classes from the API for the selected date and renders them in hall columns.
 *
 * Props:
 *  selectedDate {Date}     – The date currently being viewed.
 *  onBack       {Function} – Called when the user clicks "Back to Calendar".
 */
const ScheduleGrid = ({ selectedDate, onBack }) => {
    const { user } = useAuth();
    const [viewDate, setViewDate] = useState(selectedDate);
    const [classes, setClasses] = useState([]);
    const [rawClasses, setRawClasses] = useState([]);  // raw API DTOs for view modal
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentTimeOffset, setCurrentTimeOffset] = useState(0);
    const [selectedClass, setSelectedClass] = useState(null); // class to view in modal
    const scrollContainerRef = useRef(null);

    const scrollToNow = () => {
        if (scrollContainerRef.current) {
            const top = Math.max(0, (new Date().getHours() - 1) * HOUR_HEIGHT);
            scrollContainerRef.current.scrollTop = top;
        }
    };

    // Fetch classes from API whenever viewDate changes
    useEffect(() => {
        const fetchClasses = async () => {
            setIsLoading(true);
            setError(null);
            try {
                let res;
                if (user?.role === ROLES.STUDENT) {
                    res = await getStudentTimetable(viewDate);
                } else {
                    res = await getInstituteTimetable(viewDate);
                }
                const rawClasses = res?.data || [];
                setRawClasses(rawClasses);
                setClasses(rawClasses.map(mapClassToCard));
            } catch (err) {
                console.error('Failed to load timetable:', err);
                setError('Failed to load classes. Please try again.');
                setClasses([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchClasses();
    }, [viewDate]);

    // Scroll to current time after classes render (grid only shows when classes.length > 0)
    useEffect(() => {
        if (classes.length > 0) {
            // Allow two animation frames so React finishes painting the grid before we scroll
            requestAnimationFrame(() => {
                requestAnimationFrame(() => scrollToNow());
            });
        }
    }, [classes]);

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


    // Derive unique columns from loaded classes. 
    // We group by "InstituteName||HallName", sorting first by Institute, then Hall.
    // If instituteName is null (e.g. for institute-side view), it falls back seamlessly to HallName.
    const columnKeys = [...new Set(classes.map(c => `${c.instituteName || ''}__||__${c.hallName || 'Unknown'}`))].sort();

    const columns = columnKeys.map(key => {
        const [inst, hall] = key.split('__||__');
        return {
            id: key,
            instituteName: inst || null,
            hallName: hall
        };
    });

    return (
        <div className="flex flex-col flex-1 h-full">

            {/* ── Schedule Toolbar ── */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-3 px-4 sm:px-6 shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h2 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100 text-center sm:text-left">
                    {format(viewDate, 'EEEE, MMMM d, yyyy')}
                </h2>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
                    <button
                        onClick={onBack}
                        className="flex items-center justify-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg transition-colors shadow-sm w-full sm:w-auto"
                    >
                        <ArrowLeft size={16} />
                        Back to Calendar
                    </button>
                    <button
                        onClick={() => { const today = new Date(); setViewDate(today); scrollToNow(); }}
                        className="flex items-center justify-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg transition-colors shadow-sm w-full sm:w-auto"
                    >
                        <CalendarDays size={16} />
                        Jump to Today
                    </button>
                </div>
            </div>

            {/* ── Loading / Error / Empty states ── */}
            {isLoading && (
                <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    <RefreshCw size={24} className="animate-spin text-blue-500 mr-3" />
                    Loading schedule…
                </div>
            )}

            {!isLoading && error && (
                <div className="flex-1 flex items-center justify-center text-red-500 dark:text-red-400 p-8 text-center">
                    {error}
                </div>
            )}

            {!isLoading && !error && classes.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 p-8">
                    <CalendarDays size={48} className="mb-4 opacity-30" />
                    <p className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-1">No classes scheduled</p>
                    <p className="text-sm text-center">There are no classes assigned to any hall on this date.</p>
                </div>
            )}

            {/* ── Master Grid ── */}
            {!isLoading && !error && classes.length > 0 && (
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
                            <div className="h-12 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 sticky top-0 z-30" />
                            {Array.from({ length: 24 }).map((_, i) => (
                                <div
                                    key={`hour-${i}`}
                                    className="relative border-b border-gray-200 dark:border-gray-700"
                                    style={{ height: `${HOUR_HEIGHT}px` }}
                                >
                                    <span className="absolute top-2 right-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-1 leading-none">
                                        {format(new Date().setHours(i, 0, 0, 0), 'h:mm a')}
                                    </span>
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
                        {columns.map((col, hallIndex) => (
                            <HallColumn
                                key={col.id}
                                hallName={col.hallName}
                                subtitle={col.instituteName}
                                hallIndex={hallIndex}
                                classes={classes.filter(c => c.hallName === col.hallName && (c.instituteName || null) === col.instituteName)}
                                onClassClick={(cardCls) => {
                                    // Find the matching raw DTO by id to pass to the modal
                                    const raw = rawClasses.find(r => r.classId === cardCls.id);
                                    setSelectedClass(raw || cardCls);
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* ── View-Only Class Detail Modal ── */}
            {selectedClass && (
                <ClassFormModal
                    isOpen={!!selectedClass}
                    onClose={() => setSelectedClass(null)}
                    initialData={selectedClass}
                    viewOnly={true}
                />
            )}
        </div>
    );
};

export { HOUR_HEIGHT };
export default ScheduleGrid;
