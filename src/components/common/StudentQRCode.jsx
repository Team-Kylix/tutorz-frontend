import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const StudentQRCode = ({ value, studentName }) => {
    const qrRef = useRef();

    const downloadQRCode = () => {
        // Assuming the QRCode is the first child SVG element
        const svg = qrRef.current.querySelector('svg');
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            // Set canvas dimensions to match SVG or arbitrary large size for high quality
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.fillStyle = '#ffffff'; // Ensure white background
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

            const pngFile = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.download = `${studentName}_QR_ID.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };

    return (
        <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-md border border-gray-100 w-full max-w-sm mx-auto">
            <h3 className="mb-4 font-bold text-gray-700">{studentName}'s ID</h3>

            <div ref={qrRef} className="p-4 bg-white border-2 border-dashed border-gray-200 rounded-lg">
                <QRCodeSVG
                    value={value}
                    size={200}
                    bgColor={"#ffffff"}
                    fgColor={"#1e293b"}
                    level={"H"}
                    includeMargin={true}
                />
            </div>

            <p className="mt-4 text-xs text-gray-400 font-mono uppercase tracking-widest">
                {value}
            </p>

            <button
                onClick={downloadQRCode}
                className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download QR Code
            </button>
        </div>
    );
};

export default StudentQRCode;
