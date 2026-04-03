import React, { useState } from 'react';
import Modal from '../molecules/Modal';
import PasswordInput from '../molecules/PasswordInput';
import Button from '../atoms/Button';
import { Loader } from 'lucide-react';
import { changePassword } from '../../services/auth/authService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ChangePasswordModal = ({ isOpen, onClose, onSuccess }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (newPassword.length < 6 || newPassword.length > 10) {
            setError("New password must be between 6 and 10 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }

        setIsLoading(true);

        try {
            await changePassword(currentPassword, newPassword);
            setSuccessMessage("Password changed successfully!");
            setTimeout(() => {
                if(onSuccess) onSuccess();
                handleClose();
            }, 1500);
        } catch (err) {
            setError(err.message || "Failed to change password. Please check your current password.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setSuccessMessage('');
        onClose();
    };

    const handleForgotPassword = () => {
        // To avoid the 'flicker' where the ProtectedRoute instantly redirects to /login,
        // we manually clear localStorage and use window.location.href. 
        // This keeps the in-memory Redux state 'authenticated' for the split second 
        // until the browser initiates the full-page navigation.
        
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        
        handleClose();
        window.location.href = '/forgot-password';
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Change Password">
            <form onSubmit={handleSubmit} className="space-y-4">
                {successMessage && (
                    <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-lg text-sm font-medium">
                        {successMessage}
                    </div>
                )}
                
                <div className="space-y-1">
                    <PasswordInput
                        id="currentPassword"
                        label="Current Password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                    />
                    <div className="flex justify-end">
                        <button 
                            type="button" 
                            onClick={handleForgotPassword}
                            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        >
                            Forgot your password?
                        </button>
                    </div>
                </div>
                
                <PasswordInput
                    id="newPassword"
                    label="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                />
                
                <PasswordInput
                    id="confirmPassword"
                    label="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
                
                {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
                    <Button type="submit" variant="primary" disabled={isLoading}>
                        {isLoading ? <Loader size={18} className="animate-spin mr-2"/> : null}
                        Update Password
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default ChangePasswordModal;
