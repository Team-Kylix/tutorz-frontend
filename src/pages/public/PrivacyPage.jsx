import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, FileText, RefreshCw } from 'lucide-react';
import PublicPageLayout from '../../components/templates/PublicPageLayout';

const PrivacyPage = () => {
    return (
        <PublicPageLayout>
            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <Shield size={20} className="text-green-600 dark:text-green-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated: April 1, 2026</p>
                <div className="mt-4 flex gap-3 flex-wrap">
                    <Link to="/terms" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                        <FileText size={12} /> Terms &amp; Conditions
                    </Link>
                    <Link to="/refund" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                        <RefreshCw size={12} /> Refund Policy
                    </Link>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 md:p-10 space-y-8">
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    At Tutorz, we are dedicated to revolutionizing the Sri Lankan tuition industry while maintaining the highest standards of data privacy and security. This policy explains how we collect, use, and safeguard the information of Tutors, Students, Parents, and Institutes within our mobile and web-based platforms.
                </p>

                <section>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">1. Information We Collect</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                        To provide an automated attendance and fee management system, we collect several types of information depending on your user role:
                    </p>
                    <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-2">
                        <li><strong>Tutors:</strong> Full name, email, phone number, academic qualifications, teaching experience, and bank account details for fee withdrawals.</li>
                        <li><strong>Students &amp; Parents:</strong> Student name, school name, class grade level, parent contact information, and payment history.</li>
                        <li><strong>Institutes:</strong> Business name, official address, contact number, and email address.</li>
                        <li><strong>Usage Data:</strong> Attendance records (captured via QR scanning), student marks, awarded medals, and system logs.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">2. How We Use Your Information</h2>
                    <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-2">
                        <li><strong>Automation:</strong> Marking daily attendance and automatically calculating class fees based on those records.</li>
                        <li><strong>Communication:</strong> Sending SMS alerts for fee payments, announcements, and OTP verifications.</li>
                        <li><strong>Reporting:</strong> Generating professional PDF reports for attendance and financial summaries.</li>
                        <li><strong>Transparency:</strong> Allowing parents to securely monitor their child's academic progress, attendance, and fee status.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">3. Data Sharing and Third Parties</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                        We respect your privacy and do not sell your data. Information is only shared with third parties necessary for platform operations:
                    </p>
                    <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-2">
                        <li><strong>Payment Gateways:</strong> Secure payment processing through providers like PayHere.</li>
                        <li><strong>Communication Providers:</strong> SMS and email delivery via services like Dialog SMS, Twilio, or SendGrid.</li>
                        <li><strong>Internal Role Visibility:</strong> Data is shared between linked roles (e.g., an Institute can monitor its Tutors' classes).</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">4. Data Security and Integrity</h2>
                    <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-2">
                        <li><strong>Encryption:</strong> Sensitive data such as passwords and bank details are encrypted using AES-256 and hashed using bcrypt or Argon2.</li>
                        <li><strong>Authentication:</strong> All access is secured via JWT-based authentication and role-based authorization.</li>
                        <li><strong>Data Integrity:</strong> We use ACID-compliant transactions to ensure data consistency and perform daily backups.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">5. Your Rights and Choices</h2>
                    <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-2">
                        <li><strong>Account Deletion:</strong> Users have the right to permanently delete their accounts and associated data at any time.</li>
                        <li><strong>Data Modification:</strong> You can update your profile, qualifications, and class details through your dashboard.</li>
                        <li><strong>Visibility Control:</strong> Students can choose to show or hide their academic marks and medals.</li>
                        <li><strong>Data Access:</strong> You have the right to request a copy of your data in a portable format.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">6. Cookies and Tracking</h2>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        Tutorz uses session storage and local storage for authentication tokens only. We do not use third-party advertising cookies or tracking pixels.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">7. Changes to This Policy</h2>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        We may update this Privacy Policy periodically. We will notify users of significant changes via email or an in-app notification. Continued use of the platform after changes constitutes acceptance.
                    </p>
                </section>

                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500">
                    For privacy-related concerns, contact us at{' '}
                    <a href="mailto:kylixtechnology@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                        kylixtechnology@gmail.com
                    </a>
                </div>
            </div>
        </PublicPageLayout>
    );
};

export default PrivacyPage;
