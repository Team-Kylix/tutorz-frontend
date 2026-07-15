import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, UserPlus, Search, RefreshCw, BookOpen, Clock, Users, Building2, Calendar } from 'lucide-react';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import RowActions from '../../components/molecules/RowActions';
import ClassFormModal from '../../components/organisms/ClassFormModal';
import AddStudentModal from '../../components/organisms/AddStudentModal';
import InstituteSearchAssignModal from '../../components/organisms/InstituteSearchAssignModal';
import ConfirmationModal from '../../components/molecules/ConfirmationModal';
import useApi from '../../hooks/useApi';
import * as tutorService from '../../services/api/tutorService';
import { useDispatch, useSelector } from 'react-redux';
import { selectPendingCount } from '../../store/syncSlice';
import { enqueueAction, SYNC_ACTION_TYPES } from '../../store/syncSlice';
import { setClassesData, updateTutorClass, removeTutorClass } from '../../store/tutorSlice';

const ClassesPage = () => {
  const dispatch = useDispatch();
  const pendingCount = useSelector(selectPendingCount);
  const prevPendingRef = React.useRef(pendingCount);
  const { classes, isFetched } = useSelector(state => state.tutorData);
  const { user } = useSelector(state => state.auth);

  // State
  const [isClassModalOpen, setClassModalOpen] = useState(false);
  const [isStudentModalOpen, setStudentModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isRegisterModalOpen, setRegisterModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Delete States
  const [classToDelete, setClassToDelete] = useState(null);
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // NEW: Status Change States
  const [statusCandidate, setStatusCandidate] = useState(null);
  const [isStatusConfirmOpen, setStatusConfirmOpen] = useState(false);

  const [pendingFormData, setPendingFormData] = useState(null);

  // For showing backend conflict/error message inline in the class modal
  const [classFormError, setClassFormError] = useState('');

  // API Hooks
  const { request: fetchClasses } = useApi();
  const { request: saveClass, loading: isSaving } = useApi();

  // Mirror InstituteDashboard pattern: local loading state initialized from cache flag
  // If isFetched is already true (data in memory), loading starts as false → instant render
  const [isLoading, setIsLoading] = useState(!isFetched);

  const loadClasses = useCallback(async (force = false) => {
    if (!force && isFetched) {
      setIsLoading(false);
      return;
    }
    const { data } = await fetchClasses(tutorService.getClasses, force);
    if (data) dispatch(setClassesData(data));
    setIsLoading(false);
  }, [isFetched, fetchClasses, dispatch]);

  // Load Classes
  useEffect(() => {
    if (!isFetched) {
      loadClasses();
    } else {
      // Data already cached in Redux — skip fetch, hide loading immediately
      setIsLoading(false);
    }
  }, [isFetched, loadClasses]);

  // Listen for sync completion to replace temp IDs with real IDs
  useEffect(() => {
    if (prevPendingRef.current > 0 && pendingCount === 0) {
      loadClasses(true);
    }
    prevPendingRef.current = pendingCount;
  }, [pendingCount, loadClasses]);

  // --- HANDLERS ---

  const handleCreateClick = () => {
    setEditingClass(null);
    setClassModalOpen(true);
  };

  const handleEditClick = (cls) => {
    setEditingClass(cls);
    setClassModalOpen(true);
  };

  const handleDeleteClick = (classId) => {
    setClassModalOpen(false);
    setClassToDelete(classId);
    setDeleteConfirmOpen(true);
  };

  const handleAddStudentClick = (cls) => {
    setSelectedClass(cls);
    setStudentModalOpen(true);
  };

  // Triggered when toggle is clicked in Modal
  const handleStatusChangeRequest = (currentFormData) => {
    setStatusCandidate(currentFormData);
    setStatusConfirmOpen(true); // Open specific status confirmation
  };

  const preparePayload = (data) => {
    return {
      ...data,
      // Convert empty string date to null
      date: data.date === "" ? null : data.date,
      // Ensure numeric fee
      fee: parseFloat(data.fee),
      // Ensure dayOfWeek is string or null (not array)
      dayOfWeek: Array.isArray(data.dayOfWeek) ? data.dayOfWeek.join(',') : data.dayOfWeek
    };
  };

  const handleConfirmStatusChange = async () => {
    if (!statusCandidate) return;

    const newStatus = !statusCandidate.isActive;
    const cleanPayload = preparePayload(statusCandidate);
    cleanPayload.isActive = newStatus;

    dispatch(updateTutorClass({ classId: statusCandidate.classId, isActive: newStatus }));

    dispatch(enqueueAction({
      actionType: SYNC_ACTION_TYPES.TOGGLE_CLASS_STATUS,
      payload: { id: statusCandidate.classId, classData: cleanPayload },
      label: `Toggle Status: ${cleanPayload.className}`
    }));

    if (editingClass && editingClass.classId === statusCandidate.classId) {
      setEditingClass(prev => ({ ...prev, isActive: newStatus }));
    }

    setStatusConfirmOpen(false);
    setStatusCandidate(null);
    setSuccessMessage(`Class ${newStatus ? 'activated' : 'deactivated'} offline (Syncing...)!`);
    setIsSuccessOpen(true);
  };

  const handleClassSubmit = (formData) => {
    setClassFormError('');
    setPendingFormData(formData);
    setIsConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    // Close the confirmation modal immediately
    setIsConfirmOpen(false);

    const cleanPayload = preparePayload(pendingFormData);

    if (editingClass) {
      // ── Update Mode: direct API call (overlap errors need immediate feedback) ──
      const { data, error } = await saveClass(tutorService.updateClass, editingClass.classId, cleanPayload);
      if (error) {
        // Show the error in the form modal
        setClassFormError(error);
        setEditingClass(editingClass);   // keep editing context
        setClassModalOpen(true);         // reopen form so user sees the error
        setPendingFormData(null);
        return;
      }
      if (data) {
        // Refresh the list so the updated class appears with its real data
        dispatch(updateTutorClass({ classId: editingClass.classId, ...cleanPayload }));
        loadClasses(true);
        setClassModalOpen(false);
        setClassFormError('');
        setPendingFormData(null);
        setSuccessMessage("Class updated successfully!");
        setIsSuccessOpen(true);
      }
    } else {
      // ── Create Mode: direct API call (overlap errors need immediate feedback) ──
      const { data, error } = await saveClass(tutorService.createClass, cleanPayload);
      if (error) {
        // Show the error in the form modal
        setClassFormError(error);
        setClassModalOpen(true);   // reopen form so user sees the error
        setPendingFormData(null);
        return;
      }
      if (data) {
        // Reload from server so the new class has its real ID (no temp_ / Syncing...)
        loadClasses(true);
        setClassModalOpen(false);
        setClassFormError('');
        setPendingFormData(null);
        setSuccessMessage("Class created successfully!");
        setIsSuccessOpen(true);
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!classToDelete) return;
    const clsName = classes.find(c => c.classId === classToDelete)?.className || 'Class';

    dispatch(removeTutorClass(classToDelete));

    dispatch(enqueueAction({
      actionType: SYNC_ACTION_TYPES.DELETE_CLASS,
      payload: { id: classToDelete },
      label: `Delete Class: ${clsName}`
    }));

    setDeleteConfirmOpen(false);
    setClassToDelete(null);
    setSuccessMessage("Class deleted offline (Syncing...)!");
    setIsSuccessOpen(true);
  };

  const handleStudentSubmit = async (regNo) => {
    const { data, error } = await saveClass(tutorService.addStudentToClass, {
      classId: selectedClass?.classId,
      studentRegistrationNumber: regNo
    });
    if (data) {
      setSuccessMessage("Student added successfully!");
      setIsSuccessOpen(true);
      setStudentModalOpen(false);
      return { success: true };
    } else if (error) {
      return { success: false, error: error || "Failed to add student." };
    }
  };

  const filteredClasses = classes.filter(c =>
    c.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.grade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Classes</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your subjects and schedules</p>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-2">
          <button
            onClick={() => { setIsLoading(true); loadClasses(true); }}
            disabled={isLoading}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors shrink-0"
            title="Refresh"
          >
            <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <Button variant="primary" onClick={handleCreateClick} className="flex-1 sm:flex-none justify-center">
            <Plus size={18} className="mr-2" /> Create Class
          </Button>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
        
        {/* Top Bar with Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center">
            <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <Input
                    type="text"
                    placeholder="Search by subject or grade..."
                    className="pl-10 shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
            <table className="w-full text-left text-xs md:text-sm text-gray-600 dark:text-gray-300 relative">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20 backdrop-blur-sm">
                    <tr>
                        <th className="px-4 py-3 md:px-6 md:py-4 font-semibold whitespace-nowrap">Class Name</th>
                        <th className="px-4 py-3 md:px-6 md:py-4 font-semibold whitespace-nowrap">Subject / Grade</th>
                        <th className="px-4 py-3 md:px-6 md:py-4 font-semibold whitespace-nowrap">Time</th>
                        <th className="px-4 py-3 md:px-6 md:py-4 font-semibold whitespace-nowrap">Date / Day</th>
                        <th className="px-4 py-3 md:px-6 md:py-4 font-semibold whitespace-nowrap">Location</th>
                        <th className="px-4 py-3 md:px-6 md:py-4 font-semibold whitespace-nowrap">Fees (Rs)</th>
                        <th className="px-4 py-3 md:px-6 md:py-4 font-semibold whitespace-nowrap text-center">Students</th>
                        <th className="px-1 py-3 md:py-4 font-semibold sticky right-0 z-30 bg-gray-50 dark:bg-gray-700/50 backdrop-blur-sm"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {filteredClasses.length > 0 ? (
                        filteredClasses.map((cls, index) => {
                            const isTemp = cls.isOptimistic || cls.classId.toString().startsWith('temp_');
                            return (
                                <tr
                                    key={cls.classId || index}
                                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors group ${
                                        !cls.isActive ? 'opacity-60 bg-gray-50/50 dark:bg-gray-800/50' : ''
                                    }`}
                                >
                                    <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                                        <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <span>{cls.className || '-'}</span>
                                            {!cls.isActive && (
                                                <span className="px-2 py-0.5 text-[10px] tracking-wider font-bold bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-md">
                                                    INACTIVE
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] md:text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            <span className="text-blue-600 dark:text-blue-400 opacity-75">{cls.classType || 'Class'}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                                        <div className="flex flex-col gap-1">
                                            <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] md:text-xs rounded-md font-medium w-max">
                                                {cls.subject || '-'}
                                            </span>
                                            <span className="text-[11px] md:text-xs text-gray-500 dark:text-gray-400 px-1">{cls.grade || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                            <Clock size={14} />
                                            <span>{cls.startTime} - {cls.endTime}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                            <Calendar size={14} />
                                            <span className="capitalize">{cls.dayOfWeek || (cls.date ? new Date(cls.date).toLocaleDateString() : '-')}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-1.5">
                                            <Building2 size={14} className="text-gray-400" />
                                            <span className="font-medium">{cls.instituteName || 'Online/Private'}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 md:px-6 md:py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                        <div className="flex items-center gap-1">
                                            <span className="text-sm font-semibold text-green-500 mr-1">Rs</span>
                                            <span>{cls.fee?.toLocaleString() || '0'}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 md:px-6 md:py-4 text-center whitespace-nowrap">
                                        <div className="inline-flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full text-xs md:text-sm font-bold min-w-[3rem] gap-1.5">
                                            <Users size={14} />
                                            <span>{cls.studentCount || 0}</span>
                                        </div>
                                    </td>
                                    <td className="px-1 py-3 md:py-4 sticky right-0 z-10 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700/20 transition-colors" onClick={(e) => e.stopPropagation()}>
                                        {!isTemp ? (
                                            <RowActions actions={[
                                                { label: 'Edit Class', icon: Edit2, onClick: () => handleEditClick(cls) },
                                                { label: 'Add Student', icon: UserPlus, onClick: () => handleAddStudentClick(cls) },
                                            ]} />
                                        ) : (
                                            <span className="text-xs text-gray-400 px-4 whitespace-nowrap">Syncing...</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan={8} className="px-6 py-12 text-center">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                        <RefreshCw size={24} className="animate-spin text-blue-500 mb-3" />
                                        <p>Loading classes...</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                        <BookOpen size={32} className="text-gray-300 dark:text-gray-600 mb-3" />
                                        <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">No Classes Found</p>
                                        <p className="max-w-md">There are no classes matching your current search criteria, or you haven't created any classes yet.</p>
                                    </div>
                                )}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* --- MODALS --- */}

      <ClassFormModal
        isOpen={isClassModalOpen}
        onClose={() => { setClassModalOpen(false); setClassFormError(''); }}
        onSubmit={handleClassSubmit}
        onDelete={handleDeleteClick}
        onStatusChange={handleStatusChangeRequest}
        initialData={editingClass}
        isSubmitting={isSaving}
        existingClasses={classes}
        backendError={classFormError}
        onClearBackendError={() => setClassFormError('')}
      />

      <AddStudentModal
        isOpen={isStudentModalOpen}
        onClose={() => setStudentModalOpen(false)}
        onSubmit={handleStudentSubmit}
        isSubmitting={isSaving}
        selectedClass={selectedClass}
        onOpenRegister={() => {
            setStudentModalOpen(false);
            setRegisterModalOpen(true);
        }}
      />

      <InstituteSearchAssignModal
        isOpen={isRegisterModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        type="Student"
        user={user}
        customAssignFn={async (item) => {
            await handleStudentSubmit(item.registrationNumber || item.identifier);
        }}
        extraRegisterPayload={{ classId: selectedClass?.classId }}
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSave}
        title={editingClass ? "Update Class" : "Create Class"}
        message={editingClass
          ? "Are you sure you want to update this class details?"
          : "Are you sure you want to create this new class?"}
        confirmLabel={editingClass ? "Update" : "Create"}
        cancelLabel="Cancel"
        variant="primary"
      />

      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Class?"
        message="Are you sure you want to delete this class? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />

      {/* NEW: Status Confirmation Modal */}
      <ConfirmationModal
        isOpen={isStatusConfirmOpen}
        onClose={() => setStatusConfirmOpen(false)}
        onConfirm={handleConfirmStatusChange}
        title={statusCandidate?.isActive ? "Deactivate Class?" : "Activate Class?"}
        message={statusCandidate?.isActive
          ? "This will hide the class from the schedule. Are you sure?"
          : "This will make the class visible in the schedule again. Are you sure?"}
        confirmLabel={statusCandidate?.isActive ? "Deactivate" : "Activate"}
        cancelLabel="Cancel"
        variant={statusCandidate?.isActive ? "danger" : "success"}
      />

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

export default ClassesPage;