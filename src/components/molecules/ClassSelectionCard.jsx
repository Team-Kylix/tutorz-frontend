import React from 'react';
import { CheckCircle2, Clock, User, MapPin, Building2 } from 'lucide-react';

const ClassSelectionCard = ({ cls, isSelected, onSelect, actionNode, className = '', statusText, statusType = 'normal' }) => {

    // Status color mappings
    const statusColors = {
        normal: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    };

    const StatusBadge = statusText ? (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${statusColors[statusType] || statusColors.normal}`}>
            {statusType === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>}
            {statusText}
        </span>
    ) : null;

    return (
        <div
            onClick={(e) => {
                if (onSelect) onSelect(cls);
            }}
            className={`p-3 rounded-xl border-2 transition-all flex flex-col justify-between ${onSelect ? 'cursor-pointer hover:border-blue-300' : ''
                } ${isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                } ${className}`}
            role={onSelect ? "button" : "region"}
            tabIndex={onSelect ? 0 : undefined}
            onKeyDown={(e) => {
                if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onSelect(cls);
                }
            }}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0 pr-2">
                    <div className="flex flex-col sm:flex-row sm:items-center items-start gap-1.5 sm:gap-2 mb-1">
                        <p className="font-bold text-sm text-gray-900 dark:text-white leading-tight">
                            {cls.subject} {cls.grade ? `- ${cls.grade}` : ''}
                        </p>
                        {StatusBadge && (
                            <div className="shrink-0 mt-0.5 sm:mt-0">
                                {StatusBadge}
                            </div>
                        )}
                    </div>

                    {/* Time & Tutor Details */}
                    <div className="flex flex-col gap-1.5 mt-2">
                        {/* Day & Time */}
                        <span className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-1.5">
                            <Clock size={13} className="text-gray-400" />
                            {cls.day} {cls.startTime ? `· ${cls.startTime} - ${cls.endTime}` : ''}
                        </span>

                        {/* Additional Details row */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                            {cls.tutorName && (
                                <span className="flex items-center text-xs text-gray-600 dark:text-gray-300 gap-1.5 font-medium">
                                    <User size={13} className="text-blue-500" />
                                    {cls.tutorName}
                                </span>
                            )}
                            
                            {(cls.hallName || cls.hall) && (
                                <span className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-1.5">
                                    <MapPin size={13} className="text-purple-500" />
                                    {cls.hallName || cls.hall}
                                </span>
                            )}

                            {(cls.instituteName || cls.institute) && (
                                <span className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-1.5">
                                    <Building2 size={13} className="text-indigo-500" />
                                    {cls.instituteName || cls.institute}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {isSelected && !actionNode && (
                    <div className="shrink-0 text-blue-500 mt-1">
                        <CheckCircle2 size={20} />
                    </div>
                )}
            </div>

            {/* Optional dedicated action area (like the Assign & Mark button) */}
            {actionNode && (
                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/50 flex justify-end" onClick={(e) => e.stopPropagation()}>
                    {actionNode}
                </div>
            )}
        </div>
    );
};

export default ClassSelectionCard;
