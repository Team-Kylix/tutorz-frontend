import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2, Wallet, Download, BellRing, FileBarChart2 } from 'lucide-react';
import Select from '../../components/atoms/Select';
import RowActions from '../../components/molecules/RowActions';
import ConfirmationModal from '../../components/molecules/ConfirmationModal';
import {
    getTutorWithdrawalOverview,
    getAvailableBalance,
    requestWithdrawalNotification,
    downloadWithdrawalPdf,
    downloadOverviewPdf
} from '../../services/api/withdrawalService';
import { getJoinedInstitutes } from '../../services/api/tutorService';

const formatCurrency = (val) =>
    val != null ? `Rs ${Number(val).toLocaleString('en-LK', { minimumFractionDigits: 2 })}` : '—';

const WithdrawalsPage = () => {
    // ─── Dropdown Data ────────────────────────────────────────────
    const [institutes, setInstitutes] = useState([]);
    const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true);

    // ─── Selection ────────────────────────────────────────────────
    const [selectedInstituteId, setSelectedInstituteId] = useState('');

    // ─── Overview Data ────────────────────────────────────────────
    const [overviewRows, setOverviewRows] = useState([]);
    const [availableBalance, setAvailableBalance] = useState(null);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [error, setError] = useState(null);

    // ─── Download tracking ────────────────────────────────────────
    const [downloadingId, setDownloadingId] = useState(null);
    const [downloadConfirmRow, setDownloadConfirmRow] = useState(null);

    // ─── Request Withdrawal Modal ─────────────────────────────────
    const [requestModalOpen, setRequestModalOpen] = useState(false);
    const [requestAmount, setRequestAmount] = useState('');
    const [isRequesting, setIsRequesting] = useState(false);

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
            const overviewRes = await getTutorWithdrawalOverview(
                selectedInstituteId || null
            );
            setOverviewRows(overviewRes?.data ?? []);

            // Show balance card only when a specific institute is selected
            if (selectedInstituteId) {
                const balRes = await getAvailableBalance({ instituteId: selectedInstituteId });
                setAvailableBalance(balRes?.data ?? null);
            } else {
                setAvailableBalance(null);
            }
        } catch (err) {
            console.error('Failed to fetch withdrawal overview:', err);
            setError('Failed to load withdrawal data. Please try again.');
            setOverviewRows([]);
        } finally {
            setIsLoadingData(false);
        }
    }, [selectedInstituteId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ─── Download Handler ─────────────────────────────────────────
    const handleDownloadConfirm = async () => {
        if (!downloadConfirmRow) return;
        setDownloadingId(downloadConfirmRow.instituteId || 'all');
        setDownloadConfirmRow(null);
        try {
            if (downloadConfirmRow.lastWithdrawalId && selectedInstituteId) {
                // Download specific past receipt if filtered to an institute and it exists
                await downloadWithdrawalPdf(
                    downloadConfirmRow.lastWithdrawalId,
                    `Withdrawal_${downloadConfirmRow.referenceId ?? 'Receipt'}.pdf`
                );
            } else {
                // Otherwise download the pending earnings overview
                await downloadOverviewPdf(
                    selectedInstituteId || null,
                    'Pending_Earnings_Report.pdf'
                );
            }
        } finally {
            setDownloadingId(null);
        }
    };

    // ─── Request Withdrawal ───────────────────────────────────────
    const handleRequestConfirm = async () => {
        if (!selectedInstituteId || !requestAmount) return;
        setIsRequesting(true);
        try {
            await requestWithdrawalNotification({
                instituteId: selectedInstituteId,
                requestedAmount: parseFloat(requestAmount),
            });
            setRequestModalOpen(false);
            setRequestAmount('');
        } catch (err) {
            console.error('Failed to send withdrawal request:', err);
            alert(err?.response?.data?.message ?? 'Failed to send request. Please try again.');
        } finally {
            setIsRequesting(false);
        }
    };

    // ─── Render ───────────────────────────────────────────────────
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-2">

            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Wallet className="h-6 w-6 text-indigo-500" />
                    Withdrawals
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    View and request your earnings withdrawals from institutes.
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
                    <WithdrawalsOverviewTable
                        rows={overviewRows}
                        downloadingId={downloadingId}
                        onDownload={(row) => setDownloadConfirmRow(row)}
                        onRequest={() => setRequestModalOpen(true)}
                        selectedInstituteId={selectedInstituteId}
                    />
                )}
            </div>

            {/* Request Withdrawal Modal */}
            {requestModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <BellRing className="h-5 w-5 text-indigo-500" />
                            Request Withdrawal
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            This will send a notification to the institute. They will process the payment.
                        </p>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Withdrawal Amount (Rs)
                            </label>
                            <input
                                type="number"
                                min="1"
                                max={availableBalance ?? undefined}
                                step="0.01"
                                value={requestAmount}
                                onChange={e => setRequestAmount(e.target.value)}
                                placeholder="e.g. 5000.00"
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => { setRequestModalOpen(false); setRequestAmount(''); }}
                                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRequestConfirm}
                                disabled={isRequesting || !requestAmount || Number(requestAmount) <= 0}
                                className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                {isRequesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
                                Send Request
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

// ─── Sub-Component: Withdrawals Overview Table ────────────────────────────────
const WithdrawalsOverviewTable = ({ rows, downloadingId, onDownload, onRequest, selectedInstituteId }) => {
    if (!rows || rows.length === 0) {
        return (
            <div className="w-full text-center py-14 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <FileBarChart2 className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No records found. Make sure students have paid their fees for classes at an institute.
                </p>
                {selectedInstituteId && (
                    <button
                        onClick={onRequest}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
                    >
                        <BellRing className="h-4 w-4" />
                        Request Withdrawal
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto relative">
                <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800/50 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th scope="col" className="px-4 py-3 md:py-4 font-medium">Reference</th>
                            <th scope="col" className="px-4 py-3 md:py-4 font-medium">Institute</th>
                            <th scope="col" className="px-4 py-3 md:py-4 font-medium">Withdrawals Period</th>
                            <th scope="col" className="px-4 py-3 md:py-4 font-medium">Withdrawal Date</th>
                            <th scope="col" className="px-4 py-3 md:py-4 font-medium text-right">Available Balance</th>
                            <th scope="col" className="px-4 py-3 md:py-4 font-medium text-right">Withdrawal Amount</th>
                            {/* Sticky actions column */}
                            <th scope="col" className="px-1 py-3 md:py-4 font-medium sticky right-0 z-20 bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {rows.map((row, idx) => {
                            const isDownloading = downloadingId === (row.instituteId || 'all');

                            const actions = [
                                {
                                    label: isDownloading ? 'Downloading…' : 'Download PDF',
                                    icon: isDownloading ? Loader2 : Download,
                                    disabled: isDownloading,
                                    onClick: () => onDownload && onDownload(row),
                                },
                                ...(row.instituteId && row.isPendingRow ? [{
                                    label: 'Request Withdrawal',
                                    icon: BellRing,
                                    onClick: () => onRequest && onRequest(),
                                }] : [])
                            ];

                            return (
                                <tr
                                    key={`${row.referenceId ?? 'new'}-${row.instituteName}-${idx}`}
                                    className={`${row.isPendingRow ? 'bg-amber-50/30 dark:bg-amber-900/10' : ''} hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors`}
                                >
                                    {/* Reference */}
                                    <td className="px-4 py-3 md:py-4">
                                        {row.referenceId ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 tracking-wider">
                                                {row.referenceId}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 dark:text-gray-500 text-sm">—</span>
                                        )}
                                    </td>

                                    {/* Details Period */}
                                    <td className="px-4 py-3 md:py-4">
                                        <span className="text-gray-600 dark:text-gray-400 text-xs">
                                            {row.detailsPeriod}
                                        </span>
                                    </td>

                                    {/* Withdrawals Period badge */}
                                    <td className="px-4 py-3 md:py-4">
                                        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                                            {row.withdrawalPeriod ?? '—'}
                                        </div>
                                    </td>

                                    {/* Withdrawal Date */}
                                    <td className="px-4 py-3 md:py-4 text-gray-700 dark:text-gray-300">
                                        {row.withdrawalAt ? new Date(row.withdrawalAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : <span className="text-gray-400 dark:text-gray-500 text-sm">—</span>}
                                    </td>

                                    {/* Available Balance */}
                                    <td className="px-4 py-3 md:py-4 text-right font-medium text-gray-700 dark:text-gray-300">
                                        {row.availableBalance != null ? formatCurrency(row.availableBalance) : <span className="text-gray-400 dark:text-gray-500 text-sm">—</span>}
                                    </td>

                                    {/* Withdrawal Amount */}
                                    <td className="px-4 py-3 md:py-4 text-right">
                                        {row.withdrawalAmount != null ? (
                                            <span className="font-semibold text-green-700 dark:text-green-400">
                                                {formatCurrency(row.withdrawalAmount)}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 dark:text-gray-500 text-sm">—</span>
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

export default WithdrawalsPage;
