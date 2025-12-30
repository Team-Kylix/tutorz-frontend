import React, { useState } from 'react';
import { X, QrCode } from 'lucide-react';
import Button from '../atoms/Button';
import FormField from '../molecules/FormField';

const AddStudentModal = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
    if (!isOpen) return null;
    const [regNo, setRegNo] = useState('');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            {/* Modal Container: White in Light Mode, Dark Gray in Dark Mode */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 border border-transparent dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add Student to Class</h3>
                    <button onClick={onClose} className="hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded-full transition-colors">
                        <X size={20} className="text-gray-500 dark:text-gray-400" />
                    </button>
                </div>
                
                <div className="space-y-4">
                    {/* QR Scan Box */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center cursor-pointer border-2 border-dashed border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition">
                        <div className="text-center text-blue-600 dark:text-blue-400">
                            <QrCode className="mx-auto mb-2" />
                            <span className="text-sm font-medium">Scan QR Code</span>
                        </div>
                    </div>
                    
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400">- OR -</div>
                    
                    <form onSubmit={(e) => { e.preventDefault(); onSubmit(regNo); }}>
                        <FormField 
                            id="regNo" 
                            label="Student Registration Number" 
                            placeholder="e.g. STU-25080001"
                            value={regNo}
                            onChange={(e) => setRegNo(e.target.value)}
                            required
                        />
                        <div className="mt-4 flex justify-end gap-2">
                            <Button variant="secondary" onClick={onClose}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>Add Student</Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
export default AddStudentModal;