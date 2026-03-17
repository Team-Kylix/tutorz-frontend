import React, { useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * MonthStrip — Horizontal scrollable month ticker for the payment modal.
 *
 * Props:
 *   months         {Array}  — Array of MonthPaymentStatusDto: { month, year, status, monthName }
 *   selectedMonth  {Object} — Currently selected { month, year }
 *   onSelect       {Func}   — Called with { month, year } when user taps a chip
 */
const MonthStrip = ({ months = [], selectedMonth, onSelect }) => {
    const scrollRef = useRef(null);
    const selectedRef = useRef(null);

    // ── Initial Scroll to Selected/Current Month ──────────────────────────
    useEffect(() => {
        if (selectedRef.current) {
            selectedRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        }
    }, [months, selectedMonth]); // Re-run when months load or selection changes

    const scroll = (dir) => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: dir * 150, behavior: 'smooth' });
        }
    };

    const chipStyle = (item) => {
        const isSelected =
            selectedMonth?.month === item.month && selectedMonth?.year === item.year;

        let bg = '';
        let text = '';
        let ring = '';

        if (item.status === 'Paid') {
            bg = isSelected
                ? 'bg-green-600 shadow-lg shadow-green-500/30'
                : 'bg-green-100 dark:bg-green-900/40';
            text = isSelected
                ? 'text-white'
                : 'text-green-700 dark:text-green-300';
            ring = isSelected ? 'ring-2 ring-green-600 ring-offset-2 dark:ring-offset-gray-900' : '';
        } else if (item.status === 'Unpaid') {
            bg = isSelected
                ? 'bg-red-600 shadow-lg shadow-red-500/30'
                : 'bg-red-100 dark:bg-red-900/40';
            text = isSelected
                ? 'text-white'
                : 'text-red-700 dark:text-red-300';
            ring = isSelected ? 'ring-2 ring-red-500 ring-offset-2 dark:ring-offset-gray-900' : '';
        } else {
            // Future
            bg = isSelected
                ? 'bg-gray-400 dark:bg-gray-600'
                : 'bg-gray-100 dark:bg-gray-700/60';
            text = isSelected
                ? 'text-white'
                : 'text-gray-500 dark:text-gray-400';
            ring = isSelected ? 'ring-2 ring-gray-400 ring-offset-2 dark:ring-offset-gray-900' : '';
        }

        return `shrink-0 cursor-pointer select-none rounded-xl px-4 py-2.5 text-center transition-all duration-300 scroll-snap-align-center ${bg} ${text} ${ring} hover:scale-105 active:scale-95`;
    };

    return (
        <div className="flex items-center gap-2">
            {/* Left arrow */}
            <button
                onClick={() => scroll(-1)}
                className="p-1 shrink-0 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm active:scale-90"
                aria-label="Scroll left"
            >
                <ChevronLeft size={18} className="text-gray-500 dark:text-gray-400" />
            </button>

            {/* Scrollable chip row */}
            <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto scrollbar-hide flex-1 scroll-smooth py-2 px-1"
                style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    scrollSnapType: 'x mandatory'
                }}
            >
                {months.map((item) => {
                    const isSelected = selectedMonth?.month === item.month && selectedMonth?.year === item.year;
                    return (
                        <div
                            key={`${item.year}-${item.month}`}
                            ref={isSelected ? selectedRef : null}
                            className={chipStyle(item)}
                            style={{ scrollSnapAlign: 'center' }}
                            onClick={() => onSelect({ month: item.month, year: item.year })}
                            title={`${item.monthName}: ${item.status}`}
                        >
                            <p className="text-sm font-bold leading-tight whitespace-nowrap">
                                {new Date(item.year, item.month - 1).toLocaleString('default', { month: 'short' })}
                            </p>
                            <p className="text-[10px] leading-tight opacity-70 tracking-tight">{item.year}</p>
                        </div>
                    );
                })}
                {/* Spacer to allow centering last item */}
                <div className="shrink-0 w-12 h-1 invisible" />
            </div>

            {/* Right arrow */}
            <button
                onClick={() => scroll(1)}
                className="p-2 shrink-0 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm active:scale-90"
                aria-label="Scroll right"
            >
                <ChevronRight size={18} className="text-gray-500 dark:text-gray-400" />
            </button>
        </div>
    );
};

export default MonthStrip;
