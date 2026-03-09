import React from 'react';
import { MapPin } from 'lucide-react';
import { HOUR_HEIGHT } from '../organisms/ScheduleGrid';
import ClassCard from '../atoms/ClassCard';

/**
 * Molecule — A single vertical hall column in the schedule grid.
 * Renders the sticky hall header, hourly background grid lines, and
 * all class cards that belong to this hall.
 *
 * Props:
 *  hallName  {string}   – The name of the hall (e.g. "Hall A").
 *  classes   {Array}    – All class sessions filtered for this hall.
 *  hallIndex {number}   – Index used for unique grid-line keys.
 */
const HallColumn = ({ hallName, classes, hallIndex }) => {
    return (
        <div className="w-[180px] sm:w-[220px] border-r border-gray-200 dark:border-gray-700 flex flex-col relative shrink-0">

            {/* Sticky Hall Header */}
            <div className="h-12 sticky top-0 z-10 bg-gray-100/95 dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-sm">
                <span className="font-semibold text-sm text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                    <MapPin size={16} className="text-gray-400 shrink-0" />
                    {hallName}
                </span>
            </div>

            {/* Hall body — relative container for absolutely positioned cards */}
            <div className="relative bg-white dark:bg-gray-800/50" style={{ height: `${24 * HOUR_HEIGHT}px` }}>

                {/* Background hourly + half-hour grid lines */}
                {Array.from({ length: 24 }).map((_, i) => (
                    <div
                        key={`grid-${hallIndex}-${i}`}
                        className="relative border-b border-gray-200 dark:border-gray-700"
                        style={{ height: `${HOUR_HEIGHT}px` }}
                    >
                        {/* 30-min dashed divider */}
                        <div
                            className="absolute left-0 right-0 border-b border-dashed border-gray-100 dark:border-gray-700/40"
                            style={{ top: `${HOUR_HEIGHT / 2}px` }}
                        />
                    </div>
                ))}

                {/* Class cards */}
                {classes.map((cls) => (
                    <ClassCard key={cls.id} cls={cls} />
                ))}
            </div>
        </div>
    );
};

export default HallColumn;
