import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/templates/AuthLayout.jsx';
import FormField from '../../components/molecules/FormField.jsx';
import { ROLES, ERROR_MESSAGES } from '../../utils/constants';
import { validatePhoneNumber } from '../../utils/validators';
import useAuth from '../../hooks/useAuth';
import { socialLogin } from '../../services/auth/authService.js';
import Label from '../../components/atoms/Label.jsx';
import LocationSelector from '../../components/molecules/LocationSelector';

const GRADE_GROUPS = [
    { label: "Primary Education", options: ['Preschool', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'] },
    { label: "Secondary Education", options: ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11 (O/L)', 'Grade 12 (A/L)', 'Grade 13 (A/L)'] },
    { label: "Other", options: ['Course', 'Seminar', 'Workshop'] }
];

const SelectField = ({ id, label, value, onChange, groups, placeholder, required = false, error }) => {
    const isPlaceholder = value === "";
    return (
        <div className="w-full">
            <Label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {label} {required && <span className="text-red-500 dark:text-red-400">*</span>}
            </Label>
            <div className="relative">
                <select
                    id={id}
                    value={value}
                    onChange={onChange}
                    required={required}
                    className={`appearance-none w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-800
                        text-sm font-medium transition-all duration-200 ease-in-out
                        focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-200 dark:focus:ring-blue-900 focus:border-blue-500 dark:focus:border-blue-500
                        ${error ? 'border-red-300 dark:border-red-500 focus:ring-red-200 dark:focus:ring-red-900 focus:border-red-500' : 'border-gray-300 dark:border-gray-700'}
                        ${isPlaceholder ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}
                    `}
                >
                    <option value="" disabled>{placeholder}</option>
                    {groups.map((group, index) => (
                        <optgroup key={index} label={group.label} className="font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">
                            {group.options.map((opt) => (
                                <option key={opt} value={opt} className="text-gray-900 dark:text-white font-normal bg-white dark:bg-gray-800">{opt}</option>
                            ))}
                        </optgroup>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500 dark:text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
            {error && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{error}</p>}
        </div>
    );
};

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

    const isSocial = stepOneData?.isSocial === true;

    const [formData, setFormData] = useState({
        phoneNumber: isLinkedAccount ? linkedPhoneNumber : (stepOneData?.phoneNumber || ''),
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

    if (!stepOneData) return null; // MOVED DOWN

    const [errors, setErrors] = useState({});
    const [globalError, setGlobalError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
        if (errors[id]) setErrors(prev => ({ ...prev, [id]: null }));
    };

    const handleCityChange = (cityId) => {
        setFormData(prev => ({ ...prev, cityId }));
        if (errors.cityId) setErrors(prev => ({ ...prev, cityId: null }));
    };

    const handlePhoneBlur = () => {
        if (!isLinkedAccount) {
            const validation = validatePhoneNumber(formData.phoneNumber);
            if (!validation.isValid) setErrors(prev => ({ ...prev, phoneNumber: validation.message }));
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setGlobalError(null);

        if (!isLinkedAccount && !isSocial) {
            const phoneValidation = validatePhoneNumber(formData.phoneNumber);
            if (!phoneValidation.isValid) {
                setErrors(prev => ({ ...prev, phoneNumber: phoneValidation.message }));
                return;
            }
        }

        if (!formData.cityId) {
            setErrors(prev => ({ ...prev, cityId: ERROR_MESSAGES.REQUIRED }));
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
                    navigate('/dashboard');
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
                navigate('/dashboard');
            }
            else {
                const fullRegistrationData = {
                    ...stepOneData,
                    ...formData,
                    cityId: parseInt(formData.cityId),
                    schoolName: formData.school,
                    bankAccountNumber: formData.bankAccount,
                    dateOfBirth: cleanDateOfBirth,
                    ExperienceYears: 0,
                    instituteName: formData.instituteName,
                    address: formData.address
                };

                const result = await manualRegister(fullRegistrationData);
                if (result.success) {
                    navigate('/dashboard');
                } else {
                    setGlobalError(result.error?.message || ERROR_MESSAGES.GENERIC_ERROR);
                }
            }
        } catch (error) {
            setGlobalError(isSocial ? error.message : ERROR_MESSAGES.GENERIC_ERROR);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderRoleFields = () => {
        switch (stepOneData.role) {
            case ROLES.TUTOR:
                return (
                    <>
                        <FormField id="firstName" label="First Name" value={formData.firstName} onChange={handleChange} required />
                        <FormField id="lastName" label="Last Name" value={formData.lastName} onChange={handleChange} required />
                    </>
                );
            case ROLES.STUDENT:
                return (
                    <>
                        <FormField id="firstName" label="First Name" value={formData.firstName} onChange={handleChange} required />
                        <FormField id="lastName" label="Last Name" value={formData.lastName} onChange={handleChange} required />
                        <FormField id="school" label="School Name" value={formData.school} onChange={handleChange} />
                        <SelectField
                            id="grade"
                            label="Grade / Course ..."
                            value={formData.grade}
                            onChange={handleChange}
                            groups={GRADE_GROUPS}
                            placeholder="Select Grade"
                            error={errors.grade}
                        />
                        <FormField id="parentName" label="Parent Name" value={formData.parentName} onChange={handleChange} />
                        <FormField id="dateOfBirth" label="Date of Birth" type="date" value={formData.dateOfBirth} onChange={handleChange} />
                    </>
                );
            case ROLES.INSTITUTE:
                return (
                    <>
                        <FormField id="instituteName" label="Institute Name" value={formData.instituteName} onChange={handleChange} required />
                        <FormField id="address" label="Address" value={formData.address} onChange={handleChange} required />
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <AuthLayout>
            <div className="w-full">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white text-center">
                    {isSocial ? `Complete your ${stepOneData.provider} Sign up` : 'Tell us about yourself'}
                </h1>

                <form className="space-y-4 mt-6" onSubmit={handleSubmit}>
                    <FormField
                        id="phoneNumber"
                        label={<>Phone Number <span className="text-red-500 dark:text-red-400">*</span></>}
                        type="tel"
                        placeholder="0712345678"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        onBlur={handlePhoneBlur}
                        error={errors.phoneNumber}
                        disabled={isLinkedAccount}
                    />

                    {isLinkedAccount && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 -mt-3 mb-2">* Linked to parent account</p>
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
        </AuthLayout>
    );
};

export default RegisterDetailsPage;