import React, { useState, useEffect, useRef } from 'react';
import { Search, CheckCircle2, UserPlus, Loader2, AlertCircle } from 'lucide-react';
import Modal from '../molecules/Modal';
import Button from '../atoms/Button';
import { searchStudents, searchTutors, assignStudent, sendTutorRequest } from '../../services/api/instituteService';

/**
 * InstituteSearchAssignModal
 * Allows an institute to search for existing students or tutors and assign them.
 *
 * Props:
 *   isOpen      - boolean
 *   onClose     - function
 *   type        - 'Student' | 'Tutor'
 *   onAssigned  - callback fired after a successful assignment
 */
const InstituteSearchAssignModal = ({ isOpen, onClose, type = 'Student', onAssigned }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [assigningId, setAssigningId] = useState(null); // roleSpecificId being assigned
    const [feedback, setFeedback] = useState({ id: null, type: '', message: '' });
    const debounceTimer = useRef(null);

    // Reset state whenever modal opens or type changes
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setResults([]);
            setIsSearching(false);
            setAssigningId(null);
            setFeedback({ id: null, type: '', message: '' });
        }
    }, [isOpen, type]);

    // Debounced search
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }
        clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const searchFn = type === 'Student' ? searchStudents : searchTutors;
                const res = await searchFn(query.trim());
                setResults(res.data || []);
            } catch (err) {
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 400);

        return () => clearTimeout(debounceTimer.current);
    }, [query, type]);

    const handleAssign = async (item) => {
        setAssigningId(item.roleSpecificId);
        setFeedback({ id: null, type: '', message: '' });
        try {
            const assignFn = type === 'Student' ? assignStudent : sendTutorRequest;
            await assignFn(item.roleSpecificId);
            setFeedback({ id: item.roleSpecificId, type: 'success', message: type === 'Student' ? 'Assigned successfully!' : 'Join request sent successfully!' });
            // Mark as assigned in local results
            setResults(prev =>
                prev.map(r => r.roleSpecificId === item.roleSpecificId ? { ...r, isAlreadyAssigned: true } : r)
            );
            if (onAssigned) onAssigned();
        } catch (err) {
            setFeedback({
                id: item.roleSpecificId,
                type: 'error',
                message: err.message || 'Assignment failed. Please try again.'
            });
        } finally {
            setAssigningId(null);
        }
    };

    const accentColor = type === 'Student' ? 'blue' : 'purple';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Search & Assign ${type}`}
        >
            <div className="space-y-4">
                {/* Search Input */}
                <div className="relative">
                    <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                    {isSearching && (
                        <Loader2
                            size={16}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin"
                        />
                    )}
                    <input
                        type="text"
                        placeholder={`Search by name or registration number…`}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        autoFocus
                        className={`w-full pl-9 pr-9 py-2.5 rounded-lg border text-sm
                            bg-gray-50 dark:bg-gray-800
                            border-gray-200 dark:border-gray-700
                            text-gray-900 dark:text-white
                            placeholder-gray-400
                            focus:outline-none focus:ring-2 focus:ring-${accentColor}-500/30 focus:border-${accentColor}-500
                            transition-colors`}
                    />
                </div>

                {/* Hint */}
                {!query.trim() && (
                    <p className="text-xs text-center text-gray-400 dark:text-gray-500 py-6">
                        Start typing to search for a {type.toLowerCase()}
                    </p>
                )}

                {/* No Results */}
                {query.trim() && !isSearching && results.length === 0 && (
                    <div className="flex flex-col items-center gap-2 py-8 text-gray-400 dark:text-gray-500">
                        <AlertCircle size={32} strokeWidth={1.5} />
                        <p className="text-sm">No {type.toLowerCase()}s found for &quot;{query}&quot;</p>
                    </div>
                )}

                {/* Results List */}
                {results.length > 0 && (
                    <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                        {results.map(item => {
                            const isBusy = assigningId === item.roleSpecificId;
                            const itemFeedback = feedback.id === item.roleSpecificId ? feedback : null;

                            return (
                                <div
                                    key={item.roleSpecificId}
                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all
                                        ${item.isAlreadyAssigned
                                            ? (type === 'Student' ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/40' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700')
                                            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:shadow-sm'
                                        }`}
                                >
                                    {/* Avatar */}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0
                                        ${type === 'Student'
                                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                                            : 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400'
                                        }`}
                                    >
                                        {item.name?.charAt(0) || '?'}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                                            {item.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {item.registrationNumber}
                                            {item.phoneNumber && ` · ${item.phoneNumber}`}
                                        </p>
                                        {/* Inline feedback */}
                                        {itemFeedback && (
                                            <p className={`text-xs mt-0.5 font-medium
                                                ${itemFeedback.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                                                {itemFeedback.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Action */}
                                    {item.isAlreadyAssigned ? (
                                        <span className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400 shrink-0">
                                            <CheckCircle2 size={15} />
                                            {type === 'Student' ? 'Assigned' : 'Requested / Assigned'}
                                        </span>
                                    ) : (
                                        <Button
                                            size="small"
                                            variant={type === 'Student' ? 'primary' : 'secondary'}
                                            onClick={() => handleAssign(item)}
                                            disabled={isBusy}
                                            className="shrink-0"
                                        >
                                            {isBusy ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <><UserPlus size={14} className="mr-1" />{type === 'Student' ? 'Assign' : 'Send Request'}</>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default InstituteSearchAssignModal;
