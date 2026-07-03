import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Shield, RefreshCw } from 'lucide-react';
import PublicPageLayout from '../../components/templates/PublicPageLayout';

const TermsPage = () => {
    return (
        <PublicPageLayout>
            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Terms &amp; Conditions</h1>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated: April 1, 2026</p>
                <div className="mt-4 flex gap-3 flex-wrap">
                    <Link to="/privacy" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                        <Shield size={12} /> Privacy Policy
                    </Link>
                    <Link to="/refund" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                        <RefreshCw size={12} /> Refund Policy
                    </Link>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 md:p-10 space-y-8">
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Welcome to Tutorz, a mobile and web-based solution designed to modernize the Sri Lankan tuition industry through automated attendance and fee management. By accessing our platform, you agree to comply with the following terms.
                </p>

                <section>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">1. Acceptance of Terms</h2>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        By registering an account, you agree to be bound by these Terms and Conditions and our Privacy and Refund Policies. If you do not agree, you may not use the platform.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">2. User Roles and Responsibilities</h2>
                    <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-2">
                        <li><strong>Institutes:</strong> Responsible for managing their own tutors, subjects, classes, and student enrollments.</li>
                        <li><strong>Tutors:</strong> Responsible for marking accurate attendance (via QR scanning), managing class schedules, and generating invoices.</li>
                        <li><strong>Students/Parents:</strong> Responsible for maintaining account security and ensuring timely payment of fees via the platform.</li>
                        <li><strong>Administrators (Team Kylix):</strong> Responsible for system-wide integrity, commission settings, and mediating user disputes.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">3. Accounts and Security</h2>
                    <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-2">
                        <li><strong>Identity:</strong> You must provide accurate and current information during registration.</li>
                        <li><strong>Credentials:</strong> Users are responsible for the confidentiality of their login details.</li>
                        <li><strong>Security Layer:</strong> All access is secured via JWT-based authentication to prevent unauthorized data access.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">4. Fees and Financial Transactions</h2>
                    <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-2">
                        <li><strong>Commission Model:</strong> Tutorz operates on a flexible 1% commission model based on class fees. This fee may be split between the tutor and the institute by mutual agreement.</li>
                        <li><strong>Convenience Fees:</strong> A platform service fee (Kylix Convenience Fee) may be applied to tutors and institutes for infrastructure maintenance.</li>
                        <li><strong>Payment Processing:</strong> All online transactions are processed through integrated gateways (e.g., PayHere) compliant with Sri Lankan financial regulations.</li>
                        <li><strong>Payouts/Withdrawals:</strong> Tutors or Institutes may request withdrawals of accumulated earnings, which are processed weekly following Admin approval and SLIPS file generation.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">5. Attendance and Reporting</h2>
                    <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-2">
                        <li><strong>QR Scanning:</strong> Attendance marked via the mobile app's QR scanner is considered the primary record for fee calculations.</li>
                        <li><strong>Digital Accuracy:</strong> Users acknowledge that automated fee calculations are based on attendance logs; any discrepancies must be reported immediately.</li>
                        <li><strong>Document Generation:</strong> Professional PDF reports are generated for internal use and transparency between parties.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">6. User Conduct and Content</h2>
                    <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-2">
                        <li><strong>Inappropriate Content:</strong> The System Administrator reserves the right to remove offensive class names, descriptions, or content.</li>
                        <li><strong>Academic Integrity:</strong> Tutors are responsible for the accuracy of published results and medals awarded through the platform.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">7. Pricing</h2>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border border-blue-100 dark:border-blue-800 space-y-3">
                        <div className="flex items-start gap-3">
                            <span className="text-blue-600 dark:text-blue-400 font-bold text-sm min-w-[120px]">Platform Fee:</span>
                            <span className="text-gray-700 dark:text-gray-300 text-sm">1% commission per transaction (may be split between tutor and institute by agreement)</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-blue-600 dark:text-blue-400 font-bold text-sm min-w-[120px]">Convenience Fee:</span>
                            <span className="text-gray-700 dark:text-gray-300 text-sm">A small Kylix Convenience Fee applies to platform infrastructure access (varies per plan)</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-blue-600 dark:text-blue-400 font-bold text-sm min-w-[120px]">Payment Processing:</span>
                            <span className="text-gray-700 dark:text-gray-300 text-sm">Standard gateway fees apply (via PayHere or equivalent) — charged by the payment provider</span>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">8. Limitations &amp; Governing Law</h2>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        Tutorz is a technology provider and does not employ tutors or run tuition institutes. We are not liable for the quality of education provided or direct disputes between students and tutors. These terms are governed by the laws of Sri Lanka and comply with ICTA guidelines for digital platforms.
                    </p>
                </section>

                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500">
                    For questions about these Terms, contact us at{' '}
                    <a href="mailto:lktutorz@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                        lktutorz@gmail.com
                    </a>
                </div>
            </div>
        </PublicPageLayout>
    );
};

export default TermsPage;
