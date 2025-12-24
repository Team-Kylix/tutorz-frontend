import React from 'react';
import { Loader, BadgeCheck } from 'lucide-react';

// Atoms
import SectionTitle from '../atoms/SectionTitle';

// Molecules & Organisms
import ProfileAvatarHeader from '../molecules/ProfileAvatarHeader';
import ErrorState from '../organisms/ErrorState'; 

const ProfileTemplate = ({ 
    loading, 
    error, 
    onRetry, 
    headerInfo, 
    leftColumnContent, 
    rightColumnContent,
    rightColumnTitle = "Financial Information",
    actionButton 
}) => {

    if (loading) return (
        <div className="flex flex-col justify-center items-center h-96 space-y-4">
            <Loader className="animate-spin text-blue-600" size={40} />
            <p className="text-gray-500 text-sm animate-pulse">Loading profile...</p>
        </div>
    );

    if (error) return (
        <ErrorState message={error} onRetry={onRetry} />
    );

    return (
        // 👇 FIXED: Removed 'max-w-5xl' and 'mx-auto'. 
        // Now it uses 'w-full' to fill the entire screen space provided by the parent.
        <div className="w-full space-y-6">
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                
                <ProfileAvatarHeader firstName={headerInfo?.firstName} />

                <div className="pt-14 px-8 pb-6 border-b border-gray-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                {headerInfo?.firstName || "User"} {headerInfo?.lastName}
                                {headerInfo?.registrationNumber && <BadgeCheck className="text-blue-500" size={20} />}
                            </h1>
                            <p className="text-sm text-gray-500 font-medium mt-1">
                                Registration ID: <span className="font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-xs ml-1">
                                    {headerInfo?.registrationNumber || "PENDING"}
                                </span>
                            </p>
                        </div>

                        {/* Action Button */}
                        {actionButton && (
                            <div>{actionButton}</div>
                        )}
                    </div>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <SectionTitle title="Personal Details" />
                        {leftColumnContent}
                    </div>

                    <div className="space-y-6">
                        <SectionTitle title={rightColumnTitle} />
                        {rightColumnContent}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileTemplate;