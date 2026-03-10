import React from 'react';
import { Clock, User } from 'lucide-react';
import { HOUR_HEIGHT } from '../organisms/ScheduleGrid';

/**
 * Atom — A visually positioned class session card inside a Hall column.
 *
 * Props:
 *  cls     {Object}   – Mapped class object
 *  onClick {Function} – Called when card is clicked (for view-only modal)
 */
const ClassCard = ({ cls, onClick }) => {
    return (
        <div
            className="absolute w-full px-1.5 py-1 z-[2] transition-transform duration-200 hover:z-[8] hover:scale-[1.02] cursor-pointer"
            style={{
                top: `${cls.startHour * HOUR_HEIGHT}px`,
                height: `${cls.durationHours * HOUR_HEIGHT}px`,
            }}
            onClick={onClick}
            title={`${cls.name} — click to view details`}
        >
            <div className={`h-full w-full rounded-lg border ${cls.colors} p-3 shadow-sm flex flex-col justify-between overflow-hidden group hover:ring-2 hover:ring-offset-1 hover:ring-blue-400 dark:hover:ring-blue-500 transition-all`}>
                <div>
                    <div className="font-bold text-sm tracking-tight mb-1 truncate group-hover:whitespace-normal group-hover:break-words line-clamp-2">
                        {cls.name}
                    </div>
                    {cls.grade && (
                        <div className="text-xs opacity-70 mb-0.5 truncate">{cls.grade}</div>
                    )}
                    <div className="flex items-center text-xs opacity-80 gap-1.5 mb-1">
                        <Clock size={12} className="shrink-0" />
                        <span>{cls.timeString}</span>
                    </div>
                </div>
                <div className="flex items-center text-xs font-medium opacity-90 gap-1.5 mt-1 bg-white/40 dark:bg-black/20 rounded px-2 py-1 w-max max-w-full">
                    <User size={12} className="shrink-0" />
                    <span className="truncate">{cls.teacher}</span>
                </div>
            </div>
        </div>
    );
};

export default ClassCard;
