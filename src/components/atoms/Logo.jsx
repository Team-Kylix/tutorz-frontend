import React from 'react';
import iconImg from '../../assets/Images/Icon.png';
import fullLogoImg from '../../assets/Images/Full Logo.png';
import logoIcon from '../../assets/Images/Icon.png';

const Logo = ({ size = 'large', collapsed = false, className = '' }) => {

    // Sidebar Variant (Small, Flex Row)
    if (size === 'small') {
        return (
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} transition-all duration-300 ${className}`}>
                <img
                    src={iconImg}
                    alt="Tutorz"
                    className={`rounded-full object-cover bg-white shrink-0 transition-all duration-300 ${collapsed ? 'h-10 w-10' : 'h-11 w-11'}`}
                />
                {!collapsed && (
                    <div className="flex flex-col justify-center animate-in fade-in duration-200 overflow-hidden whitespace-nowrap">
                        <span className="font-bold text-xl text-gray-800 dark:text-white tracking-wide leading-tight">
                            Tutorz
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight hidden sm:block">
                            Tuition Management Platform
                        </span>
                    </div>
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
                    className="rounded-full object-cover bg-white h-11 w-11 mr-1"
                />
                Tutorz
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">Tuition Management Platform</p>
        </div>
    );
};

export default Logo;