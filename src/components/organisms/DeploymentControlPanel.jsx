import React, { useState, useEffect } from 'react';
import { Rocket, AlertTriangle, Users, Calendar, X, Loader2 } from 'lucide-react';
import { getMinTokenDate, getOnlineCount, forceLogoutAll } from '../../services/api/adminService';

const DeploymentControlPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [minTokenDate, setMinTokenDate] = useState('Loading...');
  const [onlineCount, setOnlineCount] = useState(0);
  const [versionNumber, setVersionNumber] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchStats();
    }
  }, [isOpen]);

  const fetchStats = async () => {
    try {
      const dateRes = await getMinTokenDate();
      setMinTokenDate(dateRes.minTokenDate);
      const countRes = await getOnlineCount();
      setOnlineCount(countRes.onlineCount);
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
      setMinTokenDate('Error');
    }
  };

  const handleDeploy = async () => {
    if (!versionNumber) {
        setMessage('Version Number is required.');
        return;
    }

    if (!window.confirm(`Are you sure you want to force logout all ${onlineCount} online users?`)) {
      return;
    }

    setIsDeploying(true);
    setMessage('');
    try {
      await forceLogoutAll(versionNumber, releaseNotes);
      setMessage('Deployment triggered successfully!');
      setTimeout(() => {
        setIsOpen(false);
        setMessage('');
        setVersionNumber('');
        setReleaseNotes('');
      }, 2000);
    } catch (error) {
      console.error(error);
      setMessage('Failed to trigger deployment.');
    } finally {
      setIsDeploying(false);
      fetchStats();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        title="Admin Deployment Panel"
      >
        <Rocket size={16} />
        <span className="hidden sm:inline">Deploy</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Rocket size={18} className="text-indigo-600 dark:text-indigo-400" />
                Deployment Control
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                    <Users size={16} />
                    <span className="text-sm font-medium">Online Users</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{onlineCount}</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800/30 overflow-hidden">
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                    <Calendar size={16} />
                    <span className="text-sm font-medium">Last Deploy</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate" title={minTokenDate}>
                    {minTokenDate !== 'Not Set' && minTokenDate !== 'Error' ? new Date(minTokenDate).toLocaleTimeString() : minTokenDate}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Version Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 1.2.0"
                    value={versionNumber}
                    onChange={e => setVersionNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Release Notes for Users</label>
                  <textarea
                    placeholder="What's new in this update?"
                    value={releaseNotes}
                    onChange={e => setReleaseNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  />
                </div>
              </div>

              {message && (
                <div className={`p-3 rounded-lg text-sm ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {message}
                </div>
              )}

              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-700/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                  <div className="text-sm text-amber-800 dark:text-amber-300">
                    <p className="font-bold mb-1">Warning: Destructive Action</p>
                    <p>This will instantly log out all active users and invalidate all existing sessions. They will be forced to log in again.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleDeploy}
                disabled={isDeploying || !versionNumber}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeploying ? <Loader2 className="animate-spin" size={20} /> : <Rocket size={20} />}
                {isDeploying ? 'Deploying...' : 'Deploy & Force Log Out All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeploymentControlPanel;
