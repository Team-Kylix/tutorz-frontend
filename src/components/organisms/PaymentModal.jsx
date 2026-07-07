import React, { useState, useEffect } from 'react';
import {
    CheckCircle2, Loader2, X, User, BookOpen, CreditCard, AlertCircle
} from 'lucide-react';
import Modal from '../molecules/Modal';
import Button from '../atoms/Button';
import MonthStrip from '../molecules/MonthStrip';
import ConfirmationModal from '../molecules/ConfirmationModal';
import { getPaymentStatus, recordPayment } from '../../services/api/paymentService';
import { getStudentPaymentStatusForTutor, recordTutorPayment } from '../../services/api/tutorService';
import { useAuth } from '../../hooks/useAuth';

/**
 * PaymentModal
 *
 * Props:
 *   isOpen       {bool}
 *   onClose      {func}
 *   student      {object}  — { roleSpecificId, name, registrationNumber }
 *   cls          {object}  — { classId | id, subject, grade, tutorName, fee }
 *   onPaymentSuccess {func} - Callback when payment is successfully made and success modal closed
 */
const PaymentModal = ({ isOpen, onClose, student, cls, onPaymentSuccess }) => {
    const { user } = useAuth();
    // --- Month strip state ---
    const [months, setMonths] = useState([]);
    const [isLoadingMonths, setIsLoadingMonths] = useState(false);

    // Default to current month
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState({
        month: now.getMonth() + 1,
        year: now.getFullYear()
    });

    // --- Payment form state ---
    const [customFee, setCustomFee] = useState('');
    const [note, setNote] = useState('');

    // --- Submission state ---
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // --- Confirmation/Success state ---
    const [showConfirm, setShowConfirm] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const classId = cls?.classId ?? cls?.id;
    const studentId = student?.roleSpecificId;

    // ── On open: load payment status and reset form ─────────────────────
    useEffect(() => {
        if (!isOpen || !classId || !studentId) return;

        // Reset
        setIsSuccess(false);
        setErrorMsg('');
        setNote('');
        setCustomFee(cls?.fee != null ? String(cls.fee) : '');
        setSelectedMonth({ month: now.getMonth() + 1, year: now.getFullYear() });

        fetchMonths();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, classId, studentId]);

    const fetchMonths = async () => {
        setIsLoadingMonths(true);
        try {
            const res = user?.role === 'Tutor'
                ? await getStudentPaymentStatusForTutor(classId, studentId)
                : await getPaymentStatus(classId, studentId);
            if (res?.success && Array.isArray(res.data)) {
                setMonths(res.data);
            } else {
                setMonths([]);
            }
        } catch (err) {
            setMonths([]);
        } finally {
            setIsLoadingMonths(false);
        }
    };

    // Derive status of selected month from the strip
    const selectedStatus = months.find(
        m => m.month === selectedMonth.month && m.year === selectedMonth.year
    )?.status;

    const handlePayClick = () => {
        const amount = parseFloat(customFee);
        if (!selectedMonth) { setErrorMsg('Please select a month first.'); return; }
        if (isNaN(amount) || amount <= 0) { setErrorMsg('Enter a valid amount.'); return; }
        if (selectedStatus === 'Paid') { setErrorMsg('This month is already paid.'); return; }
        setErrorMsg('');
        setShowConfirm(true);
    };

    const handleConfirmPay = async () => {
        setShowConfirm(false);
        setIsSubmitting(true);
        setErrorMsg('');

        try {
            const amount = parseFloat(customFee);
            const payload = {
                studentId,
                classId,
                month: selectedMonth.month,
                year: selectedMonth.year,
                amountPaid: amount,
                note: note || null
            };
            const res = user?.role === 'Tutor'
                ? await recordTutorPayment(payload)
                : await recordPayment(payload);
            if (res?.success) {
                setIsSuccess(true);
                setShowSuccess(true);
                // Refresh month statuses so the chip turns green
                await fetchMonths();
            } else {
                setErrorMsg(res?.message || 'Payment failed. Try again.');
            }
        } catch (err) {
            setErrorMsg(err?.message || 'An error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!student || !cls) return null;

    const monthLabel = selectedMonth
        ? new Date(selectedMonth.year, selectedMonth.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
        : '—';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <CreditCard size={18} className="text-indigo-500" />
                    Make Payment
                </div>
            }
        >
            <div className="space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-150">

                {/* ── Student + Class header (Matched to Attendance UI) ────────── */}
                <div className="flex items-center gap-2 p-1.5 rounded-xl bg-gray-50/50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 shrink-0">
                        {student.name?.charAt(0) ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white block leading-tight">
                            {student.name}
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-none">
                            {student.registrationNumber}
                        </span>
                    </div>
                </div>

                {/* ── Class Name (Centered & Prominent) ─────────────────────── */}
                <div className="text-center space-y-0.5 py-0.5">
                    <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                        Class
                    </p>
                    <h2 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight">
                        {cls.subject}{cls.grade ? `-${cls.grade}` : ''}
                    </h2>
                    {cls.tutorName && (
                        <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1 transition-colors">
                            <User size={12} /> {cls.tutorName}
                        </p>
                    )}
                </div>

                {/* ── Month strip ────────────────────────────────────────────── */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between px-1">
                        <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                            Select Month
                        </p>
                        <div className="flex gap-2 text-[10px]">
                            <span className="flex items-center gap-1 font-semibold"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" />Paid</span>
                            <span className="flex items-center gap-1 font-semibold"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Unpaid</span>
                        </div>
                    </div>

                    {isLoadingMonths ? (
                        <div className="flex justify-center py-2">
                            <Loader2 className="animate-spin text-indigo-400" size={18} />
                        </div>
                    ) : (
                        <MonthStrip
                            months={months}
                            selectedMonth={selectedMonth}
                            onSelect={setSelectedMonth}
                        />
                    )}

                    {/* Selected month pill (more compact) */}
                    {selectedMonth && (
                        <div className="flex items-center justify-center gap-2">
                            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                                Selected: <span className="font-bold text-gray-900 dark:text-white">{monthLabel}</span>
                            </p>
                            {selectedStatus && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm ${selectedStatus === 'Paid'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                    : selectedStatus === 'Unpaid'
                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                    }`}>
                                    {selectedStatus === 'Unpaid' ? 'Not Paid Yet' : selectedStatus}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Class Fee (Centered & Compact) ─────────────────────────── */}
                <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-dashed border-indigo-200 dark:border-indigo-800/40 space-y-1 transition-all group hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                    <label className="text-[10px] font-bold text-indigo-600/80 dark:text-indigo-400 uppercase tracking-widest">
                        Payable Amount
                    </label>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-bold text-indigo-400 dark:text-indigo-600/60">Rs</span>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={customFee}
                            onChange={e => { setCustomFee(e.target.value); setErrorMsg(''); }}
                            className="bg-transparent text-gray-900 dark:text-white text-4xl font-black focus:outline-none w-[160px] text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-transform active:scale-95"
                            placeholder="0.00"
                        />
                    </div>
                    <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                        Fee: Rs {Number(cls.fee ?? 0).toLocaleString()}
                    </p>
                </div>

                {/* ── Optional note (Very compact) ───────────────────────────── */}
                <div className="space-y-1">
                    <input
                        type="text"
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700
              bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs
              focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-300
              transition-all"
                        placeholder="Add a note... (optional)"
                    />
                </div>

                {/* ── Error ──────────────────────────────────────────────────── */}
                {errorMsg && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-700 dark:text-red-400 animate-in slide-in-from-bottom-2">
                        <AlertCircle size={16} />
                        {errorMsg}
                    </div>
                )}



                {/* ── Actions ────────────────────────────────────────────────── */}
                <div className="flex gap-3 pt-1 sticky bottom-0 bg-white dark:bg-gray-900 pb-1">
                    <Button
                        variant="outline"
                        fullWidth
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Back
                    </Button>
                    <Button
                        variant="primary"
                        fullWidth
                        disabled={isSubmitting || isSuccess || selectedStatus === 'Paid'}
                        onClick={handlePayClick}
                        className={isSuccess ? 'bg-green-500 hover:bg-green-600 focus:ring-green-500/50 shadow-green-500/20' : ''}
                    >
                        {isSubmitting ? (
                            <><Loader2 size={16} className="animate-spin mr-2" /> Processing...</>
                        ) : isSuccess ? (
                            <><CheckCircle2 size={16} className="mr-2" /> Paid!</>
                        ) : (
                            <><CreditCard size={16} className="mr-2" /> Pay</>
                        )}
                    </Button>
                </div>

            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleConfirmPay}
                title="Confirm Payment"
                message={`Are you sure you want to record a payment of Rs ${parseFloat(customFee).toLocaleString()} for ${monthLabel}?`}
                confirmLabel="Confirm Pay"
                cancelLabel="Cancel"
                variant="primary"
            />

            {/* Success Modal */}
            <ConfirmationModal
                isOpen={showSuccess}
                onClose={() => {
                    setShowSuccess(false);
                    if (onPaymentSuccess) onPaymentSuccess();
                }}
                onConfirm={() => {
                    setShowSuccess(false);
                    if (onPaymentSuccess) onPaymentSuccess();
                }}
                title="Payment Successful"
                message={`Payment of Rs ${parseFloat(customFee).toLocaleString()} for ${monthLabel} has been successfully recorded.`}
                confirmLabel="Done"
                cancelLabel="Close"
                variant="success"
            />
        </Modal>
    );
};

export default PaymentModal;
