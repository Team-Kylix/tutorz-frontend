import React, { useState, useEffect } from 'react';
import { X, QrCode, AlertCircle, Building2 } from 'lucide-react';
import Button from '../atoms/Button';
import FormField from '../molecules/FormField';
import QrScanner from './QrScanner';
import ConfirmationModal from '../molecules/ConfirmationModal';
import { validatePhoneNumber } from '../../utils/validators';

const AddStudentModal = ({ isOpen, onClose, onSubmit, isSubmitting, selectedClass, onOpenRegister }) => {
    const [regNo, setRegNo] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [pendingValue, setPendingValue] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [inputError, setInputError] = useState('');

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setRegNo('');
            setIsScanning(false);
            setIsConfirmOpen(false);
            setPendingValue('');
            setSubmitError('');
            setInputError('');
        }
    }, [isOpen]);

    if (!isOpen || !selectedClass) return null;

    const isInstituteClass = !!selectedClass.instituteName;

    const handleScanComplete = (code) => {
        if (!code) return;
        setIsScanning(false);
        setPendingValue(code);
        setIsConfirmOpen(true);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        const val = regNo.trim();
        if (!val) return;

        // If it looks like a mobile number, validate the format
        const looksLikeMobile = /^\d/.test(val);
        if (looksLikeMobile) {
            const mobileValidation = validatePhoneNumber(val);
            if (!mobileValidation.isValid) {
                setInputError(mobileValidation.message + ' (e.g. 0712345678)');
                return;
            }
        }

        setInputError('');
        setSubmitError('');
        setPendingValue(val);
        setIsConfirmOpen(true);
    };

    const handleConfirm = async () => {
        setSubmitError('');
        const res = await onSubmit(pendingValue);
        if (res && res.success === false) {
            setSubmitError(res.error);
            setIsConfirmOpen(false);
        } else if (res && res.success === true) {
            setIsConfirmOpen(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 border border-transparent dark:border-gray-700 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add Student to Class</h3>
                    <button onClick={onClose} className="hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded-full transition-colors">
                        <X size={20} className="text-gray-500 dark:text-gray-400" />
                    </button>
                </div>
                
                {isInstituteClass ? (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex flex-col items-center text-center">
                        <Building2 size={32} className="text-amber-500 mb-2" />
                        <h4 className="text-amber-800 dark:text-amber-300 font-semibold mb-1">Institute Class Restriction</h4>
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                            This class is held at <strong>{selectedClass.instituteName}</strong>. Only the institute can add students directly to the class, or the student should send a request to join the class.
                        </p>
                        <Button variant="secondary" onClick={onClose} className="mt-4">Close</Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {isScanning ? (
                            <div className="space-y-4">
                                <QrScanner 
                                    onScan={handleScanComplete}
                                    onClose={() => setIsScanning(false)}
                                    title="Scan Student QR Code"
                                />
                                <div className="text-center">
                                    <Button variant="secondary" onClick={() => setIsScanning(false)}>Cancel Scan</Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* QR Scan Box */}
                                <div 
                                    onClick={() => setIsScanning(true)}
                                    className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center cursor-pointer border-2 border-dashed border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition">
                                    <div className="text-center text-blue-600 dark:text-blue-400">
                                        <QrCode className="mx-auto mb-2" />
                                        <span className="text-sm font-medium">Scan QR Code</span>
                                    </div>
                                </div>
                                
                                <div className="text-center text-sm text-gray-500 dark:text-gray-400">- OR -</div>
                                
                                <form onSubmit={handleFormSubmit}>
                                    <FormField 
                                        id="regNo" 
                                        label="Full Mobile Number or Registration Number" 
                                        placeholder="e.g. 07XXXXXXXX or STU-XXXXXX"
                                        value={regNo}
                                        onChange={(e) => { setRegNo(e.target.value); setInputError(''); }}
                                        required
                                    />
                                    {inputError && (
                                        <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                                            <AlertCircle size={12} className="shrink-0" />{inputError}
                                        </p>
                                    )}
                                    <div className="text-xs text-gray-500 mt-1 mb-4 flex gap-1 items-start">
                                        <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                        <span>Exact match required for security.</span>
                                    </div>
                                    <div className="mt-4 flex justify-end gap-2">
                                        <Button variant="secondary" onClick={onClose}>Cancel</Button>
                                        <Button type="submit" disabled={isSubmitting || !regNo.trim()}>Verify & Add</Button>
                                    </div>
                                    
                                    {submitError && (
                                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-lg flex flex-col gap-2">
                                            <div className="flex items-start gap-2">
                                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                                <span>{submitError}</span>
                                            </div>
                                            {submitError.toLowerCase().includes('not found') && onOpenRegister && (
                                                <Button variant="primary" size="sm" onClick={onOpenRegister} className="mt-2 w-full justify-center">
                                                    Register New Student
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </form>
                            </>
                        )}
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                title="Confirm Student Addition"
                message={
                    <div className="space-y-2">
                        <p>Are you sure you want to add the student matching the following detail to your class?</p>
                        <p className="font-semibold text-center bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 break-all">
                            {pendingValue}
                        </p>
                        <p className="text-sm text-gray-500">The student will be notified upon addition.</p>
                    </div>
                }
                confirmLabel={isSubmitting ? "Adding..." : "Confirm Add"}
                cancelLabel="Cancel"
                variant="primary"
                onConfirm={handleConfirm}
            />
        </div>
    );
};

export default AddStudentModal;