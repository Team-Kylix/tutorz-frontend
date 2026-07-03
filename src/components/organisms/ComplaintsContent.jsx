import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquareWarning, Plus, Loader2, AlertCircle, RefreshCw,
  Clock, CheckCircle, XCircle, Search, ChevronDown, Image as ImageIcon,
  ShieldAlert, Info, Trash2
} from 'lucide-react';
import { getMyComplaints, deleteComplaint } from '../../services/api/disputeService';
import CreateComplaintModal from './CreateComplaintModal';

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status, label }) => {
  const styles = {
    0: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',   // Pending
    1: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',        // Under Review
    2: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',    // Resolved
    3: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',            // Rejected
    4: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',           // Closed
  };
  const icons = {
    0: <Clock size={12} />,
    1: <ShieldAlert size={12} />,
    2: <CheckCircle size={12} />,
    3: <XCircle size={12} />,
    4: <XCircle size={12} />,
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] || styles[4]}`}>
      {icons[status]}
      {label}
    </span>
  );
};

// ─── Tracking Timeline ────────────────────────────────────────────────────────
const TrackingTimeline = ({ status }) => {
  const steps = [
    { key: 0, label: 'Submitted' },
    { key: 1, label: 'Under Review' },
    { key: 2, label: 'Resolved' },
  ];
  const isRejected = status === 3 || status === 4;

  return (
    <div className="flex items-center gap-0 mt-3">
      {steps.map((step, idx) => {
        const isCompleted = isRejected
          ? step.key === 0
          : step.key <= status;
        const isActive = !isRejected && step.key === status;

        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                isCompleted
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : isActive
                    ? 'border-indigo-400 text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-300 dark:border-gray-600 text-gray-400 bg-gray-50 dark:bg-gray-800'
              }`}>
                {isCompleted ? <CheckCircle size={14} /> : idx + 1}
              </div>
              <span className={`text-xs mt-1 font-medium ${isCompleted ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-5 transition-all ${step.key < status && !isRejected ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
            )}
          </React.Fragment>
        );
      })}
      {isRejected && (
        <div className="flex flex-col items-center ml-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center bg-red-100 dark:bg-red-900/30 border-2 border-red-400">
            <XCircle size={14} className="text-red-500" />
          </div>
          <span className="text-xs mt-1 font-medium text-red-500">
            {status === 4 ? 'Closed' : 'Rejected'}
          </span>
        </div>
      )}
    </div>
  );
};

// ─── Complaint Card ───────────────────────────────────────────────────────────
const ComplaintCard = ({ dispute, onDeleteRequest }) => {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(dispute.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all overflow-hidden">
      {/* Card Header */}
      <div className="p-5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 text-xs font-mono font-bold border border-indigo-100 dark:border-indigo-800">
                {dispute.disputeNumber}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">{date}</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                {dispute.categoryLabel}
              </span>
            </div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{dispute.title}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {dispute.status === 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteRequest(dispute.id); }}
                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-800"
                title="Delete Complaint"
              >
                <Trash2 size={16} />
              </button>
            )}
            <StatusBadge status={dispute.status} label={dispute.statusLabel} />
            <ChevronDown
              size={18}
              className={`text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            />
          </div>
        </div>

        {/* Tracking bar always visible */}
        <TrackingTimeline status={dispute.status} />
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700 pt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1.5">Description</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{dispute.description}</p>
          </div>

          {dispute.adminNote && (
            <div className="flex gap-2.5 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
              <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-0.5">Admin Note</p>
                <p className="text-sm text-blue-800 dark:text-blue-300">{dispute.adminNote}</p>
              </div>
            </div>
          )}

          {dispute.screenshotUrl && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">Attached Screenshot</p>
              <a href={dispute.screenshotUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={dispute.screenshotUrl}
                  alt="Screenshot"
                  className="max-h-52 rounded-xl border border-gray-200 dark:border-gray-700 object-contain hover:opacity-90 transition-opacity cursor-pointer"
                />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main ComplaintsContent ────────────────────────────────────────────────────
const ComplaintsContent = () => {
  const [complaints, setComplaints]     = useState([]);
  const [totalCount, setTotalCount]     = useState(0);
  const [isLoading, setIsLoading]       = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError]               = useState('');
  const [page, setPage]                 = useState(1);
  const [hasMore, setHasMore]           = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteId, setDeleteId]         = useState(null);
  const [isDeleting, setIsDeleting]     = useState(false);
  const PAGE_SIZE = 10;

  const fetchComplaints = useCallback(async (isLoadMore = false, currentPage = 1) => {
    if (!isLoadMore) setIsLoading(true);
    else setIsLoadingMore(true);
    setError('');

    try {
      const res = await getMyComplaints(currentPage, PAGE_SIZE);
      const items = res.items || [];
      if (isLoadMore) setComplaints(prev => [...prev, ...items]);
      else setComplaints(items);
      setTotalCount(res.totalCount || 0);
      setHasMore(res.hasNextPage || false);
    } catch (err) {
      setError('Failed to load complaints. Please try again.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints(false, 1);
  }, [fetchComplaints]);

  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 50 && hasMore && !isLoadingMore && !isLoading) {
      const next = page + 1;
      setPage(next);
      fetchComplaints(true, next);
    }
  };

  const handleSuccess = () => {
    setPage(1);
    fetchComplaints(false, 1);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteComplaint(deleteId);
      setDeleteId(null);
      // Refresh the list after successful deletion
      setPage(1);
      fetchComplaints(false, 1);
    } catch (err) {
      alert(err.message || 'Failed to delete complaint.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Complaints</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {totalCount > 0 ? `${totalCount} complaint${totalCount !== 1 ? 's' : ''} submitted` : 'Track and manage your complaints'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchComplaints(false, 1)}
            disabled={isLoading}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-200 dark:shadow-indigo-900/30 transition-all"
          >
            <Plus size={17} />
            New Complaint
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
          <span className="text-sm font-medium">Loading complaints...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-16 text-red-500 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30">
          <AlertCircle size={36} strokeWidth={1.5} />
          <p className="text-sm font-medium">{error}</p>
          <button
            onClick={() => fetchComplaints(false, 1)}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : complaints.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
          onClick={() => setShowCreateModal(true)}
        >
          <MessageSquareWarning size={52} className="mx-auto mb-4 opacity-20" />
          <p className="font-semibold text-gray-600 dark:text-gray-400">No complaints yet</p>
          <p className="text-sm mt-1">Click here or use the button above to submit your first complaint.</p>
        </div>
      ) : (
        <div
          className="space-y-4 overflow-y-auto max-h-[70vh] pr-1 custom-scrollbar"
          onScroll={handleScroll}
        >
          {complaints.map((complaint) => (
            <ComplaintCard key={complaint.id} dispute={complaint} onDeleteRequest={setDeleteId} />
          ))}
          {isLoadingMore && (
            <div className="flex items-center justify-center p-4 text-indigo-500 space-x-2">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Loading more...</span>
            </div>
          )}
          {!hasMore && complaints.length > 0 && (
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 py-3">
              All complaints loaded.
            </p>
          )}
        </div>
      )}

      {/* Create Modal */}
      <CreateComplaintModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleSuccess}
      />

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-xl border border-gray-100 dark:border-gray-700 transform transition-all scale-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <AlertCircle className="text-red-600 dark:text-red-400" size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Complaint</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              Are you sure you want to delete this complaint? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-70"
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintsContent;
