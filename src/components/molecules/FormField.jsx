import React from 'react';
import Label from '../atoms/Label.jsx';
import Input from '../atoms/Input.jsx';
import ErrorMessage from '../atoms/ErrorMessage.jsx';

const FormField = ({ id, label, type = 'text', error, required, ...props }) => (
    <div>
        {/* Label handles its own dark mode, but we ensure the class passed is correct */}
        <Label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label} {required && <span className="text-red-500 dark:text-red-400">*</span>}
        </Label>
        
        <Input
            id={id}
            name={id}
            type={type}
            // Pass dark mode border colors here to match the logic
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow ${error ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
            {...props} 
        />
        
        <ErrorMessage message={typeof error === 'string' ? error : null} />
    </div>
);

export default FormField;