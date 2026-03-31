import React, { useState } from 'react';
import { X, CreditCard, User, Lock, Shield, AlertCircle, CalendarDays, Loader2 } from 'lucide-react';
import { mockPayHereTokenize, saveCardToken } from '../../services/api/financialService';

// Card brand detection
const detectBrand = (number) => {
    const n = number.replace(/\s/g, '');
    if (n.startsWith('4')) return 'Visa';
    if (n.startsWith('5') || (n >= '2221' && n <= '2720')) return 'Mastercard';
    if (n.startsWith('34') || n.startsWith('37')) return 'Amex';
    if (n.startsWith('6')) return 'Discover';
    return '';
};

const BrandLogo = ({ brand }) => {
    const colors = {
        Visa: 'bg-blue-600',
        Mastercard: 'bg-red-500',
        Amex: 'bg-cyan-600',
        Discover: 'bg-orange-500',
    };
    return brand ? (
        <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded ${colors[brand] || 'bg-gray-500'}`}>
            {brand.toUpperCase()}
        </span>
    ) : null;
};

const AddCardModal = ({ isOpen, onClose, onSuccess }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        cardholderName: '',
        cardNumber: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: '',
    });

    const currentYear = new Date().getFullYear();

    // Format card number as groups of 4
    const handleCardNumber = (e) => {
        const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
        const formatted = raw.replace(/(.{4})/g, '$1 ').trim();
        setForm(f => ({ ...f, cardNumber: formatted }));
    };

    // CVV: 3-4 digits only
    const handleCvv = (e) => {
        const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
        setForm(f => ({ ...f, cvv: raw }));
    };

    const handleExpiry = (field) => (e) => {
        const raw = e.target.value.replace(/\D/g, '').slice(0, field === 'expiryMonth' ? 2 : 4);
        setForm(f => ({ ...f, [field]: raw }));
    };

    const brand = detectBrand(form.cardNumber);

    const validate = () => {
        const stripped = form.cardNumber.replace(/\s/g, '');
        if (stripped.length < 13) return 'Please enter a valid card number.';
        if (!form.cardholderName.trim()) return 'Please enter the cardholder name.';
        const month = parseInt(form.expiryMonth);
        if (!month || month < 1 || month > 12) return 'Please enter a valid expiry month (01-12).';
        const year = parseInt(form.expiryYear);
        if (!year || year < currentYear || year > currentYear + 20) return 'Please enter a valid expiry year.';
        if (!form.cvv || form.cvv.length < 3) return 'Please enter the CVV.';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent bubbling to parent form (e.g. EditProfileModal)
        const validationError = validate();
        if (validationError) { setError(validationError); return; }
        setError('');
        setIsSaving(true);

        try {
            // Step 1: "Tokenize" via mock PayHere (real SDK would send card to PayHere servers directly)
            const tokenResult = await mockPayHereTokenize({
                cardNumber: form.cardNumber,
                cardholderName: form.cardholderName,
                expiryMonth: form.expiryMonth,
                expiryYear: form.expiryYear,
                // Note: CVV is used only by the PayHere SDK and never sent to our backend
            });

            // Step 2: Send ONLY the token + metadata to our backend (never the card number or CVV)
            const res = await saveCardToken({
                token: tokenResult.token,
                last4: tokenResult.last4,
                brand: tokenResult.brand,
                cardholderName: tokenResult.cardholderName,
            });

            if (res.success) {
                onSuccess(res.data);
                onClose();
            } else {
                setError(res.message || 'Failed to save card.');
            }
        } catch (err) {
            setError(err?.message || 'An error occurred.');
        } finally {
            // Immediately scrub sensitive card data from memory
            setForm({ cardholderName: '', cardNumber: '', expiryMonth: '', expiryYear: '', cvv: '' });
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        setForm({ cardholderName: '', cardNumber: '', expiryMonth: '', expiryYear: '', cvv: '' });
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    const last4 = form.cardNumber.replace(/\s/g, '').slice(-4);
    const maskedPreview = form.cardNumber.replace(/\s/g, '').length > 4
        ? `•••• •••• •••• ${last4}`
        : '•••• •••• •••• ••••';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={handleClose}>
            <div
                className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-purple-700 p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-xl">
                                <CreditCard size={22} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">Add Payment Card</h2>
                                <p className="text-xs text-violet-200">Secured via PayHere tokenization</p>
                            </div>
                        </div>
                        <button type="button" onClick={handleClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Card Preview */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-8 h-6 bg-yellow-400/80 rounded-sm" /> {/* Chip */}
                            <BrandLogo brand={brand} />
                        </div>
                        <p className="font-mono text-sm tracking-widest mb-2 text-white/90">{maskedPreview}</p>
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-white/60 uppercase tracking-widest">
                                {form.cardholderName || 'Cardholder Name'}
                            </p>
                            <p className="text-xs text-white/60 font-mono">
                                {form.expiryMonth || 'MM'}/{form.expiryYear || 'YY'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} autoComplete="off" className="p-6 space-y-4">
                    {/* Cardholder Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Cardholder Name
                        </label>
                        <div className="relative">
                            <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={form.cardholderName}
                                onChange={e => setForm(f => ({ ...f, cardholderName: e.target.value.toUpperCase() }))}
                                placeholder="Name on card"
                                autoComplete="off"
                                className="w-full pl-9 pr-4 py-2.5 text-sm tracking-wider rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </div>
                    </div>

                    {/* Card Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Card Number
                        </label>
                        <div className="relative">
                            <CreditCard size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                inputMode="numeric"
                                value={form.cardNumber}
                                onChange={handleCardNumber}
                                placeholder="0000 0000 0000 0000"
                                autoComplete="cc-number"
                                maxLength={19}
                                className="w-full pl-9 pr-4 py-2.5 text-sm font-mono tracking-widest rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                            {brand && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <BrandLogo brand={brand} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Expiry + CVV row */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">MM</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={form.expiryMonth}
                                onChange={handleExpiry('expiryMonth')}
                                placeholder="01"
                                maxLength={2}
                                autoComplete="cc-exp-month"
                                className="w-full px-3 py-2.5 text-sm font-mono text-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">YYYY</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={form.expiryYear}
                                onChange={handleExpiry('expiryYear')}
                                placeholder="2026"
                                maxLength={4}
                                autoComplete="cc-exp-year"
                                className="w-full px-3 py-2.5 text-sm font-mono text-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                <Lock size={10} className="inline mr-1" /> CVV
                            </label>
                            <input
                                type="password"
                                inputMode="numeric"
                                value={form.cvv}
                                onChange={handleCvv}
                                placeholder="•••"
                                maxLength={4}
                                autoComplete="cc-csc"
                                className="w-full px-3 py-2.5 text-sm font-mono text-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </div>
                    </div>

                    {/* Security notice */}
                    <div className="flex items-start gap-2 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl text-xs text-violet-700 dark:text-violet-300">
                        <Shield size={14} className="mt-0.5 shrink-0" />
                        <span>Your card number and CVV are never sent to our servers. They are handled directly by PayHere's secure network.</span>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-sm text-red-700 dark:text-red-300">
                            <AlertCircle size={14} />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {isSaving
                            ? <><Loader2 size={16} className="animate-spin" /> Securing Card...</>
                            : 'Save Card Securely'
                        }
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddCardModal;
