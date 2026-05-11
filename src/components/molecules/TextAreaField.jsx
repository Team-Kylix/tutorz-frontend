import React from 'react';
import Label from '../atoms/Label.jsx';
import TextArea from '../atoms/TextArea.jsx';
import ErrorMessage from '../atoms/ErrorMessage.jsx';

const TextAreaField = ({ id, label, error, required, ...props }) => (
    <div>
        <Label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label} {required && <span className="text-red-500 dark:text-red-400">*</span>}
        </Label>
        
        <TextArea
            id={id}
            name={id}
            required={required}
            className={`
                w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow resize-none
                bg-white dark:bg-gray-800
                text-gray-900 dark:text-white
                ${error ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-700'}
            `.trim()}
            {...props} 
        />
        
        <ErrorMessage message={typeof error === 'string' ? error : null} />
    </div>
);

export default TextAreaField;