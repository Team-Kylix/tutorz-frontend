import React, { useState, useEffect } from 'react';
import FormField from '../molecules/FormField';
import Button from '../atoms/Button';
import { Timer } from 'lucide-react';

const OtpVerificationModal = ({ isOpen, onClose, onVerify, identifier }) => {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

    useEffect(() => {
        if (!isOpen) return;
        
        // Reset timer when modal opens
        setTimeLeft(600);

        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen]);

    if (!isOpen) return null;

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onVerify(otp);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-sm transition-colors border border-transparent dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-2">Verify Identity</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
                    Code sent to <b className="text-gray-900 dark:text-gray-200">{identifier}</b>
                </p>

                <div className="flex items-center justify-center gap-2 mb-6 text-sm font-medium">
                    <Timer size={16} className={timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-blue-500'} />
                    <span className={timeLeft < 60 ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'}>
                        OTP valid for: {formatTime(timeLeft)}
                    </span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField
                        id="otp"
                        label="Enter OTP"
                        placeholder="123456"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="text-center tracking-widest text-lg"
                    />

                    <Button type="submit" fullWidth disabled={loading || timeLeft === 0}>
                        {loading ? 'Verifying...' : (timeLeft === 0 ? 'OTP Expired' : 'Verify')}
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