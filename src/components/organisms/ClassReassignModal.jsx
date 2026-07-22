import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import Modal from '../molecules/Modal';
import ClassSelectionCard from '../molecules/ClassSelectionCard';
import ConfirmationModal from '../molecules/ConfirmationModal';
import { searchTutors, getInstituteClasses } from '../../services/api/instituteService';
import { getClasses as getTutorClasses } from '../../services/api/tutorService';

const ClassReassignModal = ({ isOpen, onClose, selectedClass, userRole, onSuccess }) => {
    // Steps: 1 (Search Tutor / Select Class), 2 (Confirm)
    const [step, setStep] = useState(1);
    const [tutorQuery, setTutorQuery] = useState('');
    const [tutors, setTutors] = useState([]);
    const [isSearchingTutors, setIsSearchingTutors] = useState(false);
    const [selectedTutor, setSelectedTutor] = useState(null);

    const [classes, setClasses] = useState([]);
    const [isFetchingClasses, setIsFetchingClasses] = useState(false);
    const [selectedNewClass, setSelectedNewClass] = useState(null);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [error, setError] = useState('');

    const debounceTimer = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setTutorQuery('');
            setTutors([]);
            setSelectedTutor(null);
            setClasses([]);
            setSelectedNewClass(null);
            setError('');

            if (userRole === 'Tutor') {
                fetchClassesForTutor();
            }
        }
    }, [isOpen, userRole]);

    // Handle Tutor Search (for Institute)
    useEffect(() => {
        if (userRole !== 'Institute') return;

        if (tutorQuery.trim().length >= 2) {
            setIsSearchingTutors(true);
            clearTimeout(debounceTimer.current);
            debounceTimer.current = setTimeout(async () => {
                try {
                    const data = await searchTutors(tutorQuery);
                    setTutors(data.data || []);
                } catch (err) {
                    setTutors([]);
                } finally {
                    setIsSearchingTutors(false);
                }
            }, 500);
        } else {
            setTutors([]);
        }
    }, [tutorQuery, userRole]);

    const fetchClassesForTutor = async () => {
        setIsFetchingClasses(true);
        setError('');
        try {
            const data = await getTutorClasses();
            // Filter out the current class
            setClasses(data.filter(c => c.classId !== selectedClass?.classId));
        } catch (err) {
            setError('Failed to fetch classes.');
        } finally {
            setIsFetchingClasses(false);
        }
    };

    const fetchClassesForInstituteTutor = async (tutorId) => {
        setIsFetchingClasses(true);
        setError('');
        try {
            // Get classes for this specific tutor in the institute
            const result = await getInstituteClasses('', 1, 100, tutorId);
            const classesList = result.data?.items || [];
            setClasses(classesList.filter(c => c.classId !== selectedClass?.classId));
        } catch (err) {
            setError('Failed to fetch classes.');
        } finally {
            setIsFetchingClasses(false);
        }
    };

    const handleTutorSelect = (tutor) => {
        setSelectedTutor(tutor);
        fetchClassesForInstituteTutor(tutor.roleSpecificId); // Use TutorId
    };

    const handleClassSelect = (cls) => {
        setSelectedNewClass(cls);
        setIsConfirmOpen(true);
    };

    const handleConfirmAssign = () => {
        setIsConfirmOpen(false);
        onSuccess(selectedNewClass.classId);
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Reassign Students" size="3xl">
                <div className="p-4 md:p-6 space-y-6">
                    {/* Header Info */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-center justify-between border border-blue-100 dark:border-blue-800">
                        <div>
                            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Reassigning students from</p>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                                {selectedClass?.className || 'Unknown Class'}
                            </h3>
                        </div>
                        <BookOpen className="text-blue-500 w-8 h-8 opacity-50" />
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 text-red-600 flex items-center gap-2">
                            <AlertCircle size={18} />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-4">
                            {userRole === 'Institute' && !selectedTutor && (
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">1. Search & Select Tutor</h4>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Search className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                                            placeholder="Search tutor by name or mobile..."
                                            value={tutorQuery}
                                            onChange={(e) => setTutorQuery(e.target.value)}
                                        />
                                        {isSearchingTutors && (
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                                <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Tutor Results */}
                                    {tutors.length > 0 && (
                                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700 max-h-60 overflow-y-auto">
                                            {tutors.map(tutor => (
                                                <div 
                                                    key={tutor.userId} 
                                                    className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer flex justify-between items-center transition-colors"
                                                    onClick={() => handleTutorSelect(tutor)}
                                                >
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">{tutor.name}</p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">{tutor.phoneNumber}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {(userRole === 'Tutor' || selectedTutor) && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                                            {userRole === 'Institute' ? `2. Select a class by ${selectedTutor.name}` : 'Select destination class'}
                                        </h4>
                                        {userRole === 'Institute' && (
                                            <button 
                                                onClick={() => { setSelectedTutor(null); setClasses([]); }}
                                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                            >
                                                Change Tutor
                                            </button>
                                        )}
                                    </div>

                                    {isFetchingClasses ? (
                                        <div className="flex justify-center p-8">
                                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2 pb-2">
                                            {classes.length > 0 ? (
                                                classes.map(cls => (
                                                    <div 
                                                        key={cls.classId}
                                                        onClick={() => handleClassSelect(cls)}
                                                        className="cursor-pointer"
                                                    >
                                                        <ClassSelectionCard 
                                                            cls={cls} 
                                                            selected={false} 
                                                        />
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                                    No other classes available for reassignment.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Modal>

            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmAssign}
                title="Confirm Reassignment"
                message={`Are you sure you want to reassign all students from ${selectedClass?.className} to ${selectedNewClass?.className}? Is this correct? This cannot unchange.`}
                confirmLabel="Reassign Students"
                cancelLabel="Cancel"
                variant="warning"
            />
        </>
    );
};

export default ClassReassignModal;
