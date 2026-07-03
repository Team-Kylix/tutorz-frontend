import React from 'react';
import Logo from '../atoms/Logo';
import { Link } from 'react-router-dom';
import { Info, FileText, Shield, RefreshCw } from 'lucide-react';

const AuthLayout = ({ children }) => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center p-2 transition-colors">
        <div className="w-full max-w-md">
            <Logo />
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg transition-colors border border-transparent dark:border-gray-700">
                {children}

                <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        <Link to="/about" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                            <Info size={11} />
                            <span>About Us</span>
                        </Link>
                        <span className="text-gray-300 dark:text-gray-600 text-xs">|</span>
                        <Link to="/terms" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                            <FileText size={11} />
                            <span>Terms</span>
                        </Link>
                        <span className="text-gray-300 dark:text-gray-600 text-xs">|</span>
                        <Link to="/privacy" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                            <Shield size={11} />
                            <span>Privacy</span>
                        </Link>
                        <span className="text-gray-300 dark:text-gray-600 text-xs">|</span>
                        <Link to="/refund" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                            <RefreshCw size={11} />
                            <span>Refund Policy</span>
                        </Link>
                    </div>
                    <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3">
                        &copy; {new Date().getFullYear()} Tutorz &mdash; Kylix Technology
                    </p>
                </div>
            </div>
        </div>
    </div>
);

export default AuthLayout;