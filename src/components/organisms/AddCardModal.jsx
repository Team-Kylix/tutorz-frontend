import React, { useState, useEffect } from 'react';
import {
  X, CreditCard, Shield, AlertCircle, Loader2, CheckCircle2,
  RefreshCw, Info
} from 'lucide-react';
import { initiatePreapproval, getFinancialSummary } from '../../services/api/financialService';

// ── PayHere Preapproval — Automated Charging Consent Modal ────────────────────
//
// Flow:
//  1. Student clicks "Add Payment Card" → this modal opens
//  2. We show a consent screen explaining what Automated Charging is
//  3. On confirm → backend generates a preapproval hash → PayHere JS popup opens
//  4. Student enters card in PayHere's secure hosted UI (Rs.1 is charged & instantly refunded)
//  5. PayHere calls our /preapproval-notify webhook with customer_token
//  6. We poll the financial summary until the card appears, then show success
//
// Note: Only Visa and Mastercard support automated charging.
//
const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 10;

const AddCardModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState('consent'); // 'consent' | 'waiting' | 'success' | 'error'
  const [error, setError] = useState('');
  const [pollCount, setPollCount] = useState(0);

  // Reset when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('consent');
      setError('');
      setPollCount(0);
    }
  }, [isOpen]);

  // Ensure PayHere JS is loaded
  const injectPayHereScript = () => {
    if (!document.getElementById('payhere-js')) {
      const script = document.createElement('script');
      script.id = 'payhere-js';
      script.src = 'https://www.payhere.lk/lib/payhere.js';
      script.async = true;
      document.body.appendChild(script);
    }
  };

  // Poll the summary API until the card token appears (webhook may take a few seconds)
  const pollForCard = async (attempt = 0) => {
    if (attempt >= POLL_MAX_ATTEMPTS) {
      setStep('error');
      setError(
        'Your card approval is being processed. It may take a moment to appear — ' +
        'please refresh your profile page in a few seconds.'
      );
      return;
    }

    try {
      const res = await getFinancialSummary();
      if (res?.success && res.data?.hasCard) {
        setStep('success');
        // Notify parent to refresh card display
        setTimeout(() => {
          onSuccess(res.data);
        }, 2000);
        return;
      }
    } catch {
      // Ignore poll errors silently
    }

    // Wait and try again
    setPollCount(attempt + 1);
    setTimeout(() => pollForCard(attempt + 1), POLL_INTERVAL_MS);
  };

  const handleStartPreapproval = async () => {
    setError('');
    setStep('waiting');
    injectPayHereScript();

    try {
      // 1. Get preapproval params from our backend (hash, order_id, etc.)
      const res = await initiatePreapproval();
      if (!res?.success || !res.data) {
        setStep('error');
        setError(res?.message || 'Failed to initiate preapproval. Please try again.');
        return;
      }

      const preapprovalParams = res.data;

      // 2. Wait for PayHere JS to be ready then open the popup
      const openPayHere = () => {
        if (!window.payhere) {
          setTimeout(openPayHere, 300);
          return;
        }

        window.payhere.onCompleted = function (orderId) {
          // PayHere popup closed after successful preapproval
          // The actual customer_token is delivered via server-to-server notify_url
          // Poll our API until it appears
          pollForCard(0);
        };

        window.payhere.onDismissed = function () {
          setStep('consent');
          setError('Card preapproval was cancelled. You can try again anytime.');
        };

        window.payhere.onError = function (error) {
          setStep('error');
          setError('PayHere error: ' + error);
        };

        window.payhere.startPayment(preapprovalParams);
      };

      openPayHere();
    } catch (err) {
      setStep('error');
      setError(err?.message || 'An error occurred. Please try again.');
    }
  };

  const handleClose = () => {
    setStep('consent');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={step === 'waiting' ? undefined : handleClose}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <CreditCard size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold">Add Payment Card</h2>
                <p className="text-xs text-violet-200">Powered by PayHere Automated Charging</p>
              </div>
            </div>
            {step !== 'waiting' && (
              <button
                type="button"
                onClick={handleClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* ── Consent Step ────────────────────────────────────────────── */}
        {step === 'consent' && (
          <div className="p-6 space-y-5">
            {/* How it works */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                How it works
              </p>
              {[
                {
                  icon: '1',
                  title: 'Enter your card securely',
                  desc: "You'll enter your card details directly in PayHere's secure payment window — we never see your card number."
                },
                {
                  icon: '2',
                  title: 'LKR 30.00 registration fee',
                  desc: 'A one-time card registration fee of LKR 30.00 is charged. This covers the cost of securely tokenizing your card with PayHere.'
                },
                {
                  icon: '3',
                  title: 'Pay fees in one click',
                  desc: 'After approval, you can pay any class fee instantly without re-entering your card details.'
                },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs font-bold flex items-center justify-center">
                    {step.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{step.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Fee notice */}
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-xs text-amber-700 dark:text-amber-300">
              <Info size={14} className="shrink-0" />
              <span>
                A <strong>LKR 30.00</strong> one-time card registration fee applies.
                Automated charging supports <strong>Visa</strong> and <strong>Mastercard</strong> only.
              </span>
            </div>

            {/* Security note */}
            <div className="flex items-start gap-2 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl text-xs text-violet-700 dark:text-violet-300">
              <Shield size={14} className="mt-0.5 shrink-0" />
              <span>
                Your card details are handled exclusively by PayHere. We only receive a secure encrypted token.
                You can cancel this preapproval at any time from your profile.
              </span>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-sm text-red-700 dark:text-red-300">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleStartPreapproval}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <CreditCard size={16} />
              Register Card — LKR 30.00
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* ── Waiting Step ────────────────────────────────────────────── */}
        {step === 'waiting' && (
          <div className="p-8 flex flex-col items-center justify-center gap-4 min-h-[220px]">
            <Loader2 size={40} className="animate-spin text-violet-500" />
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {pollCount === 0 ? 'Opening PayHere...' : 'Saving your card...'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {pollCount === 0
                  ? 'Complete the card preapproval in the PayHere window.'
                  : `Verifying approval (${Math.min(pollCount, POLL_MAX_ATTEMPTS)}/${POLL_MAX_ATTEMPTS})...`
                }
              </p>
            </div>
          </div>
        )}

        {/* ── Success Step ─────────────────────────────────────────────── */}
        {step === 'success' && (
          <div className="p-8 flex flex-col items-center justify-center gap-4 min-h-[220px]">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 size={36} className="text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-gray-900 dark:text-white">Card Added!</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Your card has been pre-approved. You can now pay fees in one click.
              </p>
            </div>
          </div>
        )}

        {/* ── Error Step ───────────────────────────────────────────────── */}
        {step === 'error' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-sm text-red-700 dark:text-red-300">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => { setStep('consent'); setError(''); }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <RefreshCw size={14} /> Try Again
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddCardModal;
