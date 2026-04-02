import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Globe, Shield, FileText, RefreshCw } from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="mt-12 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* Brand */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">Tutorz</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                            A product of Kylix Technology. Modernizing the Sri Lankan tuition industry through automated attendance and fee management.
                        </p>
                        <a
                            href="https://team-kylix-web.vercel.app/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 mt-3 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            <Globe size={12} />
                            team-kylix-web.vercel.app
                        </a>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">Legal & Policies</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    to="/terms"
                                    className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                    <FileText size={12} />
                                    Terms &amp; Conditions
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/privacy"
                                    className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                    <Shield size={12} />
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/refund"
                                    className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                    <RefreshCw size={12} />
                                    Refund Policy
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">Contact</h3>
                        <ul className="space-y-2">
                            <li>
                                <a
                                    href="mailto:kylixtechnology@gmail.com"
                                    className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                    <Mail size={12} />
                                    kylixtechnology@gmail.com
                                </a>
                            </li>
                            <li className="text-xs text-gray-500 dark:text-gray-400">
                                Kylix Technology, Sri Lanka
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        &copy; {currentYear} Tutorz &mdash; Kylix Technology. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4">
                        <Link to="/terms" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Terms</Link>
                        <Link to="/privacy" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Privacy</Link>
                        <Link to="/refund" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Refund</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
