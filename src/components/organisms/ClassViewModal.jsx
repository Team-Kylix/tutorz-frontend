import React from 'react';
import { X } from 'lucide-react';
import ClassDetailView from '../molecules/ClassDetailView';

/**
 * ClassViewModal — A clean, read-only modal for viewing class details.
 * Replaces ClassFormModal's viewOnly={true} mode across the application.
 *
 * Props:
 *  isOpen          {bool}     – Whether the modal is visible.
 *  onClose         {func}     – Called when the modal is dismissed.
 *  classData       {object}   – Raw class DTO from the API.
 *  role            {string}   – 'student' | 'tutor' | 'institute' | 'view'
 *  enrollmentStatus {string}  – For students: 'Approved' | 'Pending' | etc.
 *  onLeave         {func}     – For enrolled students: leave class handler.
 *  onEdit          {func}     – For tutors/institutes: opens the edit form.
 *  isLeaving       {bool}     – Loading state for the leave action.
 */
const ClassViewModal = ({
  isOpen,
  onClose,
  classData,
  role = 'view',
  enrollmentStatus,
  onLeave,
  onEdit,
  onRequestJoin,
  isLeaving = false,
}) => {
  if (!isOpen || !classData) return null;

  const modalTitle = classData.subject || classData.className || 'Class Details';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-transparent dark:border-gray-700/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-blue-500" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white truncate max-w-xs">
              {modalTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Content ──────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <ClassDetailView
            classData={classData}
            role={role}
            enrollmentStatus={enrollmentStatus}
            onLeave={onLeave}
            onEdit={onEdit}
            onRequestJoin={onRequestJoin}
            isLeaving={isLeaving}
          />
        </div>
      </div>
    </div>
  );
};

export default ClassViewModal;
