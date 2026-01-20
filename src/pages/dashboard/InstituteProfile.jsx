import React, { useState, useEffect, useCallback } from 'react';
import { Mail, MapPin, Phone, Globe, Building, Pencil } from 'lucide-react';
import { getInstituteProfile, updateInstituteProfile } from '../../services/api/instituteService';

import InfoCard from '../../components/molecules/InfoCard';
import ProfileTemplate from '../../components/templates/ProfileTemplate';
import Button from '../../components/atoms/Button';
import EditProfileModal from '../../components/organisms/EditProfileModal'; 

const InstituteProfile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const fetchProfile = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const result = await getInstituteProfile();
            if (result.success) setProfile(result.data);
            else setError(result.message || 'Failed to load.');
        } catch (err) { setError('Failed to load profile.'); } 
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    const handleSaveChanges = async (formData) => {
        setIsSaving(true);
        try {
            await updateInstituteProfile(formData);
            await fetchProfile();
            setIsEditModalOpen(false);
        } catch (err) { console.error(err); } 
        finally { setIsSaving(false); }
    };

    // 1. Left Column: Contact Info
    const contactContent = (
        <div className="flex flex-col gap-4">
            <InfoCard icon={Mail} label="Email" value={profile?.email} />
            <InfoCard icon={Phone} label="Contact Number" value={profile?.contactNumber || "Not provided"} />
            <InfoCard icon={Globe} label="Website" value={profile?.website || "No website"} />
        </div>
    );

    // 2. Right Column: Location
    const locationContent = (
        <div className="flex flex-col gap-4">
            <InfoCard icon={MapPin} label="Address" value={profile?.address || "No address provided"} />
             <div className="p-4 bg-green-50 rounded-xl border border-green-100 mt-2">
                <p className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-1">Status</p>
                <div className="flex items-center gap-2">
                    <Building size={18} className="text-green-500" />
                    <span className="text-gray-900 font-medium">Verified Institute</span>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <ProfileTemplate
                loading={loading} error={error} onRetry={fetchProfile}
                headerInfo={{
                    firstName: profile?.instituteName, // Using Name as "FirstName" for header
                    lastName: "", // Institutes usually don't have last name
                    registrationNumber: profile?.registrationNumber,
                }}
                leftColumnContent={contactContent}
                rightColumnTitle="Location Details"
                rightColumnContent={locationContent}
                actionButton={
                    <Button variant="outline" size="small" onClick={() => setIsEditModalOpen(true)}>
                        <Pencil size={16} className="mr-2" /> Edit Profile
                    </Button>
                }     
            />
            <EditProfileModal 
                isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} 
                initialData={profile} onSave={handleSaveChanges} isSaving={isSaving}
                role="institute" // 👈 Vital
            />
        </>
    );
};

export default InstituteProfile;