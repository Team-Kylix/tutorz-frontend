import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, QrCode, AlertCircle, ChevronLeft, CheckCircle2, UserPlus, CreditCard, X, AlertTriangle, WifiOff } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import Modal from '../molecules/Modal';
import Button from '../atoms/Button';
import StudentSelectionCard from '../molecules/StudentSelectionCard';
import ClassSelectionCard from '../molecules/ClassSelectionCard';
import PaymentModal from './PaymentModal';
import QrScanner from './QrScanner';
import {
    searchStudents,
    getStudentClassesForAttendance,
    getInstituteClassesToday,
    getInstituteClasses,
} from '../../services/api/instituteService';
import Input from '../atoms/Input';
import Select from '../atoms/Select';
import { enqueueAction, SYNC_ACTION_TYPES, selectPendingCount, selectUnseenConflicts, markConflictAsSeen, clearSeenConflicts, selectTombstones } from '../../store/syncSlice';

/**
 * MarkAttendanceModal (Rapid Attendance Marker)
 * High-speed multi-step modal for marking student attendance.
 */
const MarkAttendanceModal = ({ isOpen, onClose }) => {
    const dispatch = useDispatch();
    const pendingCount = useSelector(selectPendingCount);
    const conflicts = useSelector(selectUnseenConflicts);
    const tombstones = useSelector(selectTombstones);
    
    // Current Step: 1 (Search), 2 (Select Class)
    const [step, setStep] = useState(1);
    const [showConflicts, setShowConflicts] = useState(false);

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
    const [allInstituteClasses, setAllInstituteClasses] = useState([]);
    const [isFetchingAllClasses, setIsFetchingAllClasses] = useState(false);
    const [tutorSearchQuery, setTutorSearchQuery] = useState('');
    const [selectedGlobalClassId, setSelectedGlobalClassId] = useState('');
    const tutorSearchDebounce = useRef(null);

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

    // --- Server-side search for any class (by tutor/subject/name) ---
    useEffect(() => {
        if (!tutorSearchQuery.trim()) {
            setAllInstituteClasses([]);
            return;
        }

        clearTimeout(tutorSearchDebounce.current);
        tutorSearchDebounce.current = setTimeout(async () => {
            setIsFetchingAllClasses(true);
            try {
                // Fetch up to 50 results matching the query
                const res = await getInstituteClasses(tutorSearchQuery.trim(), 1, 50);
                const classes = res.data?.items || res.data?.Items || (Array.isArray(res.data) ? res.data : []);
                setAllInstituteClasses(classes);
            } catch (err) {
                console.error("Failed to search classes", err);
                setAllInstituteClasses([]);
            } finally {
                setIsFetchingAllClasses(false);
            }
        }, 400); // slightly longer debounce for server calls

        return () => clearTimeout(tutorSearchDebounce.current);
    }, [tutorSearchQuery]);

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
        setTutorSearchQuery('');
        setSelectedGlobalClassId('');
    };

    // --- Search Logic ---
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        // Do not trigger search for less than 4 numbers to avoid excessive queries for prefixes like '078'
        const isNumeric = /^\d+$/.test(query.trim());
        if (isNumeric && query.trim().length <= 3) {
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
        setTutorSearchQuery('');
        setSelectedGlobalClassId('');

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
        setTutorSearchQuery('');
        setSelectedGlobalClassId('');
    };

    // --- Final Action: Mark / Assign & Mark ---
    const handleMarkAttendance = async () => {
        if (!selectedClassId || !selectedStudent) return;

        setIsSubmitting(true);
        setErrorMsg('');
        setIsSuccess(false);

        try {
            if (showAllTodayClasses) {
                // ─── OPTIMISTIC UI: Assign to Class ────────────────────────
                // Add to queue immediately for instant response
                dispatch(enqueueAction({
                    actionType: SYNC_ACTION_TYPES.ASSIGN_TO_CLASS,
                    payload: {
                        studentId: selectedStudent.roleSpecificId,
                        classId: selectedClassId,
                    },
                    label: `Assign to Class: ${selectedStudent.name}`,
                    dedupeKey: `ASSIGN_${selectedStudent.roleSpecificId}_${selectedClassId}`,
                }));

                triggerSuccessToast(`Assigned to Class!`);
                setIsSuccess(true);
                setIsSubmitting(false);

                setTimeout(async () => {
                    setIsSuccess(false);
                    setShowAllTodayClasses(false);
                    setIsFetchingClasses(true);
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
                // ─── OPTIMISTIC UI: Attendance Marking ──────────────────────
                // 1. Find the class name for readable notifications
                const classObj = activeEnrolledClasses.find(
                    c => (c.id || c.classId) === selectedClassId
                );
                
                // 2. Instantly add to the persistent offline queue (no server wait!)
                dispatch(enqueueAction({
                    actionType: SYNC_ACTION_TYPES.MARK_ATTENDANCE,
                    payload: {
                        studentId: selectedStudent.roleSpecificId,
                        classId: selectedClassId,
                    },
                    label: `Mark Present: ${selectedStudent.name}`,
                    // Dedupe key prevents scanning the same student+class twice
                    dedupeKey: `ATTEND_${selectedStudent.roleSpecificId}_${selectedClassId}`,
                }));

                // 3. Show success toast and reset the form IMMEDIATELY
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

    /**
     * Returns true if this student+class combination has already been
     * marked (or confirmed as already-marked) during this session.
     */
    const isClassAlreadyMarked = (classIdentifier) => {
        if (!selectedStudent) return false;
        const dedupeKey = `ATTEND_${selectedStudent.roleSpecificId}_${classIdentifier}`;
        return tombstones.includes(dedupeKey);
    };

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
                                        setTutorSearchQuery('');
                                        setSelectedGlobalClassId('');
                                    }}
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
                                >
                                    Assign to new class
                                </button>
                            )}
                        </div>

                        {showAllTodayClasses && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/40 animate-in slide-in-from-top-4">
                                <h4 className="text-sm font-bold text-blue-800 dark:text-blue-400 mb-3 block">Search & Assign Any Class</h4>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <Input
                                            placeholder="Search Tutor Name..."
                                            value={tutorSearchQuery}
                                            onChange={(e) => {
                                                setTutorSearchQuery(e.target.value);
                                                setSelectedGlobalClassId('');
                                                // Deselect from "Other Classes Today" if someone interacts with search
                                                setSelectedClassId(null); 
                                            }}
                                            className="pl-9"
                                        />
                                    </div>
                                    {isFetchingAllClasses ? (
                                        <div className="flex items-center text-sm text-blue-600">
                                            <Loader2 size={14} className="animate-spin mr-2" /> Loading all classes...
                                        </div>
                                    ) : (
                                        <Select
                                            value={selectedGlobalClassId}
                                            onChange={(e) => {
                                                setSelectedGlobalClassId(e.target.value);
                                                setSelectedClassId(e.target.value);
                                            }}
                                            disabled={!tutorSearchQuery.trim()}
                                        >
                                            <option value="">-- Select Class --</option>
                                            {allInstituteClasses.map(c => {
                                                const cid = c.classId || c.ClassId || c.id || c.Id;
                                                const cname = c.className || c.ClassName || c.subject || c.Subject || "Class";
                                                const tname = c.tutorName || c.TutorName || "Unknown Tutor";
                                                return (
                                                    <option key={cid} value={cid}>
                                                        {cname} - {tname}
                                                    </option>
                                                );
                                            })}
                                        </Select>
                                    )}
                                    {!isFetchingAllClasses && tutorSearchQuery.trim() && allInstituteClasses.length === 0 && (
                                        <p className="text-[10px] text-red-500 italic">No classes found matching this search.</p>
                                    )}
                                </div>
                            </div>
                        )}

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
                                                <span className="text-[14px] font-normal dark:text-red-300">
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
                        {/* Mark Present — replaced by an info notice if already marked today */}
                        {!showAllTodayClasses && selectedClassId && isClassAlreadyMarked(selectedClassId) ? (
                            <div className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 text-sm font-semibold">
                                <CheckCircle2 size={18} />
                                Already marked present today
                            </div>
                        ) : (
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
                        )}

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
