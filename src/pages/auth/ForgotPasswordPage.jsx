import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../../components/templates/AuthLayout';
import FormField from '../../components/molecules/FormField';
import OtpVerificationModal from '../../components/organisms/OtpVerificationModal';
import { forgotPassword, checkUserStatus, verifyResetOtp } from '../../services/auth/authService';
import { validatePhoneNumber } from '../../utils/validators';

const ForgotPasswordPage = () => {
    const [identifier, setIdentifier] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const navigate = useNavigate();

    const validate = async (value) => {
        const trimmed = value.trim();

        if (!trimmed) {
            return 'Please enter your email or mobile number.';
        }

        const isEmail = trimmed.includes('@');
        const isPhone = /^07\d{8}$/.test(trimmed);

        // --- EMAIL ---
        if (isEmail) {
            // Basic standard email check
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(trimmed)) {
                return 'Please enter a valid email address (e.g. you@example.com).';
            }
            return null; // Email format OK — let backend verify existence
        }

        // --- MOBILE ---
        if (!isPhone) {
            // Not a valid email, not a valid phone
            if (/^\d+$/.test(trimmed)) {
                // It's a number but wrong format
                return 'Mobile number must start with 07 and be exactly 10 digits.';
            }
            return 'Please enter a valid email address or a 10-digit mobile number starting with 07.';
        }

        // Phone format is valid — now check if it's registered
        try {
            const status = await checkUserStatus({ phoneNumber: trimmed });
            if (!status.exists) {
                return 'This mobile number is not registered. Please check the number or register first.';
            }
        } catch {
            return 'Could not verify the mobile number. Please try again.';
        }

        return null; // All good
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const validationError = await validate(identifier.trim());
        if (validationError) {
            setError(validationError);
            setIsLoading(false);
            return;
        }

        try {
            await forgotPassword(identifier.trim());
            setShowOtpModal(true);
        } catch (err) {
            setError(err.message || 'Failed to send verification code. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (otpCode) => {
        // Verify the OTP via backend before navigating to the reset password page
        await verifyResetOtp(identifier.trim(), otpCode);
        
        setShowOtpModal(false);
        navigate('/reset-password', {
            state: {
                identifier: identifier.trim(),
                resetToken: otpCode,   // the 6-digit OTP IS the token
                otpVerified: true
            }
        });
    };

    return (
        <AuthLayout>
            <div className="w-full">
                <h1 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">
                    Forgot Password
                </h1>
                <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">
                    Enter your registered email or mobile number. We'll send you a verification code.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField
                        id="identifier"
                        label="Email or Mobile Number"
                        type="text"
                        value={identifier}
                        onChange={(e) => {
                            setIdentifier(e.target.value);
                            if (error) setError('');
                        }}
                        placeholder="you@example.com or 0712345678"
                        required
                        error={error}
                    />

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Checking...' : 'Send Verification Code'}
                    </button>
                </form>

                <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    Remember your password?{' '}
                    <Link to="/login" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                        Log In
                    </Link>
                </p>
            </div>

            <OtpVerificationModal
                isOpen={showOtpModal}
                onClose={() => setShowOtpModal(false)}
                onVerify={handleVerifyOtp}
                identifier={identifier.trim()}
            />
        </AuthLayout>
    );
};

export default ForgotPasswordPage;