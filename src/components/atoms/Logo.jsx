import React from 'react';
import logoIcon from '../../assets/Images/learning-school-svgrepo-com.svg';

const Logo = ({ size = 'large', collapsed = false, className = '' }) => {
    
    // Sidebar Variant (Small, Flex Row)
    if (size === 'small') {
        return (
            <div className={`flex items-center gap-2 font-bold text-xl text-blue-700 dark:text-blue-400 tracking-wide transition-all duration-300 ${className}`}>
                <img 
                    src={logoIcon} 
                    alt="Tutorz" 
                    className="h-8 w-8" 
                />
                {/* Only render text if NOT collapsed */}
                {!collapsed && (
                    <span className="whitespace-nowrap animate-in fade-in duration-200">
                        Tutorz
                    </span>
                )}
            </div>
        );
    }

    // Auth Page Variant (Large, Centered, Subtitle)
    return (
        <div className={`text-center mb-4 ${className}`}>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white tracking-wider flex justify-center items-center">
                <img 
                    src={logoIcon} 
                    alt="Tutorz logo" 
                    className="h-9 w-9 mr-2" 
                />
                Tutorz
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Your Learning Partner</p>
        </div>
    );
};

export default Logo;