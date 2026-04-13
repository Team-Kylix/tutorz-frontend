import React from 'react';
import Label from '../atoms/Label';

const SelectField = ({ id, label, value, onChange, groups, placeholder, required = false, error, className = '' }) => {
    const isPlaceholder = value === "" || value === undefined || value === null;
    
    return (
        <div className={`w-full ${className}`}>
            {label && (
                <Label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {label} {required && <span className="text-red-500 dark:text-red-400">*</span>}
                </Label>
            )}
            <div className="relative">
                <select
                    id={id}
                    value={value || ""}
                    onChange={onChange}
                    required={required}
                    className={`appearance-none w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-800
                        text-sm font-medium transition-all duration-200 ease-in-out
                        focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-200 dark:focus:ring-blue-900 focus:border-blue-500 dark:focus:border-blue-500
                        ${error ? 'border-red-300 dark:border-red-500 focus:ring-red-200 dark:focus:ring-red-900 focus:border-red-500' : 'border-gray-300 dark:border-gray-700'}
                        ${isPlaceholder ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}
                    `}
                >
                    {placeholder && <option value="" disabled>{placeholder}</option>}
                    {groups.map((group, index) => (
                        <optgroup key={index} label={group.label} className="font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">
                            {group.options.map((opt) => (
                                <option key={opt} value={opt} className="text-gray-900 dark:text-white font-normal bg-white dark:bg-gray-800">{opt}</option>
                            ))}
                        </optgroup>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500 dark:text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
            {error && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{error}</p>}
        </div>
    );
};

export default SelectField;
