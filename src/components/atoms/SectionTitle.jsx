import React from 'react';

const SectionTitle = ({ title }) => {
    return (
        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
            {title}
        </h3>
    );
};

export default SectionTitle;