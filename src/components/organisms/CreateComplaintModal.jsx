import React, { useState, useRef } from 'react';
import { X, UploadCloud, AlertCircle, CheckCircle, Loader2, ImageIcon } from 'lucide-react';
import { createComplaint } from '../../services/api/disputeService';
import { compressImage } from '../../utils/helpers';

const CATEGORIES = [
  { value: 0, label: 'Financial' },
  { value: 1, label: 'Data Error' },
  { value: 2, label: 'Technical Issue' },
  { value: 3, label: 'Account Access' },
  { value: 4, label: 'Class Enrollment' },
  { value: 5, label: 'Attendance Issue' },
  { value: 6, label: 'Payment Issue' },
  { value: 7, label: 'Other' },
];

const CreateComplaintModal = ({ isOpen, onClose, onSuccess }) => {
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory]     = useState(7); // Default: Other
  const [screenshot, setScreenshot] = useState(null);
  const [preview, setPreview]       = useState(null);
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [dragOver, setDragOver]     = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const fileInputRef = useRef(null);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory(7);
    setScreenshot(null);
    setPreview(null);
    setError('');
    setSuccess('');
    setDragOver(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileSelect = async (file) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Only image files (JPG, PNG, GIF, WEBP) are allowed.');
      return;
    }
    
    setError('');
    setIsCompressing(true);
    
    try {
      // Compress if larger than 200KB
      const processedFile = await compressImage(file, 200);
      setScreenshot(processedFile);
      setPreview(URL.createObjectURL(processedFile));
      
      if (processedFile.size < file.size) {
        console.log(`Compressed: ${(file.size / 1024).toFixed(1)}KB -> ${(processedFile.size / 1024).toFixed(1)}KB`);
      }
    } catch (err) {
      console.error('Compression error:', err);
      setError('Failed to process image. Please try again.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim())       { setError('Please enter a complaint title.'); return; }
    if (!description.trim()) { setError('Please describe your complaint.'); return; }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category.toString());
      if (screenshot) formData.append('screenshot', screenshot);

      const result = await createComplaint(formData);
      setSuccess(`Complaint ${result.disputeNumber} submitted successfully!`);
      setTimeout(() => {
        handleClose();
        if (onSuccess) onSuccess();
      }, 1800);
    } catch (err) {
      setError(err.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700/50 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div>
            <h2 className="text-lg font-bold text-white">Submit a Complaint</h2>
            <p className="text-xs text-indigo-200 mt-0.5">We'll review and get back to you</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Success */}
          {success && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400">
              <CheckCircle size={18} />
              <span className="text-sm font-medium">{success}</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Complaint Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of your issue"
              maxLength={200}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your issue in detail, including any relevant dates or reference numbers..."
              maxLength={2000}
              rows={5}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/2000</p>
          </div>

          {/* Screenshot Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Screenshot <span className="text-gray-400 font-normal">(optional, max 10 MB)</span>
            </label>

            {preview ? (
              <div className="relative rounded-xl overflow-hidden border-2 border-indigo-300 dark:border-indigo-600">
                <img src={preview} alt="Preview" className="w-full max-h-40 object-contain bg-gray-100 dark:bg-gray-800" />
                <button
                  type="button"
                  onClick={() => { setScreenshot(null); setPreview(null); }}
                  className="absolute top-2 right-2 p-1 bg-gray-900/70 text-white rounded-lg hover:bg-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed transition-all text-sm ${
                  dragOver
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-gray-50 dark:bg-gray-800/50'
                } ${isCompressing ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {isCompressing ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 size={28} className="animate-spin text-indigo-500" />
                    <p className="text-gray-500 dark:text-gray-400">Processing image...</p>
                  </div>
                ) : (
                  <>
                    <UploadCloud size={28} className={dragOver ? 'text-indigo-500' : 'text-gray-400'} />
                    <p className="text-gray-500 dark:text-gray-400">
                      Drag & drop an image, or <span className="text-indigo-600 dark:text-indigo-400 font-semibold">browse</span>
                    </p>
                    <p className="text-xs text-gray-400">JPG, PNG, GIF, WEBP supported</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !!success}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-md shadow-indigo-200 dark:shadow-indigo-900/30"
            >
              {isLoading ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateComplaintModal;
