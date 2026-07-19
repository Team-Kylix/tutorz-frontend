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
  isSubmitting = false,
  progress = null, // null if no progress, otherwise a number 0-100
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

          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {title}
          </h3>
          
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
            {message}
          </p>

          {progress !== null && (
            <div className="w-full mb-6">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    variant === 'danger' ? 'bg-red-500' : 
                    variant === 'success' ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {children ? (
            <div className="w-full text-left mt-4 mb-6">
              {children}
            </div>
          ) : null}

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
              disabled={isSubmitting}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );

};

export default ConfirmationModal;