import React, { useState, useEffect } from 'react';
import { X, Search, Check, Trash2, Filter, Loader } from 'lucide-react';
import Button from '../atoms/Button';
import StudentDetailModal from './StudentDetailModal';
import useApi from '../../hooks/useApi'; 
import * as tutorService from '../../services/api/tutorService'; 

const StudentRequestsModal = ({ isOpen, onClose }) => {
    const [requests, setRequests] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [viewingStudent, setViewingStudent] = useState(null); 

    // API Hooks
    const { request: fetchRequests, loading: isLoading } = useApi();
    const { request: processRequests, loading: isProcessing } = useApi();
    const { request: fetchProfile, loading: isProfileLoading } = useApi();

    // Fetch Data on Open
    useEffect(() => {
        if (isOpen) {
            loadRequests();
        }
    }, [isOpen]);

    const loadRequests = async () => {
        // Destructure 'data' from the useApi result
        const { data } = await fetchRequests(tutorService.getStudentRequests);
        
        // Ensure data is an array before setting it, otherwise default to []
        if (data && Array.isArray(data)) {
            setRequests(data);
        } else {
            setRequests([]);
        }
    };

    // Filter Logic (Client-side)
    // We safeguard with (req.property || "") to prevent crashes if a field is null
    const filteredRequests = requests.filter(req => 
        (req.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (req.regNo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (req.mobile || "").includes(searchTerm) ||
        (req.grade || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Selection Logic
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredRequests.map(r => r.enrollmentId));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    // Action Logic (Accept/Decline)
    const handleAction = async (actionType) => {
        //Destructure 'data' here as well
        const { data: result } = await processRequests(tutorService.processStudentRequests, selectedIds, actionType);
        
        if (result) {
            // Optimistic UI Update: Remove processed requests from list
            setRequests(prev => prev.filter(req => !selectedIds.includes(req.enrollmentId)));
            setSelectedIds([]);
        }
    };

    // Row Click Logic (Fetch Profile & Open Modal)
    const handleRowClick = async (req, e) => {
        // Prevent clicking if clicking checkbox/buttons
        if (e.target.type === 'checkbox' || e.target.closest('button')) return;

        // Destructure 'data' to get the actual profile object
        const { data: profile } = await fetchProfile(tutorService.getStudentProfileForTutor, req.studentId);
        
        if (profile) {
            // Combine Profile Data + Request Context (Class Name, etc.)
            setViewingStudent({
                ...profile,
                targetClass: req.targetClass,
                classType: req.classType
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[80vh]">
                
                {/* Header */}
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Student Requests</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage pending enrollment requests</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400">
                        <X size={24} />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by Name, Reg ID, Mobile..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 dark:text-white dark:placeholder-gray-500"
                        />
                    </div>
                    
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button 
                            variant="primary" 
                            size="small" 
                            disabled={selectedIds.length === 0 || isProcessing}
                            onClick={() => handleAction('Accepted')}
                            className="bg-green-600 hover:bg-green-700 border-transparent text-white"
                        >
                            {isProcessing ? <Loader className="animate-spin mr-2" size={16}/> : <Check size={16} className="mr-2" />} 
                            Accept ({selectedIds.length})
                        </Button>
                        <Button 
                            variant="outline" 
                            size="small"
                            disabled={selectedIds.length === 0 || isProcessing}
                            onClick={() => handleAction('Declined')}
                            className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20"
                        >
                            <Trash2 size={16} className="mr-2" /> Decline
                        </Button>
                    </div>
                </div>

                {/* Table Content */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader className="animate-spin text-blue-600" size={32} />
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                            <Filter size={48} className="mb-2 opacity-20" />
                            <p>No pending requests found.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                                <tr>
                                    <th className="p-4 w-10">
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-800"
                                            onChange={handleSelectAll}
                                            checked={filteredRequests.length > 0 && selectedIds.length === filteredRequests.length}
                                        />
                                    </th>
                                    <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Student Info</th>
                                    <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Grade</th>
                                    <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Requesting For</th>
                                    <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredRequests.map((req) => (
                                    <tr 
                                        key={req.enrollmentId} 
                                        onClick={(e) => handleRowClick(req, e)}
                                        className={`hover:bg-blue-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${selectedIds.includes(req.enrollmentId) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                    >
                                        <td className="p-4">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedIds.includes(req.enrollmentId)}
                                                onChange={() => handleSelectOne(req.enrollmentId)}
                                                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-800"
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-gray-900 dark:text-white">{req.name}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{req.regNo} • {req.mobile}</div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{req.grade}</td>
                                        <td className="p-4">
                                            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">{req.targetClass}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{req.classType}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setSelectedIds([req.enrollmentId]); handleAction('Accepted'); }}
                                                    className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors" 
                                                    title="Accept"
                                                >
                                                    <Check size={18} />
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setSelectedIds([req.enrollmentId]); handleAction('Declined'); }}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                                    title="Decline"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                
                <div className="p-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 text-xs text-center text-gray-500 dark:text-gray-400">
                    Click on a row to view full student details
                </div>
            </div>

            {/* Nested Modal for Student Details */}
            {isProfileLoading && viewingStudent === null && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <Loader className="animate-spin text-white" size={48} />
                 </div>
            )}
            
            <StudentDetailModal 
                isOpen={!!viewingStudent} 
                onClose={() => setViewingStudent(null)} 
                student={viewingStudent} 
            />
        </div>
    );
};

export default StudentRequestsModal;