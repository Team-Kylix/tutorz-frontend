import React from 'react';
import { User, Building2, MapPin, Clock, Calendar, GraduationCap, BookOpen, LogOut, Loader } from 'lucide-react';
import Modal from '../molecules/Modal';
import Button from '../atoms/Button';
import StatusBadge from '../atoms/StatusBadge';
import InfoCard from '../molecules/InfoCard';

const StudentClassDetailsModal = ({ isOpen, onClose, cls, onLeave, isLeaving }) => {
    if (!cls) return null;

    const enrolledDate = cls.enrolledAt
        ? new Date(cls.enrolledAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : 'N/A';

    const statusLabel = cls.status === 'active' ? 'Active' : 'Inactive';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Class Details">
            <div className="space-y-4">

                {/* Class Title Block */}
                <div className="mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {cls.className || 'Class'}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="inline-block px-2 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                                {cls.classType || 'Class'}
                            </span>
                            <StatusBadge status={statusLabel} />
                        </div>
                    </div>
                </div>

                {/* Info Cards Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <InfoCard icon={BookOpen} label="Subject" value={cls.subject || 'N/A'} />
                    <InfoCard icon={GraduationCap} label="Grade" value={cls.grade || 'N/A'} />
                </div>

                <InfoCard icon={User} label="Tutor" value={cls.tutorName || 'N/A'} />
                <InfoCard icon={Building2} label="Institute" value={cls.instituteName || 'Online / Private'} />

                {cls.hallName && (
                    <InfoCard icon={MapPin} label="Hall / Venue" value={cls.hallName} />
                )}

                <div className="grid grid-cols-2 gap-4">
                    <InfoCard
                        icon={Calendar}
                        label="Day"
                        value={cls.dayOfWeek
                            ? cls.dayOfWeek.charAt(0).toUpperCase() + cls.dayOfWeek.slice(1)
                            : 'N/A'}
                    />
                    <InfoCard
                        icon={Clock}
                        label="Time"
                        value={cls.startTime && cls.endTime
                            ? `${cls.startTime} – ${cls.endTime}`
                            : 'N/A'}
                    />
                </div>

                {/* Fee Block */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wide mb-1">
                        Monthly Fee
                    </p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                        LKR {cls.fee?.toLocaleString() || '0'}
                    </p>
                </div>

                <InfoCard icon={Calendar} label="Enrolled On" value={enrolledDate} />

                {/* Footer Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700 w-full">
                    <Button variant="primary" onClick={onClose} fullWidth>
                        Close
                    </Button>
                    <Button variant="danger" onClick={onLeave} disabled={isLeaving} fullWidth>
                        {isLeaving ? <Loader size={16} className="animate-spin mr-2" /> : <LogOut size={16} className="mr-2" />}
                        {isLeaving ? 'Leaving...' : 'Leave Class'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default StudentClassDetailsModal;
