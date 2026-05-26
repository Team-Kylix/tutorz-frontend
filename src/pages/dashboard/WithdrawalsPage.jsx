import React from 'react';
import { Wallet } from 'lucide-react';

const WithdrawalsPage = () => {
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-4 animate-in fade-in duration-300">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Wallet className="h-6 w-6 text-blue-500" />
                    Withdrawals
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Manage and request your withdrawals.
                </p>
            </div>

            {/* Clean empty card */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm text-center">
                <p className="text-gray-500 dark:text-gray-400">
                    Withdrawal features will be displayed here.
                </p>
            </div>
        </div>
    );
};

export default WithdrawalsPage;
