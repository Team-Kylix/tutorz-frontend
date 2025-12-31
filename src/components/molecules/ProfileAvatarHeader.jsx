import React from 'react';
import { User } from 'lucide-react';

const ProfileAvatarHeader = ({ firstName }) => {
    return (
        // Gradient adjusted slightly for dark mode
        <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-900 relative">
            <div className="absolute -bottom-10 left-8">
                {/* Outer Box: White -> Dark Gray */}
                <div className="w-24 h-24 rounded-2xl bg-white dark:bg-gray-800 p-1.5 shadow-lg rotate-3 transition-colors">
                    {/* Inner Box: Blue-50 -> Blue-900/50 */}
                    <div className="w-full h-full rounded-xl bg-blue-50 dark:bg-blue-900 flex items-center justify-center text-3xl font-bold text-blue-700 dark:text-blue-300 uppercase">
                        {firstName?.[0] || <User />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileAvatarHeader;