import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
    const navigate = useNavigate();

    const handleGoHome = () => {
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div className="text-center">
                {/* 404 Number */}
                <h1 className="text-9xl font-bold text-blue-600 dark:text-blue-400">
                    404
                </h1>

                {/* Message */}
                <h2 className="mt-4 text-3xl font-semibold text-gray-900 dark:text-white">
                    Page Not Found
                </h2>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                    Sorry, the page you're looking for doesn't exist.
                </p>

                {/* Action Button */}
                <button
                    onClick={handleGoHome}
                    className="mt-8 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg
                        hover:bg-blue-700 dark:hover:bg-blue-500
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                        dark:focus:ring-offset-gray-900 transition-all duration-200 shadow-sm"
                >
                    Go to Dashboard
                </button>
            </div>
        </div>
    );
};

export default NotFoundPage;
