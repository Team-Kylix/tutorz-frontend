import React, { useState } from 'react';
import FormField from '../molecules/FormField';
import Button from '../atoms/Button';

const OtpVerificationModal = ({ isOpen, onClose, onVerify, identifier }) => {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await onVerify(otp); // Parent handles error
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-sm transition-colors border border-transparent dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-2">Verify Identity</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
                    Code sent to <b className="text-gray-900 dark:text-gray-200">{identifier}</b>
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField
                        id="otp"
                        label="Enter OTP"
                        placeholder="123456"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        // Note: FormField handles the base input styles (bg/text colors) for dark mode.
                        // We just pass alignment classes here.
                        className="text-center tracking-widest text-lg"
                    />

                    <Button type="submit" fullWidth disabled={loading}>
                        {loading ? 'Verifying...' : 'Verify'}
                    </Button>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                </form>
            </div>
        </div>
    );
};

export default OtpVerificationModal;