import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/atoms/Card';
import Button from '../../components/atoms/Button';
import { Plus, Search, Filter, RefreshCw } from 'lucide-react';
import api from '../../services/api/apiClient';
import RowActions from '../../components/molecules/RowActions';
import MarkSheetFormPage from './MarkSheetFormPage'; // Import the form component
import ConfirmationModal from '../../components/molecules/ConfirmationModal';

const TutorMarksPage = () => {
    const [markSheets, setMarkSheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Manage view state
    const [currentView, setCurrentView] = useState('list'); // 'list', 'create', 'edit'
    const [selectedSheetId, setSelectedSheetId] = useState(null);

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (currentView === 'list') {
            fetchMarkSheets();
        }
    }, [currentView]);

    const fetchMarkSheets = async () => {
        try {
            setLoading(true);
            const response = await api.get('/Tutor/marks');
            if (response.data?.success) {
                setMarkSheets(response.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch mark sheets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (id) => {
        setSelectedSheetId(id);
        setCurrentView('edit');
    };

    const handleCreate = () => {
        setSelectedSheetId(null);
        setCurrentView('create');
    };

    const confirmDelete = (id) => {
        setItemToDelete(id);
        setDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;

        try {
            setIsDeleting(true);
            const response = await api.delete(`/Tutor/marks/${itemToDelete}`);
            if (response.data?.success) {
                setDeleteModalOpen(false);
                fetchMarkSheets();
            } else {
                alert(response.data?.message || 'Failed to delete mark sheet');
            }
        } catch (error) {
            console.error('Failed to delete mark sheet:', error);
            alert(error.response?.data?.message || 'An error occurred while deleting.');
        } finally {
            setIsDeleting(false);
            setItemToDelete(null);
        }
    };

    const handleBackToList = () => {
        setCurrentView('list');
        setSelectedSheetId(null);
    };

    if (currentView === 'create' || currentView === 'edit') {
        return <MarkSheetFormPage id={selectedSheetId} onBack={handleBackToList} />;
    }

    const filteredSheets = markSheets.filter(ms => 
        (ms.title && ms.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (ms.referenceNumber && ms.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (ms.subject && ms.subject.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Marks Management</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and track student marks across all your classes.</p>
                </div>
                <div className="flex w-full sm:w-auto items-center gap-2">
                    <button
                        onClick={fetchMarkSheets}
                        disabled={loading}
                        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors shrink-0"
                        title="Refresh"
                    >
                        <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <Button onClick={handleCreate} className="flex-1 sm:flex-none justify-center items-center gap-2">
                        <Plus size={18} className="mr-2" />
                        Create Mark Sheet
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <CardTitle>Mark Sheets History</CardTitle>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:min-w-[250px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by title, ref no, subject..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
                        <table className="w-full text-left text-xs md:text-sm text-gray-500 dark:text-gray-400">
                            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 uppercase text-[10px] md:text-xs">
                                <tr>
                                    <th className="px-4 py-3 md:px-6 md:py-4 font-semibold whitespace-nowrap">Ref Number</th>
                                    <th className="px-4 py-3 md:px-6 md:py-4 font-semibold whitespace-nowrap">Title</th>
                                    <th className="px-4 py-3 md:px-6 md:py-4 font-semibold whitespace-nowrap">Class / Grade</th>
                                    <th className="px-4 py-3 md:px-6 md:py-4 font-semibold whitespace-nowrap">Subject</th>
                                    <th className="px-4 py-3 md:px-6 md:py-4 font-semibold whitespace-nowrap">Date</th>
                                    <th className="px-1 py-3 md:py-4 font-semibold sticky right-0 z-20 bg-gray-50 dark:bg-gray-800 backdrop-blur-sm"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                                            Loading mark sheets...
                                        </td>
                                    </tr>
                                ) : filteredSheets.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                                            No mark sheets found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSheets.map((sheet) => (
                                        <tr key={sheet.markSheetId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                            <td className="px-4 py-3 md:px-6 md:py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                                {sheet.referenceNumber}
                                            </td>
                                            <td className="px-4 py-3 md:px-6 md:py-4 text-gray-900 dark:text-white whitespace-nowrap">
                                                {sheet.title}
                                            </td>
                                            <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                                                {sheet.className} ({sheet.grade})
                                            </td>
                                            <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                                                {sheet.subject}
                                            </td>
                                            <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                                                {new Date(sheet.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-1 py-3 md:py-4 sticky right-0 z-10 bg-white dark:bg-gray-800 transition-colors group-hover:bg-gray-50 dark:group-hover:bg-gray-800/50">
                                                <RowActions
                                                    actions={[
                                                        { label: 'Edit Marks', onClick: () => handleEdit(sheet.markSheetId) },
                                                        { label: 'Delete', onClick: () => confirmDelete(sheet.markSheetId), danger: true }
                                                    ]}
                                                />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => !isDeleting && setDeleteModalOpen(false)}
                onConfirm={handleDelete}
                onCancel={() => setDeleteModalOpen(false)}
                title="Delete Mark Sheet"
                message="Are you sure you want to delete this mark sheet? This action cannot be undone."
                confirmLabel="Delete"
                cancelLabel="Cancel"
                variant="danger"
                isSubmitting={isDeleting}
            />
        </div>
    );
};

export default TutorMarksPage;
