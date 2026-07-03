import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    X, Wallet, CreditCard, Banknote, Loader2,
    AlertCircle, CheckCircle2, Info
} from 'lucide-react';
import { getAvailableBalance, processWithdrawal } from '../../services/api/withdrawalService';

const PAYHERE_COMMISSION_RATE = 0.03; // 3% online payout commission

const formatCurrency = (val) =>
    val != null ? `Rs ${Number(val).toLocaleString('en-LK', { minimumFractionDigits: 2 })}` : '—';

/**
 * WithdrawModal — shown on Institute side when processing a withdrawal for a Tutor.
 *
 * Props:
 *   isOpen         — boolean
 *   onClose        — () => void
 *   tutor          — { tutorId, firstName, lastName, registrationNumber }
 *   instituteId    — string
 *   onSuccess      — () => void  called after successful withdrawal
 */
const WithdrawModal = ({ isOpen, onClose, tutor, onSuccess }) => {
    const [availableBalance, setAvailableBalance] = useState(null);
    const [isLoadingBalance, setIsLoadingBalance] = useState(false);

    const [withdrawalAmount, setWithdrawalAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('OnHand'); // 'OnHand' | 'Online'

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    // Derived - when no balance is available yet, allow any positive amount
    const amount = parseFloat(withdrawalAmount) || 0;
    const commission = paymentMethod === 'Online' ? Math.round(amount * PAYHERE_COMMISSION_RATE * 100) / 100 : 0;
    const netAmount = amount - commission;
    const isAmountValid = amount > 0 && (availableBalance === null || amount <= availableBalance);

    // Set available balance when modal opens
    useEffect(() => {
        if (!isOpen || !tutor?.tutorId) return;
        setAvailableBalance(tutor.availableBalance ?? 0);
        setWithdrawalAmount('');
        setPaymentMethod('OnHand');
        setIsSuccess(false);
        setError('');
    }, [isOpen, tutor]);

    const handleSubmit = async () => {
        if (!isAmountValid) return;
        setIsSubmitting(true);
        setError('');
        try {
            await processWithdrawal({
                tutorId: tutor.tutorId,
                withdrawalAmount: amount,
                paymentMethod,
            });
            setIsSuccess(true);
            if (onSuccess) onSuccess();
        } catch (err) {
            setError(err?.response?.data?.message ?? 'Failed to process withdrawal. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setIsSuccess(false);
        setError('');
        setWithdrawalAmount('');
        setPaymentMethod('OnHand');
        onClose();
    };

    if (!isOpen) return null;

    const tutorName = tutor ? `${tutor.firstName ?? ''} ${tutor.lastName ?? ''}`.trim() : '';

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={handleClose}>
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shadow">
                            <Wallet className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900 dark:text-white">Withdraw to Tutor</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{tutorName}</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {isSuccess ? (
                        /* Success State */
                        <div className="text-center py-6 space-y-3">
                            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Withdrawal Processed!</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {formatCurrency(amount)} has been processed for {tutorName}.
                                {paymentMethod === 'Online' && (
                                    <span className="block mt-1">
                                        Online payout fee of {formatCurrency(commission)} was deducted from the tutor's amount.
                                    </span>
                                )}
                            </p>
                            <button
                                onClick={handleClose}
                                className="mt-2 px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Balance Display */}
                            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl p-4 text-white">
                                <p className="text-indigo-200 text-xs font-medium mb-1">Available Balance</p>
                                {isLoadingBalance ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span className="text-lg">Loading…</span>
                                    </div>
                                ) : (
                                    <p className="text-2xl font-bold">{formatCurrency(availableBalance)}</p>
                                )}
                                <p className="text-indigo-200 text-xs mt-1">
                                    Total earnings minus previous withdrawals.
                                </p>
                            </div>

                            {/* Withdrawal Amount */}
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Withdrawal Amount (Rs)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max={availableBalance ?? undefined}
                                    step="0.01"
                                    value={withdrawalAmount}
                                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                                    placeholder="e.g. 5000.00"
                                    disabled={isLoadingBalance || availableBalance === null}
                                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:opacity-50"
                                />
                                {amount > 0 && availableBalance !== null && amount > availableBalance && (
                                    <p className="text-xs text-red-500 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        Amount exceeds available balance.
                                    </p>
                                )}
                            </div>

                            {/* Payment Method */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Payment Method
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setPaymentMethod('OnHand')}
                                        className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${paymentMethod === 'OnHand'
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                                            : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                                            }`}
                                    >
                                        <Banknote className="h-5 w-5 shrink-0" />
                                        <div>
                                            <p className="text-sm font-semibold">On Hand</p>
                                            <p className="text-xs opacity-70">Cash payment</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod('Online')}
                                        className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${paymentMethod === 'Online'
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                                            : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                                            }`}
                                    >
                                        <CreditCard className="h-5 w-5 shrink-0" />
                                        <div>
                                            <p className="text-sm font-semibold">Online</p>
                                            <p className="text-xs opacity-70">Card / PayHere</p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Commission Breakdown (Online only) */}
                            {paymentMethod === 'Online' && amount > 0 && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 space-y-2 border border-amber-200 dark:border-amber-800">
                                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                                        <Info className="h-4 w-4 shrink-0" />
                                        <span className="text-xs font-semibold">Online Payout Fee Breakdown</span>
                                    </div>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between text-gray-700 dark:text-gray-300">
                                            <span>Withdrawal Amount</span>
                                            <span className="font-medium">{formatCurrency(amount)}</span>
                                        </div>
                                        <div className="flex justify-between text-red-600 dark:text-red-400">
                                            <span>PayHere Commission (3%) <span className="text-xs opacity-70">deducted from tutor</span></span>
                                            <span>– {formatCurrency(commission)}</span>
                                        </div>
                                        <div className="flex justify-between text-green-700 dark:text-green-400 font-semibold border-t border-amber-200 dark:border-amber-700 pt-1 mt-1">
                                            <span>Net Tutor Take-Home</span>
                                            <span>{formatCurrency(netAmount)}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-amber-600 dark:text-amber-400 opacity-80">
                                        The institute pays the full {formatCurrency(amount)}. The payout fee is deducted from the tutor's side.
                                    </p>
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-sm">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Summary Row */}
                            {isAmountValid && (
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-1.5 text-sm">
                                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                        <span>Current Balance</span>
                                        <span>{formatCurrency(availableBalance)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                        <span>Withdrawal</span>
                                        <span>– {formatCurrency(amount)}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-600 pt-1.5 mt-1.5">
                                        <span>Remaining Balance</span>
                                        <span>{formatCurrency((availableBalance ?? 0) - amount)}</span>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-1">
                                <button
                                    onClick={handleClose}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !isAmountValid}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Processing…
                                        </>
                                    ) : (
                                        <>
                                            <Wallet className="h-4 w-4" />
                                            Process Withdrawal
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default WithdrawModal;
