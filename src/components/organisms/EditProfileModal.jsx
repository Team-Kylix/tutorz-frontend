import React, { useState, useEffect } from 'react';
import { Camera, Upload, Save, Loader } from 'lucide-react';

// Atoms & Molecules
import Button from '../atoms/Button';
import Label from '../atoms/Label';
import Modal from '../molecules/Modal';
import FormField from '../molecules/FormField';
import TextAreaField from '../molecules/TextAreaField';

const EditProfileModal = ({ isOpen, onClose, initialData, onSave, isSaving, role = 'tutor' }) => {
    
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

        // Override with initial data
        ...initialData
    });

    const [previewImage, setPreviewImage] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    // Sync state when initialData changes or modal opens
    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                ...initialData,
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
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Check if a file is selected regardless of Role
        if (selectedFile) {
            const submitData = new FormData();
            
            // Append all text data
            Object.keys(formData).forEach(key => {
                // Prevent appending null/undefined which might become string "null"
                submitData.append(key, formData[key] === null || formData[key] === undefined ? '' : formData[key]);
            });
            
            // Append the file
            submitData.append('profilePicture', selectedFile);
            
            onSave(submitData);
        } else {
            // If no file changed, send standard JSON object
            onSave(formData);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Edit ${role.charAt(0).toUpperCase() + role.slice(1)} Profile`}>
            <form onSubmit={handleSubmit} className="space-y-6">
                
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
                        Tap to change {role === 'institute' ? 'logo' : 'photo'}
                    </Label>
                </div>

                {/* --- SECTION 2: Personal Info (Common Fields) --- */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">
                        Basic Information
                    </h3>
                    
                    {role === 'institute' ? (
                        // Institute Specific Top Fields
                        <div className="grid grid-cols-1 gap-4">
                            <FormField id="instituteName" label="Institute Name" value={formData.instituteName} onChange={handleChange} required />
                        </div>
                    ) : (
                        // Tutor/Student Top Fields
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField id="firstName" label="First Name" value={formData.firstName} onChange={handleChange} required />
                            <FormField id="lastName" label="Last Name" value={formData.lastName} onChange={handleChange} required />
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField id="email" label="Email" value={formData.email} disabled className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed" />
                        <FormField 
                            id={role === 'institute' ? 'contactNumber' : 'phoneNumber'} 
                            label={role === 'institute' ? 'Contact Number' : 'Phone Number'} 
                            value={role === 'institute' ? formData.contactNumber : formData.phoneNumber} 
                            onChange={handleChange} 
                        />
                    </div>

                    {/* Student Specific Fields */}
                    {role === 'student' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField id="dateOfBirth" label="Date of Birth" type="date" value={formData.dateOfBirth} onChange={handleChange} />
                            <FormField id="parentName" label="Guardian Name" value={formData.parentName} onChange={handleChange} />
                        </div>
                    )}

                    {/* Tutor Specific Bio */}
                    {role === 'tutor' && (
                        <TextAreaField id="bio" label="Biography" value={formData.bio} onChange={handleChange} placeholder="Tell students about yourself..." />
                    )}
                </div>

                {/* --- SECTION 3: Role Specific Details --- */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">
                        {role === 'tutor' ? 'Financial Details' : role === 'institute' ? 'Location & Web' : 'Academic Details'}
                    </h3>

                    {/* A. TUTOR FIELDS */}
                    {role === 'tutor' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField id="bankName" label="Bank Name" value={formData.bankName} onChange={handleChange} placeholder="e.g. Bank of Ceylon" />
                            <FormField id="bankAccountNumber" label="Account Number" value={formData.bankAccountNumber} onChange={handleChange} />
                        </div>
                    )}

                    {/* B. STUDENT FIELDS */}
                    {role === 'student' && (
                        <>
                            <div className="grid grid-cols-1 gap-4">
                                <FormField id="schoolName" label="School Name" value={formData.schoolName} onChange={handleChange} placeholder="e.g. Royal College" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField id="grade" label="Grade / Year" value={formData.grade} onChange={handleChange} placeholder="e.g. Grade 10" />
                                {initialData?.registrationNumber && (
                                    <FormField id="regNumber" label="Registration No" value={initialData.registrationNumber} disabled className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed" />
                                )}
                            </div>
                        </>
                    )}

                    {/* C. INSTITUTE FIELDS */}
                    {role === 'institute' && (
                        <>
                            <FormField id="address" label="Address" value={formData.address} onChange={handleChange} />
                            <FormField id="website" label="Website" value={formData.website} onChange={handleChange} placeholder="https://..." />
                        </>
                    )}
                </div>

                {/* --- Footer Buttons --- */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="primary" disabled={isSaving}>
                        {isSaving ? <Loader size={18} className="animate-spin mr-2"/> : <Save size={18} className="mr-2"/>}
                        Save Changes
                    </Button>
                </div>

            </form>
        </Modal>
    );
};

export default EditProfileModal;