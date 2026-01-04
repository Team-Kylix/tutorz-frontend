import React from 'react';
import { X, User, Phone, Mail, GraduationCap, School, MapPin } from 'lucide-react';
import InfoCard from '../molecules/InfoCard';

const StudentDetailModal = ({ isOpen, onClose, student }) => {
    if (!isOpen || !student) return null;

    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Student Details</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-4">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-2xl font-bold text-blue-600 dark:text-blue-300">
                            {(student.firstName || "U").charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {student.firstName} {student.lastName}
                            </h2>
                            <span className="inline-block px-2 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded mt-1">
                                {student.registrationNumber || "Pending Reg"}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <InfoCard icon={GraduationCap} label="Grade" value={student.grade} />
                        <InfoCard icon={User} label="Parent Name" value={student.parentName || "N/A"} />
                    </div>
                    
                    <InfoCard icon={School} label="School" value={student.schoolName || "Not Provided"} />
                    <InfoCard icon={Phone} label="Mobile" value={student.mobile} />
                    <InfoCard icon={Mail} label="Email" value={student.email || "N/A"} />
                    {student.address && <InfoCard icon={MapPin} label="Address" value={student.address} />}
                    
                    {/* Request Context Section */}
                    {student.targetClass && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900 mt-4">
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wide mb-1">
                                Requesting to Join
                            </p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                {student.targetClass} 
                                {student.classType && <span className="font-normal text-gray-500 dark:text-gray-400"> ({student.classType})</span>}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentDetailModal;