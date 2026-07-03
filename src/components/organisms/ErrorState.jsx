import React from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import Button from '../atoms/Button'; 

const ErrorState = ({ message, onRetry }) => {
    return (
        <div className="w-full h-96 flex flex-col items-center justify-center text-center px-4">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full mb-4 transition-colors">
                <AlertCircle size={40} className="text-red-500 dark:text-red-400" />
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Something went wrong
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                {message || "An unexpected error occurred."}
            </p>
            
            {onRetry && (
                <Button onClick={onRetry} variant="primary" size="medium">
                    <RefreshCcw size={16} className="mr-2" /> 
                    Retry
                </Button>
            )}
        </div>
    );
};

export default ErrorState;