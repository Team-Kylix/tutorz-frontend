import React from 'react';

const InfoCard = ({ icon: Icon, label, value }) => {
    return (
        <div className="group flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200">
            <div className="p-2 bg-white dark:bg-gray-900 rounded-lg shadow-sm text-blue-600 dark:text-blue-400">
                {/* We render the passed Lucide icon component here */}
                {Icon && <Icon size={20} />}
            </div>
            <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{value}</p>
            </div>
        </div>
    );
};

export default InfoCard;