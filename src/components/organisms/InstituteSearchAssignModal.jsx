import React, { useState, useEffect, useRef } from 'react';
import { Search, CheckCircle2, UserPlus, Loader2, AlertCircle, GraduationCap, Save } from 'lucide-react';
import Modal from '../molecules/Modal';
import Button from '../atoms/Button';
import FormField from '../molecules/FormField';
import Select from '../atoms/Select';
import QuickActionCard from '../molecules/QuickActionCard';
import ConfirmationModal from '../molecules/ConfirmationModal';
import OtpVerificationModal from './OtpVerificationModal';

import { checkUserStatus, register, sendOtp, verifyOtp, registerSibling } from '../../services/auth/authService';
import { searchStudents, searchTutors, assignStudent, sendTutorRequest, getInstituteProfile } from '../../services/api/instituteService';
import { validatePhoneNumber } from '../../utils/validators';

const GRADE_GROUPS = [
    { label: "Primary Education", options: ['Preschool', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'] },
    { label: "Secondary Education", options: ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11 (O/L)', 'Grade 12 (A/L)', 'Grade 13 (A/L)'] },
    { label: "Other", options: ['Course', 'Seminar', 'Workshop'] }
];

const InstituteSearchAssignModal = ({ isOpen, onClose, type = null, onAssigned, user }) => {
    // Flow states
    // steps: 'role-picker' | 'choice' | 'search' | 'check' | 'register-student' | 'register-tutor' | 'success'
    const [step, setStep] = useState('role-picker');
    const [selectedRole, setSelectedRole] = useState(type); // 'Student' or 'Tutor'

    // Institute Profile
    const [instituteProfile, setInstituteProfile] = useState(null);

    // Search Mode State
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [assigningId, setAssigningId] = useState(null);
    const [feedback, setFeedback] = useState({ id: null, type: '', message: '' });
    const debounceTimer = useRef(null);

    // Registration Flow States
    const [checkData, setCheckData] = useState({ email: '', mobile: '' });
    const [isChecking, setIsChecking] = useState(false);
    const [checkError, setCheckError] = useState('');
    const [existingUser, setExistingUser] = useState(null);
    
    // Sub Modals states (overlays)
    const [isExistingUserModalOpen, setIsExistingUserModalOpen] = useState(false);
    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState({ title: '', message: '' });

    const [isRegistering, setIsRegistering] = useState(false);
    const [isSiblingRegistration, setIsSiblingRegistration] = useState(false);
    const [siblingVerificationToken, setSiblingVerificationToken] = useState(null);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        grade: '',
        bio: '',
        bankAccountNumber: '',
        bankName: '',
        experienceYears: 0
    });

    // Reset and Initialize on Open
    useEffect(() => {
        if (isOpen) {
            setStep(type ? 'check' : 'role-picker');
            setSelectedRole(type);
            
            // Search resets
            setQuery('');
            setResults([]);
            setIsSearching(false);
            setAssigningId(null);
            setFeedback({ id: null, type: '', message: '' });

            // Check resets
            setCheckData({ email: '', mobile: '' });
            setCheckError('');
            setIsChecking(false);
            setExistingUser(null);

            // Sub modals resets
            setIsExistingUserModalOpen(false);
            setIsOtpModalOpen(false);
            
            // Form resets
            setFormData({ firstName: '', lastName: '', grade: '', bio: '', bankAccountNumber: '', bankName: '', experienceYears: 0 });
            setIsSiblingRegistration(false);
            setSiblingVerificationToken(null);
            setIsRegistering(false);

            // Fetch profile if needed
            if (!instituteProfile && user?.userId) {
                getInstituteProfile(user.userId).then(res => {
                    if (res?.success) setInstituteProfile(res.data);
                }).catch(err => console.error("Failed to fetch institute profile", err));
            }
        }
    }, [isOpen, type, user]);

    // --- Search Logic ---
    useEffect(() => {
        if (step !== 'search') return;

        if (!query.trim()) {
            setResults([]);
            return;
        }
        clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const searchFn = selectedRole === 'Student' ? searchStudents : searchTutors;
                const res = await searchFn(query.trim());
                setResults(res.data || []);
            } catch (err) {
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 400);

        return () => clearTimeout(debounceTimer.current);
    }, [query, selectedRole, step]);

    const handleAssign = async (item) => {
        setAssigningId(item.roleSpecificId);
        setFeedback({ id: null, type: '', message: '' });
        try {
            const assignFn = selectedRole === 'Student' ? assignStudent : sendTutorRequest;
            await assignFn(item.roleSpecificId);
            setFeedback({ id: item.roleSpecificId, type: 'success', message: selectedRole === 'Student' ? 'Assigned successfully!' : 'Join request sent successfully!' });
            
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

    // --- Flow Navigation ---
    const handleSelectRole = (r) => {
        setSelectedRole(r);
        setStep('check');
    };

    const handleBack = () => {
        if (step === 'check') {
            if (type) onClose(); // If type was forced, closing goes back completely
            else setStep('role-picker'); // Otherwise back to role picker
        } else if (step === 'search' || step === 'register-student' || step === 'register-tutor') {
            setStep('check');
        } else {
            onClose();
        }
    };

    const handleResetToChoice = () => {
        // Specifically used after "Done" or "Add Another" in Success view
        setCheckData({ email: '', mobile: '' });
        setFormData({ firstName: '', lastName: '', grade: '', bio: '', bankAccountNumber: '', bankName: '', experienceYears: 0 });
        setIsSiblingRegistration(false);
        setSiblingVerificationToken(null);
        setStep(type ? 'check' : 'role-picker');
    };

    // --- Check User Logic ---
    const handleCheckUser = async (e) => {
        e.preventDefault();
        if (!checkData.email.trim() && !checkData.mobile.trim()) {
            setCheckError("Please enter at least a Mobile Number or Email.");
            return;
        }

        if (checkData.mobile.trim()) {
            const mobileValidation = validatePhoneNumber(checkData.mobile.trim());
            if (!mobileValidation.isValid) {
                setCheckError(mobileValidation.message);
                return;
            }
        }

        setIsChecking(true);
        setCheckError('');

        try {
            const result = await checkUserStatus({
                email: checkData.email,
                phoneNumber: checkData.mobile
            });

            if (result.exists) {
                setExistingUser(result);
                if (result.role === selectedRole) {
                    setQuery(checkData.mobile || checkData.email);
                    setStep('search');
                } else {
                    setIsExistingUserModalOpen(true);
                }
            } else {
                setFormData({ firstName: '', lastName: '', grade: '', bio: '', bankAccountNumber: '', bankName: '', experienceYears: 0 });
                setStep(selectedRole === 'Student' ? 'register-student' : 'register-tutor');
            }
        } catch (err) {
            setCheckError("Failed to verify user. Please try again.");
        } finally {
            setIsChecking(false);
        }
    };

    // --- Sibling Flow ---
    const handleItsParent = async () => {
        setIsChecking(true);
        try {
            const identifierToUse = checkData.email || checkData.mobile;
            await sendOtp(identifierToUse);
            setIsOtpModalOpen(true);
        } catch (error) {
            alert(error.message || "Failed to send verification code.");
        } finally {
            setIsChecking(false);
        }
    };

    const handleVerifyOtp = async (otpCode) => {
        try {
            const identifierToUse = checkData.email || checkData.mobile;
            await verifyOtp(identifierToUse, otpCode);
            setIsOtpModalOpen(false);

            setIsSiblingRegistration(true);
            setSiblingVerificationToken(otpCode);
            setFormData({ firstName: '', lastName: '', grade: '', bio: '', bankAccountNumber: '', bankName: '', experienceYears: 0 });
            setStep('register-student');
        } catch (error) {
            console.error("OTP Error", error);
            throw error;
        }
    };

    // --- Final Register ---
    const executeRegister = async (payload) => {
        setIsRegistering(true);
        try {
            if (isSiblingRegistration && selectedRole === 'Student') {
                await registerSibling(payload);
            } else {
                await register(payload);
            }
            if (onAssigned) onAssigned();
            setStep('success');
        } catch (err) {
            alert(err.message || "Registration Failed");
        } finally {
            setIsRegistering(false);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        const mobileStr = checkData.mobile.trim();
        const generatedPassword = mobileStr.length >= 6 ? mobileStr.slice(-6) : "123456";
        const instId = instituteProfile?.instituteId || user?.instituteId;

        if (selectedRole === 'Student') {
            if (isSiblingRegistration) {
                await executeRegister({
                    identifier: checkData.email || checkData.mobile,
                    verificationToken: siblingVerificationToken,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    grade: formData.grade,
                    schoolName: "Not Provided",
                    parentName: "Not Provided",
                    dateOfBirth: new Date().toISOString(),
                    instituteId: instId
                });
                setSuccessMessage({ 
                    title: "Sibling Successfully Registered!", 
                    message: "Sibling account created securely under their parent's profile." 
                });
            } else {
                await executeRegister({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    grade: formData.grade,
                    role: "Student",
                    email: checkData.email || `student.${mobileStr}@tutorz.lk`,
                    phoneNumber: mobileStr,
                    password: generatedPassword,
                    schoolName: "Not Provided",
                    parentName: "Not Provided",
                    dateOfBirth: new Date().toISOString(),
                    cityId: instituteProfile?.cityId,
                    instituteId: instId
                });
                setSuccessMessage({ 
                    title: "Registration Successful!", 
                    message: `Student account created successfully.\n\nDefault Password: ${generatedPassword}` 
                });
            }
        } else {
            // Tutor
            if (!instituteProfile?.cityId) {
                alert("Institute location not found. Cannot register tutor.");
                return;
            }
            await executeRegister({
                firstName: formData.firstName,
                lastName: formData.lastName,
                role: "Tutor",
                email: checkData.email || `tutor.${mobileStr}@tutorz.lk`,
                phoneNumber: mobileStr,
                password: generatedPassword,
                bio: formData.bio,
                bankAccountNumber: formData.bankAccountNumber,
                bankName: formData.bankName,
                experienceYears: formData.experienceYears,
                cityId: instituteProfile.cityId,
                instituteId: instId
            });
            setSuccessMessage({ 
                title: "Tutor Added Successfully!", 
                message: `Tutor account created successfully.\n\nDefault Password: ${generatedPassword}` 
            });
        }
    };

    // --- Renders ---
    const renderHeader = (title) => (
        <div className="flex items-center gap-2 mb-4">
            {step !== 'role-picker' && step !== 'success' && (
                <button type="button" onClick={handleBack} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
            )}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
        </div>
    );

    const renderRolePicker = () => (
        <>
            {renderHeader("What would you like to add?")}
            <div className="grid grid-cols-2 gap-4">
                <QuickActionCard icon={GraduationCap} label="Add Student" colorClass="text-blue-600 dark:text-blue-400" onClick={() => handleSelectRole('Student')} />
                <QuickActionCard icon={UserPlus} label="Add Tutor" colorClass="text-purple-600 dark:text-purple-400" onClick={() => handleSelectRole('Tutor')} />
            </div>
        </>
    );

    const renderSearch = () => {
        const accentColor = selectedRole === 'Student' ? 'blue' : 'purple';
        return (
            <>
                {renderHeader(`Search & Assign ${selectedRole}`)}
                <div className="space-y-4">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        {isSearching && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />}
                        <input
                            type="text"
                            placeholder={`Search by name or registration number…`}
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            autoFocus
                            className={`w-full pl-9 pr-9 py-2.5 rounded-lg border text-sm
                                bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400
                                focus:outline-none focus:ring-2 focus:ring-${accentColor}-500/30 focus:border-${accentColor}-500 transition-colors`}
                        />
                    </div>
                    {!query.trim() && <p className="text-xs text-center text-gray-400 dark:text-gray-500 py-6">Start typing to search for a {selectedRole.toLowerCase()}</p>}
                    {query.trim() && !isSearching && results.length === 0 && (
                        <div className="flex flex-col items-center gap-2 py-8 text-gray-400 dark:text-gray-500">
                            <AlertCircle size={32} strokeWidth={1.5} />
                            <p className="text-sm">No {selectedRole.toLowerCase()}s found for "{query}"</p>
                        </div>
                    )}
                    {results.length > 0 && (
                        <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                            {results.map(item => {
                                const isBusy = assigningId === item.roleSpecificId;
                                const itemFeedback = feedback.id === item.roleSpecificId ? feedback : null;
                                return (
                                    <div key={item.roleSpecificId} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${item.isAlreadyAssigned ? (selectedRole === 'Student' ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/40' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700') : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:shadow-sm'}`}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${selectedRole === 'Student' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400'}`}>
                                            {item.name?.charAt(0) || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{item.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.registrationNumber}{item.phoneNumber && ` · ${item.phoneNumber}`}</p>
                                            {itemFeedback && <p className={`text-xs mt-0.5 font-medium ${itemFeedback.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>{itemFeedback.message}</p>}
                                        </div>
                                        {item.isAlreadyAssigned ? (
                                            <span className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400 shrink-0">
                                                <CheckCircle2 size={15} />
                                                {selectedRole === 'Student' ? 'Assigned' : 'Requested / Assigned'}
                                            </span>
                                        ) : (
                                            <Button size="small" variant={selectedRole === 'Student' ? 'primary' : 'secondary'} onClick={() => handleAssign(item)} disabled={isBusy} className="shrink-0">
                                                {isBusy ? <Loader2 size={14} className="animate-spin" /> : <><UserPlus size={14} className="mr-1" />{selectedRole === 'Student' ? 'Assign' : 'Send Request'}</>}
                                            </Button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {results.length > 0 && selectedRole === 'Student' && (
                        <div className="pt-4 mt-2 border-t border-gray-100 dark:border-gray-800">
                            <Button variant="outline" fullWidth onClick={() => handleItsParent()} disabled={isChecking}>
                                {isChecking ? <><Loader2 size={16} className="animate-spin mr-2"/> Sending OTP...</> : 'Student not listed? Register New Sibling'}
                            </Button>
                        </div>
                    )}
                </div>
            </>
        );
    };

    const renderCheck = () => (
        <>
            {renderHeader(`Verify ${selectedRole}`)}
            <form onSubmit={handleCheckUser} className="space-y-4">
                <div className="space-y-4">
                    <FormField
                        id="mobile"
                        label="Mobile Number"
                        placeholder="e.g. 0771234567"
                        value={checkData.mobile}
                        onChange={(e) => setCheckData({ ...checkData, mobile: e.target.value })}
                        autoFocus
                    />
                    <FormField
                        id="email"
                        label="Email Address (Optional)"
                        placeholder={`${selectedRole?.toLowerCase() || 'user'}@example.com`}
                        value={checkData.email}
                        onChange={(e) => setCheckData({ ...checkData, email: e.target.value })}
                    />
                </div>
                {checkError && <p className="text-xs text-red-500 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> {checkError}</p>}
                <Button type="submit" fullWidth disabled={isChecking}>
                    {isChecking ? 'Checking...' : 'Verify & Continue'}
                </Button>
            </form>
        </>
    );

    const renderRegisterForm = () => {
        const isTutor = selectedRole === 'Tutor';
        const color = isTutor ? 'purple' : 'blue';

        return (
            <>
                {renderHeader(`New ${selectedRole} Registration`)}
                <form onSubmit={handleRegisterSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                    <div className={`bg-${color}-50 dark:bg-${color}-900/20 p-3 rounded-lg border border-${color}-100 dark:border-${color}-800 grid ${isTutor ? 'grid-cols-2' : 'grid-cols-2'} gap-4`}>
                        <div><p className={`text-[10px] text-${color}-600 dark:text-${color}-400 font-semibold uppercase`}>Mobile</p><p className={`font-mono text-sm font-bold text-${color}-800 dark:text-${color}-300`}>{checkData.mobile || "N/A"}</p></div>
                        <div><p className={`text-[10px] text-${color}-600 dark:text-${color}-400 font-semibold uppercase`}>Email</p><p className={`font-mono text-sm font-bold text-${color}-800 dark:text-${color}-300 truncate`}>{checkData.email || "N/A"}</p></div>
                        {isTutor && (
                            <div className="col-span-2">
                                <p className={`text-[10px] text-${color}-600 dark:text-${color}-400 font-semibold uppercase`}>Location</p>
                                <p className={`font-mono text-sm font-bold text-${color}-800 dark:text-${color}-300`}>
                                    {instituteProfile?.cityId ? `Linked to Institute (ID: ${instituteProfile.cityId})` : "Loading Location..."}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField id="firstName" label="First Name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
                        <FormField id="lastName" label="Last Name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required />
                    </div>

                    {!isTutor && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grade</label>
                            <Select value={formData.grade} onChange={(e) => setFormData({ ...formData, grade: e.target.value })} required>
                                <option value="">Select Grade</option>
                                {GRADE_GROUPS.map((group, index) => (
                                    <optgroup key={index} label={group.label} className="font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">
                                        {group.options.map((opt) => <option key={opt} value={opt} className="text-gray-900 dark:text-white font-normal bg-white dark:bg-gray-800">{opt}</option>)}
                                    </optgroup>
                                ))}
                            </Select>
                        </div>
                    )}

                    {isTutor && (
                        <>
                            <FormField id="bio" label="Bio / Title" placeholder="e.g. A/L Logic Tutor" value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField id="bankAccount" label="Account Number" placeholder="Optional" value={formData.bankAccountNumber} onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })} />
                                <FormField id="bankName" label="Bank Name" placeholder="Optional" value={formData.bankName} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} />
                            </div>
                        </>
                    )}

                    <div className="pt-4">
                        <Button type="submit" fullWidth disabled={isRegistering || (isTutor && !instituteProfile?.cityId)}>
                            {isRegistering ? <><Loader2 size={18} className="animate-spin mr-2" /> Registering...</> : <><Save size={18} className="mr-2" /> Register {selectedRole}</>}
                        </Button>
                        {isTutor && !instituteProfile?.cityId && <p className="text-xs text-center text-red-500 mt-2">Cannot register: Institute location is missing.</p>}
                        <p className="text-[10px] text-center text-gray-400 mt-2">Default password will be last 6 digits of mobile</p>
                    </div>
                </form>
            </>
        );
    };

    const renderSuccess = () => (
        <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{successMessage.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 whitespace-pre-line">{successMessage.message}</p>
            <div className="flex gap-3 justify-center">
                <Button variant="secondary" onClick={handleResetToChoice}>Add Another</Button>
                <Button variant="primary" onClick={onClose}>Done</Button>
            </div>
        </div>
    );

    let content = null;
    if (isOpen) {
        switch (step) {
            case 'role-picker': content = renderRolePicker(); break;
            case 'search': content = renderSearch(); break;
            case 'check': content = renderCheck(); break;
            case 'register-student': 
            case 'register-tutor': content = renderRegisterForm(); break;
            case 'success': content = renderSuccess(); break;
            default: content = null;
        }
    }

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={undefined}>
                {content}
            </Modal>

            {/* Sub Modals rendered outside so they overlay properly if needed */}
            <ConfirmationModal
                isOpen={isExistingUserModalOpen}
                onClose={() => setIsExistingUserModalOpen(false)}
                title="User Already Exists"
                message={`This user is already registered as ${existingUser?.name} [${existingUser?.role}].`}
                confirmLabel="View Profile"
                cancelLabel="Close"
                onConfirm={() => alert("Navigate to Profile")}
                variant="primary"
            />
            {isOtpModalOpen && (
                <OtpVerificationModal
                    isOpen={isOtpModalOpen}
                    onClose={() => setIsOtpModalOpen(false)}
                    onVerify={handleVerifyOtp}
                    identifier={checkData.email || checkData.mobile}
                />
            )}
        </>
    );
};

export default InstituteSearchAssignModal;
