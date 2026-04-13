import React from 'react';
import { FileText } from 'lucide-react';

const StudentFinancialsTable = ({ payments = [] }) => {
    if (!payments || payments.length === 0) {
        return (
            <div className="w-full text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">No payment records found for this selection.</p>
            </div>
        );
    }

    return (
        <div className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto relative">
                <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800/50 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 shadow-sm">
                        <tr>
                            <th scope="col" className="px-3 py-3 md:px-6 md:py-4 font-medium sticky left-0 z-20 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-w-[200px] shadow-[1px_0_0_0_rgba(229,231,235,1)] dark:shadow-[1px_0_0_0_rgba(55,65,81,1)]">
                                Class & Tutor Info
                            </th>
                            <th scope="col" className="px-4 py-3 md:py-4 font-medium">
                                Paid For
                            </th>
                            <th scope="col" className="px-4 py-3 md:py-4 font-medium text-right">
                                Amount Paid
                            </th>
                            <th scope="col" className="px-4 py-3 md:py-4 font-medium">
                                Paid Date
                            </th>
                            <th scope="col" className="px-4 py-3 md:py-4 font-medium text-center">
                                Status
                            </th>
                            <th scope="col" className="px-4 py-3 md:py-4 font-medium">
                                Note
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {payments.map((payment) => {
                            const dateObj = new Date(payment.paidAt);
                            const formattedDate = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                            const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                            return (
                                <tr key={payment.paymentId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    {/* Sticky Class Info Column */}
                                    <td className="px-3 py-3 md:px-6 md:py-4 sticky left-0 z-10 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-[1px_0_0_0_rgba(229,231,235,1)] dark:shadow-[1px_0_0_0_rgba(55,65,81,1)]">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-sm md:text-base text-gray-900 dark:text-white truncate max-w-[200px] md:max-w-none block">
                                                {payment.className}
                                            </span>
                                            <div className="flex items-center text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mt-1 space-x-1 md:space-x-2">
                                                <span className="truncate max-w-[100px]">{payment.subject || 'N/A'}</span>
                                                <span>•</span>
                                                <span className="truncate max-w-[100px]">By {payment.tutorName || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Month/Year */}
                                    <td className="px-4 py-3 md:py-4">
                                        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                                            {payment.monthYear}
                                        </div>
                                    </td>

                                    {/* Amount Paid */}
                                    <td className="px-4 py-3 md:py-4 text-right">
                                        <span className="font-bold text-gray-900 dark:text-white">
                                            Rs {payment.amountPaid.toLocaleString()}
                                        </span>
                                    </td>

                                    {/* Paid Date */}
                                    <td className="px-4 py-3 md:py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-gray-800 dark:text-gray-200">{formattedDate}</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{formattedTime}</span>
                                        </div>
                                    </td>

                                    {/* Status Indicator */}
                                    <td className="px-4 py-3 md:py-4 text-center">
                                        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-100 dark:border-green-800">
                                            {payment.status}
                                        </div>
                                    </td>

                                    {/* Note */}
                                    <td className="px-4 py-3 md:py-4">
                                        {payment.note ? (
                                            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 max-w-[200px]" title={payment.note}>
                                                <FileText size={14} className="text-gray-400 shrink-0" />
                                                <span className="truncate text-xs">{payment.note}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 dark:text-gray-500 text-xs italic">-</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StudentFinancialsTable;
