import React, { useState, useEffect } from 'react';
import { Camera, Upload, Save, Loader } from 'lucide-react';

// Atoms & Molecules
import Button from '../atoms/Button';
import Label from '../atoms/Label';
import Modal from '../molecules/Modal';
import FormField from '../molecules/FormField';
import TextAreaField from '../molecules/TextAreaField';

const EditProfileModal = ({ isOpen, onClose, initialData, onSave, isSaving, role = 'tutor' }) => {
    
    // 1. Unified State: Includes fields for BOTH Tutor and Student
    const [formData, setFormData] = useState({
        // Common
        firstName: '',
        lastName: '',
        phoneNumber: '',
        
        // Tutor Specific
        bio: '',
        bankName: '',
        bankAccountNumber: '',
        
        // Student Specific
        schoolName: '',
        grade: '',
        parentName: '',
        dateOfBirth: '',

        //Institute Details
        instituteName: '',
        address: '',
        contactNumber: '',
        website: '',

        ...initialData
    });

    const [previewImage, setPreviewImage] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    // Sync state
    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ 
                instituteName: initialData.instituteName || '',
                address: initialData.address || '',
                contactNumber: initialData.contactNumber || '',
                website: initialData.website || '',
                dateOfBirth: initialData.dateOfBirth ? initialData.dateOfBirth.split('T')[0] : ''
            }));
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
        
        if (role === 'student' || role === 'institute') {
            onSave(formData); // Send JSON object
        } else {
            // Send FormData for Tutors (supports Image upload)
            const submitData = new FormData();
            Object.keys(formData).forEach(key => {
                submitData.append(key, formData[key] || '');
            });
            if (selectedFile) {
                submitData.append('profilePicture', selectedFile);
            }
            onSave(submitData);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Edit ${role === 'student' ? 'Student' : 'Tutor'} Profile`}>
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* --- SECTION 1: Profile Picture (Tutor Only?) --- */}
                {role === 'tutor' && (
                    <div className="flex flex-col items-center gap-2">
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
                        <Label htmlFor="profilePicture" className="text-xs text-gray-400 dark:text-gray-500 cursor-pointer">
                            Tap to change photo
                        </Label>
                    </div>
                )}

                {/* --- SECTION 2: Personal Info (Common Fields) --- */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">Personal Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField id="firstName" label="First Name" value={formData.firstName} onChange={handleChange} />
                        <FormField id="lastName" label="Last Name" value={formData.lastName} onChange={handleChange} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Email is usually read-only */}
                        <FormField id="email" label="Email" value={formData.email} disabled className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed" />
                        <FormField id="phoneNumber" label="Phone Number" value={formData.phoneNumber} onChange={handleChange} />
                    </div>

                    {/* Student Specific Personal Fields */}
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

                    {/* Institute Name */}
                    {role === 'institute' && (
                         <div className="grid grid-cols-1 gap-4">
                            <FormField id="instituteName" label="Institute Name" value={formData.instituteName} onChange={handleChange} />
                        </div>
                    )}
                </div>

                {/* --- SECTION 3: Role Specific Details --- */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">
                        {role === 'tutor' ? 'Financial Details' : 'Academic Details'}
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

                    {/* INSTITUTE FIELDS */}
                    {role === 'institute' && (
                        <>
                            <FormField id="address" label="Address" value={formData.address} onChange={handleChange} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField id="contactNumber" label="Contact Number" value={formData.contactNumber} onChange={handleChange} />
                                <FormField id="website" label="Website" value={formData.website} onChange={handleChange} placeholder="https://..." />
                            </div>
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