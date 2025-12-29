import React from 'react';

const Select = ({ children, className = '', ...props }) => {
    return (
        <select 
            className={`
                w-full px-3 py-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
                bg-white dark:bg-gray-800 
                border-gray-300 dark:border-gray-700 
                text-gray-900 dark:text-white 
                ${className}
            `.trim()}
            {...props}
        >
            {children}
        </select>
    );
};

export default Select;