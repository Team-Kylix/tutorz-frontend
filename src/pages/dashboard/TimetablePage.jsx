import React, { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import CalendarGrid from '../../components/molecules/CalendarGrid';
import ScheduleGrid from '../../components/organisms/ScheduleGrid';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';

/**
 * TimetablePage
 *
 * Phase 1 (default): Shows a full monthly calendar grid (CalendarGrid).
 * Phase 2 (after date click): Shows the master schedule grid (ScheduleGrid).
 *
 * State:
 *  selectedDate   – The date the user picked, or null.
 *  isDateSelected – Boolean phase flag.
 */
const TimetablePage = () => {
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState(null);
    const [isDateSelected, setIsDateSelected] = useState(false);

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setIsDateSelected(true);
    };

    const handleBackToCalendar = () => {
        setIsDateSelected(false);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] animate-fade-in pb-4">

            {/* ── Page Header ── */}
            <div className="flex justify-between items-center mb-6 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                        <CalendarIcon className="w-6 h-6 text-blue-600" />
                        {user?.role === ROLES.STUDENT ? 'My Timetable' : 'InstiTuition Timetable'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {isDateSelected
                            ? 'Viewing schedule — click "Back to Calendar" to choose another date.'
                            : user?.role === ROLES.STUDENT
                                ? 'Select a date to view your enrolled classes.'
                                : 'Select a date to view all class schedules across different halls.'}
                    </p>
                </div>
            </div>

            {/* ── Main Card ── */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col flex-1">

                {/* Phase 1 — Calendar */}
                {!isDateSelected && (
                    <CalendarGrid onDateSelect={handleDateSelect} />
                )}

                {/* Phase 2 — Schedule Grid */}
                {isDateSelected && selectedDate && (
                    <ScheduleGrid
                        selectedDate={selectedDate}
                        onBack={handleBackToCalendar}
                    />
                )}
            </div>
        </div>
    );
};

export default TimetablePage;