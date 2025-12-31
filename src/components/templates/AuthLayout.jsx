import React from 'react';
import Logo from '../atoms/Logo'; 

const AuthLayout = ({ children }) => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center p-2 transition-colors">
        <div className="w-full max-w-md">
            <Logo />
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg transition-colors border border-transparent dark:border-gray-700">
                {children}
            </div>
        </div>
    </div>
);

export default AuthLayout;