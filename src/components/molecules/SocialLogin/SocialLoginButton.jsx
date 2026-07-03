import React from 'react';
import Icon from '../../atoms/Icon';

// Update arguments to accept onClick and props
const SocialLoginButton = ({ provider, children, onClick, ...props }) => {
    const providerStyles = {
        google: 'border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700',
        apple: 'border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700',
    };

    return (
        <button 
            // Add onClick and spread other props
            onClick={onClick}
            {...props}
            className={`
                w-full flex items-center justify-center gap-3 py-3 px-4 border rounded-lg transition-colors duration-200 cursor-pointer 
                bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200
                ${providerStyles[provider]}
            `.trim()}
        >
            <Icon provider={provider} className="w-6 h-6" />
            <span className="font-medium text-sm">{children}</span>
        </button>
    );
};

export default SocialLoginButton;