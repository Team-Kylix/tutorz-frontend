import React from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import Button from '../atoms/Button'; // 👈 Import your new Atom

const ErrorState = ({ message, onRetry }) => {
    return (
        <div className="w-full h-96 flex flex-col items-center justify-center text-center px-4">
            <div className="bg-red-50 p-4 rounded-full mb-4">
                <AlertCircle size={40} className="text-red-500" />
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Something went wrong
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm">
                {message || "An unexpected error occurred."}
            </p>
            
            {onRetry && (
                // 👇 Now using the Button Atom
                <Button onClick={onRetry} variant="primary" size="medium">
                    <RefreshCcw size={16} className="mr-2" /> 
                    Retry
                </Button>
            )}
        </div>
    );
};

export default ErrorState;