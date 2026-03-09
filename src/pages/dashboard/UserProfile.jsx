import React, { useState, useEffect, useCallback } from 'react';
import { Mail, Phone, FileText, Pencil, MapPin, Globe, Building, School, GraduationCap, Calendar, User } from 'lucide-react';

// Hooks & Constants
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';

// Services (Import all of them)
import { getTutorProfile, updateTutorProfile } from '../../services/api/tutorService';
import { getStudentProfile, updateStudentProfile } from '../../services/api/studentService';
import { getInstituteProfile, updateInstituteProfile } from '../../services/api/instituteService';

// Components
import InfoCard from '../../components/molecules/InfoCard';
import BankingCard from '../../components/organisms/BankingCard';
import ProfileTemplate from '../../components/templates/ProfileTemplate';
import Button from '../../components/atoms/Button';
import EditProfileModal from '../../components/organisms/EditProfileModal';
import StudentQRCode from '../../components/common/StudentQRCode';

const UserProfile = () => {
    const { user } = useAuth(); // Get current logged in user & role
    const role = user?.role;

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // --- 1. Dynamic API Logic ---
    const fetchProfileData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            let result;
            // Switch API call based on Role
            switch (role) {
                case ROLES.TUTOR: result = await getTutorProfile(); break;
                case ROLES.STUDENT: result = await getStudentProfile(); break;
                case ROLES.INSTITUTE: result = await getInstituteProfile(); break;
                default: throw new Error("Unknown Role");
            }

            if (result.success) {
                setProfile(result.data);
            } else {
                setError(result.message || 'Failed to load profile.');
            }
        } catch (err) {
            console.error("Profile fetch error:", err);
            setError('Failed to load profile details.');
        } finally {
            setLoading(false);
        }
    }, [role]);

    useEffect(() => {
        if (role) fetchProfileData();
    }, [fetchProfileData, role]);

    const handleSaveChanges = async (formData) => {
        setIsSaving(true);
        try {
            // Switch Update API call based on Role
            switch (role) {
                case ROLES.TUTOR: await updateTutorProfile(formData); break;
                case ROLES.STUDENT: await updateStudentProfile(formData); break;
                case ROLES.INSTITUTE: await updateInstituteProfile(formData); break;
            }
            await fetchProfileData(); // Refresh UI
            setIsEditModalOpen(false);
        } catch (err) {
            console.error("Update failed", err);
        } finally {
            setIsSaving(false);
        }
    };

    // --- 2. Dynamic Content Rendering ---

    // A. Left Column (Personal / Contact)
    const renderPersonalContent = () => {
        return (
            <div className="flex flex-col gap-4">
                <InfoCard icon={Mail} label="Email Address" value={profile?.email} />

                {/* Phone: Different field name for Institute */}
                <InfoCard
                    icon={Phone}
                    label={role === ROLES.INSTITUTE ? "Contact Number" : "Phone Number"}
                    value={role === ROLES.INSTITUTE ? profile?.contactNumber : profile?.phoneNumber}
                />

                {/* Institute Specific */}
                {role === ROLES.INSTITUTE && (
                    <InfoCard icon={Globe} label="Website" value={profile?.website || "No website"} />
                )}

                {/* Student Specific: Guardian & DOB */}
                {role === ROLES.STUDENT && (
                    <>
                        <InfoCard icon={Calendar} label="Date of Birth" value={profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : "Not set"} />
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900 transition-colors">
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wide mb-1">Guardian</p>
                            <div className="flex items-center gap-2">
                                <User size={18} className="text-blue-500 dark:text-blue-400" />
                                <span className="text-gray-900 dark:text-white font-medium">{profile?.parentName || "Not set"}</span>
                            </div>
                        </div>
                    </>
                )}

                {/* Tutor Specific: Bio */}
                {role === ROLES.TUTOR && (
                    <div className="group flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                        <div className="p-2 bg-white dark:bg-gray-900 rounded-lg shadow-sm text-blue-600 dark:text-blue-400">
                            <FileText size={20} />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 uppercase tracking-wide">Bio</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {profile?.bio || "No biography added yet."}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // B. Right Column (Financial / Academic / Location)
    const renderRightColumn = () => {
        let specificContent = null;

        if (role === ROLES.TUTOR) {
            specificContent = <BankingCard bankName={profile?.bankName} accountNumber={profile?.bankAccountNumber} />;
        } else if (role === ROLES.STUDENT) {
            specificContent = (
                <div className="flex flex-col gap-4">
                    <InfoCard icon={School} label="School Name" value={profile?.schoolName || "Not provided"} />
                    <InfoCard icon={GraduationCap} label="Grade / Year" value={profile?.grade || "Not provided"} />
                    <div className="mt-2 flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Account Status</span>
                        <span className="px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 rounded-full">Active Student</span>
                    </div>
                </div>
            );
        } else if (role === ROLES.INSTITUTE) {
            specificContent = (
                <div className="flex flex-col gap-4">
                    <InfoCard icon={MapPin} label="Address" value={profile?.address || "No address provided"} />
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800 mt-2">
                        <p className="text-xs text-green-600 dark:text-green-400 font-semibold uppercase tracking-wide mb-1">Status</p>
                        <div className="flex items-center gap-2">
                            <Building size={18} className="text-green-500 dark:text-green-400" />
                            <span className="text-gray-900 dark:text-white font-medium">Verified Institute</span>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-6">
                {specificContent}

                {profile?.registrationNumber && (
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                        <StudentQRCode
                            value={profile.registrationNumber}
                            studentName={getHeaderName().first}
                        />
                    </div>
                )}
            </div>
        );
    };

    // Helper to get Right Column Title
    const getRightTitle = () => {
        if (role === ROLES.TUTOR) return "Financial Information";
        if (role === ROLES.STUDENT) return "Academic Information";
        if (role === ROLES.INSTITUTE) return "Location Details";
        return "Details";
    };

    // Helper to get Name for Header
    const getHeaderName = () => {
        if (role === ROLES.INSTITUTE) return { first: profile?.instituteName, last: "" };
        return { first: profile?.firstName, last: profile?.lastName };
    };

    return (
        <>
            <ProfileTemplate
                loading={loading}
                error={error}
                onRetry={fetchProfileData}
                headerInfo={{
                    firstName: getHeaderName().first,
                    lastName: getHeaderName().last,
                    registrationNumber: profile?.registrationNumber,
                }}
                leftColumnContent={renderPersonalContent()}
                rightColumnTitle={getRightTitle()}
                rightColumnContent={renderRightColumn()}
                actionButton={
                    <Button variant="outline" size="small" onClick={() => setIsEditModalOpen(true)}>
                        <Pencil size={16} className="mr-2" /> Edit Profile
                    </Button>
                }
            />

            {/* The Unified Edit Modal handles fields based on 'role' prop */}
            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                initialData={profile}
                onSave={handleSaveChanges}
                isSaving={isSaving}
                role={role}
            />
        </>
    );
};

export default UserProfile;