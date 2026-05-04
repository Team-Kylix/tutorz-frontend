import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Loader2, 
  CreditCard, 
  ShieldCheck, 
  Info,
  ArrowRight,
  AlertCircle,
  ChevronRight,
  Receipt
} from 'lucide-react';
import Modal from '../molecules/Modal';
import Button from '../atoms/Button';
import { getFinancialSummary, initiateBillPayment } from '../../services/api/financialService';

const BillPaymentModal = ({ isOpen, onClose, bill, onPaymentSuccess }) => {
  const navigate = useNavigate();
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Card State
  const [cardToken, setCardToken] = useState(false);
  const [cardLast4, setCardLast4] = useState('');
  const [cardBrand, setCardBrand] = useState('');
  
  // Interaction State
  const [confirmCharge, setConfirmCharge] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // The backend uses Math.Ceiling((amount + 30) / 0.97 * 100) / 100
  const calculateTotal = (baseFee) => {
    if (!baseFee || baseFee <= 0) return 0;
    return Math.ceil((baseFee + 30) / 0.97 * 100) / 100;
  };

  useEffect(() => {
    if (isOpen && bill) {
      resetState();
      fetchData();
    }
  }, [isOpen, bill]);

  const resetState = () => {
    setErrorMsg('');
    setIsSuccess(false);
    setIsSubmitting(false);
    setConfirmCharge(false);
    setCardToken(false);
    setCardLast4('');
    setCardBrand('');
  };

  const fetchData = async () => {
    setLoadingInitial(true);
    try {
      const finRes = await getFinancialSummary();
      if (finRes?.success && finRes.data?.hasCard) {
        setCardToken(true);
        setCardLast4(finRes.data.cardLast4 || '');
        setCardBrand(finRes.data.cardBrand || '');
      }
    } catch (err) {
      setErrorMsg('Failed to load financial information.');
    } finally {
      setLoadingInitial(false);
    }
  };

  const handlePayClick = async () => {
    if (!bill) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await initiateBillPayment({
        billId: bill.billId,
        useSavedCard: true
      });

      if (!res?.success) {
        setErrorMsg(res?.message || 'Failed to process payment.');
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
      setIsSubmitting(false);
      
      // Auto close and refresh after a short delay
      setTimeout(() => {
        if (onPaymentSuccess) onPaymentSuccess();
        onClose();
      }, 2000);

    } catch (err) {
      setErrorMsg(err.message || 'An error occurred during payment.');
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !bill) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <CreditCard size={18} className="text-indigo-500" />
          Pay Platform Bill
        </div>
      }
    >
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-150 relative min-h-[300px]">
        {loadingInitial && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 rounded-xl">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        )}

        {!loadingInitial && (
          <div className="space-y-4">
            
            {/* Bill Summary */}
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 shadow-inner dark:bg-gray-800/50 dark:border-gray-700 space-y-2 mt-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center border-b border-gray-200 dark:border-gray-700 pb-2 mb-2">
                Invoice Summary
              </p>
              
              <div className="flex justify-between items-start text-xs border-b border-gray-100 dark:border-gray-700 pb-3">
                <span className="text-gray-500 font-medium mt-0.5">Reference</span>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-1.5 justify-end">
                    <Receipt size={14} className="text-gray-400" />
                    {bill.billReference}
                  </p>
                </div>
              </div>

              {/* Amount Details */}
              <div className="space-y-2 px-1">
                <div className="flex justify-between text-xs pt-1">
                  <span className="text-gray-500">Base Amount</span>
                  <span className="font-bold text-gray-900 dark:text-white">LKR {Number(bill.payableAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                
                <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-700 space-y-1.5">
                  <div className="flex justify-between text-[11px] font-medium">
                    <span className="text-gray-500">Platform Service Fee</span>
                    <span className="text-gray-700 dark:text-gray-300">LKR {(calculateTotal(Number(bill.payableAmount)) - Number(bill.payableAmount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="flex justify-between text-sm pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="font-bold text-gray-700 dark:text-gray-300">Total Payable</span>
                  <span className="font-black text-indigo-600 dark:text-indigo-400">LKR {calculateTotal(Number(bill.payableAmount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="space-y-2 px-1 pb-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Billing Month</span>
                  <span className="font-bold text-gray-900 dark:text-white uppercase tracking-tight">{bill.monthYear}</span>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-xs text-red-700 dark:text-red-400">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errorMsg}</span>
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2">
              {/* ── One-Click Payment: Only if card is saved ─────────── */}
              {cardToken ? (
                <>
                  {!confirmCharge ? (
                    <button
                      type="button"
                      disabled={isSubmitting || isSuccess || bill.status === 'Paid'}
                      onClick={() => setConfirmCharge(true)}
                      className="w-full h-12 flex items-center justify-between px-4 rounded-xl border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/20 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm"
                    >
                      <span className="flex items-center gap-2.5 text-[13px] font-bold text-indigo-700 dark:text-indigo-400">
                        <div className="w-7 h-7 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-xs border border-indigo-100 dark:border-indigo-700">
                          <CreditCard size={15} />
                        </div>
                        {cardBrand || 'Card'} •••• {cardLast4}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] items-center gap-1 font-bold text-indigo-500 uppercase tracking-widest hidden sm:flex">
                         One-Click Pay
                        </span>
                        <ChevronRight size={16} className="text-indigo-300 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  ) : (
                    <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center border border-indigo-100 dark:border-indigo-800 shadow-xs">
                           <ShieldCheck size={20} className="text-indigo-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-indigo-950 dark:text-indigo-200">Payment Confirmation</p>
                          <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">Charge to {cardBrand} •••• {cardLast4}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmCharge(false)}
                          className="flex-1 h-10 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={handlePayClick}
                          className={`flex-[2] h-10 rounded-lg text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                            isSuccess 
                              ? 'bg-green-500 shadow-green-200 dark:shadow-none' 
                              : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none disabled:opacity-60'
                          }`}
                        >
                          {isSubmitting ? (
                             <><Loader2 size={14} className="animate-spin" /> Processing...</>
                          ) : isSuccess ? (
                             <><CheckCircle2 size={15} /> Payment Successful!</>
                          ) : (
                             <>Confirm & Pay</>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* ── Missing Card: Guide to Profile ───────────────── */
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                   <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/50">
                      <div className="flex items-start gap-3 mb-3">
                         <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-xs border border-violet-100 dark:border-violet-800 shrink-0">
                            <Info size={18} className="text-violet-500" />
                         </div>
                         <div>
                            <p className="text-xs font-bold text-violet-900 dark:text-violet-200 mb-1">Saved Card Required</p>
                            <p className="text-[10px] text-violet-700/80 dark:text-violet-400 leading-relaxed">
                               To ensure secure transactions, platform bills must be paid using a saved payment card.
                            </p>
                         </div>
                      </div>
                      
                      <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg border border-violet-50 dark:border-violet-900/30 flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                            <CreditCard size={14} />
                         </div>
                         <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                            Card registration involves a one-time charge of <span className="font-bold text-violet-600 dark:text-violet-400">LKR 30.00</span> which is refundable by PayHere.
                         </p>
                      </div>
                   </div>

                   <Button 
                      variant="primary" 
                      fullWidth 
                      onClick={() => {
                        sessionStorage.setItem('profile_intent', 'edit');
                        onClose();
                        navigate('/dashboard/profile');
                      }}
                      className="group"
                   >
                      Go to Profile & Add Card <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                   </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default BillPaymentModal;
