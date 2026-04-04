import React from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import Button from '../atoms/Button';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "primary", // 'primary', 'danger', 'success'
  children
}) => {
  if (!isOpen) return null;

  // Determine icon and colors based on variant
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <XCircle size={32} />,
          // Dark mode: darker red background, lighter red text
          iconBg: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
          btnVariant: 'danger'
        };
      case 'success':
        return {
          icon: <CheckCircle size={32} />,
          // Dark mode: darker green background, lighter green text
          iconBg: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
          btnVariant: 'primary'
        };
      default:
        return {
          icon: <AlertCircle size={32} />,
          // Dark mode: darker blue background, lighter blue text
          iconBg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
          btnVariant: 'primary'
        };
    }
  };

  const styles = getVariantStyles();

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">

          {/* Icon */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${styles.iconBg}`}>
            {styles.icon}
          </div>

          {/* Text Content */}
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
          
          {children ? (
            <div className="w-full text-left mt-4 mb-6">
              {children}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6 text-sm">
              {message}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 w-full">
            <Button
              variant="secondary"
              onClick={onCancel || onClose}
              fullWidth
            >
              {cancelLabel}
            </Button>

            <Button
              variant={styles.btnVariant}
              onClick={onConfirm}
              fullWidth
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );

  return createPortal(modalContent, document.body);
};

export default ConfirmationModal;