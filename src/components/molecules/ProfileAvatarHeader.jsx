import React from 'react';
import { User } from 'lucide-react';

const ProfileAvatarHeader = ({ firstName }) => {
    return (
        <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-800 relative">
            <div className="absolute -bottom-10 left-8">
                <div className="w-24 h-24 rounded-2xl bg-white p-1.5 shadow-lg rotate-3">
                    <div className="w-full h-full rounded-xl bg-blue-50 flex items-center justify-center text-3xl font-bold text-blue-700 uppercase">
                        {firstName?.[0] || <User />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileAvatarHeader;