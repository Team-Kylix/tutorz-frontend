import React from 'react';
import Button from '../atoms/Button';

const DuplicateUserModal = ({ isOpen, onClose, existingUser, onItsMe, onItsParent, loading, isInstituteView }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md border border-transparent dark:border-gray-700">
                <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Account Found</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                        {isInstituteView ? (
                            <>The number <b>{existingUser?.identifier}</b> belongs to <b>{existingUser?.name || 'an existing student'}</b>. Would you like to add a sibling account to this parent's profile?</>
                        ) : (
                            <>The account with <b className="text-gray-900 dark:text-white">{existingUser?.identifier}</b> belongs to <b className="text-gray-900 dark:text-white">{existingUser?.name || 'an existing user'}</b> and is already registered.</>
                        )}
                    </p>
                </div>

                <div className="space-y-3">
                    {!isInstituteView && (
                        <Button variant="outline" fullWidth onClick={onItsMe} disabled={loading}>
                            That's me! (Log In)
                        </Button>
                    )}

                    <Button
                        variant="primary"
                        fullWidth
                        onClick={onItsParent}
                        loading={loading}
                        disabled={loading}
                    >
                        {isInstituteView ? "Yes, Register Sibling Account" : "That's my Family Account (Add Sibling)"}
                    </Button>

                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mt-2 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DuplicateUserModal;