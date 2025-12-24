import React, { useState, useEffect, useCallback } from 'react';
import { Mail, Phone, FileText, Pencil } from 'lucide-react';
import { getTutorProfile, updateTutorProfile } from '../../services/api/tutorService';

// Components
import InfoCard from '../../components/molecules/InfoCard';
import BankingCard from '../../components/organisms/BankingCard';
import ProfileTemplate from '../../components/templates/ProfileTemplate';
import Button from '../../components/atoms/Button'; // 👈 Import Button Atom
import EditProfileModal from '../../components/organisms/EditProfileModal';

const TutorProfile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const fetchProfile = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            // "result" contains { success: true, data: { ...profile ... } }
            const result = await getTutorProfile();
            
            // 👇 THE FIX: Check success and save ONLY the inner 'data'
            if (result.success) {
                setProfile(result.data); 
            } else {
                // Handle logic failure (e.g., "Profile not found")
                setError(result.message || 'Failed to load profile.');
            }

        } catch (err) {
            console.error("Profile fetch error:", err);
            if (err.response && err.response.status === 401) {
                setError('Session expired. Please log in again.');
            } else {
                setError('Failed to load profile details.');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSaveChanges = async (formData) => {
        setIsSaving(true);
        try {
            await updateTutorProfile(formData);
            await fetchProfile(); // Refresh data
            setIsEditModalOpen(false); // Close modal
        } catch (err) {
            console.error("Update failed", err);
            // Handle error (maybe show a toast)
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const personalContent = (
        <>
            <InfoCard icon={Mail} label="Email Address" value={profile?.email} />
            <InfoCard icon={Phone} label="Phone Number" value={profile?.phoneNumber || "Not provided"} />
            <div className="group flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors duration-200">
                <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600">
                    <FileText size={20} />
                </div>
                <div className="flex-1">
                    <p className="text-xs text-gray-500 font-medium mb-1">Bio</p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                        {profile?.bio || "No biography added yet."}
                    </p>
                </div>
            </div>
        </>
    );

    const financialContent = (
        <BankingCard 
            bankName={profile?.bankName} 
            accountNumber={profile?.bankAccountNumber} 
        />
    );

    return (
        <>
        <ProfileTemplate
            loading={loading}
            error={error}
            onRetry={fetchProfile}
            headerInfo={{
                firstName: profile?.firstName,
                lastName: profile?.lastName,
                registrationNumber: profile?.registrationNumber,
            }}
            leftColumnContent={personalContent}
            rightColumnContent={financialContent}
            rightColumnTitle="Financial Information"
            
            // 👇 PASSING THE BUTTON ATOM HERE
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
        {/* 2. Edit Profile Modal (Hidden until clicked) */}
            <EditProfileModal 
                isOpen={isEditModalOpen} 
                onClose={() => setIsEditModalOpen(false)} 
                initialData={profile} 
                onSave={handleSaveChanges}
                isSaving={isSaving}
            />
        </>



        
    );
};

export default TutorProfile;