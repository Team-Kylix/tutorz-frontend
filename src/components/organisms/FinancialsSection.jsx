import React, { useState, useEffect, useCallback } from 'react';
import { Building2, CreditCard, Plus, Trash2, Shield, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { getFinancialSummary, removeBankDetails, removeCardToken } from '../../services/api/financialService';
import AddBankModal from './AddBankModal';
import AddCardModal from './AddCardModal';
import { ROLES } from '../../utils/constants';

// ── Card brand colour map ──────────────────────────────────────────────
const brandGradients = {
    Visa:       'linear-gradient(135deg, #1a1a6e 0%, #283593 50%, #1565C0 100%)',
    Mastercard: 'linear-gradient(135deg, #4a0000 0%, #b71c1c 50%, #e65100 100%)',
    Amex:       'linear-gradient(135deg, #006064 0%, #00838f 50%, #26c6da 100%)',
    Discover:   'linear-gradient(135deg, #bf360c 0%, #e64a19 50%, #f9a825 100%)',
};

const defaultCardGradient = 'linear-gradient(135deg, #1a237e 0%, #4a148c 50%, #6a1b9a 100%)';
const bankCardGradient    = 'linear-gradient(135deg, #0d1117 0%, #1c2a3a 40%, #0f2027 100%)';

// EMV Chip SVG
const ChipSVG = () => (
    <svg width="44" height="34" viewBox="0 0 44 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
        <rect width="44" height="34" rx="5" fill="#D4A843"/>
        <rect x="1" y="1" width="42" height="32" rx="4" fill="url(#chipGrad)"/>
        {/* Contact pads */}
        <rect x="4" y="4" width="16" height="11" rx="1" fill="#C8961E" opacity="0.7"/>
        <rect x="24" y="4" width="16" height="11" rx="1" fill="#C8961E" opacity="0.7"/>
        <rect x="4" y="19" width="16" height="11" rx="1" fill="#C8961E" opacity="0.7"/>
        <rect x="24" y="19" width="16" height="11" rx="1" fill="#C8961E" opacity="0.7"/>
        {/* Center contact */}
        <rect x="14" y="11" width="16" height="12" rx="2" fill="#B8860B" opacity="0.8"/>
        <rect x="16" y="13" width="12" height="8" rx="1" fill="#D4A843" opacity="0.6"/>
        <defs>
            <linearGradient id="chipGrad" x1="0" y1="0" x2="44" y2="34" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#F5C842"/>
                <stop offset="100%" stopColor="#A87820"/>
            </linearGradient>
        </defs>
    </svg>
);

// Visa-style wordmark
const VisaLogo = () => (
    <span style={{ fontFamily: 'serif', fontWeight: 900, fontSize: '20px', color: '#fff', letterSpacing: '-1px', fontStyle: 'italic' }}>VISA</span>
);

// Mastercard circles
const MastercardLogo = () => (
    <div className="flex items-center" style={{ gap: '-4px' }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#EB001B', opacity: 0.9 }} />
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#F79E1B', opacity: 0.9, marginLeft: -8 }} />
    </div>
);

const CardBrandLogo = ({ brand }) => {
    if (brand === 'Visa') return <VisaLogo />;
    if (brand === 'Mastercard') return <MastercardLogo />;
    return <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: 1 }}>{brand?.toUpperCase()}</span>;
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
const FinancialsSection = ({ role, readOnly = false }) => {
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
                <button type="button" onClick={loadSummary} className="ml-auto text-xs underline flex items-center gap-1">
                    <RefreshCw size={12} /> Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ── BANK ACCOUNT (Tutor + Institute only) ── */}
            {canAddBank && (
                <div className="group" style={{ maxWidth: 380, marginLeft: 'auto', marginRight: 'auto' }}>
                    {summary?.hasBankDetails ? (
                        /* Saved bank details — ATM card shape */
                        <div
                            style={{
                                background: bankCardGradient,
                                borderRadius: '16px',
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 6px 20px rgba(0,0,0,0.3)',
                                aspectRatio: '1.586 / 1',
                                color: '#fff',
                                padding: '6%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                            }}
                        >
                            {/* Glare overlay */}
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 60%)', pointerEvents: 'none', zIndex: 1 }} />
                            {/* Decorative circle top-right */}
                            <div style={{ position: 'absolute', top: '-30%', right: '-10%', width: '55%', paddingBottom: '55%', borderRadius: '50%', background: 'rgba(52,211,153,0.07)', zIndex: 0 }} />
                            <div style={{ position: 'absolute', bottom: '-20%', left: '-8%', width: '40%', paddingBottom: '40%', borderRadius: '50%', background: 'rgba(20,184,166,0.06)', zIndex: 0 }} />

                            {/* Row 1: Label + Encrypted badge */}
                            <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ padding: '4px 6px', background: 'rgba(52,211,153,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center' }}>
                                        <Building2 size={13} color="#6ee7b7" />
                                    </div>
                                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Bank Account</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Shield size={11} color="#6ee7b7" />
                                    <span style={{ fontSize: 9, color: '#6ee7b7', letterSpacing: 1 }}>ENCRYPTED</span>
                                </div>
                            </div>

                            {/* Row 2: Bank icon (no chip — bank accounts don't have EMV chips) */}
                            <div style={{ position: 'relative', zIndex: 2 }}>
                                <div style={{ width: 44, height: 34, background: 'rgba(52,211,153,0.12)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(52,211,153,0.2)' }}>
                                    <Building2 size={18} color="#6ee7b7" />
                                </div>
                            </div>

                            {/* Row 3: Account number */}
                            <div style={{ position: 'relative', zIndex: 2 }}>
                                <p style={{ fontFamily: 'monospace', fontSize: 'clamp(10px, 3.2vw, 18px)', letterSpacing: '0.15em', color: 'rgba(219,234,254,0.95)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'clip' }}>
                                    {summary.maskedAccountNumber || '•••• •••• •••• •••• ••••'}
                                </p>
                            </div>

                            {/* Row 4: Cardholder + Bank name + Actions */}
                            <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div>
                                    <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, textTransform: 'uppercase', margin: 0 }}>Account Holder</p>
                                    <p style={{ fontSize: 'clamp(10px, 2vw, 13px)', fontWeight: 600, color: '#fff', margin: 0, letterSpacing: 1, textTransform: 'uppercase' }}>{summary.accountHolderName}</p>
                                    <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', margin: '2px 0 0', letterSpacing: 0.5 }}>{summary.bankName}{summary.branchName ? ` · ${summary.branchName}` : ''}</p>
                                </div>
                                {!readOnly && (
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button
                                            type="button"
                                            onClick={() => setIsBankModalOpen(true)}
                                            style={{ fontSize: 11, padding: '5px 10px', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
                                        >
                                            Change
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setConfirm({ type: 'bank', message: 'Remove your saved bank account? This action cannot be undone.' })}
                                            disabled={isRemoving}
                                            style={{ padding: '5px 8px', background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 8, color: '#fca5a5', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Add bank CTA — only shown in edit mode */
                        !readOnly ? (
                            <button
                                type="button"
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
                        ) : (
                            <div className="w-full border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-5 flex items-center gap-4 opacity-60">
                                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                                    <Building2 size={20} className="text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">No Bank Account</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">No bank account linked yet</p>
                                </div>
                            </div>
                        )
                    )}
                </div>
            )}

            {/* ── PAYMENT CARD (all roles) ── ATM card shape */}
            <div className="group" style={{ maxWidth: 380, marginLeft: 'auto', marginRight: 'auto' }}>
                {summary?.hasCard ? (
                    /* Saved card display — ATM card shaped */
                    <div
                        style={{
                            background: brandGradients[summary.cardBrand] || defaultCardGradient,
                            borderRadius: '16px',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.45), 0 6px 20px rgba(0,0,0,0.3)',
                            aspectRatio: '1.586 / 1',
                            color: '#fff',
                            padding: '6%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                        }}
                    >
                        {/* Glare top-left */}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 55%)', pointerEvents: 'none', zIndex: 1 }} />
                        {/* Large background circle */}
                        <div style={{ position: 'absolute', top: '-30%', right: '-15%', width: '65%', paddingBottom: '65%', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 0 }} />
                        <div style={{ position: 'absolute', bottom: '-25%', left: '-10%', width: '45%', paddingBottom: '45%', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', zIndex: 0 }} />

                        {/* Row 1: Label + Brand */}
                        <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ padding: '4px 6px', background: 'rgba(255,255,255,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center' }}>
                                    <CreditCard size={13} color="rgba(255,255,255,0.9)" />
                                </div>
                                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Payment Card</span>
                            </div>
                            <CardBrandLogo brand={summary.cardBrand} />
                        </div>

                        {/* Row 2: Chip */}
                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <ChipSVG />
                        </div>

                        {/* Row 3: Card number */}
                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <p style={{ fontFamily: 'monospace', fontSize: 'clamp(12px, 3.5vw, 20px)', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.95)', margin: 0 }}>
                                •••• •••• •••• {summary.cardLast4}
                            </p>
                        </div>

                        {/* Row 4: Cardholder + Actions */}
                        <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div>
                                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, textTransform: 'uppercase', margin: 0 }}>Card Holder</p>
                                <p style={{ fontSize: 'clamp(10px, 2vw, 13px)', fontWeight: 600, color: '#fff', margin: 0, letterSpacing: 1, textTransform: 'uppercase' }}>{summary.cardholderName}</p>
                            </div>
                            {!readOnly && (
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button
                                        type="button"
                                        onClick={() => setIsCardModalOpen(true)}
                                        style={{ fontSize: 11, padding: '5px 10px', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
                                    >
                                        Change
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setConfirm({ type: 'card', message: 'Remove your saved payment card? You will need to add it again to make payments.' })}
                                        disabled={isRemoving}
                                        style={{ padding: '5px 8px', background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 8, color: '#fca5a5', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Add card CTA — only shown in edit mode */
                    !readOnly ? (
                        <button
                            type="button"
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
                    ) : (
                        <div className="w-full border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-5 flex items-center gap-4 opacity-60">
                            <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                                <CreditCard size={20} className="text-violet-600 dark:text-violet-400" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">No Payment Card</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">No payment card linked yet</p>
                            </div>
                        </div>
                    )
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
