import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AboutUsContent from '../../components/organisms/AboutUsContent';
import Logo from '../../components/atoms/Logo';

const AboutPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col pt-6 px-4 pb-12">
            {/* Header */}
            <div className="max-w-6xl w-full mx-auto mb-8 flex items-center justify-between">
                <Logo size="large" />
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                    <ArrowLeft size={18} />
                    <span>Go Back</span>
                </button>
            </div>

            {/* Content Area */}
            <div className="max-w-6xl w-full mx-auto flex-1">
                <AboutUsContent />
            </div>
        </div>
    );
};

export default AboutPage;
