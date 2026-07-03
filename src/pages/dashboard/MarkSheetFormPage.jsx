import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api/apiClient';
import { getJoinedInstitutes, getClasses, getTutorAttendanceHistory } from '../../services/api/tutorService';
import Input from '../../components/atoms/Input';
import Button from '../../components/atoms/Button';
import ConfirmationModal from '../../components/molecules/ConfirmationModal';

const MarkSheetFormPage = ({ id, onBack }) => {
    const isEditing = !!id;

    const [institutes, setInstitutes] = useState([]);
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);

    const [selectedInstitute, setSelectedInstitute] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [title, setTitle] = useState('');
    
    const [marksData, setMarksData] = useState({}); // { studentId: marks }
    
    // UI state
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [saveModalOpen, setSaveModalOpen] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            
            // Fetch joined institutes and classes
            const [institutesRes, classesRes] = await Promise.all([
                getJoinedInstitutes(),
                getClasses()
            ]);
            
            setClasses(classesRes?.items || classesRes?.data || classesRes || []);
            
            // Derive available institutes from classes
            const classesData = classesRes?.items || classesRes?.data || classesRes || [];
            const instMap = new Map();
            let hasOwnPlace = false;
            classesData.forEach(cls => {
                if (cls.instituteId) {
                    instMap.set(cls.instituteId, cls.instituteName || cls.institute?.name || 'Unknown Institute');
                } else {
                    hasOwnPlace = true;
                }
            });
            const instList = Array.from(instMap.entries()).map(([id, name]) => ({ instituteId: id, instituteName: name }));
            if (hasOwnPlace) {
                instList.unshift({ instituteId: 'own', instituteName: 'My Own Place' });
            }
            setInstitutes(instList);

            if (isEditing) {
                const markSheetRes = await api.get(`/Tutor/marks/${id}`);
                if (markSheetRes.data?.success) {
                    const data = markSheetRes.data.data;
                    setSelectedInstitute(data.instituteId);
                    setSelectedClass(data.classId);
                    setTitle(data.title);
                    
                    const existingMarks = {};
                    data.markRecords.forEach(r => {
                        existingMarks[r.studentId] = r.marks;
                    });
                    setMarksData(existingMarks);

                    // Fetch students for this class
                    fetchStudentsForClass(data.classId, data.markRecords);
                }
            }
        } catch (error) {
            console.error('Failed to fetch initial data:', error);
            setError('Failed to load required data.');
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentsForClass = async (classId, markRecords = null) => {
        try {
            if (isEditing && markRecords) {
                setStudents(markRecords.map(r => ({
                    userId: r.studentId,
                    fullName: r.studentName || 'Unknown',
                    registrationNumber: r.registrationNumber
                })));
                return;
            }
            
            const response = await getTutorAttendanceHistory(classId, undefined, '', 1, 100); 
            const resData = response?.data || response;
            if (resData?.students) {
                const fetchedStudents = resData.students;
                setStudents(fetchedStudents.map(s => ({
                    userId: s.studentId,
                    fullName: s.name || 'Unknown',
                    registrationNumber: s.registrationNumber
                })));
                const initialMarks = {};
                fetchedStudents.forEach(s => {
                    initialMarks[s.studentId] = '';
                });
                setMarksData(initialMarks);
            }
        } catch (error) {
            console.error('Failed to fetch students:', error);
        }
    };

    useEffect(() => {
        if (!isEditing && selectedClass) {
            fetchStudentsForClass(selectedClass);
        }
    }, [selectedClass]);

    const handleMarkChange = (studentId, value) => {
        let numericValue = value;
        if (value !== '') {
            const parsed = parseFloat(value);
            if (parsed > 100) numericValue = '100';
            else if (parsed < 0) numericValue = '0';
        }

        setMarksData(prev => ({
            ...prev,
            [studentId]: numericValue
        }));
    };

    const handleSave = async () => {
        if (!title || !selectedClass || !selectedInstitute) {
            setError('Please select an institute, a class, and enter a title.');
            return;
        }

        if (students.length === 0) {
            setError('There are no students in this class to save marks for.');
            return;
        }

        const hasAnyMarks = Object.values(marksData).some(val => val !== '' && val !== null && val !== undefined);
        if (!hasAnyMarks) {
            setError('Please enter marks for at least one student before saving.');
            return;
        }

        setSaveModalOpen(true);
    };

    const executeSave = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccess(false);

            const payload = {
                instituteId: selectedInstitute === 'own' ? null : selectedInstitute,
                classId: selectedClass,
                title: title,
                marks: Object.keys(marksData).map(studentId => {
                    let val = parseFloat(marksData[studentId]) || 0;
                    if (val > 100) val = 100;
                    if (val < 0) val = 0;
                    return {
                        studentId: studentId,
                        marks: val
                    };
                })
            };

            if (isEditing) {
                await api.put(`/Tutor/marks/${id}`, payload);
            } else {
                await api.post('/Tutor/marks', payload);
            }

            setSuccess(true);
            setSaveModalOpen(false);
            setTimeout(() => {
                if (onBack) onBack();
            }, 1000);
        } catch (error) {
            console.error('Failed to save mark sheet:', error);
            setError('Failed to save mark sheet. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const filteredClasses = classes.filter(c => selectedInstitute === 'own' ? !c.instituteId : c.instituteId === selectedInstitute);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <p className="text-gray-500">Loading form...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => { if (onBack) onBack(); }}
                        className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {isEditing ? 'Edit Mark Sheet' : 'Create Mark Sheet'}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Record and manage student performance.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button onClick={handleSave} disabled={saving} className="shadow-sm">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        {saving ? 'Saving...' : 'Save Marks'}
                    </Button>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl border border-green-100 dark:border-green-900/30 text-sm">
                    <CheckCircle className="w-5 h-5 shrink-0" />
                    <span>Mark sheet saved successfully! Redirecting...</span>
                </div>
            )}

            {/* Filter Controls */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-4 items-end">
                {/* Select Institute */}
                <div className="w-full md:w-1/3 flex flex-col items-start gap-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Institute
                    </label>
                    <select
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                        value={selectedInstitute}
                        onChange={(e) => {
                            setSelectedInstitute(e.target.value);
                            setSelectedClass('');
                        }}
                        disabled={isEditing || saving}
                    >
                        <option value="">-- Select Institute --</option>
                        {institutes.map(inst => (
                            <option key={inst.instituteId} value={inst.instituteId}>
                                {inst.instituteName}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Select Class */}
                <div className="w-full md:w-1/3 flex flex-col items-start gap-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Class
                    </label>
                    <select
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        disabled={isEditing || !selectedInstitute || saving}
                    >
                        <option value="">-- Select Class --</option>
                        {filteredClasses.map(c => (
                            <option key={c.classId} value={c.classId}>
                                {c.className} - {c.grade}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Enter Title */}
                <div className="w-full md:w-1/3 flex flex-col items-start gap-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Title / Subject
                    </label>
                    <Input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Mid Term Exam"
                        disabled={saving}
                    />
                </div>
            </div>

            {/* Students Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Student Marks</h3>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] text-sm text-left">
                        <thead className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 uppercase border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4 font-medium">Student Name</th>
                                <th className="px-6 py-4 font-medium w-48">Marks (out of 100)</th>
                                <th className="px-6 py-4 font-medium">Registration No</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {!selectedClass ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        Please select an institute and class to load students.
                                    </td>
                                </tr>
                            ) : students.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        No students found in this class.
                                    </td>
                                </tr>
                            ) : (
                                students.map(student => (
                                    <tr key={student.userId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            {student.fullName}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.01"
                                                value={marksData[student.userId] !== undefined ? marksData[student.userId] : ''}
                                                onChange={(e) => handleMarkChange(student.userId, e.target.value)}
                                                className="w-32 inline-block"
                                                placeholder="0.00"
                                                disabled={saving}
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                            {student.registrationNumber || 'N/A'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmationModal
                isOpen={saveModalOpen}
                onClose={() => !saving && setSaveModalOpen(false)}
                onConfirm={executeSave}
                onCancel={() => setSaveModalOpen(false)}
                title={isEditing ? "Update Mark Sheet" : "Save Mark Sheet"}
                message={isEditing ? "Are you sure you want to update this mark sheet?" : "Are you sure you want to save this mark sheet?"}
                confirmLabel="Save"
                cancelLabel="Cancel"
                variant="primary"
                isSubmitting={saving}
            />
        </div>
    );
};

export default MarkSheetFormPage;
