import React, { useState, useEffect, useCallback } from 'react';
import {
    Users, Check, X, Loader2, Search, Filter,
    RefreshCw, AlertCircle, Clock, Trash2
} from 'lucide-react';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import StatCard from '../../components/molecules/StatCard';
import StudentDetailModal from '../../components/organisms/StudentDetailModal';

// Services & Hooks
import useApi from '../../hooks/useApi';
import * as tutorService from '../../services/api/tutorService';

const StudentRequestsPage = () => {
    const [requests, setRequests] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [viewingStudent, setViewingStudent] = useState(null);

    // API Hooks
    const { request: fetchRequests, loading: isLoading } = useApi();
    const { request: processRequests, loading: isProcessing } = useApi();
    const { request: fetchProfile, loading: isProfileLoading } = useApi();

    // Debounce Search Term
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const loadRequests = useCallback(async () => {
        const { data } = await fetchRequests(tutorService.getStudentRequests);
        if (data && Array.isArray(data)) {
            setRequests(data);
        } else {
            setRequests([]);
        }
    }, [fetchRequests]);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    // Filter Logic
    const filteredRequests = requests.filter(req =>
        (req.name || "").toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (req.regNo || "").toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (req.mobile || "").includes(debouncedSearchTerm) ||
        (req.grade || "").toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );

    // Selection Logic
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredRequests.map(r => r.enrollmentId));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id, e) => {
        e.stopPropagation();
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    // Action Logic
    const handleAction = async (actionType, ids = selectedIds) => {
        if (ids.length === 0) return;
        const { data: result } = await processRequests(tutorService.processStudentRequests, ids, actionType);

        if (result) {
            setRequests(prev => prev.filter(req => !ids.includes(req.enrollmentId)));
            setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
        }
    };

    // Row Click Logic
    const handleRowClick = async (req, e) => {
        // Prevent clicking if clicking checkbox or buttons
        if (e.target.type === 'checkbox' || e.target.closest('button')) return;

        const { data: profile } = await fetchProfile(tutorService.getStudentProfileForTutor, req.studentId);

        if (profile) {
            setViewingStudent({
                ...profile,
                targetClass: req.targetClass,
                classType: req.classType
            });
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Requests</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Manage pending enrollment requests from students
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadRequests}
                        disabled={isLoading}
                        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Stats Banner & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="w-full md:w-64">
                    <StatCard
                        label="Pending Requests"
                        value={requests.length}
                        change="Awaiting your response"
                        icon={Clock}
                        color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    />
                </div>

                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <Input
                        type="text"
                        placeholder="Search by Name, Reg ID, Mobile..."
                        className="pl-10 shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedIds.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-lg p-3 flex justify-between items-center transition-colors">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                        {selectedIds.length} request{selectedIds.length > 1 ? 's' : ''} selected
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="primary"
                            size="small"
                            disabled={isProcessing}
                            onClick={() => handleAction('Accepted')}
                            className="bg-green-600 hover:bg-green-700 border-transparent text-white py-1.5"
                        >
                            {isProcessing ? <Loader2 className="animate-spin mr-2" size={16} /> : <Check size={16} className="mr-2" />}
                            Accept All
                        </Button>
                        <Button
                            variant="outline"
                            size="small"
                            disabled={isProcessing}
                            onClick={() => handleAction('Declined')}
                            className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20 py-1.5"
                        >
                            <Trash2 size={16} className="mr-2" /> Decline All
                        </Button>
                    </div>
                </div>
            )}

            {/* Content Table */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                    <Loader2 size={32} className="animate-spin text-blue-500" />
                    <span className="text-sm font-medium">Loading requests...</span>
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 transition-colors">
                    <Filter size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-medium text-gray-600 dark:text-gray-400">
                        {debouncedSearchTerm ? 'No matching requests found.' : 'No pending requests.'}
                    </p>
                    {debouncedSearchTerm && (
                        <p className="text-sm mt-2 text-gray-400">Try a different search term.</p>
                    )}
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
                    <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
                        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300 relative">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 backdrop-blur-sm">
                                <tr>
                                    <th className="px-6 py-4 w-10 font-semibold">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-800 cursor-pointer"
                                            onChange={handleSelectAll}
                                            checked={filteredRequests.length > 0 && selectedIds.length === filteredRequests.length}
                                        />
                                    </th>
                                    <th className="px-6 py-4 font-semibold">Student Info</th>
                                    <th className="px-6 py-4 font-semibold">Grade</th>
                                    <th className="px-6 py-4 font-semibold">Requesting For</th>
                                    <th className="px-6 py-4 text-right font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                {filteredRequests.map((req) => (
                                    <tr
                                        key={req.enrollmentId}
                                        onClick={(e) => handleRowClick(req, e)}
                                        className={`hover:bg-blue-50 dark:hover:bg-gray-700/20 transition-colors cursor-pointer group ${selectedIds.includes(req.enrollmentId) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                    >
                                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(req.enrollmentId)}
                                                onChange={(e) => handleSelectOne(req.enrollmentId, e)}
                                                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-800 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900 dark:text-white">{req.name}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{req.regNo} • {req.mobile}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                                                {req.grade}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">{req.targetClass}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{req.classType}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                className="border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 py-1.5 px-3"
                                                onClick={(e) => { e.stopPropagation(); handleAction('Accepted', [req.enrollmentId]); }}
                                            >
                                                <Check size={16} className="mr-1.5" /> Accept
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 py-1.5 px-3"
                                                onClick={(e) => { e.stopPropagation(); handleAction('Declined', [req.enrollmentId]); }}
                                            >
                                                <X size={16} className="mr-1.5" /> Decline
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Nested Modal for Student Details */}
            {isProfileLoading && !viewingStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                    <Loader2 className="animate-spin text-blue-600" size={48} />
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

export default StudentRequestsPage;
