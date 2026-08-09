import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useThemeContext } from '../../context/ThemeContext';
import { downloadMyQrPdf } from '../../services/auth/authService';
import systemService from '../../services/api/systemService';
import { Loader2 } from 'lucide-react';
import ConfirmationModal from '../molecules/ConfirmationModal';

const StudentQRCode = ({ value, studentName, userId = null, variant = 'default' }) => {
    const qrRef = useRef();
    const { theme } = useThemeContext();
    const isDark = theme === 'dark';
    const [isDownloading, setIsDownloading] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const downloadQRCode = async () => {
        setIsConfirmOpen(false);
        setIsDownloading(true);
        try {
            let blob;
            if (userId) {
                blob = await systemService.downloadUserQrPdf(userId);
            } else {
                blob = await downloadMyQrPdf();
            }

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${studentName}_QR_ID.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Failed to download QR code:', err);
            alert('Failed to download QR code PDF.');
        } finally {
            setIsDownloading(false);
        }
    };

    if (variant === 'compact') {
        return (
            <div className="group relative">
                <div 
                    ref={qrRef} 
                    className="p-1.5 bg-white dark:bg-gray-800 border-none shadow-xl transition-all cursor-pointer group-hover:scale-105" 
                    onClick={() => setIsConfirmOpen(true)}
                >
                    <div className="bg-blue-50 dark:bg-gray-900 transition-colors">
                        <QRCodeSVG
                            value={value}
                            size={140}
                            bgColor={isDark ? "#111827" : "#eff6ff"}
                            fgColor={isDark ? "#ffffff" : "#1e40af"}
                            level={"H"}
                            includeMargin={false}
                        />
                    </div>
                    {/* Compact download indicator */}
                    <div className="absolute top-2 right-2 p-1.5 bg-blue-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 w-full max-w-sm mx-auto transition-colors">
            <h3 className="mb-4 font-bold text-gray-700 dark:text-gray-200">{studentName}'s ID</h3>

            <div ref={qrRef} className="p-4 bg-white dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg transition-colors">
                <QRCodeSVG
                    value={value}
                    size={200}
                    bgColor={isDark ? "#111827" : "#ffffff"} // Matches gray-900 in dark mode
                    fgColor={isDark ? "#ffffff" : "#1e293b"} // White in dark mode, dark blue in light mode
                    level={"H"}
                    includeMargin={true}
                />
            </div>

            <p className="mt-4 text-xs text-gray-400 dark:text-gray-500 font-mono uppercase tracking-widest">
                {value}
            </p>

            <button
                onClick={() => setIsConfirmOpen(true)}
                disabled={isDownloading}
                className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isDownloading ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Downloading...
                    </>
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download QR Code
                    </>
                )}
            </button>

            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={downloadQRCode}
                title="Download QR Code"
                message={`Are you sure you want to download ${studentName}_QR_ID.pdf?`}
                confirmLabel="Download"
            />
        </div>
    );
};

export default StudentQRCode;
