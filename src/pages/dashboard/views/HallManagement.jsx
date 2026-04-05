import React, { useState, useEffect } from 'react';
import { Building, Plus, Search, Users, Edit2, Trash2, X } from 'lucide-react';
import Button from '../../../components/atoms/Button';
import Input from '../../../components/atoms/Input';
import SectionTitle from '../../../components/atoms/SectionTitle';
import Modal from '../../../components/molecules/Modal';
import FormField from '../../../components/molecules/FormField';
import ConfirmationModal from '../../../components/molecules/ConfirmationModal';
import ClassCard from '../../../components/molecules/ClassCard';
import StatCard from '../../../components/molecules/StatCard';
import { getHalls } from '../../../services/api/instituteService';
import { useDispatch, useSelector } from 'react-redux';
import { enqueueAction, SYNC_ACTION_TYPES, selectPendingCount } from '../../../store/syncSlice';

const HallManagement = () => {
    // Data State
    const [halls, setHalls] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const dispatch = useDispatch();
    const pendingCount = useSelector(selectPendingCount);
    const prevPendingRef = React.useRef(pendingCount);

    // Modal States
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [isStatusConfirmOpen, setStatusConfirmOpen] = useState(false);
    const [isSuccessOpen, setIsSuccessOpen] = useState(false);

    // Operation States
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingHall, setEditingHall] = useState(null); // If null, we are adding
    const [hallToDelete, setHallToDelete] = useState(null);
    const [statusCandidate, setStatusCandidate] = useState(null);

    // Form Data
    const [formData, setFormData] = useState({ name: '', capacity: '', isActive: true });
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchHalls();
    }, []);

    // Listen for sync completion to replace temp IDs with real IDs
    useEffect(() => {
        if (prevPendingRef.current > 0 && pendingCount === 0) {
            // Sync just completed (pushed data up). 
            // Bypass PWA cache to fetch real permanent IDs silently without loading spinner
            fetchHalls(true);
        }
        prevPendingRef.current = pendingCount;
    }, [pendingCount]);

    const fetchHalls = async (bypassCache = false) => {
        if (!bypassCache) setIsLoading(true);
        try {
            const response = await getHalls(bypassCache);
            if (response.success) {
                setHalls(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch halls", error);
        } finally {
            if (!bypassCache) setIsLoading(false);
        }
    };

    // --- Handlers ---

    const handleCreateClick = () => {
        setEditingHall(null);
        setFormData({ name: '', capacity: '', isActive: true });
        setIsFormModalOpen(true);
    };

    const handleEditClick = (hall) => {
        setEditingHall(hall);
        setFormData({ name: hall.name, capacity: hall.capacity, isActive: hall.isActive });
        setIsFormModalOpen(true);
    };

    const handleDeleteClick = (hallId) => {
        setIsFormModalOpen(false); // Close form if open
        setHallToDelete(hallId);
        setDeleteConfirmOpen(true);
    };

    // Triggered from Toggle in Modal
    const handleStatusToggleRequest = () => {
        // Find the original hall to get ID
        if (editingHall) {
            setStatusCandidate(editingHall);
            setStatusConfirmOpen(true);
        } else {
            // If creating new, just toggle state locally
            setFormData(prev => ({ ...prev, isActive: !prev.isActive }));
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.capacity) return;
        setIsFormModalOpen(false); // Close form, open confirmation
        setIsConfirmOpen(true);
    };

    // --- Confirm Actions ---

    const handleConfirmSave = async () => {
        if (editingHall) {
            const updatedHall = { ...editingHall, name: formData.name, capacity: parseInt(formData.capacity) };
            setHalls(prev => prev.map(h => h.hallId === editingHall.hallId ? updatedHall : h));
            
            dispatch(enqueueAction({
                actionType: SYNC_ACTION_TYPES.UPDATE_HALL,
                payload: { id: editingHall.hallId, hallData: { name: formData.name, capacity: parseInt(formData.capacity) } },
                label: `Update Hall: ${formData.name}`,
            }));
            setSuccessMessage("Hall updated offline (Syncing...)!");
        } else {
            const tempId = `temp_${Date.now()}`;
            const newHall = {
                hallId: tempId,
                name: formData.name,
                capacity: parseInt(formData.capacity),
                isActive: true,
                hallCode: 'Pending...',
                isOptimistic: true 
            };
            setHalls(prev => [...prev, newHall]);
            
            dispatch(enqueueAction({
                actionType: SYNC_ACTION_TYPES.CREATE_HALL,
                payload: { hallData: { name: formData.name, capacity: parseInt(formData.capacity) } },
                label: `Create Hall: ${formData.name}`,
            }));
            setSuccessMessage("Hall added offline (Syncing...)!");
        }

        setIsConfirmOpen(false);
        setFormData({ name: '', capacity: '', isActive: true });
        setEditingHall(null);
        setIsSuccessOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!hallToDelete) return;
        const hallName = halls.find(h => h.hallId === hallToDelete)?.name || 'Hall';

        setHalls(prev => prev.filter(h => h.hallId !== hallToDelete));

        dispatch(enqueueAction({
            actionType: SYNC_ACTION_TYPES.DELETE_HALL,
            payload: { id: hallToDelete },
            label: `Delete Hall: ${hallName}`
        }));

        setDeleteConfirmOpen(false);
        setHallToDelete(null);
        setSuccessMessage("Hall deleted offline (Syncing...)!");
        setIsSuccessOpen(true);
    };

    const handleConfirmStatusChange = async () => {
        if (!statusCandidate) return;
        
        setHalls(prev => prev.map(h => h.hallId === statusCandidate.hallId ? { ...h, isActive: !h.isActive } : h));

        dispatch(enqueueAction({
            actionType: SYNC_ACTION_TYPES.TOGGLE_HALL_STATUS,
            payload: { id: statusCandidate.hallId },
            label: `Toggle Status: ${statusCandidate.name}`
        }));

        setStatusConfirmOpen(false);
        if (editingHall && editingHall.hallId === statusCandidate.hallId) {
            setFormData(prev => ({ ...prev, isActive: !prev.isActive }));
            setEditingHall(prev => ({ ...prev, isActive: !prev.isActive }));
        }
        
        let toggledName = statusCandidate.name;
        let futureStatus = !statusCandidate.isActive;
        setStatusCandidate(null);
        
        setSuccessMessage(`Hall ${futureStatus ? 'activated' : 'deactivated'} offline (Syncing...)!`);
        setIsSuccessOpen(true);
    };

    // --- Filter ---
    const filteredHalls = halls.filter(h =>
        h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (h.hallCode && h.hallCode.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hall Management</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage your institute's halls and facilities</p>
                </div>
                <Button variant="primary" onClick={handleCreateClick}>
                    <Plus size={18} className="mr-2" /> Add Hall
                </Button>
            </div>

            {/* Stats Banner & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="w-full md:w-64">
                    <StatCard
                        label="Total Halls"
                        value={halls.length}
                        change={`${halls.filter(h => h.isActive).length} Active`}
                        icon={Building}
                        color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    />
                </div>

                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <Input
                        type="text"
                        placeholder="Search halls..."
                        className="pl-10 shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="text-center py-12 text-gray-500">Loading halls...</div>
            ) : filteredHalls.length === 0 ? (
                <div className="col-span-full text-center py-10 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 transition-colors">
                    <Building size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No halls found.</p>
                    {searchTerm && <p className="text-sm mt-2 text-gray-400">Try a different search term.</p>}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredHalls.map((hall) => {
                        const isTemp = hall.hallId.toString().startsWith('temp_') || hall.isOptimistic;
                        return (
                            <div key={hall.hallId} className="relative group h-full">
                                <ClassCard
                                    className={hall.name}
                                    subject={`Code: ${hall.hallCode || 'N/A'}`}
                                    grade="Physical"
                                    classType="Course"
                                    time={`Capacity: ${hall.capacity}`}
                                    status={hall.isActive ? 'active' : 'inactive'}
                                />
                                {/* Overlay Edit Button */}
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <button
                                        onClick={() => !isTemp && handleEditClick(hall)}
                                        disabled={isTemp}
                                        className={`p-1.5 shadow-sm border border-gray-100 dark:border-gray-700 rounded-full transition-colors ${
                                            isTemp ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                                        }`}
                                        title={isTemp ? "Syncing to server..." : "Edit Hall"}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add/Edit Modal (Matching ClassFormModal Style) */}
            {isFormModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] transition-colors">

                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editingHall ? 'Edit Hall Details' : 'Common New Hall'}
                            </h2>
                            <button onClick={() => setIsFormModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <X className="text-gray-500 dark:text-gray-400" size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                            <FormField
                                label="Hall Name / Number"
                                placeholder="e.g. Hall A, Room 101"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <FormField
                                label="Capacity"
                                type="number"
                                placeholder="e.g. 50"
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                required
                            />


                            {/* Footer with Toggle and Delete */}
                            <div className="pt-6 border-t border-gray-100 dark:border-gray-700 mt-4 flex flex-col gap-6 sm:flex-row sm:justify-between sm:items-center">
                                {/* Delete Button */}
                                <div className="order-3 sm:order-1 w-full sm:w-auto flex justify-center sm:justify-start">
                                    {editingHall && (
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteClick(editingHall.hallId)}
                                            className="flex items-center gap-2 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                        >
                                            <Trash2 size={16} /> Delete
                                        </button>
                                    )}
                                </div>

                                {/* Status Toggle */}
                                <div className="order-2 sm:order-2 w-full sm:w-auto flex justify-center py-2 sm:py-0">
                                    {editingHall && (
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={handleStatusToggleRequest}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                                                    }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isActive
                                                        ? 'translate-x-6'
                                                        : 'translate-x-1'
                                                        }`}
                                                />
                                            </button>
                                            <span className="text-xs font-semibold w-14 inline-block">
                                                {formData.isActive ? (
                                                    <span className="text-green-600 dark:text-green-400">Active</span>
                                                ) : (
                                                    <span className="text-gray-500 dark:text-gray-400">Inactive</span>
                                                )}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Buttons */}
                                <div className="order-1 sm:order-3 w-full sm:w-auto flex gap-3">
                                    <Button variant="secondary" onClick={() => setIsFormModalOpen(false)} fullWidth>
                                        Cancel
                                    </Button>

                                    {editingHall ? (
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || (
                                                editingHall.name === formData.name &&
                                                editingHall.capacity == formData.capacity &&
                                                editingHall.isActive === formData.isActive
                                            )}
                                            className={`w-full sm:w-auto px-6 py-2 rounded-lg text-sm font-medium transition-colors ${isSubmitting || (
                                                editingHall.name === formData.name &&
                                                editingHall.capacity == formData.capacity &&
                                                editingHall.isActive === formData.isActive
                                            )
                                                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                                                : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200 dark:shadow-none'
                                                }`}
                                        >
                                            {isSubmitting ? 'Updating...' : 'Update'}
                                        </button>
                                    ) : (
                                        <Button type="submit" disabled={isSubmitting} fullWidth variant="primary">
                                            {isSubmitting ? 'Saving...' : 'Create'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Save Confirmation Modal */}
            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmSave}
                title={editingHall ? "Confirm Update" : "Confirm Addition"}
                message={editingHall
                    ? `Are you sure you want to update "${formData.name}"?`
                    : `Are you sure you want to add "${formData.name}" with a capacity of ${formData.capacity}?`}
                confirmLabel={isSubmitting ? (editingHall ? "Updating..." : "Adding...") : (editingHall ? "Update" : "Add Hall")}
                cancelLabel="Cancel"
                variant="primary"
            />

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={isDeleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Hall?"
                message="Are you sure you want to delete this hall? This action cannot be undone."
                confirmLabel={isSubmitting ? "Deleting..." : "Delete"}
                cancelLabel="Cancel"
                variant="danger"
            />

            {/* Status Confirmation Modal */}
            <ConfirmationModal
                isOpen={isStatusConfirmOpen}
                onClose={() => setStatusConfirmOpen(false)}
                onConfirm={handleConfirmStatusChange}
                title={statusCandidate?.isActive ? "Deactivate Hall?" : "Activate Hall?"}
                message={statusCandidate?.isActive
                    ? "This will mark the hall as inactive. Are you sure?"
                    : "This will make the hall active again. Are you sure?"}
                confirmLabel={statusCandidate?.isActive ? "Deactivate" : "Activate"}
                cancelLabel="Cancel"
                variant={statusCandidate?.isActive ? "danger" : "success"}
            />

            {/* Success Modal (Matching ClassesPage style) */}
            <ConfirmationModal
                isOpen={isSuccessOpen}
                onClose={() => setIsSuccessOpen(false)}
                onConfirm={() => setIsSuccessOpen(false)}
                title="Success"
                message={successMessage}
                confirmLabel="OK"
                cancelLabel="Close"
                variant="success"
            />
        </div>
    );
};

export default HallManagement;
