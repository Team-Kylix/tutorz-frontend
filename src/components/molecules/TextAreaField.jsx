import React from 'react';
import Label from '../atoms/Label.jsx';
import TextArea from '../atoms/TextArea.jsx';
import ErrorMessage from '../atoms/ErrorMessage.jsx';

const TextAreaField = ({ id, label, error, ...props }) => (
    <div>
        <Label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
        </Label>
        
        <TextArea
            id={id}
            name={id}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow resize-none ${error ? 'border-red-500' : 'border-gray-300'}`}
            {...props} 
        />
        
        <ErrorMessage message={typeof error === 'string' ? error : null} />
    </div>
);

export default TextAreaField;