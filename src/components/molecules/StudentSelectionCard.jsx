import React from 'react';
import { User } from 'lucide-react';

const StudentSelectionCard = ({ student, onSelect, isSelected }) => {
    return (
        <div
            onClick={() => onSelect(student)}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group ${isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                }`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(student);
                }
            }}
        >
            {/* Avatar / Photo */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 transition-colors ${isSelected
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50'
                }`}>
                {student.profilePic ? (
                    <img src={student.profilePic} alt={student.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                    student.name?.charAt(0) || <User size={20} />
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm truncate transition-colors ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300'
                    }`}>
                    {student.name}
                </p>
                <p className={`text-xs truncate ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                    {student.registrationNumber || "N/A"}
                    {student.phoneNumber && ` ${student.phoneNumber}`}
                </p>
            </div>

            {/* Action text */}
            <div className={`shrink-0 text-xs font-semibold px-2 transition-opacity ${isSelected ? 'opacity-100 text-blue-600 dark:text-blue-400' : 'opacity-0 group-hover:opacity-100 text-blue-500'
                }`}>
                {isSelected ? 'Selected' : 'Select'}
            </div>
        </div>
    );
};

export default StudentSelectionCard;
