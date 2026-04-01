import React from 'react';
import Logo from '../atoms/Logo';
import { Link } from 'react-router-dom';
import { Info } from 'lucide-react';

const AuthLayout = ({ children }) => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center p-2 transition-colors">
        <div className="w-full max-w-md">
            <Logo />
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg transition-colors border border-transparent dark:border-gray-700">
                {children}

                <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-700 text-center">
                    <Link to="/about" className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                        <Info size={14} />
                        <span>About Us & Policies</span>
                    </Link>
                </div>
            </div>
            

        </div>
    </div>
);

export default AuthLayout;