import React from 'react';
import { format, isSameDay, isSameMonth } from 'date-fns';

/**
 * Atom — A single clickable day cell inside the monthly calendar grid.
 *
 * Props:
 *  date           {Date}     – The date this card represents.
 *  currentMonth   {Date}     – The month currently in view (used to grey out off-month days).
 *  onClick        {Function} – Called with `date` when the card is clicked.
 */
const CalendarDayCard = ({ date, currentMonth, onClick }) => {
    const isCurrentMonth = isSameMonth(date, currentMonth);
    const isToday = isSameDay(date, new Date());

    return (
        <button
            onClick={() => onClick(date)}
            className={`
        flex flex-col items-center justify-center p-2 h-18 sm:h-23 w-full rounded-xl border
        transition-all duration-200 active:scale-95
        ${!isCurrentMonth
                    ? 'bg-transparent border-transparent text-gray-300 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5'
                }
        ${isToday ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}
      `}
        >
            <span
                className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-0.5 sm:mb-1
          ${isCurrentMonth ? 'text-gray-400' : 'text-gray-300 dark:text-gray-600'}`}
            >
                {format(date, 'EEE')}
            </span>
            <span
                className={`text-lg sm:text-2xl font-bold
          ${isCurrentMonth ? 'text-gray-800 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}
            >
                {format(date, 'd')}
            </span>
            {isToday && (
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 sm:mt-2" />
            )}
        </button>
    );
};

export default CalendarDayCard;
