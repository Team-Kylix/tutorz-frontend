import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';

/**
 * RowActions — A reusable "⋮" kebab menu for table rows.
 *
 * Usage:
 *   <RowActions actions={[
 *     { label: 'Edit',   icon: Edit2,   onClick: () => handleEdit(row) },
 *     { label: 'Delete', icon: Trash2,  onClick: () => handleDelete(row), danger: true },
 *   ]} />
 *
 * The containing <td> must have: className="sticky right-0 ..." — apply this in each page.
 */
const RowActions = ({ actions = [] }) => {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);
    const menuRef = useRef(null);
    const buttonRef = useRef(null);
    
    // Positioning state
    const [coords, setCoords] = useState({ top: 0, right: 0, bottom: 'auto' });
    const [isDropUp, setIsDropUp] = useState(false);

    // Close when clicking outside
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            // If click is inside the button, handleOpen will toggle it.
            if (buttonRef.current && buttonRef.current.contains(e.target)) return;
            // If click is outside the menu, close it.
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    // Close on scroll or resize to prevent detached floating menu
    useEffect(() => {
        if (!open) return;
        const handleScroll = () => {
            setOpen(false);
        };
        // Use capture phase to catch all scroll events in any scrollable container
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
        };
    }, [open]);

    const handleOpen = (e) => {
        e.stopPropagation();
        if (!open && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const dropUpFlag = spaceBelow < 180;
            setIsDropUp(dropUpFlag);
            
            setCoords({
                right: window.innerWidth - rect.right,
                top: dropUpFlag ? 'auto' : rect.bottom + 4,
                bottom: dropUpFlag ? window.innerHeight - rect.top + 4 : 'auto'
            });
        }
        setOpen((prev) => !prev);
    };

    if (!actions || actions.length === 0) return null;

    const menuContent = open ? (
        <div
            ref={menuRef}
            style={{
                position: 'fixed',
                top: coords.top,
                bottom: coords.bottom,
                right: coords.right,
                zIndex: 25
            }}
            className={`w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1 text-sm animate-in fade-in zoom-in-95 duration-100`}
        >
            {actions.map((action, idx) => {
                const Icon = action.icon;
                return (
                    <button
                        key={idx}
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpen(false);
                            action.onClick(e);
                        }}
                        disabled={action.disabled}
                        className={`w-full flex items-center gap-2.5 px-4 py-2 transition-colors text-left ${
                            action.disabled
                                ? 'opacity-40 cursor-not-allowed text-gray-400'
                                : action.danger
                                ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                                : action.success
                                ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                    >
                        {Icon && <Icon size={15} className="shrink-0" />}
                        <span>{action.label}</span>
                    </button>
                );
            })}
        </div>
    ) : null;

    return (
        <div ref={containerRef} className="relative flex items-center justify-center">
            <button
                ref={buttonRef}
                onClick={handleOpen}
                className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 transition-colors focus:outline-none"
                title="Actions"
            >
                <MoreVertical size={16} />
            </button>
            {open && createPortal(menuContent, document.body)}
        </div>
    );
};

export default RowActions;
