import React, { useState, useEffect } from 'react';
import { Camera, Upload, Save, Loader } from 'lucide-react';

// Atoms
import Button from '../atoms/Button';
import Label from '../atoms/Label'; // Using your existing Label atom

// Molecules
import Modal from '../molecules/Modal';
import FormField from '../molecules/FormField'; // Your existing molecule
import TextAreaField from '../molecules/TextAreaField'; // The one we just made

const EditProfileModal = ({ isOpen, onClose, initialData, onSave, isSaving }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        bio: '',
        bankName: '',
        bankAccountNumber: '',
        ...initialData
    });

    const [previewImage, setPreviewImage] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    // Sync state if initialData updates
    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));
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
        
        // Convert to FormData for file upload
        const submitData = new FormData();
        Object.keys(formData).forEach(key => {
            // handle null values gracefully
            submitData.append(key, formData[key] || '');
        });
        
        if (selectedFile) {
            submitData.append('profilePicture', selectedFile);
        }

        onSave(submitData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile">
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. Profile Picture Upload Section */}
                <div className="flex flex-col items-center gap-2">
                    <div className="relative group cursor-pointer w-24 h-24">
                        <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100">
                            {previewImage ? (
                                <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <Camera size={32} />
                                </div>
                            )}
                        </div>
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Upload className="text-white" size={20} />
                        </div>
                        
                        {/* Hidden File Input */}
                        <input 
                            id="profilePicture"
                            type="file" 
                            accept="image/*" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleImageChange}
                        />
                    </div>
                    <Label htmlFor="profilePicture" className="text-xs text-gray-400 cursor-pointer">
                        Tap to change photo
                    </Label>
                </div>

                {/* 2. Personal Info */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Personal Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField 
                            id="firstName" 
                            label="First Name" 
                            value={formData.firstName} 
                            onChange={handleChange} 
                        />
                        <FormField 
                            id="lastName" 
                            label="Last Name" 
                            value={formData.lastName} 
                            onChange={handleChange} 
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField 
                            id="email" 
                            label="Email" 
                            value={formData.email} 
                            disabled 
                            className="bg-gray-50 text-gray-500 cursor-not-allowed" // styling for disabled
                        />
                        <FormField 
                            id="phoneNumber" 
                            label="Phone Number" 
                            value={formData.phoneNumber} 
                            onChange={handleChange} 
                        />
                    </div>

                    <TextAreaField 
                        id="bio" 
                        label="Biography" 
                        value={formData.bio} 
                        onChange={handleChange} 
                        placeholder="Tell students about yourself..." 
                    />
                </div>

                {/* 3. Financial Info */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Financial Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField 
                            id="bankName" 
                            label="Bank Name" 
                            value={formData.bankName} 
                            onChange={handleChange} 
                            placeholder="e.g. Bank of Ceylon" 
                        />
                        <FormField 
                            id="bankAccountNumber" 
                            label="Account Number" 
                            value={formData.bankAccountNumber} 
                            onChange={handleChange} 
                        />
                    </div>
                </div>

                {/* 4. Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
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