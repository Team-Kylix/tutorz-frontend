import React, { useState, useEffect } from 'react';
import { Camera, Upload, Save, Loader, Key, X } from 'lucide-react';

// Atoms & Molecules
import Button from '../atoms/Button';
import Label from '../atoms/Label';
import Modal from '../molecules/Modal';
import FormField from '../molecules/FormField';
import TextAreaField from '../molecules/TextAreaField';
import UpdateCredentialModal from './UpdateCredentialModal';
import ChangePasswordModal from './ChangePasswordModal';
import LocationSelector from '../molecules/LocationSelector';
import ConfirmationModal from '../molecules/ConfirmationModal';
import FinancialsSection from './FinancialsSection';
import { ROLES, GRADE_GROUPS } from '../../utils/constants';
import { validatePhoneNumber } from '../../utils/validators';

const SelectField = ({ id, label, value, onChange, groups, placeholder, required = false, error }) => {
    const isPlaceholder = value === "";
    return (
        <div className="w-full">
            <Label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {label} {required && <span className="text-red-500 dark:text-red-400">*</span>}
            </Label>
            <div className="relative">
                <select
                    id={id}
                    value={value}
                    onChange={onChange}
                    required={required}
                    className={`appearance-none w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-800
                        text-sm font-medium transition-all duration-200 ease-in-out
                        focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-200 dark:focus:ring-blue-900 focus:border-blue-500 dark:focus:border-blue-500
                        ${error ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-700'}
                        ${isPlaceholder ? 'text-gray-400' : 'text-gray-900 dark:text-white'}
                    `}
                >
                    <option value="" disabled>{placeholder}</option>
                    {groups.map((group, index) => (
                        <optgroup key={index} label={group.label} className="font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">
                            {group.options.map((opt) => (
                                <option key={opt} value={opt} className="text-gray-900 dark:text-white font-normal bg-white dark:bg-gray-800">{opt}</option>
                            ))}
                        </optgroup>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500 dark:text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
};

const EditProfileModal = ({ isOpen, onClose, initialData, onSave, isSaving, role = 'tutor' }) => {
    
    const normalizedRole = role?.toLowerCase() || 'tutor';
    
    // Unified State: Includes fields for ALL Roles
    const [formData, setFormData] = useState({
        // Common
        firstName: '',
        lastName: '',
        phoneNumber: '',
        email: '', 

        // Tutor Specific
        bio: '',
        bankName: '',
        bankAccountNumber: '',
        
        // Student Specific
        schoolName: '',
        grade: '',
        parentName: '',
        dateOfBirth: '',

        // Institute Specific
        instituteName: '',
        address: '',
        contactNumber: '',
        website: '',
        provinceId: '',
        districtId: '',
        cityId: '',

        // Override with initial data
        ...initialData
    });

    const [previewImage, setPreviewImage] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    // Modal states for credential updates
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showMobileModal, setShowMobileModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [errors, setErrors] = useState({});

    // Sync state when initialData changes or modal opens
    useEffect(() => {
        if (initialData) {
            // Clean initialData: replace null with empty string to prevent React warnings
            const safeData = { ...initialData };
            Object.keys(safeData).forEach(key => {
                if (safeData[key] === null) {
                    safeData[key] = '';
                }
            });

            setFormData(prev => ({
                ...prev,
                ...safeData,
                // Ensure specific fields map correctly
                dateOfBirth: initialData.dateOfBirth ? initialData.dateOfBirth.split('T')[0] : '',
                contactNumber: initialData.contactNumber || initialData.phoneNumber || '',
            }));
            
            // Set existing profile picture if available
            if (initialData.profilePictureUrl) {
                setPreviewImage(initialData.profilePictureUrl); 
            }
        }
    }, [initialData, isOpen]);

    const handleChange = (e) => {
        const { id, value } = e.target;
        const key = id || e.target.name; 
        setFormData(prev => ({ ...prev, [key]: value }));
        if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
    };

    const handlePhoneBlur = () => {
        if (normalizedRole !== 'institute' && formData.phoneNumber) {
            const validation = validatePhoneNumber(formData.phoneNumber);
            if (!validation.isValid) {
                setErrors(prev => ({ ...prev, phoneNumber: validation.message }));
            }
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleTriggerSave = (e) => {
        e.preventDefault();

        // Validate phone number before showing confirmation dialog.
        // Tutors have a DISABLED phone field (changed via UpdateCredentialModal)
        // so we must NOT validate it here — it may be empty for new tutors.
        // Institute uses contactNumber. Student uses the dedicated modal too.
        // → Only validate for roles that have an editable phoneNumber in THIS form.
        // (Currently no role has an editable phone here, but guard for future changes.)
        if (normalizedRole === 'student') {
            // Students edit their phone via the credential modal (disabled in form)
        }

        setShowSaveConfirm(true);
    };

    const executeSave = () => {
        setShowSaveConfirm(false);
        
        // Ensure clean payload for ALL roles using [FromForm] backend validation
        const submitData = new FormData();
        
        let expectedFields = [];
        switch (normalizedRole) {
            case 'institute':
                expectedFields = ['instituteName', 'address', 'contactNumber', 'website', 'isSmsEnabled', 'provinceId', 'districtId', 'cityId'];
                break;
            case 'student':
                expectedFields = ['firstName', 'lastName', 'schoolName', 'grade', 'parentName', 'dateOfBirth', 'address', 'provinceId', 'districtId', 'cityId'];
                break;
            case 'tutor':
                expectedFields = ['firstName', 'lastName', 'bio', 'address', 'cityId'];
                break;
            case 'admin':
            case 'superadmin':
                expectedFields = ['firstName', 'lastName', 'address'];
                break;
        }

        expectedFields.forEach(key => {
            const val = formData[key];
            // Only append if truly non-empty; prevents sending literal 'null' / 'undefined' strings
            if (val !== null && val !== undefined && val !== '' && val !== 'null') {
                submitData.append(key, val);
            }
        });
        
        if (selectedFile) {
            submitData.append('profilePicture', selectedFile);
        }
        
        onSave(submitData);
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={`Edit ${role.charAt(0).toUpperCase() + role.slice(1)} Profile`}>
                <div className="space-y-6">
                    
                    {/* --- SECTION 1: Profile Picture (Enabled for ALL Roles) --- */}
                    <div className="flex flex-col items-center gap-2 mb-4">
                        <div className="relative group cursor-pointer w-24 h-24">
                            <div className="w-full h-full rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-lg bg-gray-100 dark:bg-gray-700 transition-colors">
                                {previewImage ? (
                                    <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                                        <Camera size={32} />
                                    </div>
                                )}
                            </div>
                            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload className="text-white" size={20} />
                            </div>
                            <input 
                                id="profilePicture" type="file" accept="image/*" 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleImageChange}
                            />
                        </div>
                        <Label htmlFor="profilePicture" className="text-xs text-gray-400 dark:text-gray-500 cursor-pointer hover:text-blue-500 transition-colors">
                            Tap to change {normalizedRole === 'institute' ? 'logo' : 'photo'}
                        </Label>
                    </div>

                    {/* --- SECTION 2: Personal Info (Common Fields) --- */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                Basic Information
                            </h3>
                        </div>
                        
                        {normalizedRole === 'institute' ? (
                            // Institute Specific Top Fields
                            <div className="grid grid-cols-1 gap-4">
                                <FormField id="instituteName" label="Institute Name" value={formData.instituteName} onChange={handleChange} required />
                            </div>
                        ) : (
                            // Admin/Tutor/Student Top Fields
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField id="firstName" label="First Name" value={formData.firstName} onChange={handleChange} required />
                                <FormField id="lastName" label="Last Name" value={formData.lastName} onChange={handleChange} required />
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-end gap-2">
                                <div className="flex-1">
                                    <FormField id="email" label="Email" value={formData.email} disabled className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed" />
                                </div>
                                <Button type="button" variant="outline" className="mb-px" onClick={() => setShowEmailModal(true)}>Change</Button>
                            </div>
                            <div className="flex items-end gap-2">
                                <div className="flex-1">
                                    <FormField 
                                        id={normalizedRole === 'tutor' ? "phoneNumber" : "contactNumber"} 
                                        label={normalizedRole === 'student' ? "Phone Number" : normalizedRole === 'tutor' ? "Phone Number" : "Contact Number"} 
                                        value={normalizedRole === 'tutor' ? formData.phoneNumber : formData.contactNumber} 
                                        disabled 
                                        className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed" 
                                    />
                                </div>
                                <Button type="button" variant="outline" className="mb-px" onClick={() => setShowMobileModal(true)}>Change</Button>
                            </div>
                        </div>

                        {/* Student Specific Fields */}
                        {normalizedRole === 'student' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField id="dateOfBirth" label="Date of Birth" type="date" value={formData.dateOfBirth} onChange={handleChange} />
                                <FormField id="parentName" label="Guardian Name" value={formData.parentName} onChange={handleChange} />
                            </div>
                        )}

                        {/* Tutor Specific Bio */}
                        {normalizedRole === 'tutor' && (
                            <TextAreaField id="bio" label="Biography" value={formData.bio} onChange={handleChange} placeholder="Tell students about yourself..." />
                        )}
                    </div>

                    {/* --- SECTION 3: Role Specific Details --- */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">
                            {normalizedRole === 'tutor' ? 'Financial Details' : normalizedRole === 'institute' ? 'Location & Web' : normalizedRole === 'student' ? 'Academic Details' : 'Additional Details'}
                        </h3>

                        {/* A. TUTOR FIELDS (Now standardized with location) */}
                        {normalizedRole === 'tutor' && (
                            <>
                                <LocationSelector 
                                    onProvinceChange={(provinceId) => setFormData(prev => ({ ...prev, provinceId }))}
                                    onDistrictChange={(districtId) => setFormData(prev => ({ ...prev, districtId }))}
                                    onCityChange={(cityId) => setFormData(prev => ({ ...prev, cityId }))}
                                    initialProvinceId={formData.provinceId}
                                    initialDistrictId={formData.districtId}
                                    initialCityId={formData.cityId}
                                    error={null} 
                                />
                                <FormField id="address" label="Home/Office Street Address" value={formData.address} onChange={handleChange} placeholder="e.g. No 15, Main Street" />
                            </>
                        )}

                        {/* B. STUDENT FIELDS */}
                        {normalizedRole === 'student' && (
                            <>
                                <div className="grid grid-cols-1 gap-4">
                                    <FormField id="schoolName" label="School Name" value={formData.schoolName} onChange={handleChange} placeholder="e.g. Royal College" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <SelectField
                                        id="grade"
                                        label="Grade / Course ..."
                                        value={formData.grade}
                                        onChange={handleChange}
                                        groups={GRADE_GROUPS}
                                        placeholder="Select Grade"
                                        required={true}
                                        error={errors.grade}
                                    />
                                    {initialData?.registrationNumber && (
                                        <FormField id="regNumber" label="Registration No" value={initialData.registrationNumber} disabled className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed" />
                                    )}
                                </div>
                                <LocationSelector 
                                    onProvinceChange={(provinceId) => setFormData(prev => ({ ...prev, provinceId }))}
                                    onDistrictChange={(districtId) => setFormData(prev => ({ ...prev, districtId }))}
                                    onCityChange={(cityId) => setFormData(prev => ({ ...prev, cityId }))}
                                    initialProvinceId={formData.provinceId}
                                    initialDistrictId={formData.districtId}
                                    initialCityId={formData.cityId}
                                    error={null} 
                                />
                                <FormField id="address" label="Street Address" value={formData.address} onChange={handleChange} placeholder="e.g. No 15, Main Street" />
                            </>
                        )}

                        {/* C. INSTITUTE FIELDS */}
                        {normalizedRole === 'institute' && (
                            <>
                                <LocationSelector 
                                    onProvinceChange={(provinceId) => setFormData(prev => ({ ...prev, provinceId }))}
                                    onDistrictChange={(districtId) => setFormData(prev => ({ ...prev, districtId }))}
                                    onCityChange={(cityId) => setFormData(prev => ({ ...prev, cityId }))}
                                    initialProvinceId={formData.provinceId}
                                    initialDistrictId={formData.districtId}
                                    initialCityId={formData.cityId}
                                    error={null} 
                                />
                                <FormField id="address" label="Street Address" value={formData.address} onChange={handleChange} placeholder="e.g. No 15, Main Street" />
                                <FormField id="website" label="Website" value={formData.website} onChange={handleChange} placeholder="https://..." />
                            </>
                        )}

                        {/* D. ADMIN FIELDS */}
                        {(normalizedRole === 'admin' || normalizedRole === 'superadmin') && (
                            <>
                                <FormField id="address" label="Street Address" value={formData.address} onChange={handleChange} placeholder="e.g. No 15, Main Street" />
                            </>
                        )}
                    </div>

                    {/* --- SECTION 4: Payment & Banking --- */}
                    {(normalizedRole !== 'admin' && normalizedRole !== 'superadmin') && (
                        <div className="space-y-4 border-t border-gray-100 dark:border-gray-700 pt-6">
                            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                    Payment &amp; Banking
                                </h3>
                                <span className="text-xs text-gray-400 dark:text-gray-500">Manage your saved accounts</span>
                            </div>
                            <FinancialsSection role={role} readOnly={false} />
                        </div>
                    )}

                    {/* --- Footer Buttons --- */}
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <Button 
                            type="button" 
                            variant="primary" 
                            onClick={() => setShowPasswordModal(true)}
                            className="w-full sm:w-auto order-2 sm:order-none"
                        >
                            <Key size={18} className="mr-2"/>
                            Change Password
                        </Button>
                        <Button 
                            type="button" 
                            variant="primary" 
                            disabled={isSaving}
                            onClick={handleTriggerSave}
                            className="w-full sm:w-auto order-1 sm:order-none"
                        >
                            {isSaving ? <Loader size={18} className="animate-spin mr-2"/> : <Save size={18} className="mr-2"/>}
                            Save Changes
                        </Button>
                        <Button 
                            type="button" 
                            variant="secondary" 
                            onClick={onClose}
                            className="w-full sm:w-auto order-3 sm:order-none"
                        >
                            <X size={18} className="mr-2"/>
                            Cancel
                        </Button>
                    </div>
                </div>

        </Modal>

        {/* --- Credential Update Modals --- */}
        <UpdateCredentialModal
            isOpen={showEmailModal}
            onClose={() => setShowEmailModal(false)}
            type="email"
            currentIdentifier={formData.email}
            onSuccess={(newEmail) => setFormData(prev => ({ ...prev, email: newEmail }))}
        />

        <UpdateCredentialModal
            isOpen={showMobileModal}
            onClose={() => setShowMobileModal(false)}
            type="mobile"
            currentIdentifier={formData.contactNumber}
            onSuccess={(newMobile) => setFormData(prev => ({ ...prev, contactNumber: newMobile }))}
        />

        <ChangePasswordModal
            isOpen={showPasswordModal}
            onClose={() => setShowPasswordModal(false)}
        />

        <ConfirmationModal
            isOpen={showSaveConfirm}
            onClose={() => setShowSaveConfirm(false)}
            onConfirm={executeSave}
            title="Confirm Profile Update"
            message={`Are you sure you want to save the changes to your profile?`}
            confirmLabel={isSaving ? "Saving..." : "Save Changes"}
        />
    </>
    );
};

export default EditProfileModal;