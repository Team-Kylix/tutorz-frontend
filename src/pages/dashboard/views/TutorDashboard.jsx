import React, { useState } from 'react';
import { Plus, Zap } from 'lucide-react';

// Services & Hooks
import useApi from '../../../hooks/useApi';
import { useAuth } from '../../../hooks/useAuth';
import * as tutorService from '../../../services/api/tutorService';

import Button from '../../../components/atoms/Button';
import StatsGrid from '../../../components/organisms/StatsGrid';
import UnifiedSchedule from '../../../components/organisms/UnifiedSchedule';
import QuickActions from '../../../components/organisms/QuickActions';
import ClassFormModal from '../../../components/organisms/ClassFormModal';
import ConfirmationModal from '../../../components/molecules/ConfirmationModal';
import InstituteSearchAssignModal from '../../../components/organisms/InstituteSearchAssignModal';
import MarkAttendanceModal from '../../../components/organisms/MarkAttendanceModal';

const TutorDashboard = ({ setActivePage }) => {
  const { user } = useAuth();

  // -- State for Dashboard Quick Actions --
  const [isClassModalOpen, setClassModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [preselectedStudent, setPreselectedStudent] = useState(null);

  // Confirmation States
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);
  const [saveError, setSaveError] = useState(null);

  // API Hooks
  const { request: saveClass, loading: isSaving } = useApi();

  // --- HANDLERS ---

  // Handle Quick Action Clicks
  const handleQuickAction = (actionType) => {
    setActivePage(actionType);
  };

  const handleClassSubmit = (formData) => {
    setSaveError(null);
    setPendingFormData(formData);
    setIsConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    setSaveError(null);
    const result = await saveClass(tutorService.createClass, pendingFormData);
    if (result.error) {
      // Backend returned 400 — show the message inside the confirm modal
      setSaveError(result.error);
      return; // keep the modal open so the user can see the error
    }
    if (result.data) {
      setIsConfirmOpen(false);
      setClassModalOpen(false);
      setPendingFormData(null);
      setSaveError(null);
      setIsSuccessOpen(true);
    }
  };

  const handleSuccessClose = () => {
    setIsSuccessOpen(false);
    window.location.reload();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Overview of your institute activities</p>
        </div>

        <div className="w-full md:w-auto flex items-center gap-3 justify-center md:justify-end">
          <Button
            variant="primary"
            onClick={() => setIsAttendanceModalOpen(true)}
            className="flex-1 md:flex-none md:min-w-[170px]"
            title="Attendance · Fees · Enroll"
          >
            <Zap size={18} className="mr-2" /> Student Hub
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 md:flex-none md:min-w-[170px]"
          >
            <Plus size={18} className="mr-2" /> Add New
          </Button>
        </div>
      </div>

      <StatsGrid />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[26rem]">
          <UnifiedSchedule 
            title="My Schedule"
            onNavigate={() => setActivePage('classes')} 
            fetchClassesApi={tutorService.getClasses} 
          />
        </div>
        <div>
          {/* Pass the handler */}
          <QuickActions onActionClick={handleQuickAction} />
        </div>
      </div>

      {/* --- DASHBOARD MODALS --- */}
      <ClassFormModal
        isOpen={isClassModalOpen}
        onClose={() => setClassModalOpen(false)}
        onSubmit={handleClassSubmit}
        isSubmitting={isSaving}
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => { setIsConfirmOpen(false); setSaveError(null); }}
        onConfirm={handleConfirmSave}
        title="Create Class"
        message={saveError
          ? saveError
          : "Are you sure you want to create this new class?"}
        confirmLabel={isSaving ? 'Creating…' : 'Create'}
        cancelLabel="Cancel"
        variant={saveError ? 'danger' : 'primary'}
        isLoading={isSaving}
      />

      <ConfirmationModal
        isOpen={isSuccessOpen}
        onClose={handleSuccessClose}
        onConfirm={handleSuccessClose}
        title="Success"
        message="Class added successfully!"
        confirmLabel="OK"
        cancelLabel="Close"
        variant="success"
      />

      {/* Add User Flow Modal */}
      <InstituteSearchAssignModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        type="Student"
        user={user}
        onAssignToClass={(student) => {
          setIsAddModalOpen(false);
          setPreselectedStudent(student);
          setIsAttendanceModalOpen(true);
        }}
      />

      {/* Mark Attendance Modal */}
      <MarkAttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => {
          setIsAttendanceModalOpen(false);
          setPreselectedStudent(null);
        }}
        initialStudent={preselectedStudent}
      />
    </div>
  );
};

export default TutorDashboard;