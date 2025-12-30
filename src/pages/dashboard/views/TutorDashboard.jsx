import React, { useState } from 'react';
import { QrCode, Plus } from 'lucide-react';

// Services & Hooks
import useApi from '../../../hooks/useApi';
import * as tutorService from '../../../services/api/tutorService';

// Components
import StatsGrid from '../../../components/organisms/StatsGrid';
import UpcomingClasses from '../../../components/organisms/UpcomingClasses';
import QuickActions from '../../../components/organisms/QuickActions';
import ClassFormModal from '../../../components/organisms/ClassFormModal';
import ConfirmationModal from '../../../components/molecules/ConfirmationModal';

const TutorDashboard = ({ setActivePage }) => {
  // -- State for Dashboard Quick Actions --
  const [isClassModalOpen, setClassModalOpen] = useState(false);
  
  // Confirmation States
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);

  // API Hooks
  const { request: saveClass, loading: isSaving } = useApi();

  // --- HANDLERS ---
  
  const handleClassSubmit = (formData) => {
    setPendingFormData(formData);
    setIsConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    const result = await saveClass(tutorService.createClass, pendingFormData);
    if (result.data) {
      setIsConfirmOpen(false);
      setClassModalOpen(false);
      setPendingFormData(null);
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
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors">
            <QrCode size={18} />
            <span>Scan Student QR</span>
          </button>
          
          <button 
            onClick={() => setClassModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span>Create</span>
          </button>
        </div>
      </div>
      
      <StatsGrid />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* We pass setActivePage down so the 'View All' buttons work */}
          <UpcomingClasses onNavigate={() => setActivePage('classes')} />
        </div>
        <div>
          <QuickActions />
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
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSave}
        title="Create Class"
        message="Are you sure you want to create this new class?"
        confirmLabel="Create"
        cancelLabel="Cancel"
        variant="primary"
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
    </div>
  );
};

export default TutorDashboard;