import React from 'react';
import { X } from 'lucide-react';
import Button from '../atoms/Button';

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        // Backdrop
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            {/* Modal Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-transparent dark:border-gray-800">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
                    <Button variant="ghost" size="small" onClick={onClose}>
                        <X size={20} />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar dark:text-gray-300">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;