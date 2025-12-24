import React from 'react';
import { CreditCard, Building2 } from 'lucide-react';

const BankingCard = ({ bankName, accountNumber }) => {
    return (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden transition-transform hover:scale-[1.01] duration-300">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-5 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-blue-500 opacity-10 rounded-full blur-xl"></div>

            <div className="flex items-center justify-between mb-8">
                <CreditCard size={24} className="text-blue-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/10 px-2 py-1 rounded backdrop-blur-sm border border-white/5">
                    Banking Details
                </span>
            </div>

            <div className="space-y-5 relative z-10">
                <div>
                    <p className="text-xs text-gray-400 mb-1">Bank Name</p>
                    <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-gray-400" />
                        <p className="font-semibold text-lg tracking-wide">
                            {bankName || "N/A"}
                        </p>
                    </div>
                </div>
                <div>
                    <p className="text-xs text-gray-400 mb-1">Account Number</p>
                    <p className="font-mono text-xl tracking-widest text-blue-50">
                        {accountNumber || "•••• •••• ••••"}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BankingCard;