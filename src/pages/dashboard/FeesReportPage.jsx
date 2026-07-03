import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, FileBarChart2, Download } from 'lucide-react';
import Select from '../../components/atoms/Select';
import RowActions from '../../components/molecules/RowActions';
import ConfirmationModal from '../../components/molecules/ConfirmationModal';
import {
    getTutorMonthlyFees,
    downloadTutorMonthlyFeesPdf
} from '../../services/api/withdrawalService';
import { getJoinedInstitutes } from '../../services/api/tutorService';

const formatCurrency = (val) =>
    val != null ? `Rs ${Number(val).toLocaleString('en-LK', { minimumFractionDigits: 2 })}` : '—';

const FeesReportPage = () => {
    // ─── Dropdown Data ────────────────────────────────────────────
    const [institutes, setInstitutes] = useState([]);
    const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true);

    // ─── Selection ────────────────────────────────────────────────
    const [selectedInstituteId, setSelectedInstituteId] = useState('');

    // ─── Overview Data ────────────────────────────────────────────
    const [feesRows, setFeesRows] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [error, setError] = useState(null);

    // ─── Download tracking ────────────────────────────────────────
    const [downloadingId, setDownloadingId] = useState(null);
    const [downloadConfirmRow, setDownloadConfirmRow] = useState(null);

    // ─── Fetch Dropdown Data on mount ────────────────────────────
    useEffect(() => {
        const load = async () => {
            setIsLoadingDropdowns(true);
            try {
                const instRes = await getJoinedInstitutes();
                const instData = instRes?.data ?? instRes;
                setInstitutes(Array.isArray(instData) ? instData : (instData?.data ?? []));
            } catch (err) {
                console.error('Failed to load dropdown data:', err);
            } finally {
                setIsLoadingDropdowns(false);
            }
        };
        load();
    }, []);

    // ─── Fetch Overview Data ──────────────────────────────────────
    const fetchData = useCallback(async () => {
        setIsLoadingData(true);
        setError(null);
        try {
            const overviewRes = await getTutorMonthlyFees(
                selectedInstituteId || null
            );
            setFeesRows(overviewRes?.data ?? []);
        } catch (err) {
            console.error('Failed to fetch fees report:', err);
            setError('Failed to load fees data. Please try again.');
            setFeesRows([]);
        } finally {
            setIsLoadingData(false);
        }
    }, [selectedInstituteId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ─── Download Handler ─────────────────────────────────────────
    const handleDownloadConfirm = async () => {
        if (!downloadConfirmRow) return;
        setDownloadingId(downloadConfirmRow.period);
        try {
            await downloadTutorMonthlyFeesPdf(
                downloadConfirmRow.year,
                downloadConfirmRow.month,
                selectedInstituteId || null
            );
        } finally {
            setDownloadingId(null);
            setDownloadConfirmRow(null);
        }
    };

    // ─── Render ───────────────────────────────────────────────────
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-2">

            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileBarChart2 className="h-6 w-6 text-indigo-500" />
                    Fees Report
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    View your monthly class-wise earnings, online commission deductions, and net payouts.
                </p>
            </div>


            {/* Filter Controls */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-4 items-end">

                {/* Select Institute */}
                <div className="w-full md:w-1/3 flex flex-col items-start gap-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Select Institute
                    </label>
                    <Select
                        value={selectedInstituteId}
                        onChange={e => setSelectedInstituteId(e.target.value)}
                        disabled={isLoadingDropdowns}
                    >
                        <option value="">-- All Institutes --</option>
                        {institutes.map(inst => {
                            const iId = inst.instituteId ?? inst.id;
                            return (
                                <option key={iId} value={iId}>
                                    {inst.name ?? inst.instituteName ?? `Institute ${String(iId).substring(0, 4)}`}
                                </option>
                            );
                        })}
                    </Select>
                </div>

                {/* Info */}
                <div className="w-full md:flex-1 flex items-end pb-0.5">
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                        Showing earnings per institute.
                    </p>
                </div>
            </div>

            {/* Content Area */}
            <div className="mt-4">
                {isLoadingData ? (
                    <div className="flex justify-center items-center p-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        <span className="ml-3 text-gray-500 dark:text-gray-400">Loading withdrawal data…</span>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
                        <p>{error}</p>
                    </div>
                ) : (
                    <FeesReportTable
                        rows={feesRows}
                        downloadingId={downloadingId}
                        onDownload={(row) => setDownloadConfirmRow(row)}
                        selectedInstituteId={selectedInstituteId}
                    />
                )}
            </div>



            {/* Download Confirm Modal */}
            <ConfirmationModal
                isOpen={!!downloadConfirmRow}
                onClose={() => setDownloadConfirmRow(null)}
                onConfirm={handleDownloadConfirm}
                title={downloadConfirmRow?.lastWithdrawalId && selectedInstituteId ? "Download Receipt PDF" : "Download Earnings Report"}
                message={downloadConfirmRow?.lastWithdrawalId && selectedInstituteId 
                    ? `Download the receipt PDF for withdrawal ${downloadConfirmRow.referenceId ?? ''}?`
                    : "Download a PDF report of your current pending earnings?"}
                confirmLabel="Download"
                variant="primary"
            />
        </div>
    );
};

// ─── Sub-Component: Fees Report Table ────────────────────────────────
const FeesReportTable = ({ rows, downloadingId, onDownload, selectedInstituteId }) => {
    if (!rows || rows.length === 0) {
        return (
            <div className="w-full text-center py-14 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <FileBarChart2 className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No records found. Make sure students have paid their fees for classes.
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
                            <th scope="col" className="px-4 py-3 md:py-4 font-medium">Period</th>
                            <th scope="col" className="px-4 py-3 md:py-4 font-medium">Institute</th>
                            <th scope="col" className="px-4 py-3 md:py-4 font-medium text-right">Gross Collected</th>
                            <th scope="col" className="px-4 py-3 md:py-4 font-medium text-right">Commission Deducted</th>
                            <th scope="col" className="px-4 py-3 md:py-4 font-medium text-right">Net Earnings</th>
                            {/* Sticky actions column */}
                            <th scope="col" className="px-1 py-3 md:py-4 font-medium sticky right-0 z-20 bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {rows.map((row, idx) => {
                            const isDownloading = downloadingId === row.period;

                            const actions = [
                                {
                                    label: isDownloading ? 'Downloading…' : 'Download PDF',
                                    icon: isDownloading ? Loader2 : Download,
                                    disabled: isDownloading,
                                    onClick: () => onDownload && onDownload(row),
                                }
                            ];

                            return (
                                <tr
                                    key={`${row.period}-${row.instituteId}-${idx}`}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    {/* Period */}
                                    <td className="px-4 py-3 md:py-4">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 tracking-wider">
                                            {row.period}
                                        </span>
                                    </td>

                                    {/* Institute */}
                                    <td className="px-4 py-3 md:py-4">
                                        <span className="text-gray-600 dark:text-gray-400 text-xs">
                                            {row.instituteName}
                                        </span>
                                    </td>

                                    {/* Gross Collected */}
                                    <td className="px-4 py-3 md:py-4 text-right text-gray-700 dark:text-gray-300">
                                        {formatCurrency(row.grossCollected)}
                                    </td>

                                    {/* Commission Deducted */}
                                    <td className="px-4 py-3 md:py-4 text-right text-red-600 dark:text-red-400">
                                        {formatCurrency(row.commissionDeducted)}
                                    </td>

                                    {/* Net Earnings */}
                                    <td className="px-4 py-3 md:py-4 text-right font-semibold text-green-700 dark:text-green-400">
                                        {formatCurrency(row.netEarnings)}
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

export default FeesReportPage;
