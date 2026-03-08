import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/templates/AuthLayout';
import PasswordInput from '../../components/molecules/PasswordInput';
import FormField from '../../components/molecules/FormField';
import { resetPassword } from '../../services/auth/authService';

const ResetPasswordPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Get identifier from Forgot Password page if available
    const identifier = location.state?.identifier || '';

    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Add Length Check
        if (password.length < 6 || password.length > 10) {
            setError("Password must be between 6 and 10 characters.");
            return;
        }

        // Existing Match Check
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            await resetPassword(otp, password);
            setIsSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000); // Redirect after 3 seconds
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <AuthLayout>
            <h2 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">Set New Password</h2>
            {identifier && <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-4">Code sent to {identifier}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormField
                    id="otp"
                    label="6-Digit Verification Code"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    required
                />
                <PasswordInput
                    id="new-pass"
                    label="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <PasswordInput
                    id="conf-pass"
                    label="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
                {error && <p className="text-red-500 dark:text-red-400 text-sm text-center">{error}</p>}
                {isSuccess && <p className="text-green-600 dark:text-green-400 text-sm text-center font-semibold bg-green-50 dark:bg-green-900/30 p-2 rounded-md">Password Reset Successfully! Redirecting to login...</p>}

                <button type="submit" disabled={isSuccess} className={`w-full text-white py-2 rounded-lg transition-colors ${isSuccess ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500'}`}>
                    Reset Password
                </button>
            </form>
        </AuthLayout>
    );
};

export default ResetPasswordPage;