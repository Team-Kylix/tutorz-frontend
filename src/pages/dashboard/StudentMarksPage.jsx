import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/atoms/Card';
import { Search, Loader2 } from 'lucide-react';
import api from '../../services/api/apiClient';

const StudentMarksPage = () => {
    const [marks, setMarks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchMarks();
    }, []);

    const fetchMarks = async () => {
        try {
            setLoading(true);
            const response = await api.get('/Student/marks');
            if (response.data?.success) {
                setMarks(response.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch student marks:', error);
        } finally {
            setLoading(false);
        }
    };

    const getMedalBadge = (medal) => {
        if (!medal || medal === 'None') return null;
        
        const medalStyles = {
            Gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            Silver: 'bg-gray-100 text-gray-800 border-gray-200',
            Bronze: 'bg-orange-100 text-orange-800 border-orange-200'
        };

        const emoji = {
            Gold: '🥇',
            Silver: '🥈',
            Bronze: '🥉'
        };

        return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${medalStyles[medal]}`}>
                {emoji[medal]} {medal}
            </span>
        );
    };

    const filteredMarks = marks.filter(m => 
        (m.title && m.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.subject && m.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.className && m.className.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Marks</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">View your performance and medals across all classes.</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <CardTitle>Academic Records</CardTitle>
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search exams or subjects..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Date</th>
                                    <th className="px-6 py-4 font-semibold">Exam Title</th>
                                    <th className="px-6 py-4 font-semibold">Class</th>
                                    <th className="px-6 py-4 font-semibold">Subject</th>
                                    <th className="px-6 py-4 font-semibold text-right">Marks</th>
                                    <th className="px-6 py-4 font-semibold text-center">Achievement</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
                                            Loading marks...
                                        </td>
                                    </tr>
                                ) : filteredMarks.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                            No mark records found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMarks.map((record) => (
                                        <tr key={record.markRecordId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                {new Date(record.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-gray-900 dark:text-white">
                                                {record.title}
                                            </td>
                                            <td className="px-6 py-4">
                                                {record.className}
                                            </td>
                                            <td className="px-6 py-4">
                                                {record.subject}
                                            </td>
                                            <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">
                                                {record.marks}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {getMedalBadge(record.medal)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default StudentMarksPage;
