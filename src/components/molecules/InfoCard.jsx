// src/components/molecules/InfoCard.jsx
import React from 'react';

const InfoCard = ({ icon: Icon, label, value }) => {
    return (
        <div className="group flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors duration-200">
            <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600">
                {/* We render the passed Lucide icon component here */}
                {Icon && <Icon size={20} />}
            </div>
            <div>
                <p className="text-xs text-gray-500 font-medium mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-gray-900">{value}</p>
            </div>
        </div>
    );
};

export default InfoCard;