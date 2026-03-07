import React from 'react';
import { Check } from 'lucide-react'; // Assuming lucide-react is used for icons based on typical Tutorz setup

const AttendanceSquare = ({ isPresent = false, date, onClick, disabled = false }) => {
    // If the date is passed, we might want to show it in a tooltip or aria-label
    // The prompt just says green if true, gray if false/unmarked.

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled || isPresent} // Disable if already present or explicitly disabled
            title={date ? `Mark attendance for ${date}` : 'Mark attendance'}
            className={`
                flex items-center justify-center
                w-8 h-8 rounded-md transition-all duration-200
                flex-shrink-0
                hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500
                ${isPresent
                    ? 'bg-green-500 text-white shadow-sm'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                }
                ${(disabled || isPresent) ? 'cursor-default' : 'cursor-pointer'}
            `.trim()}
            aria-label={isPresent ? "Present" : "Unmarked"}
        >
            {isPresent && <Check size={16} strokeWidth={3} />}
        </button>
    );
};

export default AttendanceSquare;
