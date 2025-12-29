import React, { useState } from 'react';
import Icon from '../atoms/Icon.jsx';
import Label from '../atoms/Label.jsx'; 
import Input from '../atoms/Input.jsx'; 
import ErrorMessage from '../atoms/ErrorMessage.jsx';

const PasswordInput = ({ id, label, error, ...props }) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div>
            {/* Added dark:text-gray-300 to Label */}
            <Label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {label}
            </Label>
            <div className="relative">
                <Input
                    id={id}
                    name={id}
                    type={showPassword ? 'text' : 'password'}
                    // Updated border logic for dark mode
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow ${error ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
                    {...props}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    // Updated text colors for the eye icon button
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                    <Icon provider={showPassword ? 'eye-off' : 'eye'} className="w-5 h-5" />
                </button>
            </div>
            {/* We now pass the error message string directly to the atom */}
            <ErrorMessage message={typeof error === 'string' ? error : null} />
        </div>
    );
};

export default PasswordInput;