import React from 'react';
import { Loader2 } from 'lucide-react';

export const DetailRow = ({ label, value, valueClass = '' }) => (
    <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">{label}</span>
        <span className={`text-xs font-semibold text-gray-800 dark:text-gray-200 text-right ${valueClass}`}>
            {value}
        </span>
    </div>
);

const DetailStatusCard = ({ icon: Icon, color, rows, isLoading }) => {
    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow h-full">
            <div className="flex items-start gap-3 h-full">
                <div className={`p-2.5 rounded-lg shrink-0 mt-0.5 ${color}`}>
                    <Icon size={20} />
                </div>
                
                {isLoading ? (
                    <div className="flex items-center justify-center flex-1 py-2 h-full">
                        <Loader2 className="animate-spin text-indigo-400" size={18} />
                    </div>
                ) : (
                    <div className="flex-1 space-y-1.5 flex flex-col justify-center h-full">
                        {rows.map((r, i) => r.isDivider ? (
                            <div key={`div-${i}`} className="border-t border-gray-100 dark:border-gray-700 my-1" />
                        ) : (
                            <DetailRow key={`row-${i}`} label={r.label} value={r.value} valueClass={r.valueClass} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DetailStatusCard;
