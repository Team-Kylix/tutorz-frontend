import React, { useState, useEffect, useCallback } from 'react';
import {
    Users, UserPlus, Loader2, Search,
    RefreshCw, AlertCircle
} from 'lucide-react';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import StatCard from '../../components/molecules/StatCard';
import InstituteSearchAssignModal from '../../components/organisms/InstituteSearchAssignModal';
import { getAssignedTutors } from '../../services/api/instituteService';

const InstituteTutorsPage = () => {
    const [tutors, setTutors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchTutors = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const res = await getAssignedTutors();
            setTutors(res.data || []);
        } catch (err) {
            setError('Failed to load tutors. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTutors();
    }, [fetchTutors]);

    const handleAssigned = () => {
        fetchTutors();
    };

    const filteredTutors = tutors.filter(tutor => {
        const fullName = `${tutor.firstName || ''} ${tutor.lastName || ''}`.toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        return fullName.includes(searchLower) ||
            (tutor.registrationNumber && tutor.registrationNumber.toLowerCase().includes(searchLower)) ||
            (tutor.phoneNumber && tutor.phoneNumber.includes(searchLower)) ||
            (tutor.email && tutor.email.toLowerCase().includes(searchLower));
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header (Matches HallManagement) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Institute Tutors</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Manage tutors working with your institute
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchTutors}
                        disabled={isLoading}
                        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    <Button variant="primary" onClick={() => setIsAssignModalOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                        <UserPlus size={18} className="mr-2" />
                        Add Tutor
                    </Button>
                </div>
            </div>

            {/* Stats Banner & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="w-full md:w-64">
                    <StatCard
                        label="Total Active"
                        value={tutors.length}
                        change="All time tutors"
                        icon={Users}
                        color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                    />
                </div>

                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <Input
                        type="text"
                        placeholder="Search tutors..."
                        className="pl-10 py-3 shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Content Table */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                    <Loader2 size={32} className="animate-spin text-purple-500" />
                    <span className="text-sm font-medium">Loading tutors...</span>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center gap-3 py-16 text-red-500 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                    <AlertCircle size={36} strokeWidth={1.5} />
                    <p className="text-sm font-medium">{error}</p>
                    <Button variant="outline" onClick={fetchTutors}>Retry</Button>
                </div>
            ) : filteredTutors.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 transition-colors">
                    <Users size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-medium text-gray-600 dark:text-gray-400">
                        {searchTerm ? 'No matching tutors found.' : 'No tutors found.'}
                    </p>
                    {searchTerm ? (
                        <p className="text-sm mt-2 text-gray-400">Try a different search term.</p>
                    ) : (
                        <Button variant="primary" className="mt-4 bg-purple-600 hover:bg-purple-700" onClick={() => setIsAssignModalOpen(true)}>
                            <UserPlus size={16} className="mr-2" /> Add First Tutor
                        </Button>
                    )}
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Tutor Name</th>
                                    <th className="px-6 py-4">Registration No</th>
                                    <th className="px-6 py-4">Mobile Number</th>
                                    <th className="px-6 py-4">Experience</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                {filteredTutors.map((tutor) => {
                                    const initials = `${tutor.firstName?.charAt(0) || ''}${tutor.lastName ? tutor.lastName.charAt(0) : ''}`.toUpperCase();
                                    const fullName = `${tutor.firstName || ''} ${tutor.lastName || ''}`.trim() || 'Unknown';

                                    return (
                                        <tr key={tutor.tutorId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                                        {initials || <Users size={14} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 dark:text-white">{fullName}</p>
                                                        {tutor.email && (
                                                            <p className="text-xs text-gray-500">{tutor.email}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs">
                                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                                                    {tutor.registrationNumber || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {tutor.phoneNumber || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                                                    {tutor.experienceYears ? `${tutor.experienceYears} Years` : 'New'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Assign Modal */}
            <InstituteSearchAssignModal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                type="Tutor"
                onAssigned={handleAssigned}
            />
        </div>
    );
};

export default InstituteTutorsPage;
