import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Info, Shield, FileText, RefreshCw, Mail, Globe, MapPin, Tag, ExternalLink } from 'lucide-react';
import { APP_VERSION } from '../../config/version';
import apiClient from '../../services/api/apiClient';

const AboutUsContent = () => {
    const [activeTab, setActiveTab] = useState('about');
    const [backendVersion, setBackendVersion] = useState('Loading...');

    useEffect(() => {
        let isMounted = true;
        const fetchVersion = async () => {
            try {
                // Fetch the backend API version using the open endpoint
                const res = await apiClient.get('/system/version');
                if (isMounted) setBackendVersion(res.data.version);
            } catch (err) {
                if (isMounted) setBackendVersion('Unavailable');
            }
        };
        fetchVersion();
        return () => { isMounted = false; };
    }, []);

    const tabs = [
        { id: 'about', label: 'About Us', icon: Info },
        { id: 'pricing', label: 'Pricing', icon: Tag },
        { id: 'privacy', label: 'Privacy Policy', icon: Shield },
        { id: 'terms', label: 'Terms & Conditions', icon: FileText },
        { id: 'refund', label: 'Refund Policy', icon: RefreshCw },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'about':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">About Tutorz</h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                Tutorz (a product of Kylix Technology) is a mobile and web-based solution designed to modernize the Sri Lankan tuition industry through automated attendance and fee management.
                            </p>
                        </div>
                        
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
                            <h4 className="text-sm uppercase tracking-wider font-semibold text-blue-600 dark:text-blue-400 mb-4">Contact Information</h4>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg text-blue-500 shadow-sm">
                                        <Info size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">Developer</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Kylix Technology (Tutorz Team)</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg text-blue-500 shadow-sm">
                                        <Mail size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">Email</p>
                                        <a href="mailto:lktutorz@gmail.com" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">lktutorz@gmail.com</a>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg text-blue-500 shadow-sm">
                                        <Globe size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">Company</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Kylix Technology</p>
                                        <a href="https://team-kylix-web.vercel.app/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                                            team-kylix-web.vercel.app <ExternalLink size={12} />
                                        </a>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg text-blue-500 shadow-sm">
                                        <MapPin size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">Location</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Sri Lanka</p>
                                        <a href="https://www.linkedin.com/company/kylix-technology" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">LinkedIn Profile</a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3 pt-2">
                            <button onClick={() => setActiveTab('terms')} className="text-xs text-blue-600 dark:text-blue-400 underline hover:no-underline">Terms &amp; Conditions</button>
                            <span className="text-gray-300 dark:text-gray-600 text-xs">·</span>
                            <button onClick={() => setActiveTab('privacy')} className="text-xs text-blue-600 dark:text-blue-400 underline hover:no-underline">Privacy Policy</button>
                            <span className="text-gray-300 dark:text-gray-600 text-xs">·</span>
                            <button onClick={() => setActiveTab('refund')} className="text-xs text-blue-600 dark:text-blue-400 underline hover:no-underline">Refund Policy</button>
                            <span className="text-gray-300 dark:text-gray-600 text-xs">·</span>
                            <button onClick={() => setActiveTab('pricing')} className="text-xs text-blue-600 dark:text-blue-400 underline hover:no-underline">Pricing</button>
                        </div>
                        
                        {/* Mobile Version Display */}
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700 md:hidden flex justify-between">
                            <div>
                                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 dark:text-gray-600">App Version</p>
                                <p className="text-xs font-mono font-medium text-gray-500 dark:text-gray-400">{APP_VERSION}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 dark:text-gray-600">API Version</p>
                                <p className="text-xs font-mono font-medium text-gray-500 dark:text-gray-400">{backendVersion}</p>
                            </div>
                        </div>
                    </div>
                );

            case 'pricing':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Pricing</h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                Tutorz operates on a transparent, low-cost model designed to make digital tuition management accessible to all. There are no upfront subscription fees — we only charge a small platform commission when payments are processed.
                            </p>
                        </div>

                        {/* Main pricing cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border border-blue-100 dark:border-blue-800">
                                <div className="flex items-center gap-2 mb-3">
                                    <Tag size={16} className="text-blue-600 dark:text-blue-400" />
                                    <h4 className="text-sm font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Platform Commission</h4>
                                </div>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">1%</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">per transaction</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">
                                    Applied to each student fee payment processed through the platform. May be split between the tutor and the institute by mutual agreement.
                                </p>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 border border-gray-200 dark:border-gray-600">
                                <div className="flex items-center gap-2 mb-3">
                                    <Tag size={16} className="text-gray-500 dark:text-gray-400" />
                                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Kylix Convenience Fee</h4>
                                </div>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Variable</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">per plan / tier</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">
                                    A small service fee for platform infrastructure access. Applies to tutors and institutes for premium features and maintenance support.
                                </p>
                            </div>
                        </div>

                        {/* Payment Gateway */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Payment Gateway Fees</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                Tutorz uses <strong>PayHere</strong> as the primary payment gateway, compliant with Sri Lankan financial regulations set by the Central Bank of Sri Lanka. Standard gateway processing fees charged by PayHere apply separately and are outside of Tutorz's control.
                            </p>
                        </div>

                        {/* Free features */}
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-5 border border-green-100 dark:border-green-800">
                            <h4 className="text-sm font-bold text-green-700 dark:text-green-300 uppercase tracking-wide mb-3">Included at No Extra Cost</h4>
                            <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> QR-based attendance tracking</li>
                                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Automated fee calculations</li>
                                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Monthly PDF invoice generation</li>
                                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Student progress &amp; medal tracking</li>
                                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Multi-role dashboards (Tutor, Student, Institute)</li>
                                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> SMS &amp; in-app notifications</li>
                            </ul>
                        </div>

                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            For pricing enquiries, contact us at{' '}
                            <a href="mailto:lktutorz@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">lktutorz@gmail.com</a>.
                        </p>
                    </div>
                );

            case 'privacy':
                return (
                    <div className="space-y-6 prose dark:prose-invert max-w-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center justify-between border-b pb-4 dark:border-gray-700">
                            <h3 className="text-xl font-bold m-0 text-gray-900 dark:text-white">Privacy Policy for Tutorz</h3>
                            <span className="text-sm text-gray-500">Last Updated: April 1, 2026</span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">
                            At Tutorz, we are dedicated to revolutionizing the Sri Lankan tuition industry while maintaining the highest standards of data privacy and security. This policy explains how we collect, use, and safeguard the information of Tutors, Students, Parents, and Institutes within our mobile and web-based platforms.
                        </p>
                        
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6">1. Information We Collect</h4>
                        <p className="text-gray-600 dark:text-gray-400">To provide an automated attendance and fee management system, we collect several types of information depending on your user role:</p>
                        <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
                            <li><strong>Tutors:</strong> Full name, email, phone number, academic qualifications, teaching experience, and bank account details for fee withdrawals.</li>
                            <li><strong>Students &amp; Parents:</strong> Student name, school name, class grade level, parent contact information, and payment history.</li>
                            <li><strong>Institutes:</strong> Business name, official address, contact number, and email address.</li>
                            <li><strong>Usage Data:</strong> Attendance records (captured via QR scanning), student marks, awarded medals, and system logs.</li>
                        </ul>

                        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6">2. How We Use Your Information</h4>
                        <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
                            <li><strong>Automation:</strong> Marking daily attendance and automatically calculating class fees based on those records.</li>
                            <li><strong>Communication:</strong> Sending SMS alerts for fee payments, announcements, and OTP verifications.</li>
                            <li><strong>Reporting:</strong> Generating professional PDF reports for attendance and financial summaries.</li>
                            <li><strong>Transparency:</strong> Allowing parents to securely monitor their child's academic progress, attendance, and fee status.</li>
                        </ul>

                        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6">3. Data Sharing and Third Parties</h4>
                        <p className="text-gray-600 dark:text-gray-400">We respect your privacy and do not sell your data. Information is only shared with third parties necessary for platform operations:</p>
                        <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
                            <li><strong>Payment Gateways:</strong> Secure payment processing through providers like PayHere.</li>
                            <li><strong>Communication Providers:</strong> SMS and email delivery via services like Dialog SMS, Twilio, or SendGrid.</li>
                            <li><strong>Internal Role Visibility:</strong> Data is shared between linked roles (e.g., an Institute can monitor its Tutors' classes).</li>
                        </ul>

                        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6">4. Data Security and Integrity</h4>
                        <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
                            <li><strong>Encryption:</strong> Sensitive data such as passwords and bank details are encrypted using AES-256 and hashed using bcrypt or Argon2.</li>
                            <li><strong>Authentication:</strong> All access is secured via JWT-based authentication and role-based authorization.</li>
                            <li><strong>Data Integrity:</strong> We use ACID-compliant transactions to ensure data consistency and perform daily backups.</li>
                        </ul>

                        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6">5. Your Rights and Choices</h4>
                        <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
                            <li><strong>Account Deletion:</strong> Users have the right to permanently delete their accounts and associated data at any time.</li>
                            <li><strong>Data Modification:</strong> You can update your profile, qualifications, and class details through your dashboard.</li>
                            <li><strong>Visibility Control:</strong> Students can choose to show or hide their academic marks and medals.</li>
                            <li><strong>Data Access:</strong> You have the right to request a copy of your data in a portable format.</li>
                        </ul>

                        <div className="not-prose mt-4">
                            <Link to="/privacy" className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
                                View full Privacy Policy page <ExternalLink size={11} />
                            </Link>
                        </div>
                    </div>
                );

            case 'terms':
                return (
                    <div className="space-y-6 prose dark:prose-invert max-w-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center justify-between border-b pb-4 dark:border-gray-700">
                            <h3 className="text-xl font-bold m-0 text-gray-900 dark:text-white">Terms and Conditions for Tutorz</h3>
                            <span className="text-sm text-gray-500">Last Updated: April 1, 2026</span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">
                            Welcome to Tutorz, a mobile and web-based solution designed to modernize the Sri Lankan tuition industry through automated attendance and fee management. By accessing our platform, you agree to comply with the following terms.
                        </p>

                        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6">1. Acceptance of Terms</h4>
                        <p className="text-gray-600 dark:text-gray-400">By registering an account, you agree to be bound by these Terms and Conditions and our Privacy and Refund Policies. If you do not agree, you may not use the platform.</p>

                        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6">2. User Roles and Responsibilities</h4>
                        <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
                            <li><strong>Institutes:</strong> Responsible for managing their own tutors, subjects, classes, and student enrollments.</li>
                            <li><strong>Tutors:</strong> Responsible for marking accurate attendance (via QR scanning), managing class schedules, and generating invoices.</li>
                            <li><strong>Students/Parents:</strong> Responsible for maintaining account security and ensuring timely payment of fees via the platform.</li>
                            <li><strong>Administrators (Team Kylix):</strong> Responsible for system-wide integrity, commission settings, and mediating user disputes.</li>
                        </ul>

                        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6">3. Accounts and Security</h4>
                        <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
                            <li><strong>Identity:</strong> You must provide accurate and current information during registration.</li>
                            <li><strong>Credentials:</strong> Users are responsible for the confidentiality of their login details.</li>
                            <li><strong>Security Layer:</strong> All access is secured via JWT-based authentication to prevent unauthorized data access.</li>
                        </ul>

                        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6">4. Fees and Financial Transactions</h4>
                        <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
                            <li><strong>Commission Model:</strong> Tutorz operates on a flexible 1% commission model based on class fees. This fee may be split between the tutor and the institute by mutual agreement.</li>
                            <li><strong>Convenience Fees:</strong> A platform service fee (Kylix Convenience Fee) may be applied to tutors and institutes for infrastructure maintenance.</li>
                            <li><strong>Payment Processing:</strong> All online transactions are processed through integrated gateways (e.g., PayHere) compliant with Sri Lankan financial regulations.</li>
                            <li><strong>Payouts/Withdrawals:</strong> Tutors or Institutes may request withdrawals of accumulated earnings, which are processed weekly following Admin approval and SLIPS file generation.</li>
                        </ul>

                        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6">5. Attendance and Reporting</h4>
                        <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
                            <li><strong>QR Scanning:</strong> Attendance marked via the mobile app's QR scanner is considered the primary record for fee calculations.</li>
                            <li><strong>Digital Accuracy:</strong> Users acknowledge that automated fee calculations are based on attendance logs; any discrepancies must be reported immediately.</li>
                            <li><strong>Document Generation:</strong> Professional PDF reports are generated for internal use and transparency between parties.</li>
                        </ul>

                        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6">6. User Conduct and Content</h4>
                        <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
                            <li><strong>Inappropriate Content:</strong> The System Administrator reserves the right to remove offensive class names, descriptions, or content.</li>
                            <li><strong>Academic Integrity:</strong> Tutors are responsible for the accuracy of published results and medals awarded through the platform.</li>
                        </ul>

                        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6">7. Limitations &amp; Governing Law</h4>
                        <p className="text-gray-600 dark:text-gray-400">
                            Tutorz is a technology provider and does not employ tutors or run tuition institutes. We are not liable for the quality of education provided or direct disputes between students and tutors. These terms are governed by the laws of Sri Lanka and comply with ICTA guidelines for digital platforms.
                        </p>

                        <div className="not-prose mt-4">
                            <Link to="/terms" className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
                                View full Terms &amp; Conditions page <ExternalLink size={11} />
                            </Link>
                        </div>
                    </div>
                );

            case 'refund':
                return (
                    <div className="space-y-6 prose dark:prose-invert max-w-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center justify-between border-b pb-4 dark:border-gray-700">
                            <h3 className="text-xl font-bold m-0 text-gray-900 dark:text-white">Refund Policy for Tutorz</h3>
                            <span className="text-sm text-gray-500">Last Updated: April 1, 2026</span>
                        </div>

                        {/* Bank-required highlighted notice */}
                        <div className="not-prose flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
                            <span className="text-blue-500 dark:text-blue-400 text-lg leading-none">ℹ</span>
                            <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed m-0">
                                <strong>Important:</strong> Please note that all refunds will be credited back to the original payment-initiated media (e.g., the original credit card, debit card, or mobile wallet used for the transaction).
                            </p>
                        </div>

                        <p className="text-gray-600 dark:text-gray-400">
                            At Tutorz (a product of Team Kylix), we are committed to providing a transparent and efficient platform for managing tuition attendance and fees. Because our platform facilitates payments between students/parents and independent tutors or institutes, the following policy outlines how refunds are handled within our ecosystem.
                        </p>

                        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6">1. Nature of Services</h4>
                        <p className="text-gray-600 dark:text-gray-400">Tutorz provides a digital service that includes: automated attendance tracking and QR scanning, digital fee calculation and invoice generation, downloadable monthly PDF reports, and communication tools.</p>

                        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6">2. Tuition Fee Refunds</h4>
                        <p className="text-gray-600 dark:text-gray-400">Tutorz acts as a payment facilitator. Tuition fees paid via the app are distributed to the respective Tutor or Institute.</p>
                        <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
                            <li><strong>Direct Responsibility:</strong> Any request for a refund of tuition fees (e.g., due to class cancellation or student withdrawal) must be initiated through the respective Tutor or Institute.</li>
                            <li><strong>Approval:</strong> Once the Tutor or Institute approves a refund, Tutorz will facilitate the reversal of the transaction through our integrated payment gateway.</li>
                            <li><strong>Timeline:</strong> Approved refunds are typically processed within 7 business days, depending on the student's bank or payment provider.</li>
                            <li><strong>Refund Method:</strong> Please note that all refunds will be credited back to the original payment-initiated media (e.g., the original credit card, debit card, or mobile wallet used for the transaction).</li>
                        </ul>

                        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6">3. Non-Refundable Items</h4>
                        <p className="text-gray-600 dark:text-gray-400">Certain fees and products are non-refundable:</p>
                        <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
                            <li><strong>Platform Convenience Fees:</strong> The small service fee (the Kylix Convenience Fee) charged for the use of the platform's infrastructure is non-refundable.</li>
                            <li><strong>Digital Products:</strong> Fees paid for generated and downloaded PDF reports or digital educational materials are non-refundable once the download is initiated.</li>
                            <li><strong>Completed Services:</strong> Fees for classes that the student has already attended, as verified by the digital attendance system, are not eligible for a refund.</li>
                        </ul>

                        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6">4. Dispute Resolution</h4>
                        <p className="text-gray-600 dark:text-gray-400">
                            In the event of a disagreement between a student and a tutor regarding a refund, the Tutorz System Administrator may act as a mediator. The Administrator will review digital attendance logs and payment records to make a fair determination. Decisions made by the System Administrator in dispute cases are final.
                        </p>

                        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6">5. Payment Errors</h4>
                        <p className="text-gray-600 dark:text-gray-400">
                            If you believe a technical error has occurred (e.g., a double-charge or an incorrect amount was billed), please contact our support team immediately at lktutorz@gmail.com. We will audit the transaction and, if a platform error is confirmed, we will issue a full refund of the erroneous amount. All such refunds will be credited back to the original payment-initiated media used for the transaction.
                        </p>

                        <div className="not-prose mt-4">
                            <Link to="/refund" className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
                                View full Refund Policy page <ExternalLink size={11} />
                            </Link>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[600px]">
            {/* Sidebar / Tabs */}
            <div className="w-full md:w-64 bg-gray-50 dark:bg-gray-900/50 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-700 p-4 flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap md:whitespace-normal text-left font-medium text-sm
                                ${activeTab === tab.id 
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                        >
                            <Icon size={18} className={activeTab === tab.id ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'} />
                            {tab.label}
                        </button>
                    );
                })}

                {/* Layer 2: Version Display */}
                <div className="mt-auto pt-6 px-4 hidden md:block border-t border-gray-100 dark:border-gray-800 space-y-3">
                    <div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 dark:text-gray-600 mb-0.5">App Version</p>
                        <p className="text-xs font-mono font-medium text-gray-500 dark:text-gray-400">
                            {APP_VERSION}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 dark:text-gray-600 mb-0.5">API Version</p>
                        <p className="text-xs font-mono font-medium text-gray-500 dark:text-gray-400">
                            {backendVersion}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-800">
                {renderContent()}
            </div>
        </div>
    );
};

export default AboutUsContent;
