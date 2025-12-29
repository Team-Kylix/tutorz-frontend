import React, { useState, useEffect, useCallback } from 'react';
import { Mail, GraduationCap, School, User, Calendar, Pencil } from 'lucide-react';

// Services
import { getStudentProfile, updateStudentProfile } from '../../services/api/studentService';

// Atoms & Molecules
import Button from '../../components/atoms/Button';
import InfoCard from '../../components/molecules/InfoCard';

// Templates & Organisms
import ProfileTemplate from '../../components/templates/ProfileTemplate'; 
import EditProfileModal from '../../components/organisms/EditProfileModal'; 

const StudentProfile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // 1. Fetch Data
    const fetchProfile = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const result = await getStudentProfile();
            if (result.success) {
                setProfile(result.data); 
            } else {
                setError(result.message || 'Failed to load profile.');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load profile details.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    // 2. Save Data
    const handleSaveChanges = async (formData) => {
        setIsSaving(true);
        try {
            await updateStudentProfile(formData);
            await fetchProfile(); // Reload data to show updates
            setIsEditModalOpen(false);
        } catch (err) {
            console.error("Update failed", err);
            // You could add a toast notification here
        } finally {
            setIsSaving(false);
        }
    };

    // 3. Define content for the Left Column (Personal)
    const personalContent = (
        <div className="flex flex-col gap-4">
            <InfoCard icon={Mail} label="Email Address" value={profile?.email} />
            <InfoCard 
                icon={Calendar} 
                label="Date of Birth" 
                value={profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : "Not set"} 
            />
            {/* Guardian Info Card */}
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">Guardian</p>
                <div className="flex items-center gap-2">
                    <User size={18} className="text-blue-500" />
                    <span className="text-gray-900 font-medium">
                        {profile?.parentName || "Parent name not set"}
                    </span>
                </div>
            </div>
        </div>
    );

    // 4. Define content for the Right Column (Academic) 
    const academicContent = (
        <div className="flex flex-col gap-4">
            <InfoCard icon={School} label="School Name" value={profile?.schoolName || "Not provided"} />
            <InfoCard icon={GraduationCap} label="Grade / Year" value={profile?.grade || "Not provided"} />
            
            {/* Status Badge */}
            <div className="mt-2 flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                <span className="text-sm text-gray-500">Account Status</span>
                <span className="px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
                    Active Student
                </span>
            </div>
        </div>
    );

    return (
        <>
            {/* 5. Use the Common ProfileTemplate */}
            <ProfileTemplate
                // State props
                loading={loading}
                error={error}
                onRetry={fetchProfile}
                
                // Header Information
                headerInfo={{
                    firstName: profile?.firstName,
                    lastName: profile?.lastName,
                    registrationNumber: profile?.registrationNumber,
                }}

                // Injecting the content columns
                leftColumnContent={personalContent}
        
                rightColumnTitle="Academic Information"
                rightColumnContent={academicContent}
                
                // Action Button (Edit)
                actionButton={
                    <Button 
                        variant="outline" 
                        size="small" 
                        onClick={() => setIsEditModalOpen(true)}
                    >
                        <Pencil size={16} className="mr-2" />
                        Edit Profile
                    </Button>
                }     
            />
            <EditProfileModal 
                isOpen={isEditModalOpen} 
                onClose={() => setIsEditModalOpen(false)} 
                initialData={profile} 
                onSave={handleSaveChanges}
                isSaving={isSaving}
                role="student"
            />
        </>
    );
};

export default StudentProfile;