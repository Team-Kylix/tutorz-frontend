import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert, Loader2, AlertCircle, RefreshCw, Search,
  CheckCircle, XCircle, Clock, Eye, X, ChevronDown, Info
} from 'lucide-react';
import { getAllDisputes, updateDisputeStatus } from '../../services/api/disputeService';

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  0: { label: 'Pending',      color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',   icon: Clock },
  1: { label: 'Under Review', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',        icon: ShieldAlert },
  2: { label: 'Resolved',     color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',    icon: CheckCircle },
  3: { label: 'Rejected',     color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',            icon: XCircle },
  4: { label: 'Closed',       color: 'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400',        icon: XCircle },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG[0];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      <Icon size={12} /> {cfg.label}
    </span>
  );
};

// ─── Detail Modal ─────────────────────────────────────────────────────────────
const DisputeDetailModal = ({ dispute, onClose, onStatusUpdated }) => {
  const [status, setStatus]     = useState(dispute.status);
  const [adminNote, setAdminNote] = useState(dispute.adminNote || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');

  const handleUpdate = async () => {
    setUpdateError('');
    setUpdateSuccess('');
    setIsUpdating(true);
    try {
      await updateDisputeStatus(dispute.id, status, adminNote);
      setUpdateSuccess('Status updated successfully!');
      onStatusUpdated();
    } catch (err) {
      setUpdateError(err.message || 'Failed to update status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const date = new Date(dispute.createdAt).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700/50 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-slate-700 to-slate-900">
          <div>
            <span className="text-xs font-bold font-mono text-slate-300">{dispute.disputeNumber}</span>
            <h2 className="text-lg font-bold text-white mt-0.5 truncate">{dispute.title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Meta info */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Submitted By', value: dispute.raisedByName },
              { label: 'Role', value: dispute.raisedByRole },
              { label: 'Phone', value: dispute.raisedByPhone || '—' },
              { label: 'Category', value: dispute.categoryLabel },
              { label: 'Current Status', value: <StatusBadge status={dispute.status} /> },
              { label: 'Submitted At', value: date },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{label}</p>
                <div className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{value}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">Description</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap bg-gray-50 dark:bg-gray-800 p-3.5 rounded-xl">
              {dispute.description}
            </p>
          </div>

          {/* Screenshot */}
          {dispute.screenshotUrl && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">Screenshot</p>
              <a href={dispute.screenshotUrl} target="_blank" rel="noopener noreferrer">
                <img src={dispute.screenshotUrl} alt="Screenshot" className="max-h-56 rounded-xl border border-gray-200 dark:border-gray-700 object-contain hover:opacity-90 transition-opacity" />
              </a>
            </div>
          )}

          {/* Update Status */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-3">
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Update Status</p>

            {updateSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm">
                <CheckCircle size={16} /> {updateSuccess}
              </div>
            )}
            {updateError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                <AlertCircle size={16} /> {updateError}
              </div>
            )}

            <div className="relative">
              <select
                value={status}
                onChange={(e) => setStatus(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm appearance-none"
              >
                {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                  <option key={val} value={val}>{cfg.label}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Add a note for the user (optional)..."
              rows={3}
              maxLength={1000}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm resize-none"
            />

            <div className="flex justify-end">
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-indigo-200 dark:shadow-indigo-900/20 transition-all"
              >
                {isUpdating ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main AdminDisputesContent ─────────────────────────────────────────────────
const AdminDisputesContent = () => {
  const [disputes, setDisputes]         = useState([]);
  const [totalCount, setTotalCount]     = useState(0);
  const [isLoading, setIsLoading]       = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError]               = useState('');
  const [searchTerm, setSearchTerm]     = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage]                 = useState(1);
  const [hasMore, setHasMore]           = useState(true);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const PAGE_SIZE = 15;

  // Status filter
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const fetchDisputes = useCallback(async (isLoadMore = false, pg = 1, search = '') => {
    if (!isLoadMore) setIsLoading(true);
    else setIsLoadingMore(true);
    setError('');

    try {
      const res = await getAllDisputes(search, pg, PAGE_SIZE);
      const items = res.items || [];
      if (isLoadMore) setDisputes(prev => [...prev, ...items]);
      else setDisputes(items);
      setTotalCount(res.totalCount || 0);
      setHasMore(res.hasNextPage || false);
    } catch {
      setError('Failed to load disputes. Please try again.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    fetchDisputes(false, 1, debouncedSearch);
  }, [debouncedSearch, fetchDisputes]);

  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 80 && hasMore && !isLoadingMore && !isLoading) {
      const next = page + 1;
      setPage(next);
      fetchDisputes(true, next, debouncedSearch);
    }
  };

  const handleStatusUpdated = () => {
    setPage(1);
    fetchDisputes(false, 1, debouncedSearch);
  };

  // Local status filter
  const visibleDisputes = statusFilter === 'all'
    ? disputes
    : disputes.filter(d => d.status === Number(statusFilter));

  // Summary counts
  const counts = disputes.reduce((acc, d) => {
    acc[d.status] = (acc[d.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Disputes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage and resolve user complaints</p>
        </div>
        <button
          onClick={() => fetchDisputes(false, 1, debouncedSearch)}
          disabled={isLoading}
          className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors self-start sm:self-auto"
          title="Refresh"
        >
          <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: totalCount, color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300', statusKey: 'all' },
          { label: 'Pending', value: counts[0] || 0, color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400', statusKey: '0' },
          { label: 'Under Review', value: counts[1] || 0, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400', statusKey: '1' },
          { label: 'Resolved', value: counts[2] || 0, color: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400', statusKey: '2' },
          { label: 'Rejected', value: counts[3] || 0, color: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400', statusKey: '3' },
        ].map(({ label, value, color, statusKey }) => (
          <button
            key={label}
            onClick={() => setStatusFilter(statusKey)}
            className={`text-left p-3 rounded-xl border transition-all ${
              statusFilter === statusKey
                ? 'border-indigo-400 ring-2 ring-indigo-200 dark:ring-indigo-800/50'
                : 'border-gray-100 dark:border-gray-700'
            } ${color}`}
          >
            <p className="text-xs font-semibold opacity-70">{label}</p>
            <p className="text-2xl font-bold mt-0.5">{value}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search by number, title, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
          <span className="text-sm font-medium">Loading disputes...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-16 text-red-500 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30">
          <AlertCircle size={36} strokeWidth={1.5} />
          <p className="text-sm font-medium">{error}</p>
          <button onClick={() => fetchDisputes(false, 1, debouncedSearch)} className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-100 text-red-600">Retry</button>
        </div>
      ) : visibleDisputes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <ShieldAlert size={48} className="opacity-20 mb-4" />
          <p className="font-medium text-gray-600 dark:text-gray-400">No disputes found</p>
        </div>
      ) : (
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden"
          onScroll={handleScroll}
        >
          <div className="overflow-x-auto overflow-y-auto max-h-[620px] custom-scrollbar" onScroll={handleScroll}>
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <th className="px-5 py-4 font-semibold">Number</th>
                  <th className="px-5 py-4 font-semibold">Title</th>
                  <th className="px-5 py-4 font-semibold">Category</th>
                  <th className="px-5 py-4 font-semibold">Submitted By</th>
                  <th className="px-5 py-4 font-semibold">Role</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Date</th>
                  <th className="px-5 py-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {visibleDisputes.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md text-gray-700 dark:text-gray-300">
                        {d.disputeNumber}
                      </span>
                    </td>
                    <td className="px-5 py-4 max-w-[180px]">
                      <p className="truncate font-medium text-gray-900 dark:text-white">{d.title}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded-md">
                        {d.categoryLabel}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-700 dark:text-gray-300">{d.raisedByName}</td>
                    <td className="px-5 py-4 text-xs">{d.raisedByRole}</td>
                    <td className="px-5 py-4"><StatusBadge status={d.status} /></td>
                    <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(d.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setSelectedDispute(d)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                      >
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {isLoadingMore && (
              <div className="flex items-center justify-center p-4 text-indigo-500 space-x-2">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Loading more...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedDispute && (
        <DisputeDetailModal
          dispute={selectedDispute}
          onClose={() => setSelectedDispute(null)}
          onStatusUpdated={() => {
            setSelectedDispute(null);
            handleStatusUpdated();
          }}
        />
      )}
    </div>
  );
};

export default AdminDisputesContent;
