import React, { useState, useEffect } from 'react';
import { 
    X, Loader2, AlertCircle, Repeat, Search
} from 'lucide-react';
import { 
    getStudentClassesForInstitute, 
    reassignStudentToInstituteClass,
    assignStudentToClass,
    getAssignedTutors
} from '../../services/api/instituteService';
import { 
    getStudentClassesForTutor,
    reassignStudentToTutorClass,
    getClasses
} from '../../services/api/tutorService';
import ConfirmationModal from '../molecules/ConfirmationModal';

const ReassignStudentModal = ({ isOpen, onClose, student, type, onUpdated }) => {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Reassignment state
    const [selectedOldClassId, setSelectedOldClassId] = useState('');
    const [tutors, setTutors] = useState([]);
    const [selectedTutorId, setSelectedTutorId] = useState('');
    const [tutorSearch, setTutorSearch] = useState('');
    const [showTutorDropdown, setShowTutorDropdown] = useState(false);
    const [targetClasses, setTargetClasses] = useState([]);
    const [selectedNewClassId, setSelectedNewClassId] = useState('');
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    useEffect(() => {
        if (isOpen && student) {
            fetchClasses();
            setError('');
            setSelectedOldClassId('');
            setSelectedTutorId('');
            setSelectedNewClassId('');
            setTutors([]);
            setTargetClasses([]);
            setTutorSearch('');
            setShowTutorDropdown(false);

            if (type === 'Tutor') {
                fetchTargetTutorClasses();
            } else {
                fetchTutors();
            }
        }
    }, [isOpen, student]);

    // Automatically set the old class if there's only 1 class available
    useEffect(() => {
        if (classes.length === 1 && !selectedOldClassId) {
            setSelectedOldClassId(classes[0].classId);
        }
    }, [classes]);

    const fetchClasses = async () => {
        try {
            setLoading(true);
            let res;
            if (type === 'Institute') {
                res = await getStudentClassesForInstitute(student.studentId);
            } else {
                res = await getStudentClassesForTutor(student.studentId);
            }
            if (res?.success) {
                setClasses(res.data || []);
            } else {
                setError(res?.message || 'Failed to load classes.');
            }
        } catch (err) {
            setError('Error loading current classes.');
        } finally {
            setLoading(false);
        }
    };

    const fetchTargetTutorClasses = async () => {
        try {
            setActionLoading(true);
            const res = await getClasses();
            if (Array.isArray(res)) {
                setTargetClasses(res);
            } else if (res?.success) {
                setTargetClasses(res.data || []);
            }
        } catch (err) {
            setError('Failed to load target classes.');
        } finally {
            setActionLoading(false);
        }
    };

    const fetchTutors = async (search = '') => {
        try {
            setActionLoading(true);
            const res = await getAssignedTutors(search);
            if (res?.success) {
                setTutors(res.data.items || []);
            }
        } catch (err) {
            setError('Failed to load tutors.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleTutorSelect = async (tutorId) => {
        setSelectedTutorId(tutorId);
        setSelectedNewClassId('');
        if (!tutorId) {
            setTargetClasses([]);
            return;
        }

        try {
            setActionLoading(true);
            const { getInstituteClasses } = await import('../../services/api/instituteService');
            const res = await getInstituteClasses('', 1, 100, tutorId);
            if (res?.success) {
                setTargetClasses(res.data.items || []);
            }
        } catch (err) {
            setError('Failed to load classes for tutor.');
        } finally {
            setActionLoading(false);
        }
    };

    const selectTutorFromSearch = (tutor) => {
        const fullName = `${tutor.firstName || ''} ${tutor.lastName || ''}`.trim();
        setTutorSearch(fullName);
        setShowTutorDropdown(false);
        handleTutorSelect(tutor.tutorId);
    };

    const handleClearTutor = () => {
        setTutorSearch('');
        setSelectedTutorId('');
        setSelectedNewClassId('');
        setTargetClasses([]);
        fetchTutors('');
    };

    const handleSubmitClick = () => {
        const isAssignOnly = classes.length === 0;
        if (!selectedNewClassId) {
            setError('Please select a target class.');
            return;
        }
        if (!isAssignOnly && !selectedOldClassId) {
            setError('Please select a current class.');
            return;
        }
        if (!isAssignOnly && selectedOldClassId === selectedNewClassId) {
            setError('Target class cannot be the same as the current class.');
            return;
        }
        setIsConfirmOpen(true);
    };

    const executeReassign = async () => {
        try {
            setActionLoading(true);
            setError('');
            
            const isAssignOnly = classes.length === 0;
            
            if (isAssignOnly) {
                if (type === 'Institute') {
                    await assignStudentToClass(student.studentId, selectedNewClassId);
                } else {
                    throw new Error('Assigning directly to a class is only supported for Institutes.');
                }
            } else {
                if (type === 'Institute') {
                    await reassignStudentToInstituteClass(student.studentId, selectedOldClassId, selectedNewClassId);
                } else {
                    await reassignStudentToTutorClass(student.studentId, selectedOldClassId, selectedNewClassId);
                }
            }
            
            if (onUpdated) onUpdated();
            onClose(); // Close modal immediately after success
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to reassign student.');
        } finally {
            setActionLoading(false);
            setIsConfirmOpen(false);
        }
    };

    if (!isOpen) return null;

    // Filter out the old class from the target classes list
    const availableTargetClasses = targetClasses.filter(c => c.classId !== selectedOldClassId);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {classes.length > 0 ? 'Reassign Class' : 'Assign to Class'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {student?.studentName || student?.firstName + ' ' + student?.lastName}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex flex-col justify-center items-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                            <p className="text-gray-500">Loading data...</p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {classes.length > 0 && (
                                <div className="p-4 bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-800/60 space-y-2.5">
                                    <label className="block text-sm font-semibold text-blue-900 dark:text-blue-300">
                                        Current Class (Move From)
                                    </label>
                                    <select
                                        value={selectedOldClassId}
                                        onChange={(e) => setSelectedOldClassId(e.target.value)}
                                        className="w-full p-3 bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-700/80 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                                    >
                                        <option value="">-- Select Current Class --</option>
                                        {classes.map(c => (
                                            <option key={c.classId} value={c.classId}>{c.className} ({c.classType} - {c.grade})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-800/60 space-y-4">
                                <label className="block text-sm font-semibold text-emerald-900 dark:text-emerald-300">
                                    Target Class ({classes.length > 0 ? 'Move To' : 'Assign To'})
                                </label>

                                {type === 'Institute' && (
                                    <div className="space-y-2">
                                        <label className="block text-xs font-medium text-emerald-800/80 dark:text-emerald-300/80">
                                            Select Target Tutor
                                        </label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600/60 dark:text-emerald-400/60" />
                                            <input
                                                type="text"
                                                placeholder="Search tutors by name..."
                                                value={tutorSearch}
                                                onFocus={() => {
                                                    setShowTutorDropdown(true);
                                                    if (tutors.length === 0) fetchTutors(tutorSearch);
                                                }}
                                                onBlur={() => setTimeout(() => setShowTutorDropdown(false), 200)}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setTutorSearch(val);
                                                    if (selectedTutorId) {
                                                        setSelectedTutorId('');
                                                        setSelectedNewClassId('');
                                                        setTargetClasses([]);
                                                    }
                                                    fetchTutors(val);
                                                    setShowTutorDropdown(true);
                                                }}
                                                className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-700/80 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm text-gray-900 dark:text-white"
                                            />
                                            {tutorSearch && (
                                                <button
                                                    type="button"
                                                    onClick={handleClearTutor}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 rounded-full"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}

                                            {/* Autocomplete Popup List */}
                                            {showTutorDropdown && (
                                                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-700 rounded-xl shadow-lg max-h-48 overflow-y-auto py-1 custom-scrollbar">
                                                    {tutors.length === 0 ? (
                                                        <div className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 text-center">
                                                            No tutors found.
                                                        </div>
                                                    ) : (
                                                        tutors.map((t) => (
                                                            <div
                                                                key={t.tutorId}
                                                                onMouseDown={(e) => e.preventDefault()}
                                                                onClick={() => selectTutorFromSearch(t)}
                                                                className={`px-4 py-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 cursor-pointer text-sm font-medium flex items-center justify-between transition-colors ${selectedTutorId === t.tutorId ? 'bg-emerald-50/80 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200' : 'text-gray-800 dark:text-gray-200'}`}
                                                            >
                                                                <span>{t.firstName} {t.lastName}</span>
                                                                {t.registrationNumber && (
                                                                    <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                                                                        {t.registrationNumber}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    {type === 'Institute' && (
                                        <label className="block text-xs font-medium text-emerald-800/80 dark:text-emerald-300/80">
                                            Select Target Class
                                        </label>
                                    )}
                                    <select
                                        value={selectedNewClassId}
                                        onChange={(e) => setSelectedNewClassId(e.target.value)}
                                        className="w-full p-3 bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-700/80 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={type === 'Institute' && !selectedTutorId}
                                    >
                                        <option value="">-- Select Target Class --</option>
                                        {availableTargetClasses.map(c => (
                                            <option key={c.classId} value={c.classId}>{c.className} ({c.classType} - {c.grade})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-6">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitClick}
                                    disabled={!selectedNewClassId || (classes.length > 0 && !selectedOldClassId) || actionLoading}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center gap-2 disabled:opacity-50"
                                >
                                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (classes.length > 0 ? <Repeat className="w-5 h-5" /> : null)}
                                    {classes.length > 0 ? 'Assign & Transfer' : 'Assign to Class'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={executeReassign}
                title="Reassign Student"
                message={classes.length > 0 ? "Are you sure you want to reassign this student to the new class? This action cannot be undone." : "Are you sure you want to assign this student to the new class?"}
                confirmLabel={classes.length > 0 ? "Reassign" : "Assign"}
                cancelLabel="Cancel"
                variant="primary"
                isSubmitting={actionLoading}
            />
        </div>
    );
};

export default ReassignStudentModal;
