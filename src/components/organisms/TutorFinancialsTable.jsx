import React, { useState } from 'react';
import { FileText, Download, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { cleanClassName } from '../../utils/helpers';
import RowActions from '../molecules/RowActions';
import { downloadTutorPaymentPdf } from '../../services/api/paymentService';

/**
 * Renders the tutor's payment history table.
 * Mirrors the structure of StudentFinancialsTable but shows
 * Student Info + Class Info in the primary column.
 *
 * Props:
 *   payments — array of ClassPaymentHistoryDto from /api/tutor/payments/history
 */
const TutorFinancialsTable = ({ payments = [] }) => {
    const [downloadingId, setDownloadingId] = useState(null);

    const handleDownload = async (payment) => {
        if (downloadingId) return;
        setDownloadingId(payment.paymentId);
        try {
            const classLabel = cleanClassName(payment.className) || payment.subject || 'Class';
            const ref = `${classLabel}_${payment.monthYear}`.replace(/\s+/g, '_');
            await downloadTutorPaymentPdf(payment.paymentId, ref);
        } finally {
            setDownloadingId(null);
        }
    };

    const getStatusBadge = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'paid') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-100 dark:border-green-800">
                    <CheckCircle size={11} /> Paid
                </span>
            );
        }
        if (s === 'pending') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                    <AlertCircle size={11} /> Pending
                </span>
            );
        }
        if (s === 'failed') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-100 dark:border-red-800">
                    <Clock size={11} /> Failed
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                {status}
            </span>
        );
    };

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
                <table className="w-full text-xs md:text-sm text-left whitespace-nowrap">
                    <thead className="text-[10px] md:text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800/50 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 shadow-sm">
                        <tr>
                            {/* Primary: Student + Class info */}
                            <th scope="col" className="pl-3 pr-1 py-3 md:pl-6 md:pr-2 md:py-4 font-medium">
                                Student &amp; Class Info
                            </th>
                            <th scope="col" className="pl-1 pr-4 py-3 md:pl-2 md:pr-6 md:py-4 font-medium text-left">
                                Status
                            </th>
                            <th scope="col" className="px-4 py-3 md:py-4 font-medium">
                                Paid For
                            </th>
                            <th scope="col" className="px-4 py-3 md:py-4 font-medium text-right">
                                Class Fee
                            </th>
                            <th scope="col" className="px-4 py-3 md:py-4 font-medium text-right">
                                Paid Amount
                            </th>
                            <th scope="col" className="px-4 py-3 md:py-4 font-medium">
                                Paid Date
                            </th>
                            <th scope="col" className="px-4 py-3 md:py-4 font-medium">
                                Note
                            </th>
                            {/* Actions column — sticky right */}
                            <th scope="col" className="px-1 py-3 md:py-4 font-medium sticky right-0 z-20 bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {payments.map((payment, idx) => {
                            const isPaid = (payment.status || '').toLowerCase() === 'paid';
                            const hasPaidAt = payment.paidAt && isPaid;

                            let dateObj = null;
                            if (hasPaidAt) {
                                let dateStr = payment.paidAt;
                                if (typeof dateStr === 'string' && !dateStr.endsWith('Z')) {
                                    dateStr += 'Z';
                                }
                                dateObj = new Date(dateStr);
                            }
                            const formattedDate = dateObj
                                ? dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                                : '–';
                            const formattedTime = dateObj
                                ? dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                                : '';

                            // Build RowActions: only "Download PDF" for paid records with a real paymentId
                            const actions = [];
                            if (isPaid && payment.paymentId && payment.paymentId !== '00000000-0000-0000-0000-000000000000') {
                                actions.push({
                                    label: downloadingId === payment.paymentId ? 'Downloading…' : 'Download PDF',
                                    icon: Download,
                                    disabled: downloadingId === payment.paymentId,
                                    onClick: () => handleDownload(payment),
                                });
                            }

                            return (
                                <tr
                                    key={`${payment.paymentId}-${idx}`}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    {/* Student + Class Info */}
                                    <td className="pl-3 pr-1 py-3 md:pl-6 md:pr-2 md:py-4">
                                        <div className="flex flex-col">
                                            {/* Student name — primary line */}
                                            <span className="font-semibold text-sm md:text-base text-gray-900 dark:text-white truncate max-w-[180px] md:max-w-none block">
                                                {payment.studentName || '—'}
                                            </span>
                                            {/* Reg + mobile — secondary line */}
                                            <div className="flex items-center text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mt-0.5 gap-1 md:gap-2">
                                                <span className="truncate max-w-[80px] md:max-w-none">{payment.registrationNumber || 'N/A'}</span>
                                                <span>•</span>
                                                <span className="truncate max-w-[90px] md:max-w-none">{payment.mobileNumber || 'N/A'}</span>
                                            </div>
                                            {/* Class name — tertiary line */}
                                            {(payment.className || payment.subject) && (
                                                <div className="flex items-center text-[10px] md:text-xs text-indigo-500 dark:text-indigo-400 mt-0.5 gap-1">
                                                    <span className="truncate max-w-[160px] md:max-w-none">
                                                        {cleanClassName(payment.className)}
                                                        {payment.subject && payment.subject !== payment.className
                                                            ? ` · ${payment.subject}`
                                                            : ''}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    {/* Status */}
                                    <td className="pl-1 pr-4 py-3 md:pl-2 md:pr-6 md:py-4 text-left">
                                        {getStatusBadge(payment.status)}
                                    </td>

                                    {/* Paid For – month badge */}
                                    <td className="px-4 py-3 md:py-4">
                                        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                                            {payment.monthYear}
                                        </div>
                                    </td>

                                    {/* Class Fee (BaseFee) */}
                                    <td className="px-4 py-3 md:py-4 text-right">
                                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                                            Rs {Number(payment.classFee || 0).toLocaleString()}
                                        </span>
                                    </td>

                                    {/* Paid Amount */}
                                    <td className="px-4 py-3 md:py-4 text-right">
                                        <span className="font-bold text-gray-900 dark:text-white">
                                            Rs {Number(payment.amountPaid || 0).toLocaleString()}
                                        </span>
                                    </td>

                                    {/* Paid Date */}
                                    <td className="px-4 py-3 md:py-4">
                                        {hasPaidAt ? (
                                            <div className="flex flex-col">
                                                <span className="text-sm text-gray-800 dark:text-gray-200">{formattedDate}</span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{formattedTime}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 dark:text-gray-500 text-xs italic">–</span>
                                        )}
                                    </td>

                                    {/* Note */}
                                    <td className="px-4 py-3 md:py-4">
                                        {payment.note ? (
                                            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 max-w-[200px]" title={payment.note}>
                                                <FileText size={14} className="text-gray-400 shrink-0" />
                                                <span className="truncate text-xs">{payment.note}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 dark:text-gray-500 text-xs italic">–</span>
                                        )}
                                    </td>

                                    {/* RowActions – sticky right */}
                                    <td className="px-1 py-3 md:py-4 sticky right-0 z-10 bg-white dark:bg-gray-800 transition-colors">
                                        <RowActions actions={actions} />
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

export default TutorFinancialsTable;
