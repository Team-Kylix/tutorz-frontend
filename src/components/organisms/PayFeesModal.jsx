import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  ChevronRight, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  CreditCard, 
  Calendar,
  Hash,
  Phone,
  Loader2,
  BookOpen,
  Clock,
  Info,
  ArrowRight
} from 'lucide-react';
import Modal from '../molecules/Modal';
import Button from '../atoms/Button';
import MonthStrip from '../molecules/MonthStrip';
import { getStudentClasses } from '../../services/api/studentService';
import { getStudentPaymentStatus, initiateOnlinePayment, getFinancialSummary } from '../../services/api/financialService';
import { BASE_URL } from '../../services/api/apiClient';

const PayFeesModal = ({ isOpen, onClose, setActivePage = () => {}, initialPayment = null }) => {
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

  // Auto-select tutor when classes are loaded and we have an initialPayment
  useEffect(() => {
    if (initialPayment && classes.length > 0 && !selectedTutor) {
      const matchedTutor = classes.find(c => c.tutorId === initialPayment.tutorId);
      if (matchedTutor) {
        handleSelectTutor({
          tutorId: matchedTutor.tutorId,
          tutorName: matchedTutor.tutorName,
          tutorRegNum: matchedTutor.tutorRegistrationNumber || 'ID N/A',
          tutorPhone: matchedTutor.tutorPhoneNumber || 'N/A',
          tutorImage: matchedTutor.tutorProfileImageUrlSmall
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classes, initialPayment]);

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
          tutorRegNum: c.tutorRegistrationNumber || 'ID N/A',
          tutorPhone: c.tutorPhoneNumber || 'N/A',
          tutorImage: c.tutorProfileImageUrlSmall
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
        // Auto success
        setIsSuccess(true);
        setIsSubmitting(false);
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
    window.payhere.onCompleted = function onCompleted() {
      setIsSuccess(true);
      setIsSubmitting(false);
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
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all text-left group"
                >
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400 flex items-center justify-center shrink-0 overflow-hidden font-bold border border-indigo-200/50 dark:border-indigo-800/50">
                      {t.tutorImage ? (
                        <img 
                          src={t.tutorImage.startsWith('http') ? t.tutorImage : `${BASE_URL}${t.tutorImage}`} 
                          alt={t.tutorName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{t.tutorName.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-900 dark:text-white truncate uppercase tracking-tight leading-none mb-1.5">
                        {t.tutorName}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                        <span className="font-bold uppercase tracking-wider text-purple-500">Tutor</span>
                        <span>&bull;</span>
                        <span className="font-mono">{t.tutorRegNum}</span>
                        <span className="hidden sm:inline">&bull;</span>
                        <span className="hidden sm:inline">{t.tutorPhone}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 shrink-0 ml-2" />
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
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 mb-2 border border-gray-100 dark:border-gray-700">
              <p className="text-[10px] uppercase font-bold text-gray-400 mb-2">Tutor</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center shrink-0 overflow-hidden font-bold border border-gray-200 dark:border-gray-700 shadow-sm">
                   {selectedTutor.tutorImage ? (
                      <img 
                        src={selectedTutor.tutorImage.startsWith('http') ? selectedTutor.tutorImage : `${BASE_URL}${selectedTutor.tutorImage}`} 
                        alt={selectedTutor.tutorName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400">{selectedTutor.tutorName.charAt(0)}</span>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                   <p className="font-bold text-sm text-gray-900 dark:text-white truncate uppercase tracking-tight leading-none mb-1.5">
                      {selectedTutor.tutorName}
                   </p>
                   <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                      <span className="font-bold uppercase tracking-wider text-purple-500">Tutor</span>
                      <span>&bull;</span>
                      <span className="font-mono">{selectedTutor.tutorRegNum}</span>
                   </div>
                </div>
                <div className="text-right shrink-0">
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Contact</p>
                   <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{selectedTutor.tutorPhone}</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {tutorClasses.map(c => (
                <button
                  key={c.classId || c.id}
                  onClick={() => handleSelectClass(c)}
                  className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all text-left group gap-3"
                >
                  <div className="flex-1 flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                      <BookOpen size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate mb-0.5">
                        {c.className || c.subject}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 font-medium overflow-hidden">
                        <span className="uppercase tracking-wider truncate">{c.subject} &bull; {c.grade}</span>
                        <span className="hidden sm:inline">&bull;</span>
                        <span className="text-indigo-600 dark:text-indigo-400 truncate">{c.dayOfWeek} {c.startTime}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end sm:text-right shrink-0 border-t sm:border-t-0 border-gray-50 dark:border-gray-800 pt-2 sm:pt-0 gap-4">
                    <div className="sm:hidden flex items-center gap-1.5 text-[10px] text-indigo-500 font-bold uppercase tracking-wider">
                       <Clock size={10} /> {c.dayOfWeek} {c.startTime}
                    </div>
                    <div>
                      <p className="hidden sm:block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-0.5">Monthly Fee</p>
                      <p className="text-xs sm:text-sm font-black text-indigo-600 dark:text-indigo-400">
                        LKR {Number(c.fee).toLocaleString()}
                      </p>
                    </div>
                  </div>
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
                <div className="flex justify-between items-start text-xs border-b border-gray-100 dark:border-gray-700 pb-3">
                  <span className="text-gray-500 font-medium mt-0.5">Tutor</span>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white uppercase tracking-tight">{selectedTutor?.tutorName}</p>
                    <div className="flex items-center justify-end gap-1.5 text-[10px] text-gray-400 mt-1">
                      <span className="font-bold uppercase tracking-wider text-purple-500/80">Reg:</span>
                      <span className="font-mono">{selectedTutor?.tutorRegNum}</span>
                      <span className="mx-0.5 text-gray-300">|</span>
                      <span>{selectedTutor?.tutorPhone}</span>
                    </div>
                  </div>
                </div>
                {/* Fee Card (Centered & Prominent) */}
                <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-dashed border-indigo-200 dark:border-indigo-800/40 space-y-1 mb-2">
                    <label className="text-[10px] font-bold text-indigo-600/80 dark:text-indigo-400 uppercase tracking-widest">
                        Class Fee (Monthly)
                    </label>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-bold text-indigo-400 dark:text-indigo-600/60">LKR</span>
                        <span className="text-3xl font-black text-gray-900 dark:text-white">
                          {Number(selectedClass.fee).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                        Excluding service fees
                    </p>
                </div>

                <div className="space-y-2 px-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Subject / Grade</span>
                    <span className="font-bold text-gray-900 dark:text-white uppercase tracking-tight">{selectedClass.subject} • {selectedClass.grade}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Payment Month</span>
                    <span className="font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                      {new Date(selectedMonth.year, selectedMonth.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                
                {/* Fee Breakdown */}
                <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-700 space-y-1.5">
                  <div className="flex justify-between text-[11px] font-medium">
                    <span className="text-gray-500">Platform Service Fee</span>
                    <span className="text-gray-700 dark:text-gray-300">LKR {(calculateTotal(selectedClass.fee) - selectedClass.fee).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
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
              {/* ── One-Click Payment: Only if card is saved ─────────── */}
              {cardToken ? (
                <>
                  {!confirmCharge ? (
                    <button
                      type="button"
                      disabled={!selectedMonth || isSubmitting || isSuccess || selectedStatus === 'Paid'}
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
                        <div className="text-right">
                          <p className="text-sm font-black text-indigo-700 dark:text-indigo-300">
                             LKR {calculateTotal(selectedClass.fee).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {isSuccess ? (
                          <>
                            <button
                              type="button"
                              onClick={onClose}
                              className="flex-1 h-10 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 transition-all"
                            >
                              Close
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                setActivePage('financials');
                              }}
                              className="flex-[2] h-10 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition-all shadow-md shadow-green-200 dark:shadow-none flex items-center justify-center gap-2"
                            >
                              <CheckCircle2 size={15} /> Download Payslip
                            </button>
                          </>
                        ) : (
                          <>
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
                              onClick={() => handlePayClick(true)}
                              className="flex-[2] h-10 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 dark:shadow-none disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                              {isSubmitting ? (
                                 <><Loader2 size={14} className="animate-spin" /> Processing...</>
                              ) : (
                                 <>Confirm & Pay</>
                              )}
                            </button>
                          </>
                        )}
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
                               To ensure secure and high-speed transactions, all class fee payments must be made using a saved payment card.
                            </p>
                         </div>
                      </div>
                      
                      <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg border border-violet-50 dark:border-violet-900/30 flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                            <CreditCard size={14} />
                         </div>
                         <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                            Card registration involves a one-time charge of <span className="font-bold text-violet-600 dark:text-violet-400">LKR 30.00</span> (LKR 29.00 platform fee + LKR 1.00 refundable by PayHere).
                         </p>
                      </div>
                   </div>

                   <Button 
                      variant="primary" 
                      fullWidth 
                      onClick={() => {
                        sessionStorage.setItem('profile_intent', 'edit');
                        onClose();
                        setActivePage('profile');
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

export default PayFeesModal;
