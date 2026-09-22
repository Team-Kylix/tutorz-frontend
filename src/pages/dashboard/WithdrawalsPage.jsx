import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, RefreshCw, X, Calculator, CheckCircle, Download, TrendingUp } from 'lucide-react';
import Select from '../../components/atoms/Select';
import Input from '../../components/atoms/Input';
import RowActions from '../../components/molecules/RowActions';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';

import {
    getEarningsSummaries,
    getWalletBalances,
    calculateEarnings,
    calculateInstituteEarnings,
    withdrawFromWallet,
    downloadEarningsPdf,
} from '../../services/api/withdrawalService';
import { getJoinedInstitutes } from '../../services/api/tutorService';
import { searchTutors } from '../../services/api/instituteService';

const formatCurrency = (val) =>
    val != null ? `Rs ${Number(val).toLocaleString('en-LK', { minimumFractionDigits: 2 })}` : '—';

const MONTHS = [
    { value: 1,  label: 'January' },  { value: 2,  label: 'February' },
    { value: 3,  label: 'March' },    { value: 4,  label: 'April' },
    { value: 5,  label: 'May' },      { value: 6,  label: 'June' },
    { value: 7,  label: 'July' },     { value: 8,  label: 'August' },
    { value: 9,  label: 'September' },{ value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' },
];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

/* ─── Multi-step Withdraw Modal ─────────────────────────────────── */
const WithdrawModal = ({ onClose, walletBalances, isInstitute, isTutor }) => {
    const [step, setStep] = useState(1);

    // Tutor search (institute)
    const [wQuery, setWQuery]             = useState('');
    const [wDebounced, setWDebounced]     = useState('');
    const [wSuggestions, setWSuggestions] = useState([]);
    const [isSearching, setIsSearching]   = useState(false);
    const [showDrop, setShowDrop]         = useState(false);
    const [selectedWallet, setSelectedWallet] = useState(null);

    // Step 2
    const [amount, setAmount]         = useState('');
    const [method, setMethod]         = useState('OnHand');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setWDebounced(wQuery), 400);
        return () => clearTimeout(t);
    }, [wQuery]);

    useEffect(() => {
        if (!isInstitute || !wDebounced || selectedWallet) return;
        const run = async () => {
            setIsSearching(true);
            try {
                const res = await searchTutors(wDebounced);
                setWSuggestions(res?.data ?? []);
                setShowDrop(true);
            } catch { /* ignore */ }
            finally { setIsSearching(false); }
        };
        run();
    }, [wDebounced, isInstitute, selectedWallet]);

    const handleSelectTutor = (tutor) => {
        const w = walletBalances.find(wb => wb.tutorId === tutor.tutorId);
        setSelectedWallet(w ?? { tutorName: tutor.name || `${tutor.firstName} ${tutor.lastName}`, balance: null, walletId: null });
        setWQuery(tutor.name || `${tutor.firstName} ${tutor.lastName}`);
        setShowDrop(false);
    };

    const handleConfirm = async () => {
        if (!selectedWallet?.walletId || !amount || Number(amount) <= 0) return;
        setSubmitting(true);
        try {
            await withdrawFromWallet({
                walletId: selectedWallet.walletId,
                amount: parseFloat(amount),
                type: method,
                description: `${method} withdrawal processed.`,
            });
            onClose(true);
        } catch (e) {
            alert(e?.response?.data?.message || 'Withdrawal failed.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Process Withdrawal
                </h2>

                {/* Step dots */}
                <div className="flex items-center gap-2">
                    <div className={`h-2 w-8 rounded-full transition-colors ${step >= 1 ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                    <div className={`h-2 w-8 rounded-full transition-colors ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                </div>

                {/* ── Step 1: select tutor / wallet ── */}
                {step === 1 && (
                    <div className="space-y-4">
                        {isInstitute && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Search Tutor
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        {isSearching
                                            ? <Loader2 size={15} className="text-gray-400 animate-spin" />
                                            : <Search  size={15} className="text-gray-400" />}
                                    </div>
                                    <Input
                                        placeholder="Type tutor name..."
                                        className="pl-10"
                                        value={wQuery}
                                        onChange={e => { setWQuery(e.target.value); setSelectedWallet(null); setShowDrop(true); }}
                                        onFocus={() => setShowDrop(true)}
                                    />
                                    {wQuery && (
                                        <button className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            onClick={() => { setWQuery(''); setSelectedWallet(null); setWSuggestions([]); }}>
                                            <X size={14} className="text-gray-400 hover:text-gray-600" />
                                        </button>
                                    )}
                                    {showDrop && wSuggestions.length > 0 && !selectedWallet && (
                                        <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl max-h-52 overflow-auto py-1 text-sm">
                                            {wSuggestions.map(t => (
                                                <li key={t.tutorId}
                                                    onMouseDown={() => handleSelectTutor(t)}
                                                    className="px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer flex justify-between">
                                                    <span className="font-medium">{t.name || `${t.firstName} ${t.lastName}`}</span>
                                                    <span className="text-gray-400 text-xs">{t.registrationNumber}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Show selected tutor balance */}
                        {isInstitute && selectedWallet && (
                            <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-xl px-4 py-3 flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-indigo-500 font-medium flex items-center gap-1">
                                        <TrendingUp size={11} /> Available Balance
                                    </p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
                                        {selectedWallet.balance != null ? formatCurrency(selectedWallet.balance) : 'N/A'}
                                    </p>
                                </div>
                                <CheckCircle size={22} className="text-indigo-400" />
                            </div>
                        )}

                        {/* Tutor: wallet selection */}
                        {isTutor && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Wallet</label>
                                {walletBalances.map(w => (
                                    <button key={w.walletId}
                                        onClick={() => setSelectedWallet(w)}
                                        className={`w-full flex justify-between items-center px-4 py-3 rounded-lg border transition-colors text-sm ${
                                            selectedWallet?.walletId === w.walletId
                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                                                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                        }`}>
                                        <span className="font-medium text-gray-700 dark:text-gray-300">
                                            {w.isIndividual ? 'Individual Wallet' : `${w.instituteName || 'Institute'} Wallet`}
                                        </span>
                                        <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(w.balance)}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button onClick={() => onClose(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition-colors">
                                Cancel
                            </button>
                            <button onClick={() => setStep(2)} disabled={!selectedWallet}
                                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors">
                                Continue →
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Step 2: amount + method ── */}
                {step === 2 && (
                    <div className="space-y-4">
                        {selectedWallet?.balance != null && (
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-4 py-2 flex justify-between text-sm">
                                <span className="text-gray-500">Available balance</span>
                                <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(selectedWallet.balance)}</span>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Withdrawal Amount (Rs)</label>
                            <Input type="number" placeholder="e.g. 5000" value={amount} onChange={e => setAmount(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Method</label>
                            <Select value={method} onChange={e => setMethod(e.target.value)}>
                                <option value="OnHand">Cash (On Hand)</option>
                                <option value="Online">Bank Transfer (Online)</option>
                            </Select>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setStep(1)}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition-colors">
                                ← Back
                            </button>
                            <button onClick={handleConfirm} disabled={submitting || !amount || Number(amount) <= 0}
                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-lg flex justify-center items-center gap-2 text-sm font-medium transition-colors">
                                {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                Confirm Withdrawal
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

/* ─── Main Page ──────────────────────────────────────────────────── */
const WithdrawalsPage = () => {
    const { user } = useAuth();
    const isTutor     = user?.role === ROLES.TUTOR;
    const isInstitute = user?.role === ROLES.INSTITUTE;

    /* Tutor side: institute filter */
    const [institutes, setInstitutes]                   = useState([]);
    const [selectedInstituteId, setSelectedInstituteId] = useState('');

    /* Institute side: tutor search (filter bar) */
    const [tutorSearchQuery, setTutorSearchQuery]       = useState('');
    const [debouncedTutorQuery, setDebouncedTutorQuery] = useState('');
    const [tutorSuggestions, setTutorSuggestions]       = useState([]);
    const [isSearchingTutors, setIsSearchingTutors]     = useState(false);
    const [showTutorDropdown, setShowTutorDropdown]     = useState(false);
    const [selectedTutorId, setSelectedTutorId]         = useState('');

    useEffect(() => {
        const t = setTimeout(() => setDebouncedTutorQuery(tutorSearchQuery), 500);
        return () => clearTimeout(t);
    }, [tutorSearchQuery]);

    useEffect(() => {
        if (!isInstitute || !debouncedTutorQuery || selectedTutorId) { setTutorSuggestions([]); return; }
        const run = async () => {
            setIsSearchingTutors(true);
            try {
                const res = await searchTutors(debouncedTutorQuery);
                setTutorSuggestions(res?.data ?? []);
                setShowTutorDropdown(true);
            } catch { /* ignore */ }
            finally { setIsSearchingTutors(false); }
        };
        run();
    }, [debouncedTutorQuery, isInstitute, selectedTutorId]);

    /* Period filter */
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear,  setSelectedYear]  = useState(new Date().getFullYear());

    /* Data */
    const [earningsRows,   setEarningsRows]   = useState([]);
    const [walletBalances, setWalletBalances] = useState([]);
    const [isLoadingData,  setIsLoadingData]  = useState(false);
    const [isCalculating,  setIsCalculating]  = useState(false);
    const [error,          setError]          = useState(null);
    const [downloadingId,  setDownloadingId]  = useState(null);

    /* Withdraw modal */
    const [withdrawOpen, setWithdrawOpen] = useState(false);

    /* Load institutes (tutor side) */
    useEffect(() => {
        if (!isTutor) return;
        getJoinedInstitutes()
            .then(res => { const d = res?.data ?? res; setInstitutes(Array.isArray(d) ? d : (d?.data ?? [])); })
            .catch(console.error);
    }, [isTutor]);

    /* Fetch earnings + wallets */
    const fetchData = useCallback(async () => {
        setIsLoadingData(true);
        setError(null);
        try {
            const params = { month: selectedMonth, year: selectedYear };
            if (isTutor     && selectedInstituteId) params.instituteId = selectedInstituteId;
            if (isInstitute && selectedTutorId)     params.tutorId     = selectedTutorId;

            const [earningsRes, walletsRes] = await Promise.all([
                getEarningsSummaries(params),
                getWalletBalances(),
            ]);
            setEarningsRows(earningsRes?.data ?? []);

            let wallets = walletsRes?.data ?? [];
            if (isTutor     && selectedInstituteId) wallets = wallets.filter(w => w.instituteId === selectedInstituteId);
            if (isInstitute && selectedTutorId)     wallets = wallets.filter(w => w.tutorId     === selectedTutorId);
            setWalletBalances(wallets);
        } catch {
            setError('Failed to load data. Please try again.');
        } finally {
            setIsLoadingData(false);
        }
    }, [isTutor, isInstitute, selectedInstituteId, selectedTutorId, selectedMonth, selectedYear]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleDownloadPdf = async (id) => {
        setDownloadingId(id);
        try { await downloadEarningsPdf(id); }
        catch { alert('Failed to download PDF.'); }
        finally { setDownloadingId(null); }
    };

    const handleCalculate = async () => {
        setIsCalculating(true);
        try {
            if (isTutor)          await calculateEarnings();
            else if (isInstitute) await calculateInstituteEarnings();
            await fetchData();
            alert('Earnings calculated successfully!');
        } catch (e) {
            alert(e?.response?.data?.message || 'Calculation failed.');
        } finally {
            setIsCalculating(false);
        }
    };

    const periodLabel = `${MONTHS.find(m => m.value === selectedMonth)?.label ?? ''} ${selectedYear}`;

    /* ── Render ──────────────────────────────────────────────────── */
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* ── Page Header — identical pattern to InstituteStudentsPage ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Earnings &amp; Withdrawals</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage and withdraw earnings.</p>
                </div>
                <div className="flex w-full sm:w-auto items-center gap-2">
                    <button
                        onClick={fetchData}
                        disabled={isLoadingData}
                        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors shrink-0"
                        title="Refresh"
                    >
                        <RefreshCw size={17} className={isLoadingData ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => setWithdrawOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
                    >
                        <CheckCircle size={16} />
                        Withdraw
                    </button>
                    <button
                        onClick={handleCalculate}
                        disabled={isCalculating}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                    >
                        {isCalculating ? <Loader2 size={16} className="animate-spin" /> : <Calculator size={16} />}
                        Calculate Pending Earnings
                    </button>
                </div>
            </div>

            {/* ── Filter bar (top half of panel) — same as InstituteStudentsPage ── */}
            <div className="bg-white dark:bg-gray-800 rounded-t-xl border border-b-0 border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="p-4 flex flex-col md:flex-row gap-3 items-center">

                    {/* Institute side: tutor search — LEFT */}
                    {isInstitute && (
                        <div className="w-full md:w-1/3 relative z-20">
                            <div className="relative w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search tutor..."
                                    value={tutorSearchQuery}
                                    onChange={e => { setTutorSearchQuery(e.target.value); if (selectedTutorId) setSelectedTutorId(''); setShowTutorDropdown(true); }}
                                    onFocus={() => setShowTutorDropdown(true)}
                                    onBlur={() => setTimeout(() => setShowTutorDropdown(false), 200)}
                                    className="w-full pl-9 pr-8 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none shadow-sm"
                                />
                                {selectedTutorId && (
                                    <button onClick={() => { setSelectedTutorId(''); setTutorSearchQuery(''); }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                        <X size={14} />
                                    </button>
                                )}
                                {isSearchingTutors && (
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                    </div>
                                )}
                            </div>
                            {showTutorDropdown && tutorSuggestions.length > 0 && tutorSearchQuery && !selectedTutorId && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowTutorDropdown(false)} />
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto z-20">
                                        {tutorSuggestions.map(t => (
                                            <div key={t.tutorId}
                                                onMouseDown={() => { setSelectedTutorId(t.tutorId); setTutorSearchQuery(t.name || `${t.firstName} ${t.lastName}`); setShowTutorDropdown(false); }}
                                                className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 flex justify-between items-center text-gray-700 dark:text-gray-300">
                                                <span className="font-medium">{t.name || `${t.firstName} ${t.lastName}`}</span>
                                                <span className="text-gray-400 text-xs">{t.registrationNumber}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Tutor side: institute filter — LEFT */}
                    {isTutor && (
                        <div className="w-full md:w-1/3">
                            <Select value={selectedInstituteId} onChange={e => setSelectedInstituteId(e.target.value)}>
                                <option value="">-- All Institutes --</option>
                                {institutes.map(i => (
                                    <option key={i.instituteId} value={i.instituteId}>{i.instituteName}</option>
                                ))}
                            </Select>
                        </div>
                    )}

                    {/* Month */}
                    <div className="w-full md:w-44">
                        <Select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
                            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </Select>
                    </div>

                    {/* Year */}
                    <div className="w-full md:w-28">
                        <Select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </Select>
                    </div>

                    {/* Wallet balance — plain text, far right */}
                    {walletBalances.length > 0 && (
                        <div className="flex gap-4 ml-auto shrink-0">
                            {walletBalances.map(w => (
                                <div key={w.walletId} className="text-right">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {w.isIndividual
                                            ? 'Individual Wallet'
                                            : (isInstitute && w.tutorName
                                                ? `${w.tutorName}'s Wallet`
                                                : `${w.instituteName || 'Institute'} Wallet`)}
                                    </p>
                                    <p className="text-base font-bold text-gray-900 dark:text-white">{formatCurrency(w.balance)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Table (bottom half of panel, seamlessly joined) ── */}
            <div className="bg-white dark:bg-gray-800 rounded-b-xl border border-t-0 border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                {error ? (
                    <div className="p-8 text-center text-red-500 text-sm">{error}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs md:text-sm text-left whitespace-nowrap">
                            <thead className="text-[10px] md:text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    {isInstitute && <th className="px-5 py-3 font-medium">Tutor</th>}
                                    {isTutor     && <th className="px-5 py-3 font-medium">Institute</th>}
                                    <th className="px-5 py-3 font-medium text-right">Gross</th>
                                    <th className="px-5 py-3 font-medium text-right">Platform Comm</th>
                                    <th className="px-5 py-3 font-medium text-right">SMS Deduct</th>
                                    <th className="px-5 py-3 font-medium text-right">Server Deduct</th>
                                    <th className="px-5 py-3 font-medium text-right">Net Amount</th>
                                    <th className="px-2 py-3 sticky right-0 z-20 bg-gray-50 dark:bg-gray-800/50" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {isLoadingData ? (
                                    Array(4).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={8} className="px-5 py-4 h-12 bg-gray-50/50 dark:bg-gray-800/30" />
                                        </tr>
                                    ))
                                ) : earningsRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-16 text-gray-400 dark:text-gray-500 text-sm">
                                            <p>No earnings found for <strong>{periodLabel}</strong>.</p>
                                            <p className="text-xs mt-1 text-gray-400">Click "Calculate Pending Earnings" to generate records.</p>
                                        </td>
                                    </tr>
                                ) : earningsRows.map(row => (
                                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                                        {isInstitute && <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-200">{row.tutorName || 'Institute (Self)'}</td>}
                                        {isTutor     && <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-200">{row.instituteName || 'Individual'}</td>}
                                        <td className="px-5 py-3 text-right text-gray-700 dark:text-gray-300">{formatCurrency(row.grossAmount)}</td>
                                        <td className="px-5 py-3 text-right text-red-500">-{formatCurrency(row.platformCommission)}</td>
                                        <td className="px-5 py-3 text-right text-red-500">-{formatCurrency(row.smsDeduction)}</td>
                                        <td className="px-5 py-3 text-right text-red-500">-{formatCurrency(row.serverDeduction)}</td>
                                        <td className="px-5 py-3 text-right font-bold text-green-600">{formatCurrency(row.netAmount)}</td>
                                        <td className="px-2 py-3 sticky right-0 z-10 bg-white dark:bg-gray-800">
                                            <RowActions actions={[{
                                                label:    downloadingId === row.id ? 'Downloading...' : 'Download PDF',
                                                icon:     downloadingId === row.id ? Loader2 : Download,
                                                disabled: downloadingId === row.id,
                                                onClick:  () => handleDownloadPdf(row.id),
                                            }]} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Withdraw Modal ─────────────────────────────────── */}
            {withdrawOpen && (
                <WithdrawModal
                    onClose={async (didWithdraw) => {
                        setWithdrawOpen(false);
                        if (didWithdraw) { await fetchData(); alert('Withdrawal successful!'); }
                    }}
                    walletBalances={walletBalances}
                    isInstitute={isInstitute}
                    isTutor={isTutor}
                />
            )}
        </div>
    );
};

export default WithdrawalsPage;
