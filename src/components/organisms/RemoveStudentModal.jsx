import React, { useState, useEffect } from 'react';
import { 
    X, Loader2, AlertCircle, LogOut, GraduationCap
} from 'lucide-react';
import { 
    getStudentClassesForInstitute, 
    dropStudentFromInstituteClass
} from '../../services/api/instituteService';
import { 
    getStudentClassesForTutor,
    dropStudentFromTutorClass
} from '../../services/api/tutorService';
import { BASE_URL } from '../../services/api/apiClient';
import ConfirmationModal from '../molecules/ConfirmationModal';

const RemoveStudentModal = ({ isOpen, onClose, student, type, onUpdated }) => {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [confirmRemoveClassId, setConfirmRemoveClassId] = useState(null);

    useEffect(() => {
        if (isOpen && student) {
            fetchClasses();
            setError('');
        }
    }, [isOpen, student]);

    const fetchClasses = async () => {
        try {
            setLoading(true);
            let res;
            if (type === 'Institute') {
                res = await getStudentClassesForInstitute(student.studentId);
            } else {
                res = await getStudentClassesForTutor(student.studentId);
            }
            if (res?.success) {
                setClasses(res.data || []);
            } else {
                setError(res?.message || 'Failed to load classes.');
            }
        } catch (err) {
            setError('Error loading classes.');
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = (classId) => {
        setConfirmRemoveClassId(classId);
    };

    const executeRemove = async () => {
        if (!confirmRemoveClassId) return;
        try {
            setActionLoading(true);
            setError('');
            if (type === 'Institute') {
                await dropStudentFromInstituteClass(student.studentId, confirmRemoveClassId);
            } else {
                await dropStudentFromTutorClass(student.studentId, confirmRemoveClassId);
            }
            await fetchClasses();
            if (onUpdated) onUpdated();
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to drop student.');
        } finally {
            setActionLoading(false);
            setConfirmRemoveClassId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Remove Student From Class
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {student?.studentName || student?.firstName + ' ' + student?.lastName}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex flex-col justify-center items-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                            <p className="text-gray-500">Loading classes...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {classes.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    This student is not actively enrolled in any of your classes.
                                </div>
                            ) : (
                                classes.map(cls => (
                                    <div key={cls.classId} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-white">{cls.className}</h4>
                                            <p className="text-sm text-gray-500">{cls.classType} • {cls.grade}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => handleRemove(cls.classId)}
                                                disabled={actionLoading}
                                                className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1.5"
                                            >
                                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            <ConfirmationModal
                isOpen={!!confirmRemoveClassId}
                onClose={() => setConfirmRemoveClassId(null)}
                onConfirm={executeRemove}
                title="Remove Student"
                message="Are you sure you want to remove this student from the class? This action cannot be undone."
                confirmLabel="Remove"
                cancelLabel="Cancel"
                variant="danger"
                isSubmitting={actionLoading}
            />
        </div>
    );
};

export default RemoveStudentModal;
