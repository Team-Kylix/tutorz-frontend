import React from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, FileText, Shield, AlertCircle } from 'lucide-react';
import PublicPageLayout from '../../components/templates/PublicPageLayout';

const RefundPage = () => {
    return (
        <PublicPageLayout>
            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                        <RefreshCw size={20} className="text-orange-600 dark:text-orange-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Refund Policy</h1>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated: April 1, 2026</p>
                <div className="mt-4 flex gap-3 flex-wrap">
                    <Link to="/terms" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                        <FileText size={12} /> Terms &amp; Conditions
                    </Link>
                    <Link to="/privacy" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                        <Shield size={12} /> Privacy Policy
                    </Link>
                </div>
            </div>

            {/* Bank-required notice — highlighted */}
            <div className="mb-6 flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
                <AlertCircle size={18} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                    <strong>Important:</strong> Please note that all refunds will be credited back to the original payment-initiated media (e.g., the original credit card, debit card, or mobile wallet used for the transaction).
                </p>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 md:p-10 space-y-8">
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    At Tutorz (a product of Team Kylix), we are committed to providing a transparent and efficient platform for managing tuition attendance and fees. Because our platform facilitates payments between students/parents and independent tutors or institutes, the following policy outlines how refunds are handled within our ecosystem.
                </p>

                <section>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">1. Nature of Services</h2>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        Tutorz provides a digital service that includes: automated attendance tracking and QR scanning, digital fee calculation and invoice generation, downloadable monthly PDF reports, and communication tools.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">2. Tuition Fee Refunds</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                        Tutorz acts as a payment facilitator. Tuition fees paid via the app are distributed to the respective Tutor or Institute.
                    </p>
                    <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-2">
                        <li><strong>Direct Responsibility:</strong> Any request for a refund of tuition fees (e.g., due to class cancellation or student withdrawal) must be initiated through the respective Tutor or Institute.</li>
                        <li><strong>Approval:</strong> Once the Tutor or Institute approves a refund, Tutorz will facilitate the reversal of the transaction through our integrated payment gateway.</li>
                        <li><strong>Timeline:</strong> Approved refunds are typically processed within 7 business days, depending on the student's bank or payment provider.</li>
                        <li><strong>Refund Method:</strong> Please note that all refunds will be credited back to the original payment-initiated media (e.g., the original credit card, debit card, or mobile wallet used for the transaction).</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">3. Non-Refundable Items</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">Certain fees and products are non-refundable:</p>
                    <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-2">
                        <li><strong>Platform Convenience Fees:</strong> The small service fee (the Kylix Convenience Fee) charged for the use of the platform's infrastructure is non-refundable.</li>
                        <li><strong>Digital Products:</strong> Fees paid for generated and downloaded PDF reports or digital educational materials are non-refundable once the download is initiated.</li>
                        <li><strong>Completed Services:</strong> Fees for classes that the student has already attended, as verified by the digital attendance system, are not eligible for a refund.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">4. How to Request a Refund</h2>
                    <ol className="list-decimal pl-5 text-gray-600 dark:text-gray-400 space-y-2">
                        <li>Contact the Tutor or Institute responsible for the class through the Tutorz platform.</li>
                        <li>Submit your refund request within 7 days of the transaction date.</li>
                        <li>The Tutor or Institute will review and approve or decline the request.</li>
                        <li>Upon approval, Tutorz will process the refund through the original payment gateway within 7 business days.</li>
                    </ol>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">5. Dispute Resolution</h2>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        In the event of a disagreement between a student and a tutor regarding a refund, the Tutorz System Administrator may act as a mediator. The Administrator will review digital attendance logs and payment records to make a fair determination. Decisions made by the System Administrator in dispute cases are final.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">6. Payment Errors</h2>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        If you believe a technical error has occurred (e.g., a double-charge or an incorrect amount was billed), please contact our support team immediately at{' '}
                        <a href="mailto:lktutorz@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                            lktutorz@gmail.com
                        </a>
                        . We will audit the transaction and, if a platform error is confirmed, we will issue a full refund of the erroneous amount. All such refunds will be credited back to the original payment-initiated media used for the transaction.
                    </p>
                </section>

                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500">
                    For refund-related queries, contact us at{' '}
                    <a href="mailto:lktutorz@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                        lktutorz@gmail.com
                    </a>
                </div>
            </div>
        </PublicPageLayout>
    );
};

export default RefundPage;
