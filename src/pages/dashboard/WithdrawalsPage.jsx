import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Wallet, Download, BellRing, FileBarChart2, RefreshCw, Calculator, Search, CheckCircle } from 'lucide-react';
import Select from '../../components/atoms/Select';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';

import {
    getEarningsSummaries,
    getWalletBalances,
    calculateEarnings,
    calculateInstituteEarnings,
    withdrawFromWallet
} from '../../services/api/withdrawalService';
import { getJoinedInstitutes } from '../../services/api/tutorService';
import { searchTutors } from '../../services/api/instituteService';

const formatCurrency = (val) =>
    val != null ? `Rs ${Number(val).toLocaleString('en-LK', { minimumFractionDigits: 2 })}` : '—';

const WithdrawalsPage = () => {
    const { user } = useAuth();
    const isTutor = user?.role === ROLES.TUTOR;
    const isInstitute = user?.role === ROLES.INSTITUTE;

    // Dropdown Data (Tutor side)
    const [institutes, setInstitutes] = useState([]);
    const [selectedInstituteId, setSelectedInstituteId] = useState('');

    // Tutor Search (Institute side)
    const [tutorSearchQuery, setTutorSearchQuery] = useState('');
    const [tutorSuggestions, setTutorSuggestions] = useState([]);
    const [isSearchingTutors, setIsSearchingTutors] = useState(false);
    const [showTutorDropdown, setShowTutorDropdown] = useState(false);
    const [selectedTutorId, setSelectedTutorId] = useState('');
    const [debouncedTutorQuery, setDebouncedTutorQuery] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedTutorQuery(tutorSearchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [tutorSearchQuery]);

    useEffect(() => {
        if (!isInstitute || !debouncedTutorQuery || selectedTutorId) {
            setTutorSuggestions([]);
            return;
        }
        const fetchTutors = async () => {
            setIsSearchingTutors(true);
            try {
                const res = await searchTutors(debouncedTutorQuery);
                setTutorSuggestions(res?.data ?? []);
                setShowTutorDropdown(true);
            } catch (err) {
                console.error("Failed to search tutors", err);
            } finally {
                setIsSearchingTutors(false);
            }
        };
        fetchTutors();
    }, [debouncedTutorQuery, isInstitute, selectedTutorId]);

    const handleTutorSelect = (tutor) => {
        setSelectedTutorId(tutor.tutorId);
        setTutorSearchQuery(tutor.name || `${tutor.firstName} ${tutor.lastName}`);
        setShowTutorDropdown(false);
    };

    const handleTutorSearchChange = (e) => {
        setTutorSearchQuery(e.target.value);
        if (selectedTutorId) setSelectedTutorId('');
        setShowTutorDropdown(true);
    };

    // Data State
    const [earningsRows, setEarningsRows] = useState([]);
    const [walletBalances, setWalletBalances] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isCalculating, setIsCalculating] = useState(false);
    const [error, setError] = useState(null);

    // Calculation State
    const [calcMonth, setCalcMonth] = useState(new Date().getMonth() + 1);
    const [calcYear, setCalcYear] = useState(new Date().getFullYear());

    // Withdrawal Modal
    const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawType, setWithdrawType] = useState('OnHand');
    const [selectedWalletId, setSelectedWalletId] = useState('');
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    useEffect(() => {
        if (isTutor) {
            getJoinedInstitutes().then(res => {
                const data = res?.data ?? res;
                setInstitutes(Array.isArray(data) ? data : (data?.data ?? []));
            }).catch(console.error);
        }
    }, [isTutor]);

    const fetchData = useCallback(async () => {
        setIsLoadingData(true);
        setError(null);
        try {
            const params = {};
            if (isTutor && selectedInstituteId) params.instituteId = selectedInstituteId;
            if (isInstitute && selectedTutorId) params.tutorId = selectedTutorId;

            const [earningsRes, walletsRes] = await Promise.all([
                getEarningsSummaries(params),
                getWalletBalances()
            ]);

            setEarningsRows(earningsRes?.data ?? []);
            
            // Filter wallets based on selection
            let wallets = walletsRes?.data ?? [];
            if (isTutor && selectedInstituteId) {
                wallets = wallets.filter(w => w.instituteId === selectedInstituteId);
            }
            if (isInstitute && selectedTutorId) {
                wallets = wallets.filter(w => w.tutorId === selectedTutorId);
            }
            setWalletBalances(wallets);

        } catch (err) {
            console.error('Failed to fetch data:', err);
            setError('Failed to load data. Please try again.');
        } finally {
            setIsLoadingData(false);
        }
    }, [isTutor, isInstitute, selectedInstituteId, selectedTutorId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCalculate = async () => {
        setIsCalculating(true);
        try {
            if (isTutor) {
                await calculateEarnings({ month: calcMonth, year: calcYear });
            } else if (isInstitute) {
                await calculateInstituteEarnings({ month: calcMonth, year: calcYear });
            }
            fetchData();
            alert('Earnings calculated successfully!');
        } catch (err) {
            console.error('Calculate error:', err);
            alert(err?.response?.data?.message || 'Calculation failed.');
        } finally {
            setIsCalculating(false);
        }
    };

    const handleWithdrawConfirm = async () => {
        if (!selectedWalletId || !withdrawAmount || Number(withdrawAmount) <= 0) return;
        setIsWithdrawing(true);
        try {
            await withdrawFromWallet({
                walletId: selectedWalletId,
                amount: parseFloat(withdrawAmount),
                type: withdrawType,
                description: `${withdrawType} withdrawal processed.`
            });
            setWithdrawModalOpen(false);
            setWithdrawAmount('');
            fetchData();
            alert('Withdrawal successful!');
        } catch (err) {
            console.error('Withdrawal error:', err);
            alert(err?.response?.data?.message || 'Withdrawal failed.');
        } finally {
            setIsWithdrawing(false);
        }
    };

    const openWithdrawModal = (wallet) => {
        setSelectedWalletId(wallet.walletId);
        setWithdrawAmount('');
        setWithdrawModalOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Wallet className="h-6 w-6 text-indigo-500" />
                        Earnings & Withdrawals
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Manage and withdraw earnings.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2 items-center bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                    <select
                        value={calcMonth}
                        onChange={(e) => setCalcMonth(parseInt(e.target.value))}
                        className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'short' })}</option>
                        ))}
                    </select>
                    <input
                        type="number"
                        value={calcYear}
                        onChange={(e) => setCalcYear(parseInt(e.target.value))}
                        className="w-20 px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
                    />
                    <button
                        onClick={handleCalculate}
                        disabled={isCalculating}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        {isCalculating ? <Loader2 size={16} className="animate-spin" /> : <Calculator size={16} />}
                        Calculate
                    </button>
                </div>
            </div>

            {/* Filters */}
            {isTutor && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm w-full md:w-1/3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Filter by Institute
                    </label>
                    <Select value={selectedInstituteId} onChange={e => setSelectedInstituteId(e.target.value)}>
                        <option value="">-- All Earnings --</option>
                        {institutes.map(inst => (
                            <option key={inst.instituteId} value={inst.instituteId}>
                                {inst.instituteName}
                            </option>
                        ))}
                    </Select>
                </div>
            )}
            
            {isInstitute && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm w-full md:w-1/3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Search Tutor
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            {isSearchingTutors ? <Loader2 size={16} className="text-gray-400 animate-spin" /> : <Search size={16} className="text-gray-400" />}
                        </div>
                        <input
                            type="text"
                            placeholder="Type tutor name or ID..."
                            value={tutorSearchQuery}
                            onChange={handleTutorSearchChange}
                            onFocus={() => setShowTutorDropdown(true)}
                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:border-indigo-500"
                        />
                        {/* Dropdown Results */}
                        {showTutorDropdown && tutorSuggestions.length > 0 && tutorSearchQuery && !selectedTutorId && (
                            <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto py-1 text-sm">
                                {tutorSuggestions.map((tutor) => (
                                    <li
                                        key={tutor.tutorId}
                                        onClick={() => handleTutorSelect(tutor)}
                                        className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer flex justify-between"
                                    >
                                        <span className="font-medium">{tutor.name || `${tutor.firstName} ${tutor.lastName}`}</span>
                                        <span className="text-gray-500 dark:text-gray-400 text-xs">{tutor.registrationNumber}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {showTutorDropdown && tutorSuggestions.length === 0 && !isSearchingTutors && tutorSearchQuery && !selectedTutorId && (
                            <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg p-3 text-sm text-gray-500">
                                No tutors found
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Wallets */}
            {walletBalances.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {walletBalances.map(wallet => (
                        <div key={wallet.walletId} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    {wallet.isIndividual ? 'Individual Classes Wallet' : (isInstitute && wallet.tutorName ? `${wallet.tutorName}'s Wallet` : `${wallet.instituteName || 'Institute'} Wallet`)}
                                </h3>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {formatCurrency(wallet.balance)}
                                </p>
                            </div>
                            <button
                                onClick={() => openWithdrawModal(wallet)}
                                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
                            >
                                <CheckCircle size={16} />
                                Withdraw
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Earnings Table */}
            <div className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Earnings History</h3>
                    <button onClick={fetchData} className="text-gray-500 hover:text-gray-700"><RefreshCw size={16}/></button>
                </div>
                <div className="overflow-x-auto relative">
                    <table className="w-full text-xs md:text-sm text-left whitespace-nowrap">
                        <thead className="text-[10px] md:text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-4 py-3 font-medium">Period</th>
                                {isInstitute && <th className="px-4 py-3 font-medium">Tutor</th>}
                                {isTutor && <th className="px-4 py-3 font-medium">Institute</th>}
                                <th className="px-4 py-3 font-medium text-right">Gross</th>
                                <th className="px-4 py-3 font-medium text-right">Platform Comm</th>
                                <th className="px-4 py-3 font-medium text-right">SMS Deduct</th>
                                <th className="px-4 py-3 font-medium text-right">Server Deduct</th>
                                <th className="px-4 py-3 font-medium text-right">Net Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {earningsRows.length === 0 ? (
                                <tr><td colSpan={8} className="text-center py-8 text-gray-500">No earnings calculated yet.</td></tr>
                            ) : earningsRows.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-4 py-3">{row.month}/{row.year}</td>
                                    {isInstitute && <td className="px-4 py-3">{row.tutorName || 'Institute (Self)'}</td>}
                                    {isTutor && <td className="px-4 py-3">{row.instituteName || 'Individual'}</td>}
                                    <td className="px-4 py-3 text-right">{formatCurrency(row.grossAmount)}</td>
                                    <td className="px-4 py-3 text-right text-red-500">-{formatCurrency(row.platformCommission)}</td>
                                    <td className="px-4 py-3 text-right text-red-500">-{formatCurrency(row.smsDeduction)}</td>
                                    <td className="px-4 py-3 text-right text-red-500">-{formatCurrency(row.serverDeduction)}</td>
                                    <td className="px-4 py-3 text-right font-bold text-green-600">{formatCurrency(row.netAmount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Withdraw Modal */}
            {withdrawModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Process Withdrawal</h2>
                        
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm text-gray-700 dark:text-gray-300">Amount (Rs)</label>
                                <input
                                    type="number"
                                    value={withdrawAmount}
                                    onChange={e => setWithdrawAmount(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
                                    placeholder="e.g. 5000"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-700 dark:text-gray-300">Method</label>
                                <select 
                                    value={withdrawType} 
                                    onChange={e => setWithdrawType(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
                                >
                                    <option value="OnHand">Cash (On Hand)</option>
                                    <option value="Online">Bank Transfer (Online)</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button onClick={() => setWithdrawModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300">
                                Cancel
                            </button>
                            <button onClick={handleWithdrawConfirm} disabled={isWithdrawing} className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex justify-center items-center gap-2">
                                {isWithdrawing ? <Loader2 className="animate-spin" size={16} /> : null}
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WithdrawalsPage;
