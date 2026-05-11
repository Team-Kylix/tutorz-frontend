import React from 'react';
import { Check, X } from 'lucide-react';

const AttendanceSquare = ({ isPresent = false, isAbsent = false, date, onClick, disabled = false }) => {

    const getStyles = () => {
        if (isPresent) {
            return 'bg-green-500 text-white shadow-sm cursor-default';
        }
        if (isAbsent) {
            return 'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 cursor-default';
        }
        return `bg-gray-200 dark:bg-gray-700 ${disabled ? 'cursor-default' : 'hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer'}`;
    };

    const getAriaLabel = () => {
        if (isPresent) return 'Present';
        if (isAbsent) return 'Absent';
        return 'Not recorded';
    };

    return (
        <button
            type="button"
            onClick={() => {
                if (!isPresent && !isAbsent && !disabled && onClick) {
                    onClick();
                }
            }}
            disabled={disabled || isPresent || isAbsent}
            title={date ? `${getAriaLabel()} — ${date}` : getAriaLabel()}
            className={`
                flex items-center justify-center
                w-8 h-8 rounded-md transition-all duration-200
                flex-shrink-0
                focus:outline-none focus:ring-2 focus:ring-blue-500
                ${getStyles()}
            `.trim()}
            aria-label={getAriaLabel()}
        >
            {isPresent && <Check size={16} strokeWidth={3} />}
            {isAbsent && <X size={15} strokeWidth={2.5} />}
        </button>
    );
};

export default AttendanceSquare;

