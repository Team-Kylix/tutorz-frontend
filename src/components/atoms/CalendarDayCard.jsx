import React from 'react';
import { format, isSameDay, isSameMonth } from 'date-fns';

/**
 * Atom — A single clickable day cell inside the monthly calendar grid.
 *
 * Props:
 *  date           {Date}     – The date this card represents.
 *  currentMonth   {Date}     – The month currently in view (used to grey out off-month days).
 *  onClick        {Function} – Called with `date` when the card is clicked.
 *  hasClass       {boolean}  – True when this date has ≥1 class scheduled.
 *  classCount     {number}   – Number of classes scheduled (shown as a small number).
 */
const CalendarDayCard = ({ date, currentMonth, onClick, hasClass = false, classCount = 0 }) => {
    const isCurrentMonth = isSameMonth(date, currentMonth);
    const isToday        = isSameDay(date, new Date());
    const showIndicator  = hasClass && isCurrentMonth;

    return (
        <button
            onClick={() => onClick(date)}
            className={`
                relative flex flex-col items-center justify-center p-2 h-18 sm:h-23 w-full rounded-xl border
                transition-all duration-200 active:scale-95
                ${!isCurrentMonth
                    ? 'bg-transparent border-transparent text-gray-300 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                    : showIndicator
                        ? 'bg-white dark:bg-gray-800 border-indigo-200 dark:border-indigo-700/60 text-gray-700 dark:text-gray-200 hover:border-indigo-400 hover:shadow-md hover:-translate-y-0.5 shadow-sm'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5'
                }
                ${isToday ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}
            `}
        >
            {/* Day label e.g. "Mon" */}
            <span
                className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-0.5 sm:mb-1
                    ${isCurrentMonth ? 'text-gray-400' : 'text-gray-300 dark:text-gray-600'}`}
            >
                {format(date, 'EEE')}
            </span>

            {/* Day number */}
            <span
                className={`text-lg sm:text-2xl font-bold
                    ${isCurrentMonth
                        ? showIndicator
                            ? 'text-indigo-700 dark:text-indigo-300'
                            : 'text-gray-800 dark:text-white'
                        : 'text-gray-400 dark:text-gray-500'}`}
            >
                {format(date, 'd')}
            </span>

            {/* Bottom: class count number OR today dot */}
            <div className="flex items-center justify-center mt-1 sm:mt-1.5 min-h-[18px]">
                {showIndicator ? (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 leading-none tabular-nums">
                        {classCount}
                    </span>
                ) : isToday && isCurrentMonth ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                ) : null}
            </div>
        </button>
    );
};

export default CalendarDayCard;
