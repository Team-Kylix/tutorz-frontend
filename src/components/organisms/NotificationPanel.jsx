import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  X, 
  CheckCheck, 
  UserPlus, 
  GraduationCap, 
  Bell, 
  BellOff, 
  ChevronRight,
  Clock
} from 'lucide-react';
import { 
  selectNotifications, 
  selectIsPanelOpen, 
  selectIsLoading,
  closePanel, 
  markAsReadThunk, 
  markAllAsReadThunk 
} from '../../store/notificationSlice';
import { formatDistanceToNow } from 'date-fns';

const NotificationPanel = () => {
  const dispatch = useDispatch();
  const notifications = useSelector(selectNotifications);
  const isOpen = useSelector(selectIsPanelOpen);
  const isLoading = useSelector(selectIsLoading);
  const panelRef = useRef(null);

  // Keep a ref that always reflects the latest isOpen value.
  // Using a ref inside the event listener avoids two problems:
  //   1. Stale closure: if we used isOpen directly in the handler, the handler
  //      captures isOpen at the time the effect ran. When isOpen changes React
  //      re-runs the effect, briefly registering two listeners before removing
  //      the old one. This is harmless in production but in React 18 Strict Mode
  //      (which double-invokes effects) it causes unpredictable double-dispatches.
  //   2. Strict Mode double-mount: by not listing isOpen in the deps array we
  //      register exactly ONE stable listener for the lifetime of the component.
  //      The ref.current check is always fresh so we never miss a state change.
  const isOpenRef = useRef(isOpen);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Single, stable outside-click / ESC listener — registered once on mount,
  // removed once on unmount. No isOpen in the deps array on purpose.
  useEffect(() => {
    const handleMouseDown = (event) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target) &&
        isOpenRef.current
      ) {
        dispatch(closePanel());
      }
    };

    const handleEsc = (event) => {
      if (event.key === 'Escape' && isOpenRef.current) {
        dispatch(closePanel());
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleEsc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const getIcon = (type) => {
    switch (type) {
      case 'StudentRegistration':
        return <UserPlus size={18} className="text-blue-500" />;
      case 'TutorRegistration':
        return <GraduationCap size={18} className="text-purple-500" />;
      default:
        return <Bell size={18} className="text-amber-500" />;
    }
  };

  const handleMarkAsRead = (id) => {
    dispatch(markAsReadThunk(id));
  };

  const handleMarkAllRead = () => {
    dispatch(markAllAsReadThunk());
  };

  return createPortal(
    <>
      {/* Background Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/40 transition-opacity duration-300"
          style={{ zIndex: 9999 }}
          onMouseDown={(e) => {
            // Stop propagation so the document mousedown handler doesn't
            // also fire (both would call closePanel — harmless but cleaner).
            e.stopPropagation();
            dispatch(closePanel());
          }}
        />
      )}

      {/* Sliding Panel */}
      <div
        ref={panelRef}
        className={`
          fixed top-0 right-0 h-full w-80 sm:w-[380px] bg-white dark:bg-gray-800 
          border-l border-gray-200 dark:border-gray-700 shadow-2xl 
          transition-transform duration-300 ease-in-out transform
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          flex flex-col scrollbar-hide
        `}
        style={{ zIndex: 10000 }}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Notifications
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              )}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Stay updated with institute activity</p>
          </div>
          <button
            onClick={() => dispatch(closePanel())}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Bar */}
        {notifications.length > 0 && (
          <div className="px-5 py-2.5 bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800 flex justify-end">
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1.5 transition-colors"
            >
              <CheckCheck size={14} />
              Mark all as read
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-3">
          {isLoading && notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-500">Loading your notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-60">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <BellOff size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-900 dark:text-white font-medium">No notifications yet</p>
              <p className="text-sm text-gray-500 text-center mt-1 px-8">We'll let you know when something important happens at your institute.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.notificationId}
                onClick={() => !notif.isRead && handleMarkAsRead(notif.notificationId)}
                className={`
                  relative group p-4 rounded-xl border transition-all duration-300 cursor-pointer
                  ${notif.isRead
                    ? 'bg-white/50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 opacity-70 hover:opacity-100'
                    : 'bg-blue-50/30 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900 shadow-sm hover:shadow-md'
                  }
                `}
              >
                {!notif.isRead && (
                  <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full" />
                )}

                <div className="flex gap-4">
                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                    ${notif.isRead ? 'bg-gray-100 dark:bg-gray-800' : 'bg-white dark:bg-gray-800 shadow-sm'}
                  `}>
                    {getIcon(notif.type)}
                  </div>

                  <div className="flex-1 pr-2">
                    <h3 className={`text-sm font-bold ${notif.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                      {notif.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500">
                        <Clock size={10} />
                        {notif.createdAt ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true }) : 'Just now'}
                      </div>

                      {!notif.isRead && (
                        <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-blue-500 group-hover:translate-x-1 transition-transform">
                          Mark as read <ChevronRight size={10} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 text-center bg-white/50 dark:bg-gray-900/50">
          <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-medium">Tutorz Cloud Hub v1.0</p>
        </div>
      </div>
    </>,
    document.body
  );
};

export default NotificationPanel;
