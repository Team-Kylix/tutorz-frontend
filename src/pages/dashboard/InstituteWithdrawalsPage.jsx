import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Loader2, Wallet, Download, FileBarChart2 } from 'lucide-react';
import Select from '../../components/atoms/Select';
import RowActions from '../../components/molecules/RowActions';
import ConfirmationModal from '../../components/molecules/ConfirmationModal';
import WithdrawModal from '../../components/organisms/WithdrawModal';
import {
    getInstituteWithdrawalOverview,
    downloadWithdrawalPdf,
    downloadInstituteOverviewPdf
} from '../../services/api/withdrawalService';
import { getAssignedTutors } from '../../services/api/instituteService';

const formatCurrency = (val) =>
    val != null ? `Rs ${Number(val).toLocaleString('en-LK', { minimumFractionDigits: 2 })}` : '—';

const InstituteWithdrawalsPage = () => {
    // ─── Search & Autocomplete State ──────────────────────────────
    const [searchQuery, setSearchQuery] = useState('');
    const [assignedTutors, setAssignedTutors] = useState([]);
    const [selectedTutor, setSelectedTutor] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const containerRef = useRef(null);

    // ─── Withdraw Modal State ─────────────────────────────────────
    const [withdrawTutor, setWithdrawTutor] = useState(null);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

    // ─── Overview Data ────────────────────────────────────────────
    const [overviewRows, setOverviewRows] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [error, setError] = useState(null);

    // ─── Download tracking ────────────────────────────────────────
    const [downloadingId, setDownloadingId] = useState(null);
    const [downloadConfirmRow, setDownloadConfirmRow] = useState(null);
    const [downloadError, setDownloadError] = useState(null);

    // ─── Reset errors when search changes ──────────────────
    useEffect(() => {
        setDownloadError(null);
    }, [searchQuery]);

    // ─── Fetch Assigned Tutors list for Autocomplete ──────────────
    useEffect(() => {
        const fetchTutorsList = async () => {
            try {
                const res = await getAssignedTutors('', 1, 999);
                setAssignedTutors(res?.data?.items ?? []);
            } catch (err) {
                console.error('Failed to fetch assigned tutors:', err);
            }
        };
        fetchTutorsList();
    }, []);

    // ─── Fetch Overview Data ──────────────────────────────────────
    const fetchOverview = useCallback(async (tutorId = null) => {
        setIsLoadingData(true);
        setError(null);
        try {
            const res = await getInstituteWithdrawalOverview(tutorId);
            setOverviewRows(res?.data ?? []);
        } catch (err) {
            console.error('Failed to fetch withdrawal overview:', err);
            setError('Failed to load withdrawal data. Please try again.');
            setOverviewRows([]);
        } finally {
            setIsLoadingData(false);
        }
    }, []);

    useEffect(() => { 
        fetchOverview(selectedTutor?.tutorId || null); 
    }, [selectedTutor, fetchOverview]);

    // ─── Close Dropdown on click outside ──────────────────────────
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ─── Autocomplete matching logic ──────────────────────────────
    const matchingTutors = useMemo(() => {
        const lowerQ = searchQuery.toLowerCase();
        return assignedTutors.filter(t => 
            `${t.firstName || ''} ${t.lastName || ''}`.toLowerCase().includes(lowerQ) ||
            (t.registrationNumber || '').toLowerCase().includes(lowerQ)
        );
    }, [assignedTutors, searchQuery]);

    // ─── Selected tutor's pending balance helpers ──────────────────
    const pendingRow = useMemo(() => {
        return overviewRows.find(r => r.isPendingRow);
    }, [overviewRows]);

    const hasPendingBalance = useMemo(() => {
        return pendingRow && pendingRow.availableBalance > 0;
    }, [pendingRow]);

    // ─── Handlers ─────────────────────────────────────────────────
    const handleClearSearch = () => {
        setSelectedTutor(null);
        setSearchQuery('');
        setIsDropdownOpen(false);
    };

    const handleMainWithdrawalClick = () => {
        if (selectedTutor && pendingRow) {
            handleWithdrawClick(pendingRow);
        }
    };

    // ─── Download Handler ─────────────────────────────────────────
    const handleDownloadConfirm = async () => {
        if (!downloadConfirmRow) return;
        setDownloadingId(downloadConfirmRow.tutorId || 'all');
        setDownloadConfirmRow(null);
        setDownloadError(null);
        try {
            if (downloadConfirmRow.lastWithdrawalId) {
                // Historical withdrawal row → download the specific receipt PDF
                await downloadWithdrawalPdf(
                    downloadConfirmRow.lastWithdrawalId,
                    `Withdrawal_${downloadConfirmRow.referenceId ?? 'Receipt'}.pdf`
                );
            } else {
                // PENDING row → download the pending payouts overview PDF
                await downloadInstituteOverviewPdf(
                    downloadConfirmRow.tutorId || null, // Specific tutor download if requested from a row
                    'Pending_Payouts_Report.pdf'
                );
            }
        } catch (err) {
            const status = err?.response?.status;
            if (status === 404) {
                setDownloadError('No pending payouts found for the selected tutor / class. All earnings may have already been withdrawn.');
            } else {
                setDownloadError('Failed to download the report. Please try again.');
            }
        } finally {
            setDownloadingId(null);
        }
    };

    // ─── Withdraw to Tutor handler ────────────────────────────────
    const handleWithdrawClick = (row) => {
        setWithdrawTutor({ 
            tutorId: row.tutorId, 
            firstName: row.tutorName, 
            lastName: '', 
            registrationNumber: row.tutorRegNo, 
            availableBalance: row.availableBalance 
        });
        setIsWithdrawModalOpen(true);
    };

    const handleWithdrawSuccess = () => {
        setIsWithdrawModalOpen(false);
        setWithdrawTutor(null);
        fetchOverview(selectedTutor?.tutorId || null); // refresh table
    };

    // ─── Filter rows locally based on search ──────────────────────
    const filteredRows = useMemo(() => {
        if (selectedTutor) return overviewRows;
        if (!searchQuery.trim()) return overviewRows;
        const lowerQ = searchQuery.toLowerCase();
        return overviewRows.filter(r => 
            (r.tutorName || '').toLowerCase().includes(lowerQ) ||
            (r.tutorRegNo || '').toLowerCase().includes(lowerQ) ||
            (r.referenceId || '').toLowerCase().includes(lowerQ)
        );
    }, [overviewRows, searchQuery, selectedTutor]);

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
                    Manage tutor withdrawal payouts for your institute.
                </p>
            </div>

            {/* Filter Controls */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-end justify-between">

                {/* Search Tutor with Autocomplete */}
                <div ref={containerRef} className="w-full md:w-1/3 flex flex-col items-start gap-1 relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Search Tutor
                    </label>
                    <div className="relative w-full">
                        <input
                            type="text"
                            placeholder="Search and select a tutor..."
                            value={searchQuery}
                            onFocus={() => setIsDropdownOpen(true)}
                            onChange={e => {
                                setSearchQuery(e.target.value);
                                setIsDropdownOpen(true);
                                if (!e.target.value.trim() && selectedTutor) {
                                    setSelectedTutor(null);
                                }
                            }}
                            className="w-full pl-3 pr-10 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm font-bold p-1 cursor-pointer"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Suggestions Dropdown */}
                    {isDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                            {matchingTutors.length > 0 ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedTutor(null);
                                            setSearchQuery('');
                                            setIsDropdownOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-gray-100 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                                    >
                                        All Tutors
                                    </button>
                                    {matchingTutors.map(t => {
                                        const fullName = `${t.firstName || ''} ${t.lastName || ''}`.trim();
                                        return (
                                            <button
                                                key={t.tutorId}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedTutor(t);
                                                    setSearchQuery(fullName);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-700 dark:text-gray-200 border-b border-gray-100 last:border-0 dark:border-gray-700"
                                            >
                                                <div className="font-medium">{fullName}</div>
                                                {t.registrationNumber && (
                                                    <div className="text-xs text-gray-400 font-mono">{t.registrationNumber}</div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </>
                            ) : (
                                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 italic">
                                    No assigned tutors found matching "{searchQuery}"
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="hidden md:flex flex-1 items-end pb-0.5">
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                        {selectedTutor ? `Showing overview for ${selectedTutor.firstName} ${selectedTutor.lastName}.` : 'Showing combined overview for all tutors.'}
                    </p>
                </div>

                {/* Withdrawal button beside the search bar, right-aligned */}
                <div className="w-full md:w-auto">
                    <button
                        type="button"
                        disabled={!selectedTutor || !hasPendingBalance}
                        onClick={handleMainWithdrawalClick}
                        className={`w-full md:w-auto inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            selectedTutor && hasPendingBalance
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                        }`}
                    >
                        <Wallet className="h-4 w-4 mr-2" />
                        Withdrawal
                    </button>
                </div>
            </div>

            {/* Download Error Banner */}
            {downloadError && (
                <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3 mt-2">
                    <span className="text-amber-500 text-lg leading-none mt-0.5">⚠</span>
                    <p className="text-sm text-amber-800 dark:text-amber-300 flex-1">{downloadError}</p>
                    <button
                        onClick={() => setDownloadError(null)}
                        className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-200 text-lg leading-none"
                        aria-label="Dismiss"
                    >×</button>
                </div>
            )}

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
                    <InstituteOverviewTable
                        rows={filteredRows}
                        downloadingId={downloadingId}
                        onDownload={(row) => setDownloadConfirmRow(row)}
                        onWithdraw={(row) => handleWithdrawClick(row)}
                    />
                )}
            </div>

            {/* Withdraw Modal */}
            <WithdrawModal
                isOpen={isWithdrawModalOpen}
                onClose={() => { setIsWithdrawModalOpen(false); setWithdrawTutor(null); }}
                tutor={withdrawTutor}
                onSuccess={handleWithdrawSuccess}
            />

            {/* Download Confirm Modal */}
            <ConfirmationModal
                isOpen={!!downloadConfirmRow}
                onClose={() => setDownloadConfirmRow(null)}
                onConfirm={handleDownloadConfirm}
                title={downloadConfirmRow?.lastWithdrawalId ? "Download Receipt PDF" : "Download Payouts Report"}
                message={downloadConfirmRow?.lastWithdrawalId 
                    ? `Download the receipt PDF for withdrawal ${downloadConfirmRow.referenceId ?? ''}?`
                    : "Download a PDF report of your current pending payouts?"}
                confirmLabel="Download"
                variant="primary"
            />
        </div>
    );
};

// ─── Sub-Component: Institute Overview Table ──────────────────────────────────
const InstituteOverviewTable = ({ rows, downloadingId, onDownload, onWithdraw }) => {
    if (!rows || rows.length === 0) {
        return (
            <div className="w-full text-center py-14 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <FileBarChart2 className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No records found. Make sure tutors have students with paid fees at this institute.
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
                            <th scope="col" className="px-4 py-3 md:py-4 font-medium">Reference</th>
                            <th scope="col" className="px-4 py-3 md:py-4 font-medium">Tutor</th>
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
                            const isDownloading = downloadingId === (row.tutorId || 'all');

                            const actions = [
                                {
                                    label: isDownloading ? 'Downloading…' : 'Download PDF',
                                    icon: isDownloading ? Loader2 : Download,
                                    disabled: isDownloading,
                                    onClick: () => onDownload && onDownload(row),
                                },
                                ...(row.tutorId && row.isPendingRow ? [{
                                    label: 'Process Withdrawal',
                                    icon: Wallet,
                                    onClick: () => onWithdraw && onWithdraw(row),
                                }] : []),
                            ];

                            return (
                                <tr
                                    key={`${row.referenceId ?? 'new'}-${row.tutorName}-${idx}`}
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

export default InstituteWithdrawalsPage;
