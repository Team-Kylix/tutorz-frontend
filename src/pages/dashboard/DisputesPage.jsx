import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert, Loader2, AlertCircle, RefreshCw, Search,
  CheckCircle, XCircle, Clock, Eye, X, ChevronDown, UserCheck, Lock,
  Plus, MessageSquareWarning, Info
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';
import {
  getAllDisputes,
  getMyComplaints,
  updateDisputeStatus
} from '../../services/api/disputeService';
import CreateComplaintModal from '../../components/organisms/CreateComplaintModal';

// ─── Shared Components & Config ───────────────────────────────────────────────

const STATUS_CONFIG = {
  0: { label: 'Pending',      color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',   icon: Clock },
  1: { label: 'Under Review', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',       icon: ShieldAlert },
  2: { label: 'Resolved',     color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',   icon: CheckCircle },
  3: { label: 'Rejected',     color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',           icon: XCircle },
  4: { label: 'Closed',       color: 'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400',       icon: XCircle },
};

const StatusBadge = ({ status, label }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG[0];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      <Icon size={12} /> {label || cfg.label}
    </span>
  );
};

// ─── ADMIN VIEW COMPONENTS ───────────────────────────────────────────────────

const AdminDisputeDetailModal = ({ dispute, onClose, onStatusUpdated, isSuperAdmin, currentUserId }) => {
  const [status, setStatus]       = useState(dispute.status);
  const [adminNote, setAdminNote] = useState(dispute.adminNote || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError]   = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');

  const isLockedByOtherAdmin =
    dispute.assignedAdminUserId &&
    dispute.assignedAdminUserId !== currentUserId &&
    !isSuperAdmin;

  const handleUpdate = async () => {
    setUpdateError('');
    setUpdateSuccess('');
    setIsUpdating(true);
    try {
      await updateDisputeStatus(dispute.id, status, adminNote);
      setUpdateSuccess('Status updated successfully!');
      setTimeout(onStatusUpdated, 1000);
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-slate-700 to-slate-900 text-white">
          <div>
            <span className="text-xs font-bold font-mono opacity-70">{dispute.disputeNumber}</span>
            <h2 className="text-lg font-bold truncate">{dispute.title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {dispute.assignedAdminUserId && (
            <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium ${
              isLockedByOtherAdmin ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 border border-amber-200' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 border border-blue-200'
            }`}>
              {isLockedByOtherAdmin ? <Lock size={15} /> : <UserCheck size={15} />}
              <span>{isLockedByOtherAdmin ? `Handled by ${dispute.assignedAdminName}` : `You are handling this dispute`}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Submitted By', value: (
                <div className="flex flex-col">
                  <span className="font-semibold">{dispute.raisedByName}</span>
                  <span className="text-xs opacity-60">{dispute.raisedByRole} • {dispute.raisedByPhone}</span>
                </div>
              )},
              { label: 'Category', value: dispute.categoryLabel },
              { label: 'Date', value: date },
              { label: 'Current Status', value: <StatusBadge status={dispute.status} /> }
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{item.label}</p>
                <div className="text-sm font-medium mt-1">{item.value}</div>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</p>
            <div className="text-sm bg-gray-50 dark:bg-gray-800 p-4 rounded-xl whitespace-pre-wrap">{dispute.description}</div>
          </div>

          {dispute.screenshotUrl && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Attachment</p>
              <img src={dispute.screenshotUrl} alt="Screenshot" className="max-h-60 rounded-xl border border-gray-100 dark:border-gray-700" />
            </div>
          )}

          <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-3">
            <p className="text-sm font-bold">Update Status</p>
            {isLockedByOtherAdmin ? (
              <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100 flex items-center gap-2">
                <Lock size={14} /> Only {dispute.assignedAdminName} or SuperAdmin can update.
              </div>
            ) : (
              <>
                <select
                  value={status}
                  onChange={(e) => setStatus(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 outline-none"
                >
                  {Object.entries(STATUS_CONFIG).map(([v, c]) => (
                    <option key={v} value={v}>{c.label}</option>
                  ))}
                </select>
                <textarea
                  placeholder="Add admin note (visible to user)..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 h-24 resize-none outline-none"
                />
                <button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isUpdating ? <Loader2 className="animate-spin" size={18} /> : 'Save Changes'}
                </button>
                {updateSuccess && <p className="text-xs text-green-600 font-medium text-center">{updateSuccess}</p>}
                {updateError && <p className="text-xs text-red-600 font-medium text-center">{updateError}</p>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── USER VIEW COMPONENTS ────────────────────────────────────────────────────

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
        const isCompleted = isRejected ? step.key === 0 : step.key <= status;
        const isActive = !isRejected && step.key === status;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                isCompleted ? 'bg-indigo-600 border-indigo-600 text-white' : isActive ? 'border-indigo-400 text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-300 dark:border-gray-600 text-gray-400 bg-gray-50 dark:bg-gray-800'
              }`}>
                {isCompleted ? <CheckCircle size={14} /> : idx + 1}
              </div>
              <span className={`text-[10px] mt-1 font-medium ${isCompleted ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
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
          <div className="w-7 h-7 rounded-full flex items-center justify-center bg-red-100 border-2 border-red-400">
            <XCircle size={14} className="text-red-500" />
          </div>
          <span className="text-[10px] mt-1 font-medium text-red-500">{status === 4 ? 'Closed' : 'Rejected'}</span>
        </div>
      )}
    </div>
  );
};

const ComplaintCard = ({ dispute }) => {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(dispute.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-all hover:shadow-md">
      <div className="p-5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md border border-indigo-100">{dispute.disputeNumber}</span>
              <span className="text-[10px] text-gray-400">{date}</span>
              <span className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-md text-gray-600">{dispute.categoryLabel}</span>
            </div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{dispute.title}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={dispute.status} label={dispute.statusLabel} />
            <ChevronDown size={18} className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
        <TrackingTimeline status={dispute.status} />
      </div>
      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-50 dark:border-gray-700 pt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Description</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{dispute.description}</p>
          </div>
          {dispute.adminNote && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 rounded-xl flex gap-2.5">
              <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-blue-700 uppercase">Admin Note</p>
                <p className="text-sm text-blue-800 dark:text-blue-300">{dispute.adminNote}</p>
              </div>
            </div>
          )}
          {dispute.screenshotUrl && (
            <img src={dispute.screenshotUrl} alt="Proof" className="max-h-48 rounded-xl border border-gray-100 dark:border-gray-700 object-contain" />
          )}
        </div>
      )}
    </div>
  );
};

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────

const DisputesPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPERADMIN;
  const isSuperAdmin = user?.role === ROLES.SUPERADMIN;
  const currentUserId = user?.id || user?.userId;

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState(isAdmin ? '1' : 'all'); // Default "Under Review" for admin, "All" for user

  const PAGE_SIZE = 15;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const fetchDisputes = useCallback(async (isLoadMore = false, pg = 1, search = '') => {
    if (!isLoadMore) setIsLoading(true);
    else setIsLoadingMore(true);
    setError('');

    try {
      const res = isAdmin
        ? await getAllDisputes(search, pg, PAGE_SIZE)
        : await getMyComplaints(pg, PAGE_SIZE);

      const items = res.items || [];
      if (isLoadMore) setDisputes(prev => [...prev, ...items]);
      else setDisputes(items);

      setTotalCount(res.totalCount || 0);
      setHasMore(res.hasNextPage || false);
    } catch {
      setError('Failed to load data. Please refresh.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    setPage(1);
    fetchDisputes(false, 1, debouncedSearch);
  }, [debouncedSearch, fetchDisputes, isAdmin]);

  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 80 && hasMore && !isLoadingMore && !isLoading) {
      const next = page + 1;
      setPage(next);
      fetchDisputes(true, next, debouncedSearch);
    }
  };

  const handleRefresh = () => {
    setPage(1);
    fetchDisputes(false, 1, debouncedSearch);
  };

  // ─── Views ─────────────────────────────────────────────────────────────

  if (isAdmin) {
    const STATUS_TABS = [
      { key: '1', label: 'Under Review', color: 'text-blue-600',   bg: 'bg-blue-50' },
      { key: '0', label: 'Pending',      color: 'text-amber-600',  bg: 'bg-amber-50' },
      { key: '2', label: 'Resolved',     color: 'text-green-600',  bg: 'bg-green-50' },
      { key: '3', label: 'Rejected',     color: 'text-red-600',    bg: 'bg-red-50' },
      { key: '4', label: 'Closed',       color: 'text-gray-500',   bg: 'bg-gray-100' },
      { key: 'all', label: 'All',        color: 'text-slate-600', bg: 'bg-slate-100' },
    ];

    const visibleDisputes = statusFilter === 'all'
      ? disputes
      : disputes.filter(d => d.status === Number(statusFilter));

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Disputes</h1>
            <p className="text-sm text-gray-500">{isSuperAdmin ? 'Full visibility' : 'Scoped visibility'}</p>
          </div>
          <button onClick={handleRefresh} className="p-2 border rounded-xl hover:bg-gray-50 text-gray-500">
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${
                statusFilter === tab.key ? `${tab.bg} border-current ${tab.color}` : 'border-gray-200 text-gray-400 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            placeholder="Search number, title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none"
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto max-h-[600px]" onScroll={handleScroll}>
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-4">Number</th>
                  <th className="px-5 py-4">Title</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">User</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Assigned To</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {visibleDisputes.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-indigo-600">{d.disputeNumber}</td>
                    <td className="px-5 py-4 font-medium truncate max-w-[150px]">{d.title}</td>
                    <td className="px-5 py-4 opacity-70">{d.categoryLabel}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{d.raisedByName}</span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">{d.raisedByRole} • {d.raisedByPhone}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={d.status} /></td>
                    <td className="px-5 py-4">
                      {d.assignedAdminUserId ? (
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-medium">
                          {d.assignedAdminName || 'Admin'}
                        </span>
                      ) : <span className="opacity-40 italic">Unassigned</span>}
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => setSelectedDispute(d)} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {isLoading && <div className="p-10 text-center"><Loader2 className="animate-spin inline mr-2" /> Loading...</div>}
            {!isLoading && visibleDisputes.length === 0 && <div className="p-10 text-center opacity-40 italic">No disputes found.</div>}
          </div>
        </div>

        {selectedDispute && (
          <AdminDisputeDetailModal
            dispute={selectedDispute}
            onClose={() => setSelectedDispute(null)}
            onStatusUpdated={() => { setSelectedDispute(null); handleRefresh(); }}
            isSuperAdmin={isSuperAdmin}
            currentUserId={currentUserId}
          />
        )}
      </div>
    );
  }

  // ─── USER VIEW ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Complaints</h1>
          <p className="text-sm text-gray-500 mt-0.5">{totalCount} complaints submitted</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} className="p-2 border rounded-xl hover:bg-gray-50 text-gray-500">
            <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200"
          >
            <Plus size={17} /> New Complaint
          </button>
        </div>
      </div>

      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1" onScroll={handleScroll}>
        {disputes.map(d => <ComplaintCard key={d.id} dispute={d} />)}
        {isLoading && <div className="text-center p-10"><Loader2 className="animate-spin inline" /></div>}
        {!isLoading && disputes.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <MessageSquareWarning size={48} className="mx-auto opacity-20 mb-4" />
            <p className="text-gray-400 font-medium">No complaints yet. Need help?</p>
          </div>
        )}
      </div>

      <CreateComplaintModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleRefresh}
      />
    </div>
  );
};

export default DisputesPage;
