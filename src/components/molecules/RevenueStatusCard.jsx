import React from 'react';
import { Banknote, Loader2 } from 'lucide-react';

const formatRs = (amount) =>
    `Rs ${Number(amount ?? 0).toLocaleString('en-LK', { maximumFractionDigits: 0 })}`;

const Row = ({ label, value, valueClass = '' }) => (
    <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">{label}</span>
        <span className={`text-xs font-semibold text-gray-800 dark:text-gray-200 text-right ${valueClass}`}>
            {value}
        </span>
    </div>
);

const RevenueStatusCard = ({ summary, isLoading, availableBalance = 0 }) => {
    const gross = summary?.totalGrossRevenue ?? 0;
    const net = summary?.instituteNetRevenue ?? 0;
    const due = summary?.totalDue ?? 0;
    const commission = summary?.commissionPercentage ?? 0;
    const tutorShare = availableBalance;

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
                {/* Left — icon, identical to StatCard */}
                <div className="p-2.5 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 shrink-0 mt-0.5">
                    <Banknote size={20} />
                </div>

                {/* Right — 5 uniform rows */}
                {isLoading ? (
                    <div className="flex items-center justify-center flex-1 py-2">
                        <Loader2 className="animate-spin text-indigo-400" size={18} />
                    </div>
                ) : (
                    <div className="flex-1 space-y-1.5">
                        <Row label="Expected Revenue" value={formatRs(gross)} />
                        <Row label="Amount Due" value={formatRs(due)} valueClass="text-amber-600 dark:text-amber-400" />
                        <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                        <Row label="Commission Rate" value={`${commission}%`} />
                        <Row label="Tutor Share" value={formatRs(tutorShare)} />
                        <Row label="Net Revenue" value={formatRs(net)} valueClass="text-indigo-600 dark:text-indigo-400" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default RevenueStatusCard;
