import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, BookOpen, Clock, Users, Building2, Calendar, User } from 'lucide-react';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import StatCard from '../../components/molecules/StatCard';
import useApi from '../../hooks/useApi';
import * as studentService from '../../services/api/studentService';

const StudentClassesPage = () => {
    // State
    const [classes, setClasses] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // API Hooks
    const { request: fetchClasses, loading: isLoading } = useApi();

    // Load Classes
    useEffect(() => {
        loadClasses();
    }, []);

    const loadClasses = async () => {
        const { data } = await fetchClasses(studentService.getStudentClasses);

        if (data && data.success) {
            setClasses(data.data || []);
        } else {
            setClasses([]);
        }
    };

    const filteredClasses = classes.filter(c =>
        (c.className || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.tutorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.instituteName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Joined Classes</h1>
                    <p className="text-gray-500 dark:text-gray-400">View and monitor all the classes you are enrolled in</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadClasses}
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
                        label="Total Joined Classes"
                        value={classes.length}
                        change={`${classes.filter(c => c.status === 'active').length} Active`}
                        icon={BookOpen}
                        color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    />
                </div>

                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <Input
                        type="text"
                        placeholder="Search by Class Name, Subject, or Tutor..."
                        className="pl-10 shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table View */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Class Name</th>
                                <th className="px-6 py-4 font-semibold">Subject</th>
                                <th className="px-6 py-4 font-semibold">Time</th>
                                <th className="px-6 py-4 font-semibold">Date / Day</th>
                                <th className="px-6 py-4 font-semibold">Location</th>
                                <th className="px-6 py-4 font-semibold">Fees (Rs)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                            {filteredClasses.length > 0 ? (
                                filteredClasses.map((cls, index) => (
                                    <tr
                                        key={cls.classId || index}
                                        className={`hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors group ${cls.status !== 'active' ? 'opacity-60 bg-gray-50/50 dark:bg-gray-800/50' : ''}`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                <span>{cls.className || '-'}</span>
                                                {cls.status !== 'active' && (
                                                    <span className="px-2 py-0.5 text-[10px] tracking-wider font-bold bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-md">
                                                        INACTIVE
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                <User size={12} />
                                                <span className="font-medium">{cls.tutorName || '-'}</span>
                                                <span className="text-blue-600 dark:text-blue-400 ml-1 opacity-75">• {cls.classType || 'Class'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-md font-medium">
                                                {cls.subject || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                                <Clock size={14} />
                                                <span>{cls.startTime} - {cls.endTime}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                                <Calendar size={14} />
                                                <span className="capitalize">{cls.dayOfWeek || (cls.date ? new Date(cls.date).toLocaleDateString() : '-')}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5">
                                                <Building2 size={14} className="text-gray-400" />
                                                <span className="font-medium">{cls.instituteName || 'Online/Private'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm font-semibold text-green-500 mr-1">Rs</span>
                                                <span>{cls.fee?.toLocaleString() || '0'}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        {isLoading ? (
                                            <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                                <RefreshCw size={24} className="animate-spin text-blue-500 mb-3" />
                                                <p>Loading classes...</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                                <BookOpen size={32} className="text-gray-300 dark:text-gray-600 mb-3" />
                                                <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">No Classes Found</p>
                                                <p className="max-w-md">There are no classes matching your current search criteria, or you haven't joined any classes yet.</p>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StudentClassesPage;
