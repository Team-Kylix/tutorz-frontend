import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Logo from '../atoms/Logo';
import Footer from '../organisms/Footer';

/**
 * Shared layout wrapper for public-facing policy pages (/terms, /privacy, /refund, /about).
 * Provides: header with logo + back button, main content area, and footer with policy links.
 */
const PublicPageLayout = ({ children }) => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Logo size="small" />
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                        <ArrowLeft size={16} />
                        <span>Go Back</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-10">
                {children}
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default PublicPageLayout;
