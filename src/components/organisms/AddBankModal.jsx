import React, { useState, useEffect, useCallback } from 'react';
import { X, Building2, GitBranch, User, Hash, ChevronDown, Shield, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { getBanks, getBranchesByBank, saveBankDetails } from '../../services/api/financialService';

// Keywords that identify non-bank financial institutions to exclude from the bank list.
// Adjust this list to match what your API actually returns.
const NON_BANK_KEYWORDS = [
    'finance', 'leasing', 'insurance', 'micro', 'credit', 'cooperative',
    'thrift', 'savings society', 'pawning', 'merchant bank'
];

const isBankOnly = (bankName = '') => {
    const lower = bankName.toLowerCase();
    return !NON_BANK_KEYWORDS.some(kw => lower.includes(kw));
};

const AddBankModal = ({ isOpen, onClose, onSuccess }) => {
    const [step, setStep] = useState(1); // 3 steps: Bank → Branch → Account
    const [banks, setBanks] = useState([]);
    const [branches, setBranches] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [loadingBanks, setLoadingBanks] = useState(false);
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        bankCode: '',
        bankName: '',
        branchCode: '',
        branchName: '',
        accountNumber: '',
        accountHolderName: '',
    });

    const [bankSearch, setBankSearch] = useState('');
    const [branchSearch, setBranchSearch] = useState('');

    const [hasBranches, setHasBranches] = useState(true); // track if the selected bank has any branches

    // Load banks on open
    useEffect(() => {
        if (!isOpen) return;
        setStep(1);
        setError('');
        setHasBranches(true);
        setForm({ bankCode: '', bankName: '', branchCode: '', branchName: '', accountNumber: '', accountHolderName: '' });
        setBankSearch('');
        setBranchSearch('');

        const load = async () => {
            setLoadingBanks(true);
            try {
                const res = await getBanks();
                if (res.success) setBanks(res.data || []);
            } catch { /* handled silently */ }
            finally { setLoadingBanks(false); }
        };
        load();
    }, [isOpen]);

    // Load branches when bank is selected
    const handleSelectBank = useCallback(async (bank) => {
        setForm(f => ({ ...f, bankCode: bank.bankCode, bankName: bank.bankName, branchCode: '', branchName: '' }));
        setBranches([]);
        setLoadingBranches(true);
        setStep(2); // show step 2 while loading so user sees the spinner
        try {
            const res = await getBranchesByBank(bank.bankCode);
            const branchList = res.success ? (res.data || []) : [];
            setBranches(branchList);
            if (branchList.length === 0) {
                // Bank has no branches — skip the branch step
                setHasBranches(false);
                setStep(3);
            } else {
                setHasBranches(true);
            }
        } catch {
            // On error, assume no branches and let user continue
            setHasBranches(false);
            setStep(3);
        } finally {
            setLoadingBranches(false);
        }
    }, []);

    const handleSelectBranch = (branch) => {
        setForm(f => ({ ...f, branchCode: branch.branchCode, branchName: branch.branchName }));
        setStep(3);
    };

    const handleAccountInput = (e) => {
        // Allow only digits — no character limit so longer account numbers work fine
        const raw = e.target.value.replace(/\D/g, '');
        setForm(f => ({ ...f, accountNumber: raw }));
    };

    // Display: group digits in blocks of 4 separated by spaces
    const displayAccountNumber = form.accountNumber.replace(/(\d{4})(?=\d)/g, '$1 ');

    const handleSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent bubbling to parent form (e.g. EditProfileModal)
        if (!form.accountNumber || form.accountNumber.length < 6) {
            setError('Please enter a valid account number.');
            return;
        }
        if (!form.accountHolderName.trim()) {
            setError('Please enter the account holder name.');
            return;
        }
        setError('');
        setIsSaving(true);
        try {
            const res = await saveBankDetails({
                bankCode: form.bankCode,
                bankName: form.bankName,
                branchCode: form.branchCode,
                branchName: form.branchName,
                accountNumber: form.accountNumber,
                accountHolderName: form.accountHolderName,
            });
            if (res.success) {
                onSuccess(res.data);
                onClose();
            } else {
                setError(res.message || 'Failed to save bank details.');
            }
        } catch (err) {
            setError(err?.message || 'An error occurred.');
        } finally {
            setIsSaving(false);
            // Scrub sensitive data from state
            setForm(f => ({ ...f, accountNumber: '', accountHolderName: '' }));
        }
    };

    if (!isOpen) return null;

    const filteredBanks = banks.filter(b =>
        isBankOnly(b.bankName) &&
        b.bankName.toLowerCase().includes(bankSearch.toLowerCase())
    );
    const filteredBranches = branches.filter(b =>
        b.branchName.toLowerCase().includes(branchSearch.toLowerCase()) ||
        b.district?.toLowerCase().includes(branchSearch.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-xl">
                                <Building2 size={22} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">Add Bank Account</h2>
                                <p className="text-xs text-emerald-100 mt-0.5">
                                    {step === 1 ? 'Select your bank' : step === 2 ? 'Select your branch' : 'Enter account details'}
                                </p>
                            </div>
                        </div>
                        <button type="button" onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Step indicator */}
                    <div className="flex items-center gap-2 mt-4">
                        {[1, 2, 3].map(s => (
                            <React.Fragment key={s}>
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                    s < step ? 'bg-white text-emerald-600' :
                                    s === step ? 'bg-white/30 text-white ring-2 ring-white' :
                                    'bg-white/10 text-white/50'
                                }`}>
                                    {s < step ? <CheckCircle2 size={14} /> : s}
                                </div>
                                {s < 3 && <div className={`flex-1 h-0.5 rounded transition-all ${s < step ? 'bg-white' : 'bg-white/20'}`} />}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Body */}
                <div className="p-6">
                    {/* ── Step 1: Select Bank ── */}
                    {step === 1 && (
                        <div>
                            <div className="relative mb-3">
                                <input
                                    type="text"
                                    placeholder="Search banks..."
                                    value={bankSearch}
                                    onChange={e => setBankSearch(e.target.value)}
                                    autoComplete="off"
                                    className="w-full pl-4 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            {loadingBanks ? (
                                <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
                                    <Loader2 size={20} className="animate-spin" />
                                    <span className="text-sm">Loading banks...</span>
                                </div>
                            ) : (
                                <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                    {filteredBanks.length === 0 ? (
                                        <p className="text-sm text-center py-6 text-gray-400">No banks found</p>
                                    ) : filteredBanks.map(bank => (
                                        <button
                                            type="button"
                                            key={bank.bankCode}
                                            onClick={() => handleSelectBank(bank)}
                                            className="w-full text-left px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-sm text-gray-800 dark:text-gray-200 transition-colors flex items-center justify-between group"
                                        >
                                            <span>{bank.bankName}</span>
                                            <span className="text-xs text-gray-400 group-hover:text-emerald-600">#{bank.bankCode} <ChevronDown size={12} className="inline -rotate-90" /></span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Step 2: Select Branch ── */}
                    {step === 2 && (
                        <div>
                            <button type="button" onClick={() => setStep(1)} className="text-xs text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-1 hover:underline">
                                ← Back to banks
                            </button>
                            <div className="mb-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-sm font-medium text-emerald-800 dark:text-emerald-300">
                                {form.bankName}
                            </div>
                            <input
                                type="text"
                                placeholder="Search by branch name or district..."
                                value={branchSearch}
                                onChange={e => setBranchSearch(e.target.value)}
                                autoComplete="off"
                                className="w-full pl-4 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-3"
                            />
                            {loadingBranches ? (
                                <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
                                    <Loader2 size={20} className="animate-spin" />
                                    <span className="text-sm">Loading branches...</span>
                                </div>
                            ) : (
                                <div className="max-h-56 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                    {filteredBranches.length === 0 ? (
                                        <p className="text-sm text-center py-6 text-gray-400">No branches found</p>
                                    ) : filteredBranches.map(branch => (
                                        <button
                                            type="button"
                                            key={branch.branchId}
                                            onClick={() => handleSelectBranch(branch)}
                                            className="w-full text-left px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-sm text-gray-800 dark:text-gray-200 transition-colors flex items-center justify-between group"
                                        >
                                            <span>{branch.branchName}</span>
                                            <span className="text-xs text-gray-400 group-hover:text-emerald-600">{branch.district}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Step 3: Account Details ── */}
                    {step === 3 && (
                        <form onSubmit={handleSubmit} autoComplete="off">
                            <button type="button" onClick={() => setStep(hasBranches ? 2 : 1)} className="text-xs text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-1 hover:underline">
                                ← Back to {hasBranches ? 'branches' : 'banks'}
                            </button>

                            {/* Summary badges */}
                            <div className="grid grid-cols-2 gap-2 mb-5">
                                <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs">
                                    <p className="text-gray-400 mb-0.5">Bank</p>
                                    <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">{form.bankName}</p>
                                </div>
                                <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs">
                                    <p className="text-gray-400 mb-0.5">Branch</p>
                                    <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                                        {form.branchName || <span className="italic text-gray-400">No branch (head office)</span>}
                                    </p>
                                </div>
                            </div>

                            {/* Account Number */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Account Number
                                </label>
                                <div className="relative">
                                    <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={displayAccountNumber}
                                        onChange={handleAccountInput}
                                        placeholder="Enter account number"
                                        autoComplete="off"
                                        className="w-full pl-9 pr-4 py-3 font-mono text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 tracking-wider"
                                    />
                                </div>
                            </div>

                            {/* Account Holder Name */}
                            <div className="mb-5">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Account Holder Name
                                </label>
                                <div className="relative">
                                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={form.accountHolderName}
                                        onChange={e => setForm(f => ({ ...f, accountHolderName: e.target.value }))}
                                        placeholder="Full name as on bank record"
                                        autoComplete="off"
                                        className="w-full pl-9 pr-4 py-3 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            {/* Security notice */}
                            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl mb-4 text-xs text-blue-700 dark:text-blue-300">
                                <Shield size={14} className="mt-0.5 shrink-0" />
                                <span>Your account number is encrypted with AES-256 before storage. Even our development team cannot read it.</span>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl mb-4 text-sm text-red-700 dark:text-red-300">
                                    <AlertCircle size={14} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {isSaving ? <><Loader2 size={16} className="animate-spin" /> Encrypting & Saving...</> : 'Save Bank Account'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddBankModal;
