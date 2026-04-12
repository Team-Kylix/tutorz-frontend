import React, { useState, useEffect, useMemo } from 'react';
import {
  X, CheckCircle2, Loader2, CreditCard, ChevronRight, Search, BookOpen, AlertCircle
} from 'lucide-react';
import Modal from '../molecules/Modal';
import Button from '../atoms/Button';
import MonthStrip from '../molecules/MonthStrip';
import { getStudentClasses } from '../../services/api/studentService';
import { getStudentPaymentStatus, initiateOnlinePayment, getFinancialSummary } from '../../services/api/financialService';

const PayFeesModal = ({ isOpen, onClose }) => {
  const [classes, setClasses] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Added Saved Card
  const [cardToken, setCardToken] = useState(false);
  const [cardLast4, setCardLast4] = useState('');
  const [cardBrand, setCardBrand] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [confirmCharge, setConfirmCharge] = useState(false);

  // Step 1: Select Tutor
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTutor, setSelectedTutor] = useState(null);

  // Step 2: Select Class
  const [selectedClass, setSelectedClass] = useState(null);

  // Step 3: Select Month
  const [months, setMonths] = useState([]);
  const [isLoadingMonths, setIsLoadingMonths] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);

  // Step 4: Payment State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Load classes & financial summary on mount
  useEffect(() => {
    if (isOpen) {
      resetState();
      fetchData();
      injectPayHereScript();
    }
  }, [isOpen]);

  const resetState = () => {
    setSelectedTutor(null);
    setSelectedClass(null);
    setSelectedMonth(null);
    setSearchQuery('');
    setMonths([]);
    setErrorMsg('');
    setIsSuccess(false);
    setIsSubmitting(false);
    setConfirmCharge(false);
  };

  const fetchData = async () => {
    setLoadingInitial(true);
    try {
      const clsRes = await getStudentClasses();
      if (clsRes?.success) setClasses(clsRes.data || []);
      
      const finRes = await getFinancialSummary();
      if (finRes?.success && finRes.data?.hasCard) {
        setCardToken(true);
        setCardLast4(finRes.data.cardLast4 || '');
        setCardBrand(finRes.data.cardBrand || '');
        setCardExpiry(finRes.data.cardExpiry || '');
      }
    } catch (err) {
      setErrorMsg('Failed to load classes or financial info.');
    } finally {
      setLoadingInitial(false);
    }
  };

  const fetchMonths = async (classId) => {
    setIsLoadingMonths(true);
    try {
      const res = await getStudentPaymentStatus(classId);
      if (res?.success) setMonths(res.data || []);
      else setMonths([]);
    } catch (err) {
      setMonths([]);
    } finally {
      setIsLoadingMonths(false);
    }
  };

  const injectPayHereScript = () => {
    if (!document.getElementById('payhere-js')) {
      const script = document.createElement('script');
      script.id = 'payhere-js';
      script.src = 'https://www.payhere.lk/lib/payhere.js';
      script.async = true;
      document.body.appendChild(script);
    }
  };

  // Derive Tutors from enrolled classes
  const tutors = useMemo(() => {
    const list = [];
    const map = new Set();
    classes.forEach(c => {
      if (c.tutorId && !map.has(c.tutorId)) {
        map.add(c.tutorId);
        list.push({
          tutorId: c.tutorId,
          tutorName: c.tutorName,
          tutorRegNum: c.tutorRegistrationNumber || ''
        });
      }
    });
    return list;
  }, [classes]);

  const filteredTutors = tutors.filter(t => 
    t.tutorName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.tutorRegNum?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tutorClasses = classes.filter(c => selectedTutor && c.tutorId === selectedTutor.tutorId);

  // Derived selected month status
  const selectedStatus = selectedMonth ? months.find(m => m.month === selectedMonth.month && m.year === selectedMonth.year)?.status : null;

  // Handlers
  const handleSelectTutor = (tutor) => {
    setSelectedTutor(tutor);
    setSelectedClass(null);
    setSelectedMonth(null);
  };

  const handleSelectClass = (cls) => {
    setSelectedClass(cls);
    setSelectedMonth(null);
    fetchMonths(cls.classId || cls.id);
  };

  const calculateTotal = (baseFee) => {
    if (!baseFee) return 0;
    // Formula: (Base + 30) / 0.97
    return Math.ceil((baseFee + 30) / 0.97 * 100) / 100;
  };

  const handlePayClick = async (useSavedCard = false) => {
    if (!selectedClass || !selectedMonth) return;
    if (selectedStatus === 'Paid') {
      setErrorMsg('This month is already paid.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const adjustedTotal = calculateTotal(selectedClass.fee);
      
      const payload = {
        classId: selectedClass.classId || selectedClass.id,
        month: selectedMonth.month,
        year: selectedMonth.year,
        amount: adjustedTotal,
        useSavedCard: useSavedCard
      };

      const res = await initiateOnlinePayment(payload);

      if (!res?.success) {
        setErrorMsg(res?.message || 'Failed to initiate payment.');
        setIsSubmitting(false);
        return;
      }

      if (useSavedCard && res.data?.isAutoCharge) {
        // Auto success for offline mock
        setIsSuccess(true);
        setIsSubmitting(false);
        setTimeout(() => onClose(), 2500);
        return;
      }

      // Start PayHere Onsite Checkout
      handlePayHereCheckout(res.data);

    } catch (err) {
      setErrorMsg(err.message || 'Error occurred');
      setIsSubmitting(false);
    }
  };

  const handlePayHereCheckout = (paymentDetails) => {
    window.payhere.onCompleted = function onCompleted(orderId) {
      setIsSuccess(true);
      setIsSubmitting(false);
      setTimeout(() => onClose(), 2500);
    };

    window.payhere.onDismissed = function onDismissed() {
      setErrorMsg("Payment dismissed by user.");
      setIsSubmitting(false);
    };

    window.payhere.onError = function onError(error) {
      setErrorMsg("Error: " + error);
      setIsSubmitting(false);
    };

    window.payhere.startPayment(paymentDetails);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <CreditCard size={18} className="text-indigo-500" />
          Pay Class Fees
        </div>
      }
    >
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-150 relative min-h-[300px]">
        {loadingInitial && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 rounded-xl">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        )}

        {/* Step 1: Select Tutor */}
        {!selectedTutor && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              Step 1: Select Tutor
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search enrolled tutors by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {filteredTutors.map(t => (
                <button
                  key={t.tutorId}
                  onClick={() => handleSelectTutor(t)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all text-left"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.tutorName}</p>
                    <p className="text-[10px] text-gray-500">{t.tutorRegNum || 'ID N/A'}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>
              ))}
              {filteredTutors.length === 0 && !loadingInitial && (
                <p className="text-sm text-gray-500 text-center py-4">No tutors found.</p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Select Class */}
        {selectedTutor && !selectedClass && (
          <div className="space-y-3 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                Step 2: Select Class
              </p>
              <button 
                onClick={() => setSelectedTutor(null)}
                className="text-xs text-indigo-500 font-medium hover:underline"
              >
                Change Tutor
              </button>
            </div>
            <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 mb-2 border border-gray-100 dark:border-gray-700">
              <p className="text-[11px] text-gray-500">Tutor</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedTutor.tutorName}</p>
            </div>
            <div className="space-y-2">
              {tutorClasses.map(c => (
                <button
                  key={c.classId || c.id}
                  onClick={() => handleSelectClass(c)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <BookOpen size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {c.subject} {c.grade ? `- ${c.grade}` : ''}
                      </p>
                      <p className="text-[10px] text-gray-500 font-medium tracking-wide">
                        LKR {Number(c.fee).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Select Month & Summary */}
        {selectedClass && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
             <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                Step 3: Select Month
              </p>
              <button 
                onClick={() => setSelectedClass(null)}
                className="text-xs text-indigo-500 font-medium hover:underline"
              >
                Change Class
              </button>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-900/10 p-3 rounded-xl border border-indigo-100 dark:border-indigo-800">
              <p className="text-[10px] uppercase font-bold text-indigo-400 mb-1">Class Fee (Read Only)</p>
              <p className="text-2xl font-black text-indigo-700 dark:text-indigo-400 tracking-tight">
                LKR {Number(selectedClass.fee).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between px-1 pb-1">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                      Month
                  </p>
                  <div className="flex gap-2 text-[10px]">
                      <span className="flex items-center gap-1 font-semibold"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" />Paid</span>
                      <span className="flex items-center gap-1 font-semibold"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Unpaid</span>
                  </div>
              </div>
              {isLoadingMonths ? (
                 <div className="flex justify-center py-4"><Loader2 className="animate-spin text-indigo-400" size={20} /></div>
              ) : (
                <MonthStrip
                  months={months}
                  selectedMonth={selectedMonth}
                  onSelect={setSelectedMonth}
                />
              )}
            </div>

            {selectedMonth && (
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 shadow-inner dark:bg-gray-800/50 dark:border-gray-700 space-y-2 mt-4 animate-in fade-in">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center border-b border-gray-200 dark:border-gray-700 pb-2 mb-2">
                  Payment Summary
                </p>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Tutor</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedTutor?.tutorName}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Class</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedClass.subject} {selectedClass.grade}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Month</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {new Date(selectedMonth.year, selectedMonth.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
                
                {/* Fee Breakdown */}
                <div className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-700 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">Class Fee</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">LKR {Number(selectedClass.fee).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">Service Fee (PayHere)</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">LKR {(calculateTotal(selectedClass.fee) - selectedClass.fee).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="flex justify-between text-sm pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="font-bold text-gray-700 dark:text-gray-300">Total Payable</span>
                  <span className="font-black text-indigo-600 dark:text-indigo-400">LKR {calculateTotal(selectedClass.fee).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-xs text-red-700 dark:text-red-400">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errorMsg}</span>
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2">
              {/* ── One-Click: Saved Card ───────────────────────── */}
              {cardToken && !confirmCharge && (
                <button
                  type="button"
                  disabled={!selectedMonth || isSubmitting || isSuccess || selectedStatus === 'Paid'}
                  onClick={() => setConfirmCharge(true)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 hover:border-violet-400 dark:hover:border-violet-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-violet-700 dark:text-violet-300">
                    <CreditCard size={16} />
                    {cardBrand || 'Card'} •••• {cardLast4}
                    {cardExpiry && <span className="text-xs font-normal text-violet-500">exp {cardExpiry.slice(0,2)}/{cardExpiry.slice(2)}</span>}
                  </span>
                  <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
                    One-Click Pay
                  </span>
                </button>
              )}

              {/* ── Confirm one-click charge ─────────────────────── */}
              {cardToken && confirmCharge && (
                <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 space-y-2">
                  <p className="text-xs font-bold text-violet-700 dark:text-violet-300 text-center">
                    Confirm charge to {cardBrand} •••• {cardLast4}?
                  </p>
                  <p className="text-center text-sm font-black text-violet-700 dark:text-violet-300">
                    LKR {calculateTotal(selectedClass.fee).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setConfirmCharge(false)}
                      className="flex-1 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handlePayClick(true)}
                      className="flex-1 py-2 rounded-lg bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-1"
                    >
                      {isSubmitting ? <><Loader2 size={12} className="animate-spin" /> Charging...</> : 'Confirm'}
                    </button>
                  </div>
                </div>
              )}
               <Button
                  variant="primary"
                  fullWidth
                  disabled={!selectedMonth || isSubmitting || isSuccess || selectedStatus === 'Paid'}
                  onClick={() => handlePayClick(false)}
                  className={isSuccess ? 'bg-green-500 hover:bg-green-600' : ''}
              >
                  {isSubmitting ? (
                      <><Loader2 size={16} className="animate-spin mr-2" /> Processing...</>
                  ) : isSuccess ? (
                      <><CheckCircle2 size={16} className="mr-2" /> Successful!</>
                  ) : (
                      <>Pay LKR {calculateTotal(selectedClass.fee).toLocaleString(undefined, { minimumFractionDigits: 2 })}</>
                  )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PayFeesModal;
