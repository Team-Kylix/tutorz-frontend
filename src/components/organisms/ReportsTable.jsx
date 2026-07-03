import React from 'react';
import { Download, Loader2 } from 'lucide-react';
import RowActions from '../molecules/RowActions';

/**
 * Renders the monthly report grid for the tutor Reports page.
 *
 * Props:
 *   rows         — array of TutorMonthReportRowDto from GET /api/report/monthly
 *   onDownload   — (row) => void — called when user clicks Download PDF
 *   downloadingRef — string|null — reference of the row currently being downloaded
 */
const ReportsTable = ({ rows = [], onDownload, downloadingRef = null }) => {
    if (!rows || rows.length === 0) {
        return (
            <div className="w-full text-center py-14 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No report records found for this selection.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto relative">
                <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800/50 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th scope="col" className="px-4 py-3 md:py-4 font-medium">
                                Reference
                            </th>
                            <th scope="col" className="px-4 py-3 md:py-4 font-medium">
                                Details Period
                            </th>
                            <th scope="col" className="px-4 py-3 md:py-4 font-medium">
                                Month
                            </th>
                            <th scope="col" className="px-4 py-3 md:py-4 font-medium text-center">
                                Students
                            </th>
                            <th scope="col" className="px-4 py-3 md:py-4 font-medium text-center">
                                Paid
                            </th>
                            <th scope="col" className="px-4 py-3 md:py-4 font-medium text-center">
                                Not Yet
                            </th>
                            {/* Sticky actions column */}
                            <th scope="col" className="px-1 py-3 md:py-4 font-medium sticky right-0 z-20 bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {rows.map((row, idx) => {
                            const isDownloading = downloadingRef === row.reference;

                            const actions = [
                                {
                                    label: isDownloading ? 'Downloading…' : 'Download PDF',
                                    icon: isDownloading ? Loader2 : Download,
                                    disabled: isDownloading,
                                    onClick: () => onDownload && onDownload(row),
                                },
                            ];

                            return (
                                <tr
                                    key={`${row.reference}-${idx}`}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    {/* Reference */}
                                    <td className="px-4 py-3 md:py-4">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 tracking-wider">
                                            {row.reference}
                                        </span>
                                    </td>

                                    {/* Details Period */}
                                    <td className="px-4 py-3 md:py-4">
                                        <span className="text-gray-600 dark:text-gray-400 text-xs">
                                            {row.detailsPeriod}
                                        </span>
                                    </td>

                                    {/* Month badge */}
                                    <td className="px-4 py-3 md:py-4">
                                        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                                            {row.monthYear}
                                        </div>
                                    </td>

                                    {/* Total Students */}
                                    <td className="px-4 py-3 md:py-4 text-center">
                                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                                            {row.totalStudents}
                                        </span>
                                    </td>

                                    {/* Paid count */}
                                    <td className="px-4 py-3 md:py-4 text-center">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-100 dark:border-green-800">
                                            {row.paidCount}
                                        </span>
                                    </td>

                                    {/* Unpaid count */}
                                    <td className="px-4 py-3 md:py-4 text-center">
                                        {row.unpaidCount > 0 ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-100 dark:border-amber-800">
                                                {row.unpaidCount}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 dark:text-gray-500 text-xs italic">—</span>
                                        )}
                                    </td>

                                    {/* Row Actions — sticky right */}
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

export default ReportsTable;