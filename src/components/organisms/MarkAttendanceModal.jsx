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
    searchTutors,
} from '../../services/api/instituteService';
import { getClasses as getTutorClasses, searchEnrolledStudents, getStudentClassesForTutor, searchStudentsGlobalForTutor } from '../../services/api/tutorService';
import { useAuth } from '../../hooks/useAuth';
import { checkUserStatus } from '../../services/auth/authService';
import ConfirmationModal from '../molecules/ConfirmationModal';
import Input from '../atoms/Input';
import Select from '../atoms/Select';
import { enqueueAction, SYNC_ACTION_TYPES, selectPendingCount, selectUnseenConflicts, markConflictAsSeen, clearSeenConflicts, selectTombstones } from '../../store/syncSlice';

/**
 * StudentHub Modal
 * Multi-purpose modal for marking attendance, recording fee payments,
 * and assigning students to classes — all from a single fast flow.
 */
const MarkAttendanceModal = ({ isOpen, onClose, initialStudent = null }) => {
    const dispatch = useDispatch();
    const { user } = useAuth();
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
    const [loadingText, setLoadingText] = useState("Cross-referencing active classes...");
    const [selectedClassId, setSelectedClassId] = useState(null);
    const [assignmentMode, setAssignmentMode] = useState(null); // 'today' | 'search' | null
    const [allInstituteClasses, setAllInstituteClasses] = useState([]);
    const [isFetchingAllClasses, setIsFetchingAllClasses] = useState(false);
    const [tutorSearchQuery, setTutorSearchQuery] = useState('');
    const [selectedTutor, setSelectedTutor] = useState(null);
    const [tutorResults, setTutorResults] = useState([]);
    const [isSearchingTutors, setIsSearchingTutors] = useState(false);
    const [selectedGlobalClassId, setSelectedGlobalClassId] = useState('');
    const tutorSearchDebounce = useRef(null);

    // Submission & Feedback State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false); // New state for button success
    const [successToast, setSuccessToast] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [showMarkConfirm, setShowMarkConfirm] = useState(false); // Confirmation gate

    // Payment Modal State
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [paymentClass, setPaymentClass] = useState(null);

    // --- On Mount: Fetch Today's Classes ---
    useEffect(() => {
        if (isOpen) {
            if (user?.role === 'Tutor') {
                setSelectedTutor({
                    roleSpecificId: user.roleSpecificId,
                    name: user.name || [user.firstName, user.lastName].filter(Boolean).join(' '),
                });
            }
            fetchTodayClasses();
            if (initialStudent) {
                handleSelectStudent(initialStudent);
            } else {
                resetFlow();
            }
        }
    }, [isOpen, initialStudent, user]);

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
            if (user?.role === 'Tutor') {
                const res = await getTutorClasses();
                const fetched = res || [];
                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const todayName = days[new Date().getDay()];
                const filtered = fetched.filter(c => c.dayOfWeek === todayName);
                setTodayClasses(filtered);
            } else {
                const res = await getInstituteClassesToday();
                setTodayClasses(res.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch today's classes", err);
            setTodayClasses([]);
        } finally {
            setIsFetchingTodayClasses(false);
        }
    };

    // --- Search for Tutors within the institute ---
    useEffect(() => {
        if (!tutorSearchQuery.trim() || selectedTutor) {
            setTutorResults([]);
            return;
        }

        clearTimeout(tutorSearchDebounce.current);
        tutorSearchDebounce.current = setTimeout(async () => {
            setIsSearchingTutors(true);
            try {
                const res = await searchTutors(tutorSearchQuery.trim());
                // Filter to only show tutors already in the institute (pre-assigned)
                const tutors = (res.data || []).filter(t => t.isAlreadyAssigned);
                setTutorResults(tutors);
            } catch (err) {
                console.error("Failed to search tutors", err);
                setTutorResults([]);
            } finally {
                setIsSearchingTutors(false);
            }
        }, 400);

        return () => clearTimeout(tutorSearchDebounce.current);
    }, [tutorSearchQuery, selectedTutor]);

    // --- Fetch classes for selected tutor ---
    useEffect(() => {
        const fetchTutorClasses = async () => {
            if (!selectedTutor) {
                setAllInstituteClasses([]);
                return;
            }

            setIsFetchingAllClasses(true);
            try {
                let classesData = [];
                if (user?.role === 'Tutor') {
                    const res = await getTutorClasses();
                    classesData = res || [];
                } else {
                    const res = await getInstituteClasses('', 1, 100, selectedTutor.roleSpecificId);
                    classesData = res.data?.items || [];
                }
                setAllInstituteClasses(classesData);
            } catch (err) {
                console.error("Failed to fetch tutor classes", err);
                setAllInstituteClasses([]);
            } finally {
                setIsFetchingAllClasses(false);
            }
        };

        fetchTutorClasses();
    }, [selectedTutor, user]);

    const resetFlow = () => {
        setStep(1);
        setQuery('');
        setResults([]);
        setSelectedStudent(null);
        setStudentClasses([]);
        setSelectedClassId(null);
        setAssignmentMode(null);
        setErrorMsg('');
        setSuccessToast(null);
        setIsSuccess(false); // Reset button success
        setIsSubmitting(false); // Reset submission state
        setIsPaymentOpen(false);
        setPaymentClass(null);
        setIsScanning(false);
        setShowMarkConfirm(false);
        setTutorSearchQuery('');
        setTutorResults([]);
        setSelectedGlobalClassId('');
        if (user?.role === 'Tutor') {
            setSelectedTutor({
                roleSpecificId: user.roleSpecificId,
                name: user.name || [user.firstName, user.lastName].filter(Boolean).join(' '),
            });
        } else {
            setSelectedTutor(null);
        }
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
                let data = [];
                if (user?.role === 'Tutor') {
                    const res = await searchEnrolledStudents(query.trim());
                    data = res.data || res || [];
                } else {
                    const res = await searchStudents(query.trim());
                    data = res.data || [];
                }
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
        // If the ID is not a GUID (e.g. from an optimistic offline registration), resolve it first.
        const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(student.roleSpecificId);
        
        let resolvedStudent = student;
        setSelectedStudent(student);
        setStep(2);
        setIsFetchingClasses(true);
        setErrorMsg('');
        setSelectedClassId(null);
        setAssignmentMode(null);
        setIsSuccess(false); // reset button success going into step 2
        setTutorSearchQuery('');
        setSelectedGlobalClassId('');

        setLoadingText("Cross-referencing active classes...");

        if (!isGuid) {
            setLoadingText("Waiting for registration sync to complete...");
            let found = null;
            let attempts = 0;
            const maxAttempts = 15; // Wait up to ~22 seconds
            
            // Extract a clean search term - prefer first name only to avoid double-space issues
            const nameParts = student.name.trim().split(/\s+/).filter(Boolean);
            const searchTerm = nameParts[0] || student.name.trim(); // Use first word only
            
            while (!found && attempts < maxAttempts) {
                try {
                    await new Promise(r => setTimeout(r, 1500));
                    
                    if (student.isSiblingRegistration) {
                        let globalRes;
                        if (user?.role === 'Tutor') {
                            globalRes = await searchStudentsGlobalForTutor(student.roleSpecificId);
                        } else {
                            globalRes = await searchStudents(student.roleSpecificId);
                        }
                        
                        const siblingData = globalRes?.data || globalRes || [];
                        const matchedSibling = siblingData.find(s => {
                            const sName = (s.name || `${s.firstName || ''} ${s.lastName || ''}`).trim().toLowerCase();
                            const targetName = (student.name || '').trim().toLowerCase();
                            return sName === targetName;
                        });
                        
                        if (matchedSibling) {
                            found = matchedSibling;
                        }
                    } else {
                        const checkRes = await checkUserStatus({
                            phoneNumber: student.phoneNumber || null,
                            email: student.email || null
                        });
                        if (checkRes?.exists && checkRes.role === 'Student') {
                            found = {
                                roleSpecificId: checkRes.roleSpecificId || checkRes.userId,
                                name: checkRes.name,
                                phoneNumber: checkRes.phoneNumber,
                                email: checkRes.email
                            };
                        }
                    }
                } catch (e) {
                    // Ignore network errors while polling
                }
                attempts++;
            }

            if (found) {
                
                resolvedStudent = found;
                setSelectedStudent(resolvedStudent);
                setLoadingText("Cross-referencing active classes...");
            } else {
                setErrorMsg("Registration is taking longer than expected. Please try again later.");
                setIsFetchingClasses(false);
                return;
            }
        }

        try {
            let res;
            if (user?.role === 'Tutor') {
                res = await getStudentClassesForTutor(resolvedStudent.roleSpecificId);
                setStudentClasses(res.data || res || []);
            } else {
                res = await getStudentClassesForAttendance(resolvedStudent.roleSpecificId);
                setStudentClasses(res.data || []);
            }
        } catch (err) {
            setStudentClasses([]);
        } finally {
            setIsFetchingClasses(false);
        }
    };

    // --- Quick Go Back ---
    const handleBack = () => {
        if (assignmentMode) {
            setAssignmentMode(null);
            setSelectedClassId(null);
        } else {
            if (initialStudent) {
                onClose();
            } else {
                setStep(1);
                setSelectedStudent(null);
                setStudentClasses([]);
                setSelectedClassId(null);
            }
        }
        setErrorMsg('');
        setIsSuccess(false);
        setTutorSearchQuery('');
        if (user?.role === 'Tutor') {
            setSelectedTutor({
                roleSpecificId: user.roleSpecificId,
                name: user.name || [user.firstName, user.lastName].filter(Boolean).join(' '),
            });
        } else {
            setSelectedTutor(null);
        }
        setTutorResults([]);
        setSelectedGlobalClassId('');
    };

    // --- Final Action: Mark / Assign & Mark ---
    const handleMarkAttendance = async () => {
        if (!selectedClassId || !selectedStudent) return;

        setIsSubmitting(true);
        setErrorMsg('');
        setIsSuccess(false);

        try {
            if (assignmentMode === 'today' || assignmentMode === 'search') {
                // ─── OPTIMISTIC UI: Assign to Class ────────────────────────
                // Add to queue immediately for instant response
                // Find the class object from the available class lists (today's or search)
                const assignedClassObj = 
                    todayClasses.find(c => (c.id || c.classId) === selectedClassId) ||
                    allInstituteClasses.find(c => (c.id || c.classId) === selectedClassId);

                dispatch(enqueueAction({
                    actionType: SYNC_ACTION_TYPES.ASSIGN_TO_CLASS,
                    payload: {
                        studentId: selectedStudent.roleSpecificId,
                        classId: selectedClassId,
                    },
                    label: `Assign to Class: ${selectedStudent.name}`,
                    dedupeKey: `ASSIGN_${selectedStudent.roleSpecificId}_${selectedClassId}`,
                }));

                // ─── OPTIMISTIC UI: Inject the newly assigned class into the
                // Active Enrolled Classes list immediately — no server round-trip needed.
                if (assignedClassObj) {
                    setStudentClasses(prev => [...prev, assignedClassObj]);
                }

                triggerSuccessToast(`Assigned to Class!`);
                setIsSuccess(true);
                setIsSubmitting(false);

                setTimeout(() => {
                    setIsSuccess(false);
                    setAssignmentMode(null);
                    setSelectedClassId(null);
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
                setIsSubmitting(false);
                setTimeout(() => {
                    setIsSuccess(false);
                    setSelectedClassId(null);
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

    // --- Location & Role-based Filtering Logic ---
    const filterClassesByLocation = (classesList) => {
        if (!selectedStudent?.selectedInstituteId) return classesList;
        return classesList.filter(c => {
            if (selectedStudent.selectedInstituteId === 'own') {
                return !c.instituteId;
            } else {
                return c.instituteId === selectedStudent.selectedInstituteId;
            }
        });
    };

    const filteredTodayClasses = filterClassesByLocation(todayClasses);
    const filteredAllInstituteClasses = filterClassesByLocation(allInstituteClasses);

    // Filter studentClasses (active enrolled classes) to only show this tutor's classes if logged-in user is a Tutor
    const filteredStudentClasses = user?.role === 'Tutor' 
        ? studentClasses.filter(c => {
            const cid = c.classId || c.id;
            return filteredAllInstituteClasses.some(tc => (tc.classId || tc.id) === cid) ||
                   c.tutorId === user.roleSpecificId || 
                   c.tutorSpecificId === user.roleSpecificId;
          })
        : studentClasses;

    // Build a Set of today's class IDs for quick lookup
    const todayClassIdSet = new Set(filteredTodayClasses.map(tc => tc.id || tc.classId));

    // All classes the student is enrolled in, sorted:
    // 1. Today's classes first (sorted by startTime)
    // 2. Then other enrolled classes (sorted by startTime)
    const toMinutes = (t) => {
        if (!t) return 9999;
        const [h, m] = t.split(':').map(Number);
        return (h || 0) * 60 + (m || 0);
    };

    const activeEnrolledClasses = [...filteredStudentClasses].sort((a, b) => {
        const aIsToday = todayClassIdSet.has(a.id || a.classId);
        const bIsToday = todayClassIdSet.has(b.id || b.classId);
        // Today's classes float to top
        if (aIsToday !== bIsToday) return aIsToday ? -1 : 1;
        // Within same group, sort by startTime
        return toMinutes(a.startTime) - toMinutes(b.startTime);
    });

    // Other classes today (for Assign flow) - classes happening today the student isn't in
    const otherClassesToday = filteredTodayClasses.filter(tc =>
        !filteredStudentClasses.some(sc => (sc.id || sc.classId) === (tc.id || tc.classId))
    );

    /**
     * Returns true if this student+class combination has already been
     * marked (or confirmed as already-marked) during this session.
     */
    const isClassAlreadyMarked = (classIdentifier) => {
        if (!selectedStudent) return false;
        
        // 1. Check if backend already reported it as marked
        const classObj = filteredStudentClasses.find(c => (c.id || c.classId) === classIdentifier) || 
                         filteredTodayClasses.find(c => (c.id || c.classId) === classIdentifier);
                         
        if (classObj && classObj.isAttendanceMarkedToday) {
            return true;
        }

        // 2. Fallback to optimistic UI check for current session
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
        const isSearchMode = assignmentMode === 'search';
        const isTodayMode = assignmentMode === 'today';
        const classesToList = isTodayMode ? otherClassesToday : activeEnrolledClasses;

        // Filter out classes the student is already enrolled in
        const availableTutorClasses = filteredAllInstituteClasses.filter(tc => {
            const tcId = tc.classId || tc.ClassId || tc.id || tc.Id;
            return !filteredStudentClasses.some(sc => {
                const scId = sc.id || sc.classId || sc.ClassId;
                return scId === tcId;
            });
        });

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
                        <span className="text-sm font-medium">{loadingText}</span>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                            {isTodayMode ? "Other Classes Today" : isSearchMode ? "Search & Assign Any Class" : "Active Enrolled Classes"}
                        </h4>
                        {!assignmentMode && classesToList.length > 0 && (
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setAssignmentMode('search');
                                        setErrorMsg('');
                                        setTutorSearchQuery('');
                                    }}
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
                                >
                                    Assign to new class
                                </button>
                                <span className="text-gray-300 dark:text-gray-700">|</span>
                                <button
                                    onClick={() => {
                                        setAssignmentMode('today');
                                        setErrorMsg('');
                                    }}
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
                                >
                                    Browse all today's classes
                                </button>
                            </div>
                        )}
                        </div>

                        {isTodayMode && classesToList.length === 0 && (
                            <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                <AlertCircle size={32} className="mx-auto text-gray-400 mb-2" />
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                    No other classes happening today.
                                </p>
                            </div>
                        )}

                        {isSearchMode && (
                            <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                                <div className="space-y-3">
                                    {user?.role !== 'Tutor' && (
                                        <div className="relative">
                                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <Input
                                                placeholder="Tutor Name, Reg No or Mobile..."
                                                value={tutorSearchQuery}
                                                onChange={(e) => {
                                                    setTutorSearchQuery(e.target.value);
                                                    if (selectedTutor) {
                                                        setSelectedTutor(null);
                                                        setSelectedGlobalClassId('');
                                                        setSelectedClassId(null);
                                                    }
                                                }}
                                                className="pl-9"
                                            />
                                            {isSearchingTutors && (
                                                <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />
                                            )}
                                        </div>
                                    )}

                                    {/* Tutor Search Results Popover */}
                                    {!selectedTutor && tutorResults.length > 0 && (
                                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden max-h-40 overflow-y-auto">
                                            {tutorResults.map(tutor => (
                                                <button
                                                    key={tutor.roleSpecificId}
                                                    onClick={() => {
                                                        setSelectedTutor(tutor);
                                                        setTutorSearchQuery(tutor.name);
                                                        setTutorResults([]);
                                                    }}
                                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 border-b last:border-0 border-gray-100 dark:border-gray-800"
                                                >
                                                    <div className="font-semibold text-gray-900 dark:text-white">{tutor.name}</div>
                                                    <div className="text-[10px] text-gray-500">{tutor.registrationNumber} • {tutor.phoneNumber}</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {isFetchingAllClasses ? (
                                        <div className="flex items-center text-sm text-blue-600">
                                            <Loader2 size={14} className="animate-spin mr-2" /> Loading tutor classes...
                                        </div>
                                    ) : selectedTutor && availableTutorClasses.length > 0 ? (
                                        <div className="space-y-2">
                                            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 mb-1">
                                                {user?.role === 'Tutor' ? 'My Classes' : `Results for ${selectedTutor.name}`}
                                            </p>
                                            <div className="grid grid-cols-1 gap-3 max-h-[40vh] overflow-y-auto custom-scrollbar pr-1 pb-2">
                                                {availableTutorClasses.map((c, idx) => {
                                                    const cid = c.classId || c.ClassId || c.id || c.Id || `tutor-class-${idx}`;
                                                    return (
                                                        <ClassSelectionCard
                                                            key={cid}
                                                            cls={c}
                                                            isSelected={selectedClassId === cid}
                                                            onSelect={() => {
                                                                setSelectedGlobalClassId(cid);
                                                                setSelectedClassId(cid);
                                                                setErrorMsg('');
                                                            }}
                                                            statusText="Available to Enroll"
                                                            statusType="normal"
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : null}
                                    {!isFetchingAllClasses && selectedTutor && allInstituteClasses.length === 0 && (
                                        <p className="text-[10px] text-red-500 italic">This tutor has no classes registered in this institute.</p>
                                    )}
                                    {!isFetchingAllClasses && selectedTutor && allInstituteClasses.length > 0 && availableTutorClasses.length === 0 && (
                                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                            <p className="text-xs text-green-700 dark:text-green-400 font-semibold mb-1">Already Fully Enrolled!</p>
                                            <p className="text-[10px] text-green-600 dark:text-green-500 italic">The student is already enrolled in all {allInstituteClasses.length} class(es) conducted by {selectedTutor.name}.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {!isSearchMode && classesToList.length > 0 && (
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
                                                    setShowMarkConfirm(false); // Dismiss confirmation on class change
                                                }}
                                                statusText={isTodayMode ? 'Available' : todayClassIdSet.has(cls.id || cls.classId) ? 'Happening Now' : 'Enrolled'}
                                                statusType={isTodayMode ? 'normal' : todayClassIdSet.has(cls.id || cls.classId) ? 'active' : 'normal'}
                                            />
                                            {!isTodayMode && selectedClassId === classIdentifier && errorMsg?.includes("already marked") && (
                                                <span className="text-[14px] font-normal dark:text-red-300">
                                                    {errorMsg}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {!isTodayMode && !isSearchMode && classesToList.length === 0 && (
                            <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                <AlertCircle size={32} className="mx-auto text-gray-400 mb-2" />
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                    {studentClasses.length > 0 ? 'No classes scheduled for today.' : 'No active enrolled classes found.'}
                                </p>
                                <div className="flex flex-col gap-2 mt-4 px-10">
                                    <Button
                                        variant="outline"
                                        size="small"
                                        onClick={() => {
                                            setAssignmentMode('today');
                                            setErrorMsg('');
                                        }}
                                    >
                                        Browse all today's classes
                                    </Button>
                                    <Button
                                        variant="primary"
                                        size="small"
                                        onClick={() => {
                                            setAssignmentMode('search');
                                            setErrorMsg('');
                                            setTutorSearchQuery('');
                                        }}
                                    >
                                        Assign to new class
                                    </Button>
                                </div>
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
                {(classesToList.length > 0 || selectedClassId) && (
                    <div className="pt-2 sticky bottom-0 bg-white dark:bg-gray-900 pb-2 space-y-2">
                        {/* Mark Present — replaced by an info notice if already marked today */}
                        {!isTodayMode && !isSearchMode && selectedClassId && isClassAlreadyMarked(selectedClassId) ? (
                            <div className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 text-sm font-semibold">
                                <CheckCircle2 size={18} />
                                Already marked present today
                            </div>
                        ) : (
                            <Button
                                variant="primary"
                                fullWidth
                                disabled={!selectedClassId || isSubmitting || isSuccess}
                                onClick={() => {
                                    if (assignmentMode) {
                                        // Assignment flow — no confirmation needed
                                        handleMarkAttendance();
                                    } else {
                                        // Mark Present — show confirmation first
                                        setShowMarkConfirm(true);
                                    }
                                }}
                                className={`py-3.5 shadow-md shadow-blue-500/20 text-base transition-colors ${isSuccess ? 'bg-green-500 hover:bg-green-600 focus:ring-green-500/50 shadow-green-500/20' : ''
                                    }`}
                            >
                                {isSubmitting ? (
                                    <><Loader2 size={18} className="animate-spin mr-2" />Processing...</>
                                ) : isSuccess ? (
                                    <><CheckCircle2 size={18} className="mr-2" />Success!</>
                                ) : (
                                    assignmentMode ? (
                                        <><UserPlus size={18} className="mr-2" />Assign Class</>
                                    ) : (
                                        <><CheckCircle2 size={18} className="mr-2" />Mark Present</>
                                    )
                                )}
                            </Button>
                        )}

                        {/* Make Payment — only shown in enrolled-class mode */}
                        {!assignmentMode && (
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
                        {step === 1 ? "Student Hub" : "Confirm Action"}
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
                onPaymentSuccess={() => {
                    // Do nothing here; allow the user to continue interacting with the student hub
                }}
            />

            {/* Mark Present Confirmation */}
            <ConfirmationModal
                isOpen={showMarkConfirm}
                onClose={() => setShowMarkConfirm(false)}
                onCancel={() => setShowMarkConfirm(false)}
                onConfirm={() => {
                    setShowMarkConfirm(false);
                    handleMarkAttendance();
                }}
                title="Confirm Attendance"
                variant="primary"
                confirmLabel="Mark Present"
                cancelLabel="Cancel"
                isSubmitting={isSubmitting}
            >
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <p>Are you sure you want to mark this student as present? <strong>This action cannot be undone.</strong></p>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-1.5 mt-3 border border-gray-200 dark:border-gray-600">
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Student</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{selectedStudent?.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Class</span>
                            <span className="font-semibold text-gray-900 dark:text-white text-right max-w-[60%]">
                                {(() => {
                                    const cls = activeEnrolledClasses.find(c => (c.id || c.classId) === selectedClassId);
                                    return cls ? `${cls.subject}${cls.grade ? ` - ${cls.grade}` : ''}` : '—';
                                })()}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Time</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                                {(() => {
                                    const cls = activeEnrolledClasses.find(c => (c.id || c.classId) === selectedClassId);
                                    return cls?.startTime ? `${cls.startTime}${cls.endTime ? ` - ${cls.endTime}` : ''}` : '—';
                                })()}
                            </span>
                        </div>
                    </div>
                </div>
            </ConfirmationModal>
        </>
    );
};

export default MarkAttendanceModal;
