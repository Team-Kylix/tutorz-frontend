import React from 'react';
import { User } from 'lucide-react';
import { BASE_URL } from '../../services/api/apiClient';

const ProfileAvatarHeader = ({ firstName, profileImageUrl, qrCode }) => {
    return (
        <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-900 relative">
            {/* Avatar (Left) */}
            <div className="absolute -bottom-10 left-8 z-10">
                <div className="w-24 h-24 rounded-2xl bg-white dark:bg-gray-800 p-1.5 shadow-lg transition-colors">
                    <div className="w-full h-full rounded-xl bg-blue-50 dark:bg-blue-900 flex items-center justify-center text-3xl font-bold text-blue-700 dark:text-blue-300 uppercase overflow-hidden">
                        {profileImageUrl ? (
                            <img
                                // Apply the same URL check here
                                src={profileImageUrl.startsWith('http') ? profileImageUrl : `${BASE_URL}${profileImageUrl}`}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            firstName?.[0] || <User />
                        )}
                    </div>
                </div>
            </div>

            {/* QR Code (Right) */}
            {qrCode && (
                <div className="absolute -bottom-12 right-8 z-10">
                    {qrCode}
                </div>
            )}
        </div>
    );
};

export default ProfileAvatarHeader;