import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/templates/AuthLayout.jsx';
import FormField from '../../components/molecules/FormField.jsx';
import { ROLES, GRADE_GROUPS } from '../../utils/constants';
import { validatePhoneNumber } from '../../utils/validators';
import useAuth from '../../hooks/useAuth';
import { socialLogin, checkUserStatus } from '../../services/auth/authService.js';
import Label from '../../components/atoms/Label.jsx';
import LocationSelector from '../../components/molecules/LocationSelector';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import OtpVerificationModal from '../../components/organisms/OtpVerificationModal.jsx';
import { sendRegistrationOtp } from '../../services/auth/authService.js';
import { verifyOtp } from '../../services/auth/authService.js';
import SelectField from '../../components/molecules/SelectField.jsx';


const RegisterDetailsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const auth = useAuth();
    const manualRegister = auth.register;
    const registerSibling = auth.registerSibling;

    const stepOneData = location.state?.stepOneData;
    const socialProfile = location.state?.socialProfile;

    const isLinkedAccount = stepOneData?.isLinkedAccount === true;
    const linkedPhoneNumber = stepOneData?.linkedPhoneNumber || '';

    useEffect(() => {
        if (!stepOneData) navigate('/register');
    }, [stepOneData, navigate]);

    if (!stepOneData) return null;
    const isSocial = stepOneData.isSocial === true;

    // TRUE when the user typed their phone (not email) at step 1.
    // In this case the phone was already checked for duplicates in RegisterForm,
    // so we should lock it on this page — no need to re-enter or re-validate.
    const phoneEnteredInStep1 = !isSocial && !isLinkedAccount && !!stepOneData.phoneNumber;
    // Phone field is locked if it was entered in step 1 OR if this is a sibling account
    const isPhoneLocked = isLinkedAccount || phoneEnteredInStep1;

    const [formData, setFormData] = useState({
        phoneNumber: isLinkedAccount ? linkedPhoneNumber : (stepOneData.phoneNumber || ''),
        firstName: socialProfile?.firstName || '',
        lastName: socialProfile?.lastName || '',
        bio: '',
        bankAccount: '',
        bankName: '',
        school: '',
        grade: '',
        parentName: '',
        dateOfBirth: '',
        instituteName: '',
        address: '',
        cityId: ''
    });

    const [errors, setErrors] = useState({});
    const [globalError, setGlobalError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    
    // OTP State
    const [showOtpModal, setShowOtpModal] = useState(false);
    const isPhoneRegistration = !isSocial && !isLinkedAccount && !stepOneData.email?.includes('@');

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
        if (errors[id]) setErrors(prev => ({ ...prev, [id]: null }));
    };

    const handleCityChange = (cityId) => {
        setFormData(prev => ({ ...prev, cityId }));
        if (errors.cityId) setErrors(prev => ({ ...prev, cityId: null }));
    };

    const handlePhoneBlur = async () => {
        // Phone is locked — no need to validate or check
        if (isPhoneLocked) return;

        // 1. Format/validate the format first
        const validation = validatePhoneNumber(formData.phoneNumber);
        if (!validation.isValid) {
            setErrors(prev => ({ ...prev, phoneNumber: validation.message }));
            return;
        }

        // 2. Email-flow: phone typed in step 2 — check if it's already registered
        if (!isSocial && !phoneEnteredInStep1) {
            try {
                const status = await checkUserStatus({ phoneNumber: formData.phoneNumber });
                if (status.exists) {
                    setErrors(prev => ({
                        ...prev,
                        phoneNumber: `This number is already registered (${status.name}). Please log in or use a different number.`
                    }));
                    return;
                }
            } catch {
                // Silently ignore — the submit will catch it too
            }
        }

        // Clear any previous phone error if now valid
        setErrors(prev => ({ ...prev, phoneNumber: null }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setGlobalError(null);

        // --- ROLE-SPECIFIC VALIDATION ---
        const role = stepOneData.role;
        const newErrors = {};

        // 1. Phone number validation (if not social/linked/locked)
        if (!isPhoneLocked && !isSocial) {
            const phoneValidation = validatePhoneNumber(formData.phoneNumber);
            if (!phoneValidation.isValid) {
                newErrors.phoneNumber = phoneValidation.message;
            } else if (!phoneEnteredInStep1) {
                // Email-flow: also check for duplicate before sending OTP
                try {
                    const status = await checkUserStatus({ phoneNumber: formData.phoneNumber });
                    if (status.exists) {
                        newErrors.phoneNumber = `This number is already registered (${status.name}). Please log in or use a different number.`;
                    }
                } catch {
                    // Network error — let the OTP step surface it
                }
            }
        }

        // 2. City validation (common for all)
        if (!formData.cityId) {
            newErrors.cityId = "Please select your city.";
        }

        // 3. Name/Entity validation based on Role
        if (role === ROLES.INSTITUTE) {
            if (!formData.instituteName.trim()) {
                newErrors.instituteName = "Institute Name is required.";
            }
            if (!formData.address.trim()) {
                newErrors.address = "Address is required.";
            }
        } else {
            // Tutors and Students
            if (!formData.firstName.trim()) {
                newErrors.firstName = "First Name is required.";
            }
            if (!formData.lastName.trim()) {
                newErrors.lastName = "Last Name is required.";
            }
        }

        // 4. Student specific validation
        if (role === ROLES.STUDENT && !formData.grade) {
            newErrors.grade = "Please select your grade.";
        }

        // If there are any errors, set them and stop
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            // Optional: set a global error if many fields are missing
            if (Object.keys(newErrors).length > 2) {
                setGlobalError("Please fill in all required fields.");
            }
            return;
        }

        setIsSubmitting(true);
        const cleanDateOfBirth = formData.dateOfBirth === '' ? null : formData.dateOfBirth;

        try {
            if (isLinkedAccount) {
                const siblingPayload = {
                    identifier: linkedPhoneNumber,
                    verificationToken: "VERIFIED",
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    schoolName: formData.school,
                    grade: formData.grade,
                    parentName: formData.parentName,
                    dateOfBirth: cleanDateOfBirth || new Date().toISOString(),
                    cityId: parseInt(formData.cityId)
                };

                const result = await registerSibling(siblingPayload);

                if (result.success) {
                    setIsSuccess(true);
                    setTimeout(() => navigate('/login'), 2000);
                } else {
                    setGlobalError(result.error?.message || "Sibling registration failed.");
                }
            }
            else if (isSocial) {
                const payload = {
                    provider: stepOneData.provider,
                    idToken: socialProfile.idToken,
                    role: stepOneData.role,
                    phoneNumber: formData.phoneNumber,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    bio: formData.bio,
                    bankAccountNumber: formData.bankAccount,
                    bankName: formData.bankName,
                    schoolName: formData.school,
                    grade: formData.grade,
                    parentName: formData.parentName,
                    dateOfBirth: cleanDateOfBirth,
                    instituteName: formData.instituteName,
                    address: formData.address,
                    cityId: parseInt(formData.cityId)
                };
                await socialLogin(payload);
                setIsSuccess(true);
                setTimeout(() => navigate('/login'), 2000);
            }
            else {
                try {
                    setIsSubmitting(true);
                    await sendRegistrationOtp(formData.phoneNumber);
                    setShowOtpModal(true);
                } catch (error) {
                    setGlobalError(error.message);
                } finally {
                    setIsSubmitting(false);
                }
            }
        } catch (error) {
            setGlobalError(error.message || "Registration failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifyOtp = async (otpCode) => {
        try {
            const fullRegistrationData = {
                ...stepOneData,
                ...formData,
                cityId: parseInt(formData.cityId),
                schoolName: formData.school,
                bankAccountNumber: formData.bankAccount,
                dateOfBirth: formData.dateOfBirth === '' ? null : formData.dateOfBirth,
                ExperienceYears: 0,
                instituteName: formData.instituteName,
                address: formData.address,
                otpCode: otpCode
            };

            const result = await manualRegister(fullRegistrationData);

            if (result.success) {
                setShowOtpModal(false);
                setIsSuccess(true);
                setTimeout(() => navigate('/login'), 2000);
            } else {
                throw new Error(result.error?.message || "Registration failed.");
            }
        } catch (error) {
            console.error("Verification Error", error);
            throw error;
        }
    };

    const renderRoleFields = () => {
        switch (stepOneData.role) {
            case ROLES.TUTOR:
                return (
                    <>
                        <FormField id="firstName" label="First Name" value={formData.firstName} onChange={handleChange} required error={errors.firstName} />
                        <FormField id="lastName" label="Last Name" value={formData.lastName} onChange={handleChange} required error={errors.lastName} />
                    </>
                );
            case ROLES.STUDENT:
                return (
                    <>
                        <FormField id="firstName" label="First Name" value={formData.firstName} onChange={handleChange} required error={errors.firstName} />
                        <FormField id="lastName" label="Last Name" value={formData.lastName} onChange={handleChange} required error={errors.lastName} />
                        <FormField id="school" label="School Name" value={formData.school} onChange={handleChange} error={errors.school} />
                        <SelectField
                            id="grade"
                            label="Grade / Course"
                            value={formData.grade}
                            onChange={handleChange}
                            groups={GRADE_GROUPS}
                            placeholder="Select Grade"
                            required={true}
                            error={errors.grade}
                        />
                        <FormField id="parentName" label="Parent Name" value={formData.parentName} onChange={handleChange} error={errors.parentName} />
                        <FormField id="dateOfBirth" label="Date of Birth" type="date" value={formData.dateOfBirth} onChange={handleChange} error={errors.dateOfBirth} />
                    </>
                );
            case ROLES.INSTITUTE:
                return (
                    <>
                        <FormField id="instituteName" label="Institute Name" value={formData.instituteName} onChange={handleChange} required error={errors.instituteName} />
                        <FormField id="address" label="Address" value={formData.address} onChange={handleChange} required error={errors.address} />
                    </>
                );
            default:
                return null;
        }
    };

    if (isSuccess) {
        return (
            <AuthLayout>
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-in fade-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 shadow-sm ring-4 ring-green-50 dark:ring-green-900/10">
                        <CheckCircle2 size={40} className="text-green-500 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Registration Successful!</h2>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm text-sm leading-relaxed">
                        Your account has been securely created. Redirecting you to the login page to access your new dashboard...
                    </p>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            <div className="w-full">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white text-center">
                    {isSocial ? `Complete your ${stepOneData.provider} Sign up` : 'Tell us about yourself'}
                </h1>

                <form className="space-y-4 mt-6" onSubmit={handleSubmit}>
                    <FormField
                        id="phoneNumber"
                        label="Phone Number"
                        required
                        type="tel"
                        placeholder="0712345678"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        onBlur={handlePhoneBlur}
                        error={errors.phoneNumber}
                        disabled={isPhoneLocked}
                    />

                    {/* Help text under the phone field */}
                    {isLinkedAccount && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 -mt-3 mb-2">* Linked to parent account</p>
                    )}
                    {phoneEnteredInStep1 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 -mt-3 mb-2 flex items-center gap-1">
                            <ArrowLeft size={12} />
                            To use a different number,{' '}
                            <button
                                type="button"
                                onClick={() => navigate('/register')}
                                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                            >
                                go back
                            </button>
                            {' '}and enter it there.
                        </p>
                    )}

                    {/* Stacked Vertical Layout for better UI */}
                    <div className="pt-2">
                        <LocationSelector
                            onCityChange={handleCityChange}
                            error={errors.cityId}
                        />
                    </div>

                    {renderRoleFields()}

                    {globalError && <p className="text-xs text-red-500 dark:text-red-400 mt-1 text-center">{globalError}</p>}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500 transition-all"
                    >
                        {isSubmitting ? 'Completing...' : 'Complete Registration'}
                    </button>
                </form>
            </div>
            
            <OtpVerificationModal
                isOpen={showOtpModal}
                onClose={() => {
                    setShowOtpModal(false);
                    // Fix: No account is created yet at this point.
                    // Registration only happens after OTP is successfully verified.
                    setGlobalError("OTP verification cancelled. Please click 'Complete Registration' again to resend the code.");
                }}
                onVerify={handleVerifyOtp}
                identifier={formData.phoneNumber}
            />
        </AuthLayout>
    );
};

export default RegisterDetailsPage;