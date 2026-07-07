import React, { useState, useEffect, useRef } from 'react';
import { Search, CheckCircle2, UserPlus, Loader2, AlertCircle, GraduationCap, Save, ShieldAlert } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { enqueueAction, SYNC_ACTION_TYPES } from '../../store/syncSlice';
import Modal from '../molecules/Modal';
import Button from '../atoms/Button';
import FormField from '../molecules/FormField';
import Select from '../atoms/Select';
import QuickActionCard from '../molecules/QuickActionCard';
import ConfirmationModal from '../molecules/ConfirmationModal';
import OtpVerificationModal from './OtpVerificationModal';

import { checkUserStatus, sendOtp, verifyOtp } from '../../services/auth/authService';
import { searchStudents, searchTutors, assignStudent, sendTutorRequest, getInstituteProfile } from '../../services/api/instituteService';
import { getJoinedInstitutes, searchStudentsGlobalForTutor } from '../../services/api/tutorService';
import { validatePhoneNumber, validateEmail } from '../../utils/validators';

const GRADE_GROUPS = [
    { label: "Primary Education", options: ['Preschool', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'] },
    { label: "Secondary Education", options: ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11 (O/L)', 'Grade 12 (A/L)', 'Grade 13 (A/L)'] },
    { label: "Other", options: ['Course', 'Seminar', 'Workshop'] }
];

const InstituteSearchAssignModal = ({ isOpen, onClose, type = null, onAssigned, user, customAssignFn, extraRegisterPayload, onAssignToClass }) => {
    const dispatch = useDispatch();
    
    // Flow states
    // steps: 'role-picker' | 'choice' | 'search' | 'check' | 'register-student' | 'register-tutor' | 'register-admin' | 'success'
    const [step, setStep] = useState('role-picker');
    const [selectedRole, setSelectedRole] = useState(type); // 'Student', 'Tutor', or 'Admin'

    // Institute Profile
    const [instituteProfile, setInstituteProfile] = useState(null);

    // Tutor Affiliate Location States
    const [tutorInstitutes, setTutorInstitutes] = useState([]);
    const [selectedTutorInstituteId, setSelectedTutorInstituteId] = useState('');

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
    const [registrationMode, setRegistrationMode] = useState(null); // 'sibling' or 'new'
    const [siblingVerificationToken, setSiblingVerificationToken] = useState(null);

    const [formData, setFormData] = useState({
        mobile: '',
        firstName: '',
        lastName: '',
        grade: '',
        bio: '',
        bankAccountNumber: '',
        bankName: '',
        experienceYears: 0
    });
    const [errors, setErrors] = useState({});
    const [globalError, setGlobalError] = useState(null);
    
    const handleFormChange = (id, value) => {
        setFormData(prev => ({ ...prev, [id]: value }));
        if (errors[id]) setErrors(prev => ({ ...prev, [id]: null }));
        if (globalError) setGlobalError(null);
    };

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
            setFormData({ mobile: '', firstName: '', lastName: '', grade: '', bio: '', bankAccountNumber: '', bankName: '', experienceYears: 0 });
            setErrors({});
            setGlobalError(null);
            setIsSiblingRegistration(false);
            setSiblingVerificationToken(null);
            setIsRegistering(false);
            setSelectedTutorInstituteId('');

            // Fetch profile if needed (only for Institutes)
            if (user?.role === 'Institute' && !instituteProfile) {
                getInstituteProfile().then(res => {
                    setInstituteProfile(res.data);
                }).catch(() => {});
            }
        }
    }, [isOpen, type, user, instituteProfile]);

    // Fetch tutor institutes on open
    useEffect(() => {
        if (isOpen && user?.role === 'Tutor') {
            const fetchTutorInstitutes = async () => {
                try {
                    const res = await getJoinedInstitutes();
                    let fetched = [];
                    if (Array.isArray(res)) {
                        fetched = res;
                    } else if (Array.isArray(res?.data)) {
                        fetched = res.data;
                    } else if (Array.isArray(res?.data?.items)) {
                        fetched = res.data.items;
                    } else if (Array.isArray(res?.items)) {
                        fetched = res.items;
                    }
                    setTutorInstitutes(fetched);
                } catch (err) {
                    console.error("Failed to fetch tutor institutes", err);
                }
            };
            fetchTutorInstitutes();
        }
    }, [isOpen, user]);

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
                let res;
                if (user?.role === 'Tutor') {
                    res = await searchStudentsGlobalForTutor(query.trim());
                } else {
                    const searchFn = selectedRole === 'Student' ? searchStudents : searchTutors;
                    res = await searchFn(query.trim());
                }
                setResults(res.data || res || []);
            } catch {
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
            if (customAssignFn) {
                await customAssignFn(item);
                setFeedback({ id: item.roleSpecificId, type: 'success', message: 'Assigned successfully!' });
            } else {
                const assignFn = selectedRole === 'Student' ? assignStudent : sendTutorRequest;
                await assignFn(item.roleSpecificId);
                setFeedback({ id: item.roleSpecificId, type: 'success', message: selectedRole === 'Student' ? 'Assigned successfully!' : 'Join request sent successfully!' });
            }
            
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
        } else if (step === 'search' || step.startsWith('register-')) {
            setStep('check');
        } else {
            onClose();
        }
    };

    const handleResetToChoice = () => {
        setCheckData({ email: '', mobile: '' });
        setFormData({ mobile: '', firstName: '', lastName: '', grade: '', bio: '', bankAccountNumber: '', bankName: '', experienceYears: 0 });
        setErrors({});
        setGlobalError(null);
        setIsSiblingRegistration(false);
        setSiblingVerificationToken(null);
        setStep(type ? 'check' : 'role-picker');
    };

    const handleCheckUser = async (e) => {
        e.preventDefault();
        setCheckError('');

        const mobileStr = checkData.mobile.trim();
        const emailStr = checkData.email.trim();

        if (!emailStr && !mobileStr) {
            setCheckError("Please enter at least a Mobile Number or Email.");
            return;
        }

        if (mobileStr) {
            const mobileValidation = validatePhoneNumber(mobileStr);
            if (!mobileValidation.isValid) {
                setCheckError(mobileValidation.message);
                return;
            }
        }

        if (emailStr) {
            const emailValidation = validateEmail(emailStr);
            if (!emailValidation.isValid) {
                setCheckError(emailValidation.message);
                return;
            }
        }

        setIsChecking(true);

        try {
            let mobileRes = null;
            let emailRes = null;

            const checkPromises = [];
            if (mobileStr) {
                checkPromises.push(checkUserStatus({ phoneNumber: mobileStr }).then(r => mobileRes = r).catch(() => null));
            }
            if (emailStr) {
                checkPromises.push(checkUserStatus({ email: emailStr }).then(r => emailRes = r).catch(() => null));
            }
            
            await Promise.all(checkPromises);

            if (mobileStr && emailStr) {
                 if (mobileRes?.exists && emailRes?.exists) {
                      if (mobileRes.userId !== emailRes.userId) {
                           setCheckError("The Email and Mobile number belong to different accounts. Please use only one to search.");
                           setIsChecking(false);
                           return;
                      }
                 } else if (mobileRes?.exists && !emailRes?.exists) {
                      setCheckError(`Mobile is registered to ${mobileRes.name} [${mobileRes.role}], but Email is not. Please search using only mobile.`);
                      setIsChecking(false);
                      return;
                 } else if (!mobileRes?.exists && emailRes?.exists) {
                      setCheckError(`Email is registered to ${emailRes.name} [${emailRes.role}], but Mobile is not. Please search using only email.`);
                      setIsChecking(false);
                      return;
                 }
            }

            const result = mobileRes?.exists ? mobileRes : (emailRes?.exists ? emailRes : { exists: false });

            if (result.exists) {
                setExistingUser(result);
                // Admins don't have a "search and link" flow in this project yet, so if an Admin account exists, we just stop.
                if (result.role === selectedRole && selectedRole !== 'Admin') {
                    setQuery(mobileStr || emailStr);
                    setStep('search');
                } else if (selectedRole === 'Student' && result.role === 'Tutor') {
                    // Sibling flow for existing Tutor account
                    setIsExistingUserModalOpen(true);
                } else {
                    setIsExistingUserModalOpen(true);
                }
            } else {
                setFormData({ mobile: mobileStr, firstName: '', lastName: '', grade: '', bio: '', bankAccountNumber: '', bankName: '', experienceYears: 0 });
                setErrors({});
                setGlobalError(null);
                
                if (selectedRole === 'Student') setStep('register-student');
                else if (selectedRole === 'Tutor') setStep('register-tutor');
                else if (selectedRole === 'Admin') setStep('register-admin');
            }
        } catch {
            setCheckError("Failed to verify user. Please try again.");
        } finally {
            setIsChecking(false);
        }
    };

    // --- Sibling Flow ---
    const handleItsParent = async () => {
        setIsChecking(true);
        try {
            setRegistrationMode('sibling');
            
            // Bypass OTP for logged in users registering a sibling
            setIsSiblingRegistration(true);
            setSiblingVerificationToken("BYPASS_OTP");
            setFormData({ mobile: '', firstName: '', lastName: '', grade: '', bio: '', bankAccountNumber: '', bankName: '', experienceYears: 0 });
            setErrors({});
            setStep('register-student');
            setIsExistingUserModalOpen(false);
        } catch (error) {
            setGlobalError(error.message || "Failed to initialize sibling registration.");
        } finally {
            setIsChecking(false);
        }
    };

    const handleVerifyOtp = async (otpCode) => {
        try {
            console.log("[handleVerifyOtp] Verifying OTP", { otpCode, registrationMode, selectedRole });
            if (registrationMode === 'sibling') {
                const identifierToUse = checkData.email || checkData.mobile;
                console.log("[handleVerifyOtp] Sibling verification for identifier:", identifierToUse);
                await verifyOtp(identifierToUse, otpCode);
                setIsOtpModalOpen(false);

                setIsSiblingRegistration(true);
                setSiblingVerificationToken(otpCode);
                setFormData({ mobile: '', firstName: '', lastName: '', grade: '', bio: '', bankAccountNumber: '', bankName: '', experienceYears: 0 });
                setErrors({});
                setStep('register-student');
                console.log("[handleVerifyOtp] Successfully verified OTP and set step to register-student");
            } else {
                setIsOtpModalOpen(false);
                await performFinalRegistration(otpCode);
            }
        } catch (error) {
            console.error("[handleVerifyOtp] OTP Error", error);
            throw error;
        }
    };

    const executeRegister = async (payload) => {
        setIsRegistering(true);
        try {
            const isSibling = isSiblingRegistration && selectedRole === 'Student';
            
            let actionType = SYNC_ACTION_TYPES.REGISTER_USER;
            let actualPayload = { 
                isSibling, 
                registrationData: {
                    ...payload,
                    ...(extraRegisterPayload || {})
                } 
            };
            const identifierPart = payload.phoneNumber || payload.identifier || '';
            const namePart = `${payload.firstName || ''}_${payload.lastName || ''}`.trim().toLowerCase().replace(/\s+/g, '_');
            let dedupeKey = `register_${namePart}_${identifierPart}`;

            if (selectedRole === 'Admin') {
                actionType = SYNC_ACTION_TYPES.CREATE_ADMIN;
                actualPayload = { adminData: payload };
                dedupeKey = `create_admin_${payload.phoneNumber}`;
            }

            dispatch(enqueueAction({
                actionType,
                payload: actualPayload,
                label: `Register ${selectedRole}: ${payload.firstName}`,
                dedupeKey
            }));
            
            setStep('success');
            if (onAssigned) onAssigned();
        } catch (err) {
            setGlobalError(err.message || "Registration Failed");
        } finally {
            setIsRegistering(false);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setGlobalError(null);
        
        const newErrors = {};

        if (!isSiblingRegistration) {
            if (!formData.mobile.trim()) { 
                newErrors.mobile = "Mobile Number is required."; 
            } else {
                const mobileValidation = validatePhoneNumber(formData.mobile.trim());
                if (!mobileValidation.isValid) newErrors.mobile = mobileValidation.message;
            }
        }

        if (!formData.firstName.trim()) newErrors.firstName = "First Name is required.";
        if (!formData.lastName.trim()) newErrors.lastName = "Last Name is required.";
        if (selectedRole === 'Student' && !formData.grade) newErrors.grade = "Please select a Grade.";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        if (!isSiblingRegistration && !checkData.mobile) {
            setIsRegistering(true);
            try {
                const result = await checkUserStatus({ phoneNumber: formData.mobile.trim() });
                if (result.exists) {
                    setErrors({ mobile: `Already registered as ${result.name} [${result.role}]. Go back and verify.` });
                    setIsRegistering(false);
                    return;
                }
            } catch {
                setErrors({ mobile: "Failed to verify mobile number. Please try again." });
                setIsRegistering(false);
                return;
            }
            setIsRegistering(false);
        }

        if (isSiblingRegistration) {
            await performFinalRegistration(siblingVerificationToken);
        } else {
            setRegistrationMode('new');
            await performFinalRegistration(null);
        }
    };

    const performFinalRegistration = async (otpCode) => {
        const mobileStr = formData.mobile.trim();
        const generatedPassword = mobileStr && mobileStr.length >= 6 ? mobileStr.slice(-6) : "123456";
        
        let instId = null;
        let selectedCityId = null;

        if (user?.role === 'Tutor') {
            if (selectedTutorInstituteId && selectedTutorInstituteId !== 'own') {
                instId = selectedTutorInstituteId;
                const foundInst = tutorInstitutes.find(i => (i.id || i.instituteId) === selectedTutorInstituteId);
                selectedCityId = foundInst?.cityId || null;
            } else {
                instId = null;
                selectedCityId = user?.cityId || null;
            }
        } else {
            instId = type === 'Admin' ? null : (instituteProfile?.instituteId || instituteProfile?.id || null);
            selectedCityId = instituteProfile?.cityId || null;
        }

        if (selectedRole === 'Admin') {
            await executeRegister({
                firstName: formData.firstName,
                lastName: formData.lastName,
                phoneNumber: mobileStr,
                email: checkData.email ? checkData.email : null
            });
            setSuccessMessage({ 
                title: "Admin Created Successfully!", 
                message: `The new Admin account has been provisioned.\n\nCredentials have been sent to ${mobileStr} via SMS.` 
            });
            return;
        }

        if (selectedRole === 'Student') {
            if (isSiblingRegistration) {
                await executeRegister({
                    identifier: checkData.email || checkData.mobile,
                    verificationToken: otpCode,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    grade: formData.grade,
                    schoolName: "Not Provided",
                    parentName: "Not Provided",
                    dateOfBirth: new Date().toISOString(),
                    instituteId: instId,
                    cityId: selectedCityId,
                    tutorId: user?.role === 'Tutor' ? (user.userId || user.id) : null
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
                    schoolName: "Not Provided",
                    parentName: "Not Provided",
                    dateOfBirth: new Date().toISOString(),
                    cityId: selectedCityId,
                    instituteId: instId,
                    otpCode: otpCode,
                    tutorId: user?.role === 'Tutor' ? (user.userId || user.id) : null
                });
                setSuccessMessage({ 
                    title: "Registration Successful!", 
                    message: `Student account created successfully.\n\nA secure password has been sent to ${mobileStr} via SMS.` 
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
                bio: formData.bio,
                bankAccountNumber: formData.bankAccountNumber,
                bankName: formData.bankName,
                experienceYears: formData.experienceYears,
                cityId: instituteProfile.cityId,
                instituteId: instId,
                otpCode: otpCode
            });
            setSuccessMessage({ 
                title: "Tutor Added Successfully!", 
                message: `Tutor account created successfully.\n\nA secure password has been sent to ${mobileStr} via SMS.` 
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
                {user?.role === 'Tutor' && (
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-800/40 mb-3 animate-fade-in">
                        <label className="block text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1.5">
                            Location for Assignment <span className="text-red-500">*</span>
                        </label>
                        <Select 
                            value={selectedTutorInstituteId} 
                            onChange={(e) => setSelectedTutorInstituteId(e.target.value)}
                            required
                        >
                            <option value="" disabled>Select Location</option>
                            <option value="own">My Own Place</option>
                            {tutorInstitutes.map(inst => (
                                <option key={inst.id || inst.instituteId} value={inst.id || inst.instituteId}>
                                    {inst.name || inst.instituteName}
                                </option>
                            ))}
                        </Select>
                    </div>
                )}
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
                                        {user?.role === 'Tutor' ? (
                                            <Button 
                                                size="small" 
                                                variant="primary" 
                                                disabled={user?.role === 'Tutor' && !selectedTutorInstituteId}
                                                onClick={() => {
                                                    if (onAssignToClass) {
                                                        const studentWithLoc = { 
                                                            ...item, 
                                                            selectedInstituteId: selectedTutorInstituteId,
                                                            closeOnAction: true
                                                        };
                                                        onAssignToClass(studentWithLoc);
                                                        onClose();
                                                    }
                                                }}
                                                className="shrink-0"
                                            >
                                                <UserPlus size={14} className="mr-1" /> Assign to Class
                                            </Button>
                                        ) : item.isAlreadyAssigned ? (
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
                    {selectedRole !== 'Admin' && (
                        <FormField
                            id="email"
                            label="Email Address (Optional)"
                            placeholder={`${selectedRole?.toLowerCase() || 'user'}@example.com`}
                            value={checkData.email}
                            onChange={(e) => setCheckData({ ...checkData, email: e.target.value })}
                        />
                    )}
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
        const isAdmin = selectedRole === 'Admin';
        const isStudent = selectedRole === 'Student';
        const color = isTutor ? 'purple' : (isAdmin ? 'red' : 'blue');
        const icon = isAdmin ? ShieldAlert : (isTutor ? UserPlus : GraduationCap);

        return (
            <>
                {renderHeader(`New ${selectedRole} Registration`)}
                <form onSubmit={handleRegisterSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                    {user?.role === 'Tutor' && isStudent && (
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-800/40">
                            <label className="block text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1.5">
                                Link to Institute / Location <span className="text-red-500">*</span>
                            </label>
                            <Select 
                                value={selectedTutorInstituteId} 
                                onChange={(e) => setSelectedTutorInstituteId(e.target.value)} 
                                required
                            >
                                <option value="" disabled>Select Location</option>
                                <option value="own">My Own Place</option>
                                {tutorInstitutes.map(inst => (
                                    <option key={inst.id || inst.instituteId} value={inst.id || inst.instituteId}>
                                        {inst.name || inst.instituteName}
                                    </option>
                                ))}
                            </Select>
                        </div>
                    )}
                    {(checkData.email || isTutor || isAdmin) && (
                        <div className={`bg-${color}-50 dark:bg-${color}-900/20 p-3 rounded-lg border border-${color}-100 dark:border-${color}-800 mb-4 grid grid-cols-1 md:grid-cols-2 gap-4`}>
                            {checkData.email && (
                                <div><p className={`text-[10px] text-${color}-600 dark:text-${color}-400 font-semibold uppercase`}>Email</p><p className={`font-mono text-sm font-bold text-${color}-800 dark:text-${color}-300 truncate`}>{checkData.email}</p></div>
                            )}
                            {(isTutor || isAdmin) && (
                                <div className="min-w-0">
                                    <p className={`text-[10px] text-${color}-600 dark:text-${color}-400 font-semibold uppercase`}>{isAdmin ? 'Control Level' : 'Affiliation'}</p>
                                    <p className={`truncate text-sm font-bold text-${color}-800 dark:text-${color}-300`}>
                                        {isAdmin ? "Full System Access" : (instituteProfile?.instituteName ? `Linked to ${instituteProfile.instituteName}` : "Institute Primary Location")}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {!isSiblingRegistration && (
                        <FormField 
                            id="mobile" 
                            label="Mobile Number" 
                            placeholder="e.g. 0771234567" 
                            value={formData.mobile} 
                            onChange={(e) => handleFormChange('mobile', e.target.value)} 
                            disabled={!!checkData.mobile}
                            error={errors.mobile}
                            required 
                        />
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <FormField id="firstName" label="First Name" value={formData.firstName} onChange={(e) => handleFormChange('firstName', e.target.value)} error={errors.firstName} required />
                        <FormField id="lastName" label="Last Name" value={formData.lastName} onChange={(e) => handleFormChange('lastName', e.target.value)} error={errors.lastName} required />
                    </div>

                    {isStudent && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grade <span className="text-red-500 dark:text-red-400">*</span></label>
                            <Select value={formData.grade} onChange={(e) => handleFormChange('grade', e.target.value)} required 
                                className={errors.grade ? 'border-red-300 dark:border-red-500 focus:ring-red-200 dark:focus:ring-red-900 focus:border-red-500' : ''}
                            >
                                <option value="">Select Grade</option>
                                {GRADE_GROUPS.map((group, index) => (
                                    <optgroup key={index} label={group.label} className="font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">
                                        {group.options.map((opt) => <option key={opt} value={opt} className="text-gray-900 dark:text-white font-normal bg-white dark:bg-gray-800">{opt}</option>)}
                                    </optgroup>
                                ))}
                            </Select>
                            {errors.grade && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.grade}</p>}
                        </div>
                    )}

                    {globalError && <p className="text-sm font-medium text-red-500 dark:text-red-400 mt-2 text-center">{globalError}</p>}

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
                {type !== 'Admin' && <Button variant="secondary" onClick={handleResetToChoice}>Add Another</Button>}
                {selectedRole === 'Student' && onAssignToClass && (
                    <Button 
                        variant="primary" 
                        disabled={user?.role === 'Tutor' && !selectedTutorInstituteId}
                        onClick={() => {
                            const tempStudent = {
                                roleSpecificId: formData.mobile.trim() || checkData.email || checkData.mobile,
                                isSiblingRegistration: isSiblingRegistration,
                                name: [formData.firstName, formData.lastName].filter(Boolean).join(' ').trim(),
                                phoneNumber: formData.mobile.trim() || checkData.mobile,
                                registrationNumber: 'Pending Sync',
                                selectedInstituteId: user?.role === 'Tutor' ? selectedTutorInstituteId : null,
                                closeOnAction: true
                            };
                            onAssignToClass(tempStudent);
                        }}
                    >
                        Assign to Class
                    </Button>
                )}
                <Button variant={selectedRole === 'Student' && onAssignToClass ? "secondary" : "primary"} onClick={onClose}>Done</Button>
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
            case 'register-tutor':
            case 'register-admin': content = renderRegisterForm(); break;
            case 'success': content = renderSuccess(); break;
            default: content = null;
        }
    }

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={undefined}>
                {content}
            </Modal>

            <ConfirmationModal
                isOpen={isExistingUserModalOpen}
                onClose={() => setIsExistingUserModalOpen(false)}
                title={selectedRole === 'Student' && existingUser?.role === 'Tutor' ? "Register Sibling Student" : "User Already Exists"}
                message={selectedRole === 'Student' && existingUser?.role === 'Tutor' 
                    ? `This mobile number is registered to Tutor "${existingUser?.name}". Would you like to register a sibling student under this profile?`
                    : `This user is already registered as ${existingUser?.name} [${existingUser?.role}].`
                }
                confirmLabel={selectedRole === 'Student' && existingUser?.role === 'Tutor' ? "Register Sibling" : "View Profile"}
                cancelLabel="Close"
                onConfirm={selectedRole === 'Student' && existingUser?.role === 'Tutor'
                    ? () => {
                        setIsExistingUserModalOpen(false);
                        handleItsParent();
                    }
                    : () => alert("Navigate to Profile")
                }
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
