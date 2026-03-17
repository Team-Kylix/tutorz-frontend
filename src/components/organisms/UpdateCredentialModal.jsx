import React, { useState } from 'react';
import Modal from '../molecules/Modal';
import FormField from '../molecules/FormField';
import Button from '../atoms/Button';
import { Loader } from 'lucide-react';
import { requestEmailUpdate, verifyEmailUpdate, requestMobileUpdate, verifyMobileUpdate } from '../../services/auth/authService';

const UpdateCredentialModal = ({ isOpen, onClose, type, currentIdentifier, onSuccess }) => {
    // type: 'email' or 'mobile'
    const [step, setStep] = useState(1); // 1: Request, 2: Verify OTP
    const [newIdentifier, setNewIdentifier] = useState('');
    const [otp, setOtp] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const labelName = type === 'email' ? 'Email Address' : 'Mobile Number';

    const handleRequest = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (type === 'email') {
                await requestEmailUpdate(newIdentifier);
            } else {
                await requestMobileUpdate(newIdentifier);
            }
            setStep(2);
            setSuccessMessage(`OTP sent to ${newIdentifier}`);
        } catch (err) {
            setError(err.message || `Failed to request ${type} update.`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (type === 'email') {
                await verifyEmailUpdate(newIdentifier, otp);
            } else {
                await verifyMobileUpdate(newIdentifier, otp);
            }
            setSuccessMessage(`${labelName} updated successfully!`);
            setTimeout(() => {
                onSuccess(newIdentifier);
                handleClose();
            }, 1500);
        } catch (err) {
            setError(err.message || 'Verification failed. Please check the OTP.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setStep(1);
        setNewIdentifier('');
        setOtp('');
        setError('');
        setSuccessMessage('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={`Update ${labelName}`}>
            <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Current {labelName}: <span className="font-semibold text-gray-900 dark:text-white">{currentIdentifier}</span>
                </p>

                {step === 1 ? (
                    <form onSubmit={handleRequest} className="space-y-4">
                        <FormField
                            id="newIdentifier"
                            label={`New ${labelName}`}
                            type={type === 'email' ? 'email' : 'tel'}
                            value={newIdentifier}
                            onChange={(e) => setNewIdentifier(e.target.value)}
                            required
                            placeholder={type === 'email' ? "new@example.com" : "07..."}
                        />
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        
                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
                            <Button type="submit" variant="primary" disabled={isLoading || !newIdentifier}>
                                {isLoading ? <Loader size={18} className="animate-spin mr-2"/> : null}
                                Send OTP
                            </Button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleVerify} className="space-y-4">
                        {successMessage && <p className="text-green-600 dark:text-green-400 text-sm bg-green-50 dark:bg-green-900/20 p-2 rounded">{successMessage}</p>}
                        
                        <FormField
                            id="otp"
                            label="Enter 6-digit OTP"
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            required
                            placeholder="123456"
                            className="tracking-widest"
                        />
                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="ghost" onClick={() => { setStep(1); setError(''); setSuccessMessage(''); }}>Back</Button>
                            <Button type="submit" variant="primary" disabled={isLoading || otp.length < 6}>
                                {isLoading ? <Loader size={18} className="animate-spin mr-2"/> : null}
                                Verify & Update
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </Modal>
    );
};

export default UpdateCredentialModal;
