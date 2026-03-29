import React, { useState, useEffect, useCallback } from 'react';
import { Building2, CreditCard, Plus, Trash2, Shield, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { getFinancialSummary, removeBankDetails, removeCardToken } from '../../services/api/financialService';
import AddBankModal from './AddBankModal';
import AddCardModal from './AddCardModal';
import { ROLES } from '../../utils/constants';

// ── Card brand colour map ──────────────────────────────────────────────
const brandGradients = {
    Visa:       'from-blue-900 to-blue-700',
    Mastercard: 'from-red-800 to-orange-600',
    Amex:       'from-cyan-800 to-cyan-600',
    Discover:   'from-orange-700 to-yellow-600',
};

const BrandBadge = ({ brand }) => {
    const colors = {
        Visa: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
        Mastercard: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
        Amex: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
        Discover: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
    };
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors[brand] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
            {brand?.toUpperCase()}
        </span>
    );
};

const ConfirmDialog = ({ message, onConfirm, onCancel }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onCancel}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl max-w-sm mx-4 border border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
                    <AlertCircle size={20} className="text-red-600 dark:text-red-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Confirm Removal</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">{message}</p>
            <div className="flex gap-3">
                <button onClick={onCancel} className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    Cancel
                </button>
                <button onClick={onConfirm} className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors">
                    Remove
                </button>
            </div>
        </div>
    </div>
);

/**
 * FinancialsSection
 * 
 * Shows the user their saved bank account (masked) and payment card.
 * Provides + Add / Change / Remove actions.
 * 
 * Props:
 *   role — ROLES.TUTOR | ROLES.INSTITUTE | ROLES.STUDENT
 */
