import React from 'react';
import logoIcon from '../../assets/Images/learning-school-svgrepo-com.svg';

const Logo = () => (
    <div className="text-center mb-4">
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

export default Logo;