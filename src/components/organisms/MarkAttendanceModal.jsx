import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, QrCode, AlertCircle, ChevronLeft, CheckCircle2, UserPlus, CreditCard, X } from 'lucide-react';
import Modal from '../molecules/Modal';
import Button from '../atoms/Button';
import StudentSelectionCard from '../molecules/StudentSelectionCard';
import ClassSelectionCard from '../molecules/ClassSelectionCard';
import PaymentModal from './PaymentModal';
import QrScanner from './QrScanner';
import {
    searchStudents,
    getStudentClassesForAttendance,
    markAttendance,
    getInstituteClassesToday,
    assignStudentToClass
} from '../../services/api/instituteService';

/**
 * MarkAttendanceModal (Rapid Attendance Marker)
 * High-speed multi-step modal for marking student attendance.
 */
const MarkAttendanceModal = ({ isOpen, onClose }) => {
    // Current Step: 1 (Search), 2 (Select Class)
    const [step, setStep] = useState(1);

    // Global Data
    const [todayClasses, setTodayClasses] = useState([]);
    const [isFetchingTodayClasses, setIsFetchingTodayClasses] = useState(false);

    // Step 1 State: Search
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const debounceTimer = useRef(null);
    const searchInputRef = useRef(null);

    // Step 2 State: Selected Student & Classes
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentClasses, setStudentClasses] = useState([]);
    const [isFetchingClasses, setIsFetchingClasses] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState(null);
    const [showAllTodayClasses, setShowAllTodayClasses] = useState(false); // For Assign & Mark flow

    // Submission & Feedback State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false); // New state for button success
    const [successToast, setSuccessToast] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    // Payment Modal State
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [paymentClass, setPaymentClass] = useState(null);

    // --- On Mount: Fetch Today's Classes ---
    useEffect(() => {
        if (isOpen) {
            fetchTodayClasses();
            resetFlow();
        }
    }, [isOpen]);

    // Auto-focus search input when returning to Step 1
    useEffect(() => {
        if (isOpen && step === 1 && searchInputRef.current) {
            // Small timeout ensures the modal animation completes before focusing
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        }
    }, [isOpen, step]);

    const fetchTodayClasses = async () => {
        setIsFetchingTodayClasses(true);
        try {
            const res = await getInstituteClassesToday();
            setTodayClasses(res.data || []);
        } catch (err) {
            console.error("Failed to fetch today's classes", err);
            setTodayClasses([]);
        } finally {
            setIsFetchingTodayClasses(false);
        }
    };

    const resetFlow = () => {
        setStep(1);
        setQuery('');
        setResults([]);
        setSelectedStudent(null);
        setStudentClasses([]);
        setSelectedClassId(null);
        setShowAllTodayClasses(false);
        setErrorMsg('');
        setSuccessToast(null);
        setIsSuccess(false); // Reset button success
        setIsSubmitting(false); // Reset submission state
        setIsPaymentOpen(false);
        setPaymentClass(null);
        setIsScanning(false);
    };

    // --- Search Logic ---
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }
        clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await searchStudents(query.trim());
                const data = res.data || [];
                setResults(data);
                
                // Auto-select if exact STU code match
                if (data.length === 1 && data[0].registrationNumber && data[0].registrationNumber.toUpperCase() === query.trim().toUpperCase()) {
                    handleSelectStudent(data[0]);
                }
            } catch (err) {
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300); // reduced debounce for "rapid" feel

        return () => clearTimeout(debounceTimer.current);
    }, [query]);

    // --- Step 1 -> 2: Select Student ---
    const handleSelectStudent = async (student) => {
        setSelectedStudent(student);
        setStep(2);
        setIsFetchingClasses(true);
        setErrorMsg('');
        setSelectedClassId(null);
        setShowAllTodayClasses(false);
        setIsSuccess(false); // reset button success going into step 2

        try {
            const res = await getStudentClassesForAttendance(student.roleSpecificId);
            setStudentClasses(res.data || []);
        } catch (err) {
            setStudentClasses([]);
        } finally {
            setIsFetchingClasses(false);
        }
    };

    // --- Quick Go Back ---
    const handleBack = () => {
        if (showAllTodayClasses) {
            setShowAllTodayClasses(false);
            setSelectedClassId(null);
        } else {
            setStep(1);
            setSelectedStudent(null);
            setStudentClasses([]);
            setSelectedClassId(null);
        }
        setErrorMsg('');
        setIsSuccess(false);
    };

    // --- Final Action: Mark / Assign & Mark ---
    const handleMarkAttendance = async () => {
        if (!selectedClassId || !selectedStudent) return;

        setIsSubmitting(true);
        setErrorMsg('');
        setIsSuccess(false);

        try {
            if (showAllTodayClasses) {
                // 1. Assign Flow ONLY
                await assignStudentToClass(selectedStudent.roleSpecificId, selectedClassId);

                triggerSuccessToast(`Assigned to Class!`);
                setIsSuccess(true);

                // Switch to Mark Attendance view with the class now available & pre-selected
                setTimeout(async () => {
                    setIsSuccess(false);
                    setShowAllTodayClasses(false);
                    setIsFetchingClasses(true);
                    setIsSubmitting(false); // Reset submitting immediately after transition starts
                    try {
                        const res = await getStudentClassesForAttendance(selectedStudent.roleSpecificId);
                        setStudentClasses(res.data || []);
                    } catch (err) {
                        console.error("Failed to refresh classes", err);
                    } finally {
                        setIsFetchingClasses(false);
                    }
                }, 800);

            } else {
                // 2. Mark Attendance Flow ONLY
                await markAttendance(selectedStudent.roleSpecificId, selectedClassId);

                triggerSuccessToast(`Present: ${selectedStudent.name}`);
                setIsSuccess(true);

                setTimeout(() => {
                    resetFlow();
                }, 800);
            }
        } catch (err) {
            setErrorMsg(err.message || 'Failed to complete action.');
            setIsSubmitting(false);
        }
    };

    const triggerSuccessToast = (msg) => {
        setSuccessToast(msg);
        setTimeout(() => setSuccessToast(null), 3000);
    };

    // --- Filtering Logic ---
    // Classes the student is enrolled in AND happening today
    const activeEnrolledClasses = studentClasses.filter(sc =>
        todayClasses.some(tc => (tc.id || tc.classId) === (sc.id || sc.classId))
    );

    // Other classes today (for Assign flow)
    const otherClassesToday = todayClasses.filter(tc =>
        !studentClasses.some(sc => (sc.id || sc.classId) === (tc.id || tc.classId))
    );

    // --- QR Scanner Handling ---
    const handleScanSuccess = (decodedText) => {
        setIsScanning(false);
        setQuery(decodedText.trim());
        triggerSuccessToast("QR successfully scanned!");
    };

    // --- Renderers ---
    const renderStep1 = () => (
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Action Bar */}
            <div className="flex gap-2">
                <Button 
                    variant={isScanning ? "danger" : "outline"} 
                    className="flex-1" 
                    onClick={() => setIsScanning(!isScanning)}
                >
                    {isScanning ? <X size={18} className="mr-2" /> : <QrCode size={18} className="mr-2" />}
                    {isScanning ? "Cancel Scan" : "Scan QR"}
                </Button>
            </div>

            {isScanning && (
                <div className="mt-2 animate-in fade-in slide-in-from-top-4">
                    <QrScanner 
                        onScanSuccess={handleScanSuccess} 
                        onScanError={(err) => { /* Suppress noisy scanner logs */ }} 
                    />
                </div>
            )}

            <div className="relative flex items-center">
                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-[10px] uppercase font-bold tracking-widest">or search manually</span>
                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
            </div>

            {/* Universal Search Input */}
            <div className="relative">
                <Search
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                {isSearching && (
                    <Loader2
                        size={18}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 animate-spin"
                    />
                )}
                <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Reg No, Mobile, or Name..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 rounded-2xl border-2 text-base font-medium shadow-sm
                        bg-white dark:bg-gray-800
                        border-gray-200 dark:border-gray-700
                        text-gray-900 dark:text-white
                        placeholder-gray-400
                        focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500
                        transition-all"
                />
            </div>

            {/* Hint */}
            {!query.trim() && (
                <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-800/50 mb-3 text-gray-400">
                        <Search size={24} />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Ready for rapid entry. Scan a code or type to search.
                    </p>
                </div>
            )}

            {/* No Results */}
            {query.trim() && !isSearching && results.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-8 text-gray-400 dark:text-gray-500">
                    <AlertCircle size={32} strokeWidth={1.5} />
                    <p className="text-sm">No students found matching "{query}"</p>
                </div>
            )}

            {/* Results Grid (Sibling Resolution) */}
            {results.length > 0 && (
                <div className="space-y-2 mt-4 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1 pb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Select Student</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {results.map(student => (
                            <StudentSelectionCard
                                key={student.roleSpecificId}
                                student={student}
                                onSelect={handleSelectStudent}
                                isSelected={false}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderStep2 = () => {
        // Display list changes based on mode
        const classesToList = showAllTodayClasses ? otherClassesToday : activeEnrolledClasses;

        return (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-150">
                {/* Header / Back */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleBack}
                            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                                {selectedStudent?.name?.charAt(0) || '?'}
                            </div>
                            <div>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white block leading-tight">
                                    {selectedStudent?.name}
                                </span>
                                <span className="text-[10px] text-gray-500">{selectedStudent?.registrationNumber}</span>
                            </div>
                        </div>
                    </div>
                    {successToast && (
                        <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full animate-in slide-in-from-top flex items-center gap-1">
                            <CheckCircle2 size={12} /> Success
                        </div>
                    )}
                </div>

                {isFetchingClasses ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500 gap-3">
                        <Loader2 size={28} className="animate-spin text-blue-500" />
                        <span className="text-sm font-medium">Cross-referencing active classes...</span>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                {showAllTodayClasses ? "Other Classes Today" : "Active Enrolled Classes"}
                            </h4>
                            {!showAllTodayClasses && (
                                <button
                                    onClick={() => {
                                        setShowAllTodayClasses(true);
                                        setErrorMsg('');
                                    }}
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
                                >
                                    Assign to new class
                                </button>
                            )}
                        </div>

                        {classesToList.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3 max-h-[45vh] overflow-y-auto custom-scrollbar pr-1 pb-4">
                                {classesToList.map((cls, index) => {
                                    const classIdentifier = cls.id || cls._id || cls.classId || index;
                                    return (
                                        <div key={classIdentifier} className="space-y-1">
                                            <ClassSelectionCard
                                                cls={cls}
                                                isSelected={selectedClassId === classIdentifier}
                                                onSelect={() => {
                                                    setSelectedClassId(classIdentifier);
                                                    setErrorMsg(''); // Clear error on new selection
                                                }}
                                                statusText={showAllTodayClasses ? 'Available' : 'Happening Now'}
                                                statusType={showAllTodayClasses ? 'normal' : 'active'}
                                            />
                                            {!showAllTodayClasses && selectedClassId === classIdentifier && errorMsg?.includes("already marked") && (
                                                
                                                    
                                                    <span className="text-[14px]  font-normal dark:text-red-300">
                                                        {errorMsg}
                                                    </span>
                                                
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                <AlertCircle size={32} className="mx-auto text-gray-400 mb-2" />
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                    {showAllTodayClasses ? "No other classes happening today." : "No active enrolled classes found."}
                                </p>
                                {!showAllTodayClasses && (
                                    <Button
                                        variant="outline"
                                        size="small"
                                        className="mt-3"
                                        onClick={() => {
                                            setShowAllTodayClasses(true);
                                            setErrorMsg('');
                                        }}
                                    >
                                        Browse all today's classes
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Error Feedback */}
                {errorMsg && !errorMsg.includes("already marked") && (
                    <div className="p-3 bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 rounded-lg text-sm flex items-center gap-2 animate-in slide-in-from-bottom-2">
                        <AlertCircle size={16} />
                        {errorMsg}
                    </div>
                )}

                {/* Action Area */}
                {classesToList.length > 0 && (
                    <div className="pt-2 sticky bottom-0 bg-white dark:bg-gray-900 pb-2 space-y-2">
                        {/* Mark Present */}
                        <Button
                            variant="primary"
                            fullWidth
                            disabled={!selectedClassId || isSubmitting || isSuccess}
                            onClick={handleMarkAttendance}
                            className={`py-3.5 shadow-md shadow-blue-500/20 text-base transition-colors ${isSuccess ? 'bg-green-500 hover:bg-green-600 focus:ring-green-500/50 shadow-green-500/20' : ''
                                }`}
                        >
                            {isSubmitting ? (
                                <><Loader2 size={18} className="animate-spin mr-2" />Processing...</>
                            ) : isSuccess ? (
                                <><CheckCircle2 size={18} className="mr-2" />Success!</>
                            ) : (
                                showAllTodayClasses ? (
                                    <><UserPlus size={18} className="mr-2" />Assign Class</>
                                ) : (
                                    <><CheckCircle2 size={18} className="mr-2" />Mark Present</>
                                )
                            )}
                        </Button>

                        {/* Make Payment — only shown in enrolled-class mode */}
                        {!showAllTodayClasses && (
                            <Button
                                variant="primary"
                                fullWidth
                                disabled={!selectedClassId}
                                onClick={() => {
                                    const found = classesToList.find(c =>
                                        (c.id || c.classId) === selectedClassId
                                    );
                                    if (found) {
                                        setPaymentClass(found);
                                        setIsPaymentOpen(true);
                                    }
                                }}
                                className="py-3.5 bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 text-base transition-colors"
                            >
                                <CreditCard size={18} className="mr-2" />
                                Make Payment
                            </Button>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            {/* FIX: Temporarily hide this modal if the payment modal is active */}
            <Modal
                isOpen={isOpen && !isPaymentOpen}
                onClose={onClose}
                title={
                    <div className="flex items-center gap-2">
                        {step === 1 ? "Rapid Attendance" : "Smart Class Confirm"}
                        {successToast && step === 1 && (
                            <span className="ml-auto text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full animate-in slide-in-from-top">
                                {successToast}
                            </span>
                        )}
                    </div>
                }
            >
                {step === 1 ? renderStep1() : renderStep2()}
            </Modal>

            {/* Payment Modal will now take full focus without overlapping */}
            <PaymentModal
                isOpen={isPaymentOpen}
                onClose={() => setIsPaymentOpen(false)}
                student={selectedStudent}
                cls={paymentClass}
            />
        </>
    );
};

export default MarkAttendanceModal;
