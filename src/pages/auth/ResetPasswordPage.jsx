import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/templates/AuthLayout';
import PasswordInput from '../../components/molecules/PasswordInput';
import { resetPassword } from '../../services/auth/authService';
import { CheckCircle2 } from 'lucide-react';

const ResetPasswordPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const identifier = location.state?.identifier || '';
    const resetToken = location.state?.resetToken || '';
    const otpVerified = location.state?.otpVerified === true;

    // Guard: if someone navigates here directly without going through OTP, redirect back
    useEffect(() => {
        if (!otpVerified || !identifier || !resetToken) {
            navigate('/forgot-password');
        }
    }, [otpVerified, identifier, resetToken, navigate]);

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    if (!otpVerified || !identifier || !resetToken) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 6 || password.length > 10) {
            setError('Password must be between 6 and 10 characters.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        try {
            // resetToken is the 6-digit OTP the user entered, which the backend
            // stored in PasswordResetToken via the forgot-password endpoint.
            // The reset-password endpoint looks up the user by that token value.
            await resetPassword(resetToken, password);
            setIsSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.message || 'Failed to reset password. The code may have expired. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <AuthLayout>
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 shadow-sm ring-4 ring-green-50 dark:ring-green-900/10">
                        <CheckCircle2 size={40} className="text-green-500 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Password Reset!</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Your password has been updated successfully. Redirecting you to login...
                    </p>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            <div className="w-full">
                <h1 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">
                    Set New Password
                </h1>
                <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">
                    Create a new password for <span className="font-medium text-gray-700 dark:text-gray-300">{identifier}</span>
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <PasswordInput
                        id="new-pass"
                        label="New Password"
                        placeholder="6–10 characters"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            if (error) setError('');
                        }}
                        required
                    />
                    <PasswordInput
                        id="conf-pass"
                        label="Confirm New Password"
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (error) setError('');
                        }}
                        required
                    />

                    {error && (
                        <p className="text-red-500 dark:text-red-400 text-sm text-center bg-red-50 dark:bg-red-900/20 p-2 rounded-md">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Saving...' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </AuthLayout>
    );
};

export default ResetPasswordPage;