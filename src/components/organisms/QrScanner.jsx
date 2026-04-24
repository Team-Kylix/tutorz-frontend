import React, { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const QrScanner = ({ onScanSuccess, onScanError }) => {
    const [scannerError, setScannerError] = useState('');

    useEffect(() => {
        const html5QrCode = new Html5Qrcode("qr-reader");
        let isStarted = false;

        const startScanner = async () => {
            try {
                const config = {
                    fps: 10,
                    qrbox: { width: 220, height: 220 },
                    aspectRatio: 1.0, 
                };

                await html5QrCode.start(
                    { facingMode: "environment" }, 
                    config,
                    (decodedText, decodedResult) => {
                         // Stop scanner to prevent multiple calls
                        if (html5QrCode.getState() === 2) {
                            html5QrCode.pause();
                        }
                        if (onScanSuccess) onScanSuccess(decodedText, decodedResult);
                    },
                    (errorMessage) => {
                        if (onScanError) onScanError(errorMessage);
                    }
                );
                isStarted = true;
            } catch (err) {
                console.error("Failed to start QR scanner.", err);
                setScannerError("Camera not available or permission denied.");
            }
        };

        // Delay the start so React StrictMode cleanup has a chance to run
        const timeoutId = setTimeout(() => {
            startScanner();
        }, 300);

        return () => {
            clearTimeout(timeoutId);
            if (isStarted) {
                html5QrCode.stop().then(() => {
                    html5QrCode.clear();
                }).catch(err => {
                    console.error("Failed to stop scanner", err);
                    html5QrCode.clear(); 
                });
            } else {
                html5QrCode.clear();
            }
        };
    }, []); // Empty dependency array

    return (
        <div className="w-full bg-black/5 dark:bg-black/40 rounded-2xl overflow-hidden shadow-inner border border-gray-200 dark:border-gray-700 p-2 relative flex flex-col items-center justify-center min-h-[300px]">
             {scannerError ? (
                <div className="text-red-500 text-sm font-semibold p-4 text-center">
                    {scannerError}
                </div>
            ) : (
                <>
                    <div id="qr-reader" className="w-full max-w-[280px] mx-auto overflow-hidden rounded-xl border-0"></div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 font-medium text-center">
                        Position the QR code inside the frame
                    </p>
                </>
            )}
        </div>
    );
};

export default QrScanner;
