import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  dequeueAction,
  recordSyncFailure,
  startBurstMode,
  setSyncing,
  selectDueItems,
  SYNC_ACTION_TYPES,
} from '../../store/syncSlice';
import {
  markAttendance,
  assignStudentToClass,
  updateInstituteProfile,
  addHall,
  updateHall,
  deleteHall,
  toggleHallStatus,
} from '../../services/api/instituteService';
import { updateTutorProfile, createClass, updateClass, deleteClass } from '../../services/api/tutorService';
import { updateStudentProfile } from '../../services/api/studentService';
import { register, registerSibling } from '../../services/auth/authService';
import signalRService from '../../services/signalRService';
import { fetchNotificationsThunk } from '../../store/notificationSlice';

/**
 * Server error messages that mean the action is already done on the server side.
 * In these cases we should DEQUEUE (treat as success), NOT retry.
 * Without this, "Already marked" records stay in the queue forever!
 */
const IDEMPOTENT_ERRORS = [
  'already marked',
  'already assigned',
  'already exists',
  'duplicate',
];

/**
 * Checks if a server error means the action is already complete.
 * If so, we should silently dequeue the item rather than retrying.
 */
const isAlreadyDoneError = (errorMessage = '') => {
  const lower = errorMessage.toLowerCase();
  return IDEMPOTENT_ERRORS.some((phrase) => lower.includes(phrase));
};

/**
 * ACTION ROUTER
 * Maps each SYNC_ACTION_TYPE to the correct API call.
 * To add a new offline-capable feature, add an entry here.
 */
const executeAction = async (item) => {
  const { actionType, payload } = item;
  switch (actionType) {
    case SYNC_ACTION_TYPES.MARK_ATTENDANCE:
      return markAttendance(payload.studentId, payload.classId);
    case SYNC_ACTION_TYPES.ASSIGN_TO_CLASS:
      return assignStudentToClass(payload.studentId, payload.classId);
    case SYNC_ACTION_TYPES.UPDATE_PROFILE:
      switch (payload.role) {
        case 'Tutor':     return updateTutorProfile(payload.formData);
        case 'Student':   return updateStudentProfile(payload.formData);
        case 'Institute': return updateInstituteProfile(payload.formData);
        default: throw new Error(`Unknown role for UPDATE_PROFILE: ${payload.role}`);
      }
    case SYNC_ACTION_TYPES.CREATE_HALL:
      return addHall(payload.hallData);
    case SYNC_ACTION_TYPES.UPDATE_HALL:
      return updateHall(payload.id, payload.hallData);
    case SYNC_ACTION_TYPES.DELETE_HALL:
      return deleteHall(payload.id);
    case SYNC_ACTION_TYPES.TOGGLE_HALL_STATUS:
      return toggleHallStatus(payload.id);
    case SYNC_ACTION_TYPES.CREATE_CLASS:
      return createClass(payload.classData);
    case SYNC_ACTION_TYPES.UPDATE_CLASS:
    case SYNC_ACTION_TYPES.TOGGLE_CLASS_STATUS:
      return updateClass(payload.id, payload.classData);
    case SYNC_ACTION_TYPES.DELETE_CLASS:
      return deleteClass(payload.id);
    case SYNC_ACTION_TYPES.REGISTER_USER:
      if (payload.isSibling) {
        return registerSibling(payload.registrationData);
      } else {
        return register(payload.registrationData);
      }
    default:
      throw new Error(`[SyncManager] Unknown actionType: ${actionType}`);
  }
};

/**
 * SyncManager
 * ============================================================
 * An invisible background worker. Monitors the Redux sync queue
 * and uploads pending records to Azure, with exponential backoff.
 *
 * KEY FIX: "Already marked" / "Already assigned" server responses are
 * now treated as SUCCESS (dequeue), not failures. This prevents records
 * from getting permanently stuck in the queue after idempotent actions.
 */
const SyncManager = () => {
  const dispatch = useDispatch();
  const dueItems = useSelector(selectDueItems);
  const isSyncingRef = useRef(false);
  const POLL_INTERVAL_MS = 30 * 1000;

  const processSyncQueue = async () => {
    if (isSyncingRef.current) return;
    if (dueItems.length === 0) return;
    if (!navigator.onLine) return;

    isSyncingRef.current = true;
    dispatch(setSyncing(true));

    for (const item of dueItems) {
      try {
        await executeAction(item);
        dispatch(dequeueAction({ id: item.id }));
        console.info(`[SyncManager] ✅ Synced: "${item.label}"`);

      } catch (err) {
        const errorMessage = err?.response?.data?.message || err?.message || 'Network error';

        // KEY FIX: If the server says "already done", the data IS on the server.
        // Treat this as a success and remove from queue instead of retrying forever.
        if (isAlreadyDoneError(errorMessage)) {
          dispatch(dequeueAction({ id: item.id }));
          console.info(`[SyncManager] ✅ Dequeued idempotent item (already on server): "${item.label}"`);
        } else {
          dispatch(recordSyncFailure({ id: item.id, errorMessage }));
          console.warn(`[SyncManager] ⚠️ Sync failed for "${item.label}" (attempt ${item.retryCount + 1}): ${errorMessage}`);
        }
      }
    }

    isSyncingRef.current = false;
    dispatch(setSyncing(false));
  };

  useEffect(() => {
    const handleOnline = () => {
      dispatch(startBurstMode());
      processSyncQueue();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [dueItems, dispatch]);

  useEffect(() => {
    processSyncQueue();
    const interval = setInterval(processSyncQueue, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [dueItems]);

  const { isAuthenticated, token, user } = useSelector((state) => state.auth);

  // --- SignalR & Notifications Lifecycle ---
  useEffect(() => {
    if (isAuthenticated && token && user?.role === 'Institute') {
      // 1. Start the real-time WebSocket connection
      signalRService.startConnection(token, dispatch);
      
      // 2. Fetch the notification history (last 50)
      dispatch(fetchNotificationsThunk());
    } else {
      // Stop connection on logout or if role changes
      signalRService.stopConnection();
    }

    // Cleanup on unmount
    return () => {
      signalRService.stopConnection();
    };
  }, [isAuthenticated, token, user?.role, dispatch]);

  return null;
};

export default SyncManager;
