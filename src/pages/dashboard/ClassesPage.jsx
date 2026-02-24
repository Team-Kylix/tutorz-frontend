import React, { useState, useEffect } from 'react';
import { Plus, Edit2, UserPlus, Search, RefreshCw, BookOpen } from 'lucide-react';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import StatCard from '../../components/molecules/StatCard';
import ClassCard from '../../components/molecules/ClassCard';
import ClassFormModal from '../../components/organisms/ClassFormModal';
import AddStudentModal from '../../components/organisms/AddStudentModal';
import ConfirmationModal from '../../components/molecules/ConfirmationModal';
import useApi from '../../hooks/useApi';
import * as tutorService from '../../services/api/tutorService';

const ClassesPage = () => {
  // State
  const [classes, setClasses] = useState([]);
  const [isClassModalOpen, setClassModalOpen] = useState(false);
  const [isStudentModalOpen, setStudentModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Confirmation & Success Modal States
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Delete States
  const [classToDelete, setClassToDelete] = useState(null);
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // NEW: Status Change States
  const [statusCandidate, setStatusCandidate] = useState(null);
  const [isStatusConfirmOpen, setStatusConfirmOpen] = useState(false);

  const [pendingFormData, setPendingFormData] = useState(null);

  // API Hooks
  const { request: fetchClasses, loading: isLoading } = useApi();
  const { request: saveClass, loading: isSaving } = useApi();
  const { request: removeClass, loading: isDeleting } = useApi();

  // Load Classes
  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    const { data } = await fetchClasses(tutorService.getClasses);
    if (data) setClasses(data);
  };

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

  const handleAddStudentClick = (classId) => {
    setSelectedClassId(classId);
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

    // Prepare the payload
    const cleanPayload = preparePayload(statusCandidate);

    // Toggle the status
    cleanPayload.isActive = newStatus;

    // Call API
    const result = await saveClass(tutorService.updateClass, statusCandidate.classId, cleanPayload);

    if (result.data) {
      setStatusConfirmOpen(false);
      setEditingClass(result.data);
      loadClasses();
      setSuccessMessage(`Class ${newStatus ? 'activated' : 'deactivated'} successfully!`);
      setIsSuccessOpen(true);
    }
  };

  const handleClassSubmit = (formData) => {
    setPendingFormData(formData);
    setIsConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    console.log("1. Starting Save...");

    // Ensure payload is prepared
    const cleanPayload = preparePayload(pendingFormData);
    console.log("2. Payload:", cleanPayload);

    let result;
    if (editingClass) {
      // Update Mode
      result = await saveClass(tutorService.updateClass, editingClass.classId, cleanPayload);
    } else {
      // Create Mode
      result = await saveClass(tutorService.createClass, cleanPayload);
    }

    console.log("3. API Result:", result);

    if (result && result.data) {
      console.log("4. Success! Opening Success Modal.");

      // Close the Confirmation Modal & Form
      setIsConfirmOpen(false);
      setClassModalOpen(false);

      // Clear Form Data
      setPendingFormData(null);

      // Refresh the list
      loadClasses();

      // Set Success Message & Open Success Modal
      const msg = editingClass ? "Class updated successfully!" : "Class added successfully!";
      setSuccessMessage(msg);
      setIsSuccessOpen(true);
    } else {
      console.error("5. Save failed or no data returned", result);
    }
  };

  const handleConfirmDelete = async () => {
    if (!classToDelete) return;
    const result = await removeClass(tutorService.deleteClass, classToDelete);
    if (result) {
      setDeleteConfirmOpen(false);
      setClassToDelete(null);
      loadClasses();
      setSuccessMessage("Class deleted successfully!");
      setIsSuccessOpen(true);
    }
  };

  const handleStudentSubmit = async (regNo) => {
    const { data } = await saveClass(tutorService.addStudentToClass, {
      classId: selectedClassId,
      studentRegistrationNumber: regNo
    });
    if (data) {
      setSuccessMessage("Student added successfully!");
      setIsSuccessOpen(true);
      setStudentModalOpen(false);
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
        <div className="flex items-center gap-2">
          <button
            onClick={loadClasses}
            disabled={isLoading}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <Button variant="primary" onClick={handleCreateClick}>
            <Plus size={18} className="mr-2" /> Create Class
          </Button>
        </div>
      </div>

      {/* Stats Banner & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="w-full md:w-64">
          <StatCard
            label="Total Classes"
            value={classes.length}
            change={`${classes.filter(c => c.isActive).length} Active`}
            icon={BookOpen}
            color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          />
        </div>

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

      {isLoading ? (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">Loading classes...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls) => (
            <div key={cls.classId} className="relative group">
              <ClassCard
                className={cls.className}
                subject={cls.subject}
                grade={cls.grade}
                classType={cls.classType}
                time={`${cls.dayOfWeek || (cls.date ? cls.date.split('T')[0] : '')} ${cls.startTime} - ${cls.endTime}`}
                students={cls.studentCount}
                fee={cls.fee}
                status={cls.isActive ? 'active' : 'inactive'}
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => handleEditClick(cls)}
                  className="p-1.5 bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                  title="Edit Class"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleAddStudentClick(cls.classId)}
                  className="p-1.5 bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 transition-colors"
                  title="Add Student"
                >
                  <UserPlus size={16} />
                </button>
              </div>
            </div>
          ))}
          {filteredClasses.length === 0 && (
            <div className="col-span-full text-center py-10 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 transition-colors">
              No classes found. Create one to get started!
            </div>
          )}
        </div>
      )}

      {/* --- MODALS --- */}

      <ClassFormModal
        isOpen={isClassModalOpen}
        onClose={() => setClassModalOpen(false)}
        onSubmit={handleClassSubmit}
        onDelete={handleDeleteClick}
        onStatusChange={handleStatusChangeRequest}
        initialData={editingClass}
        isSubmitting={isSaving}
      />

      <AddStudentModal
        isOpen={isStudentModalOpen}
        onClose={() => setStudentModalOpen(false)}
        onSubmit={handleStudentSubmit}
        isSubmitting={isSaving}
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
        confirmLabel={isDeleting ? "Deleting..." : "Delete"}
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