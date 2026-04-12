import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { Mail, Phone, FileText, Pencil, MapPin, Globe, School, GraduationCap, Calendar, User } from 'lucide-react';

// Hooks & Constants
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';
import { updateUser } from '../../store/authSlice';
import { enqueueAction, SYNC_ACTION_TYPES } from '../../store/syncSlice';

// Services
import { getTutorProfile, updateTutorProfile } from '../../services/api/tutorService';
import { getStudentProfile, updateStudentProfile } from '../../services/api/studentService';
import { getInstituteProfile, updateInstituteProfile } from '../../services/api/instituteService';
import { getProvinces, getDistricts, getCities } from '../../services/api/locationService';

// Components
import InfoCard from '../../components/molecules/InfoCard';
import FinancialsSection from '../../components/organisms/FinancialsSection';
import ProfileTemplate from '../../components/templates/ProfileTemplate';
import Button from '../../components/atoms/Button';
import EditProfileModal from '../../components/organisms/EditProfileModal';
import StudentQRCode from '../../components/common/StudentQRCode';

const UserProfile = () => {
    const { user } = useAuth(); 
    const role = user?.role;
    const dispatch = useDispatch(); // Initialize Dispatch

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Location name resolution for address display (institute)
    const [locationNames, setLocationNames] = useState({ province: '', district: '', city: '' });

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
                // Generate a cache-busting timestamp
                const ts = `?t=${Date.now()}`;
                
                // Get raw URLs
                let smallUrl = result.data.profileImageUrlSmall || result.data.profileImageUrlLarge || result.data.profilePictureUrl;
                let largeUrl = result.data.profileImageUrlLarge || result.data.profilePictureUrl;
                
                // Append timestamp
                if (smallUrl) smallUrl = `${smallUrl}${smallUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
                if (largeUrl) largeUrl = `${largeUrl}${largeUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;

                const profileData = { ...result.data };
                if (profileData.profileImageUrlSmall) profileData.profileImageUrlSmall = smallUrl;
                if (profileData.profileImageUrlLarge) profileData.profileImageUrlLarge = largeUrl;
                if (profileData.profilePictureUrl) profileData.profilePictureUrl = largeUrl;

                setProfile(profileData);
                
                // --- SYNC WITH REDUX SO SIDEBAR UPDATES ---
                dispatch(updateUser({
                    firstName: result.data.firstName || result.data.instituteName,
                    lastName: result.data.lastName || '',
                    // Use fallbacks to ensure the Sidebar gets an image regardless of backend column names
                    profileImageUrlSmall: smallUrl,
                    profileImageUrlLarge: largeUrl,
                    profiles: result.data.profiles || []
                }));
                // --------------------------------------------------------

            } else {
                setError(result.message || 'Failed to load profile.');
            }
        } catch (err) {
            console.error("Profile fetch error:", err);
            setError('Failed to load profile details.');
        } finally {
            setLoading(false);
        }
    }, [role, dispatch]);

    useEffect(() => {
        if (role) fetchProfileData();
    }, [fetchProfileData, role]);

    // Resolve location names when institute or student profile loads
    useEffect(() => {
        if ((role !== ROLES.INSTITUTE && role !== ROLES.STUDENT) || !profile) return;

        const resolveLocationNames = async () => {
            try {
                const names = { province: '', district: '', city: '' };

                if (profile.provinceId) {
                    const provinces = await getProvinces();
                    const prov = provinces.find(p => p.id?.toString() === profile.provinceId?.toString());
                    if (prov) names.province = prov.name;
                }

                if (profile.districtId) {
                    const districts = await getDistricts(profile.provinceId);
                    const dist = districts.find(d => d.id?.toString() === profile.districtId?.toString());
                    if (dist) names.district = dist.name;
                }

                if (profile.cityId) {
                    const cities = await getCities(profile.districtId);
                    const city = cities.find(c => c.id?.toString() === profile.cityId?.toString());
                    if (city) names.city = city.name;
                }

                setLocationNames(names);
            } catch (err) {
                console.error('Failed to resolve location names:', err);
            }
        };

        resolveLocationNames();
    }, [profile, role]);

    const handleSaveChanges = async (formDataOrObj) => {
        const isFormData = formDataOrObj instanceof FormData;
        const hasFile = isFormData && formDataOrObj.has('profilePicture');

        // --- OPTIMISTIC UI: update local state immediately ---
        if (!isFormData) {
            // Plain object: spread into local profile state for instant UI
            setProfile((prev) => ({ ...prev, ...formDataOrObj }));
            dispatch(updateUser({
                firstName: formDataOrObj.firstName || formDataOrObj.instituteName,
                lastName: formDataOrObj.lastName || '',
            }));
        }

        // Close the modal right away for a snappy feel
        setIsEditModalOpen(false);

        if (isFormData) {
            // ─── DIRECT UPLOAD: FormData (contains binary image file) ──────────────
            // FormData is NON-SERIALIZABLE — it CANNOT be stored in Redux or
            // persisted by redux-persist. Enqueuing it would corrupt the sync queue
            // and silently discard the image, causing slow/failed photo updates.
            // Solution: call the API directly and refresh from the response.
            setIsSaving(true);
            try {
                let updateFn;
                switch (role) {
                    case ROLES.TUTOR:     updateFn = updateTutorProfile; break;
                    case ROLES.STUDENT:   updateFn = updateStudentProfile; break;
                    case ROLES.INSTITUTE: updateFn = updateInstituteProfile; break;
                    default: throw new Error(`Unknown role: ${role}`);
                }

                await updateFn(formDataOrObj);

                // Refresh profile from server to get real CDN URLs for the new image
                await fetchProfileData();
            } catch (err) {
                console.error('[UserProfile] Direct profile update failed:', err);
                // Re-fetch to revert optimistic state on failure
                await fetchProfileData();
            } finally {
                setIsSaving(false);
            }
        } else {
            // ─── OFFLINE-SAFE PATH: plain JSON object (no image) ─────────────────
            // Safe to enqueue in Redux — all values are plain serializable primitives.
            dispatch(enqueueAction({
                actionType: SYNC_ACTION_TYPES.UPDATE_PROFILE,
                payload: { role, formData: formDataOrObj },
                label: `Update Profile: ${formDataOrObj.firstName || formDataOrObj.instituteName || 'User'}`,
            }));
        }
    };


    // --- 2. Dynamic Content Rendering ---

    // Helper: compose a full address string from location names + street address
    const getFullAddress = () => {
        const parts = [];
        if (locationNames.province) parts.push(locationNames.province);
        if (locationNames.district) parts.push(locationNames.district);
        if (locationNames.city) parts.push(locationNames.city);
        if (profile?.address) parts.push(profile.address);
        return parts.length > 0 ? parts.join(', ') : 'No address provided';
    };

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

                {/* Shared Hierarchical Address (Institute & Student) */}
                {(role === ROLES.INSTITUTE || role === ROLES.STUDENT) && (
                    <div className="group flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700 transition-colors">
                        <div className="p-2 bg-white dark:bg-gray-900 rounded-lg shadow-sm text-blue-600 dark:text-blue-400">
                            <MapPin size={20} />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 uppercase tracking-wide">Address</p>
                            <div className="space-y-1">
                                {locationNames.province && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                        <span className="font-medium text-gray-500 dark:text-gray-400">Province: </span>
                                        {locationNames.province}
                                    </p>
                                )}
                                {locationNames.district && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                        <span className="font-medium text-gray-500 dark:text-gray-400">District: </span>
                                        {locationNames.district}
                                    </p>
                                )}
                                {locationNames.city && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                        <span className="font-medium text-gray-500 dark:text-gray-400">City/Town: </span>
                                        {locationNames.city}
                                    </p>
                                )}
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {profile?.address || 'No street address'}
                                </p>
                            </div>
                        </div>
                    </div>
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
            specificContent = (
                <div className="flex flex-col gap-4">
                    {/* Read-only bank & card display */}
                    <div className="pb-1">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Payment & Banking</p>
                        <FinancialsSection role={role} readOnly={true} />
                    </div>
                </div>
            );
        } else if (role === ROLES.STUDENT) {
            specificContent = (
                <div className="flex flex-col gap-4">
                    <InfoCard icon={School} label="School Name" value={profile?.schoolName || "Not provided"} />
                    <InfoCard icon={GraduationCap} label="Grade / Year" value={profile?.grade || "Not provided"} />
                    <div className="mt-2 flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Account Status</span>
                        <span className="px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 rounded-full">Active Student</span>
                    </div>
                    {/* Card management — students can add/change their payment card here */}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Payment Card</p>
                        <FinancialsSection role={role} readOnly={false} />
                    </div>
                </div>
            );
        } else if (role === ROLES.INSTITUTE) {
            specificContent = (
                <div className="flex flex-col gap-4">
                    {/* Read-only bank & card display for institutes */}
                    <div className="pb-1">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Payment & Banking</p>
                        <FinancialsSection role={role} readOnly={true} />
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-6">
                {specificContent}

                {/* Registration Number is now handled in the header via qrCodeContent */}
            </div>
        );
    };

    // Helper to get Right Column Title
    const getRightTitle = () => {
        if (role === ROLES.TUTOR) return "Financial Information";
        if (role === ROLES.STUDENT) return "Academic & Payment";
        if (role === ROLES.INSTITUTE) return "Location & Financials";
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
                    profileImageUrlLarge: profile?.profileImageUrlLarge || profile?.profilePictureUrl // Fallback here too
                }}
                leftColumnContent={renderPersonalContent()}
                rightColumnTitle={getRightTitle()}
                rightColumnContent={renderRightColumn()}
                qrCodeContent={
                    profile?.registrationNumber && (
                        <StudentQRCode
                            variant="compact"
                            value={profile.registrationNumber}
                            studentName={getHeaderName().first}
                        />
                    )
                }
                actionButton={
                    <Button 
                        variant="outline" 
                        size="small" 
                        onClick={() => setIsEditModalOpen(true)}
                        className="w-full md:w-auto"
                    >
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