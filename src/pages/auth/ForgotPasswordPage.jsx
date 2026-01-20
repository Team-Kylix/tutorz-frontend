import React, { useState } from 'react';
import AuthLayout from '../../components/templates/AuthLayout';
import FormField from '../../components/molecules/FormField';
import { forgotPassword } from '../../services/auth/authService';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('Sending...');
        setError('');
        try {
            await forgotPassword(email);
            setStatus('Check your email for the reset link.');
        } catch (err) {
            setError(err.message); 
            setStatus('');
        }
    };

    return (
        <AuthLayout>
            <h2 className="text-2xl font-bold text-center mb-4 text-gray-900 dark:text-white">Forgot Password</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormField 
                    id="email" 
                    label="Enter your email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                />
                {status && <p className="text-green-600 dark:text-green-400 text-sm text-center">{status}</p>}
                {error && <p className="text-red-500 dark:text-red-400 text-sm text-center">{error}</p>}
                
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors">
                    Send Reset Link
                </button>
            </form>
        </AuthLayout>
    );
};

export default ForgotPasswordPage;