import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import SocialLoginButton from '../molecules/SocialLogin/SocialLoginButton.jsx';
import FormField from '../molecules/FormField.jsx';
import PasswordInput from '../molecules/PasswordInput.jsx';
import Label from '../atoms/Label.jsx';
import Button from '../atoms/Button.jsx';
import DuplicateUserModal from './DuplicateUserModal.jsx';
import OtpVerificationModal from './OtpVerificationModal.jsx';
import { checkUserStatus, sendOtp, verifyOtp } from '../../services/auth/authService.js';
import { getGoogleUserProfile } from '../../services/auth/googleAuthService.js';
import { validateSocialProvider } from '../../utils/validators.js';

const RegisterForm = ({ onSwitchToLogin }) => {
    // state and hooks
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');

    // Errors
    const [passwordError, setPasswordError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [roleError, setRoleError] = useState('');
    const [appleError, setAppleError] = useState('');

    // Loading & Modals
    const [isChecking, setIsChecking] = useState(false);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [existingUser, setExistingUser] = useState(null);
    const [tempSocialProfile, setTempSocialProfile] = useState(null);
    const [otpFlowType, setOtpFlowType] = useState(null); // 'sibling' or 'new_mobile'

    // handleAppleClick, validateRoleSelection, googleRegister, handleGoogleClick
    const handleAppleClick = () => {
        setAppleError('');
        if (!validateRoleSelection()) return;
        const validation = validateSocialProvider('apple');
        if (!validation.isValid) setAppleError(validation.message);
    };

    const validateRoleSelection = () => {
        if (!role) {
            setRoleError('Please select a role first: Student, Tutor or Institute.');
            return false;
        }
        setRoleError('');
        return true;
    };

    const googleRegister = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setIsChecking(true);
            setEmailError('');
            try {
                const profile = await getGoogleUserProfile(tokenResponse.access_token);

                const response = await checkUserStatus({ email: profile.email }); 
                
                // User Found
                if (response.exists) {
                    // Exists as Student AND trying to register as Student
                    if (response.role === 'Student' && role === 'Student') {
                        setEmail(profile.email);
                        setExistingUser({ identifier: profile.email, name: response.name });
                        
                        setTempSocialProfile({
                            firstName: profile.firstName,
                            lastName: profile.lastName,
                            email: profile.email,
                            idToken: tokenResponse.access_token
                        });

                        setShowDuplicateModal(true);
                        return;
                    }

                    // Block other cases
                    setEmailError(`This account belongs to ${response.name} and is already registered. Please log in.`);
                    return;
                }

                // User Not Found -> Proceed
                navigate('/register-details', {
                    state: {
                        stepOneData: {
                            email: profile.email,
                            role: role,
                            isSocial: true,
                            provider: 'Google',
                        },
                        socialProfile: {
                            firstName: profile.firstName,
                            lastName: profile.lastName,
                            idToken: tokenResponse.access_token
                        }
                    }
                });
            } catch (error) {
                console.error(error);
                setEmailError("Failed to verify Google account.");
            } finally {
                setIsChecking(false);
            }
        },
        onError: () => setEmailError('Google registration failed.'),
    });

    const handleGoogleClick = () => {
        if (validateRoleSelection()) googleRegister();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setEmailError('');
        setRoleError('');
        setPasswordError('');

        if (!role) {
            setRoleError('Please select a role first.');
            return;
        }

        if (password.length < 6 || password.length > 10) {
            setPasswordError("Password must be between 6 and 10 characters.");
            return;
        }

        // Basic format check
        const isEmail = email.includes('@');
        const isPhone = /^07\d{8}$/.test(email);

        if (!isEmail && !isPhone) {
            setEmailError("Please enter a valid Email or Mobile Number (07...)");
            return;
        }

        setIsChecking(true);
        try {
            // Pass object structure required by your updated authService
            let checkPayload = {};
            if (isEmail) checkPayload = { email: email };
            else checkPayload = { phoneNumber: email };

            const response = await checkUserStatus(checkPayload);
            
            // Use 'response.exists' instead of 'response.status'
            if (response.exists) {
                // Sibling Flow
                if (response.role === 'Student' && role === 'Student') {
                    setExistingUser({ identifier: email, name: response.name });
                    setShowDuplicateModal(true);
                } else {
                    // Block Tutor/Institute re-registration or role mismatch
                    setEmailError(`This account belongs to ${response.name} and is already registered as a ${response.role}. Please log in.`);
                }
            } 
            // User Not Found -> Proceed
            else {
                const stepOneData = { 
                    email: isEmail ? email : '', 
                    phoneNumber: isPhone ? email : '',
                    password, 
                    role, 
                    isSocial: false 
                };
                navigate('/register-details', { state: { stepOneData } });
            }

        } catch (error) {
            setEmailError(error.message || 'Something went wrong. Please try again.');
        } finally {
            setIsChecking(false);
        }
    };

    // Modal Actions: handleItsMe, handleItsParent, handleVerifyOtp
    const handleItsMe = () => {
        alert("Please log in using your existing credentials.");
        navigate('/login');
    };

    const handleItsParent = async () => {
        setShowDuplicateModal(false);
        setIsChecking(true);
        try {
            await sendOtp(email);
            setOtpFlowType('sibling');
            setShowOtpModal(true);
        } catch (error) {
            setEmailError("Failed to send verification code.");
        } finally {
            setIsChecking(false);
        }
    };

    const handleVerifyOtp = async (otpCode) => {
        try {
            const response = await verifyOtp(email, otpCode);

            setShowOtpModal(false);
            let backendPhone = response.phoneNumber || email;
            let formattedPhone = backendPhone;
            
            if (backendPhone && backendPhone.startsWith('+94')) {
                formattedPhone = '0' + backendPhone.substring(3);
            }

            const stepOneData = {
                email,
                password,
                role,
                isSocial: false,
                isLinkedAccount: true,
                linkedPhoneNumber: formattedPhone
            };
            
            if (tempSocialProfile) {
                navigate('/register-details', {
                    state: {
                        stepOneData: {
                            ...stepOneData,
                            isSocial: true,
                            provider: 'Google'
                        },
                        socialProfile: {
                            firstName: tempSocialProfile.firstName,
                            lastName: tempSocialProfile.lastName,
                            idToken: tempSocialProfile.idToken
                        }
                    }
                });
            } else {
                navigate('/register-details', { state: { stepOneData } });
            }

        } catch (error) {
            console.error("OTP Error", error);
            throw error;
        }
    };

    // Modal Actions: handleItsMe, handleItsParent, handleVerifyOtp
    const icons = {
        Student: (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.499 5.24 50.552 50.552 0 01-2.478.783M12 10.147a3.896 3.896 0 100-7.792 3.896 3.896 0 000 7.792z" /></svg>),
        Tutor: (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>),
        Institute: (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" /></svg>)
    };

    return (
        <div className="w-full">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white text-center">Create your account</h1>

            <div className="mt-6">
                <Label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 text-center ">
                    I am a (Select Role)
                </Label>
                <div className="grid grid-cols-3 gap-3">
                    {['Student', 'Tutor', 'Institute'].map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => { setRole(option); setRoleError(''); }}
                            className={`
                                flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200
                                ${role === option
                                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 ring-2 ring-blue-500 ring-opacity-50'
                                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }
                            `}
                        >
                            {icons[option]}
                            <span className="text-xs font-semibold">{option}</span>
                        </button>
                    ))}
                </div>
                {roleError && <p className="text-xs text-red-500 dark:text-red-400 mt-2 text-center font-medium">{roleError}</p>}
            </div>

            <div className="mt-6 space-y-4">
                <SocialLoginButton provider="google" onClick={handleGoogleClick} type="button">
                    Sign up with Google
                </SocialLoginButton>
                <div className="flex flex-col">
                    <SocialLoginButton provider="apple" onClick={handleAppleClick} type="button">
                        Sign up with Apple
                    </SocialLoginButton>
                    {appleError && <p className="text-xs text-red-500 dark:text-red-400 mt-2 text-center font-medium ">{appleError}</p>}
                </div>
            </div>

            <div className="my-6 flex items-center">
                <hr className="flex-grow border-gray-300 dark:border-gray-700" />
                <span className="mx-4 text-sm font-medium text-gray-500 dark:text-gray-400">OR</span>
                <hr className="flex-grow border-gray-300 dark:border-gray-700" />
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
                <FormField
                    id="email"
                    label="Email or Mobile Number"
                    type="text"
                    placeholder="you@example.com or 0712345678"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError('');
                    }}
                    required
                    error={emailError}
                />

                <PasswordInput
                    id="password"
                    label="Password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError('');
                    }}
                    required
                    error={passwordError}
                />

                <Button type="submit" variant="primary" fullWidth disabled={isChecking}>
                    {isChecking ? 'Checking...' : 'Next'}
                </Button>
            </form>

            <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <button onClick={onSwitchToLogin} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                    Log In
                </button>
            </p>

            <DuplicateUserModal
                isOpen={showDuplicateModal}
                onClose={() => setShowDuplicateModal(false)}
                existingUser={existingUser}
                onItsMe={handleItsMe}
                onItsParent={handleItsParent}
            />
            
            <OtpVerificationModal
                isOpen={showOtpModal}
                onClose={() => setShowOtpModal(false)}
                onVerify={handleVerifyOtp}
                identifier={email}
            />
        </div>
    );
};

export default RegisterForm;