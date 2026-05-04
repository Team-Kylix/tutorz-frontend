import React from 'react';
import {
  Clock, Calendar, User, BookOpen, CheckCircle, LogOut,
  Edit2, Building2, MapPin, Tag, Users
} from 'lucide-react';
import Button from '../atoms/Button';
import StatusBadge from '../atoms/StatusBadge';
import { formatTime } from '../../utils/helpers';

/**
 * ClassDetailView — a clean, read-only card for viewing class details.
 *
 * Props:
 *  classData       {object}   – The class DTO to display.
 *  role            {string}   – 'student' | 'tutor' | 'institute' | 'view'
 *  enrollmentStatus {string}  – 'Approved' | 'Pending' | 'Rejected' (for student role)
 *  onLeave         {func}     – Called when student clicks "Leave Class"
 *  onEdit          {func}     – Called when tutor/institute clicks "Edit Class"
 *  onRequestJoin   {func}     – Called when student clicks "Request to Join"
 *  isLeaving       {bool}     – Loading state for leave action
 */
const ClassDetailView = ({
  classData,
  role = 'view',
  enrollmentStatus,
  onLeave,
  onEdit,
  onRequestJoin,
  isLeaving = false,
}) => {
  if (!classData) return null;

  const isStudent  = role === 'student';
  const isTutor    = role === 'tutor';
  const isInstitute = role === 'institute';

  // ── Info row helper ──────────────────────────────────────────────────────────
  const InfoRow = ({ icon: Icon, label, value, iconColor = 'text-blue-500 dark:text-blue-400' }) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 shrink-0 ${iconColor}`}>
          <Icon size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider leading-none mb-0.5">{label}</p>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 break-words">{value}</p>
        </div>
      </div>
    );
  };

  // ── Action button ────────────────────────────────────────────────────────────
  const renderAction = () => {
    if (isStudent) {
      const status = enrollmentStatus || classData.enrollmentStatus;
      if (status === 'Approved') {
        return (
          <div className="space-y-2">
            <Button
              variant="outline"
              fullWidth
              onClick={onLeave}
              disabled={isLeaving}
              className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              {isLeaving ? (
                <Clock size={16} className="mr-2 animate-spin" />
              ) : (
                <LogOut size={16} className="mr-2" />
              )}
              {isLeaving ? 'Leaving...' : 'Leave Class'}
            </Button>
            <p className="text-xs text-center text-green-600 dark:text-green-400 font-medium flex items-center justify-center gap-1">
              <CheckCircle size={12} /> You are enrolled in this class
            </p>
          </div>
        );
      }
      if (status === 'Pending') {
        return (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 text-center">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              <Clock size={14} className="inline mr-1" />
              Request Pending Approval
            </p>
          </div>
        );
      }
      if (onRequestJoin) {
        return (
          <div className="space-y-1">
            <Button variant="primary" fullWidth onClick={() => onRequestJoin(classData.classId || classData.id)}>
              Request to Join
            </Button>
            <p className="text-xs text-center text-gray-400 dark:text-gray-500">Approval required by Tutor</p>
          </div>
        );
      }
    }

    if ((isTutor || isInstitute) && onEdit) {
      return (
        <Button variant="outline" fullWidth onClick={() => onEdit(classData)}>
          <Edit2 size={15} className="mr-2" />
          Edit Class
        </Button>
      );
    }

    return null;
  };

  const scheduleLabel = classData.dayOfWeek
    ? `Every ${classData.dayOfWeek}`
    : classData.date
    ? new Date(classData.date).toLocaleDateString('en-LK', { dateStyle: 'medium' })
    : null;

  const timeLabel =
    classData.startTime && classData.endTime
      ? `${formatTime(classData.startTime)} – ${formatTime(classData.endTime)}`
      : classData.timeString || null;

  const tutorInitial = (classData.tutorName || 'T').charAt(0).toUpperCase();

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">

      {/* ── Title Banner ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {classData.classType && (
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold rounded uppercase tracking-wide">
                {classData.classType}
              </span>
            )}
            {classData.grade && (
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded">
                {classData.grade}
              </span>
            )}
            {classData.isActive === false && (
              <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded uppercase">
                Inactive
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight truncate">
            {classData.subject || classData.name || classData.className || 'Class'}
          </h2>
          {classData.className && classData.className !== classData.subject && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{classData.className}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          {classData.fee != null && (
            <>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                LKR {Number(classData.fee).toLocaleString()}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500">per month</div>
            </>
          )}
        </div>
      </div>

      {/* ── Tutor Card ─────────────────────────────────────────────────── */}
      {classData.tutorName && (
        <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm">
            {tutorInitial}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Tutor</p>
            <h3 className="font-bold text-gray-900 dark:text-white">{classData.tutorName}</h3>
            {classData.bio && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed line-clamp-2">{classData.bio}</p>
            )}
          </div>
        </div>
      )}

      {/* ── Info Grid ──────────────────────────────────────────────────── */}
      <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InfoRow icon={Calendar}  label="Schedule"    value={scheduleLabel} />
        <InfoRow icon={Clock}     label="Time"        value={timeLabel} />
        <InfoRow icon={Building2} label="Institute"   value={classData.instituteName} iconColor="text-indigo-500" />
        <InfoRow icon={MapPin}    label="Hall"        value={classData.hallName}      iconColor="text-emerald-500" />
        <InfoRow icon={Users}     label="Students"    value={classData.studentCount != null ? `${classData.studentCount} enrolled` : null} iconColor="text-amber-500" />
        <InfoRow icon={Tag}       label="Class ID"    value={classData.classId ? classData.classId.toString().slice(0, 8).toUpperCase() : null} iconColor="text-gray-400" />
      </div>

      {/* ── Description / Syllabus ─────────────────────────────────────── */}
      {classData.description && (
        <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50">
          <h4 className="font-semibold text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-2 mb-2">
            <BookOpen size={13} /> Class Description
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{classData.description}</p>
        </div>
      )}

      {/* ── Action ─────────────────────────────────────────────────────── */}
      {renderAction() && (
        <div className="pt-1">
          {renderAction()}
        </div>
      )}
    </div>
  );
};

export default ClassDetailView;