const FinancialsSection = ({ role }) => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isBankModalOpen, setIsBankModalOpen] = useState(false);
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [confirm, setConfirm] = useState(null); // { type: 'bank'|'card', message: string }
    const [isRemoving, setIsRemoving] = useState(false);

    const canAddBank = role === ROLES.TUTOR || role === ROLES.INSTITUTE;

    const loadSummary = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await getFinancialSummary();
            if (res.success) setSummary(res.data);
            else setError(res.message || 'Failed to load financial data.');
        } catch (err) {
            setError('Could not load financial details.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadSummary(); }, [loadSummary]);

    const handleRemoveBank = async () => {
        setIsRemoving(true);
        try {
            const res = await removeBankDetails();
            if (res.success) setSummary(s => ({ ...s, hasBankDetails: false, maskedAccountNumber: null, bankName: null, branchName: null, accountHolderName: null }));
        } catch { /* silently handle */ }
        finally { setIsRemoving(false); setConfirm(null); }
    };

    const handleRemoveCard = async () => {
        setIsRemoving(true);
        try {
            const res = await removeCardToken();
            if (res.success) setSummary(s => ({ ...s, hasCard: false, cardLast4: null, cardBrand: null, cardholderName: null }));
        } catch { /* silently handle */ }
        finally { setIsRemoving(false); setConfirm(null); }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm">Loading financial details...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
                <button onClick={loadSummary} className="ml-auto text-xs underline flex items-center gap-1">
                    <RefreshCw size={12} /> Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* ── BANK ACCOUNT (Tutor + Institute only) ── */}
            {canAddBank && (
                <div className="group">
                    {summary?.hasBankDetails ? (
                        /* Saved bank details card */
                        <div className="bg-gradient-to-br from-gray-900 to-slate-800 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden border border-gray-700">
                            {/* Decorative circles */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 opacity-5 rounded-full -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-20 h-20 bg-teal-500 opacity-10 rounded-full translate-y-1/2 -translate-x-1/2" />

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                                            <Building2 size={16} className="text-emerald-400" />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Bank Account</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="p-1 bg-emerald-500/20 rounded-lg">
                                            <Shield size={12} className="text-emerald-400" />
                                        </div>
                                        <span className="text-[10px] text-emerald-400">Encrypted</span>
                                    </div>
                                </div>

                                <p className="font-mono text-xl tracking-widest mb-1 text-blue-100">
                                    {summary.maskedAccountNumber || '•••• •••• ••••'}
                                </p>
                                <p className="text-xs text-gray-400 mb-3">{summary.accountHolderName}</p>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-400">{summary.bankName}</p>
                                        <p className="text-xs text-gray-500">{summary.branchName}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setIsBankModalOpen(true)}
                                            className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                                        >
                                            Change
                                        </button>
                                        <button
                                            onClick={() => setConfirm({ type: 'bank', message: 'Remove your saved bank account? This action cannot be undone.' })}
                                            disabled={isRemoving}
                                            className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Add bank CTA */
                        <button
                            onClick={() => setIsBankModalOpen(true)}
                            className="w-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-5 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all group flex items-center gap-4"
                        >
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl group-hover:scale-110 transition-transform">
                                <Building2 size={20} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">Add Bank Account</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">For receiving payouts (AES-256 encrypted)</p>
                            </div>
                            <Plus size={18} className="ml-auto text-emerald-500 dark:text-emerald-400" />
                        </button>
                    )}
                </div>
            )}

            {/* ── PAYMENT CARD (all roles) ── */}
            <div className="group">
                {summary?.hasCard ? (
                    /* Saved card display */
                    <div className={`bg-gradient-to-br ${brandGradients[summary.cardBrand] || 'from-violet-900 to-purple-800'} rounded-2xl p-5 text-white shadow-xl relative overflow-hidden border border-white/10`}>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-white/20 rounded-lg">
                                        <CreditCard size={16} />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">Payment Card</span>
                                </div>
                                <BrandBadge brand={summary.cardBrand} />
                            </div>

                            <p className="font-mono text-xl tracking-widest mb-1">
                                •••• •••• •••• {summary.cardLast4}
                            </p>
                            <p className="text-xs text-white/60 mb-3">{summary.cardholderName}</p>

                            <div className="flex items-center justify-end gap-2">
                                <button
                                    onClick={() => setIsCardModalOpen(true)}
                                    className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    Change
                                </button>
                                <button
                                    onClick={() => setConfirm({ type: 'card', message: 'Remove your saved payment card? You will need to add it again to make payments.' })}
                                    disabled={isRemoving}
                                    className="p-1.5 text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Add card CTA */
                    <button
                        onClick={() => setIsCardModalOpen(true)}
                        className="w-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-5 hover:border-violet-400 dark:hover:border-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-all group flex items-center gap-4"
                    >
                        <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-xl group-hover:scale-110 transition-transform">
                            <CreditCard size={20} className="text-violet-600 dark:text-violet-400" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Add Payment Card</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Secured via PayHere tokenization — card never stored here</p>
                        </div>
                        <Plus size={18} className="ml-auto text-violet-500 dark:text-violet-400" />
                    </button>
                )}
            </div>

            {/* Security footer note */}
            <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 px-1">
                <Shield size={12} className="shrink-0" />
                <span>Financial data is protected by end-to-end encryption. We never store raw card numbers.</span>
            </div>

            {/* Modals */}
            <AddBankModal
                isOpen={isBankModalOpen}
                onClose={() => setIsBankModalOpen(false)}
                onSuccess={(data) => { setSummary(data); setIsBankModalOpen(false); }}
            />
            <AddCardModal
                isOpen={isCardModalOpen}
                onClose={() => setIsCardModalOpen(false)}
                onSuccess={(data) => { setSummary(data); setIsCardModalOpen(false); }}
            />

            {/* Confirm Dialog */}
            {confirm && (
                <ConfirmDialog
                    message={confirm.message}
                    onConfirm={confirm.type === 'bank' ? handleRemoveBank : handleRemoveCard}
                    onCancel={() => setConfirm(null)}
                />
            )}
        </div>
    );
};

export default FinancialsSection;
