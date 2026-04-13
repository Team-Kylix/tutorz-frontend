import { createSlice, createSelector } from '@reduxjs/toolkit';

/**
 * ACTION TYPES
 * ============================================================
 * All supported offline-queue action types. When adding a new
 * feature to the offline queue, add its identifier here.
 */
export const SYNC_ACTION_TYPES = {
  MARK_ATTENDANCE: 'MARK_ATTENDANCE',
  ASSIGN_TO_CLASS: 'ASSIGN_TO_CLASS',
  UPDATE_PROFILE:  'UPDATE_PROFILE',
  CREATE_HALL: 'CREATE_HALL',
  UPDATE_HALL: 'UPDATE_HALL',
  DELETE_HALL: 'DELETE_HALL',
  TOGGLE_HALL_STATUS: 'TOGGLE_HALL_STATUS',
  CREATE_CLASS: 'CREATE_CLASS',
  UPDATE_CLASS: 'UPDATE_CLASS',
  DELETE_CLASS: 'DELETE_CLASS',
  TOGGLE_CLASS_STATUS: 'TOGGLE_CLASS_STATUS',
  REGISTER_USER: 'REGISTER_USER',
};

/**
 * SYNC RETRY SCHEDULE (Industry-Standard Exponential Backoff)
 * ============================================================
 * Attempt 1-5:   Immediate (within one processing cycle)
 * Attempt 6-10:  After 10 minutes of the 5th failure
 * Attempt 11-15: After 30 minutes of the 10th failure
 * Attempt 16-20: After 1 hour of the 15th failure
 * Attempt 21-25: After 5 hours of the 20th failure
 * After 25:      Marked as "FAILED" - shown as conflict in TopNavbar
 */
export const RETRY_SCHEDULE_MS = [
  0,                // Phase 1: Attempts 1-5   (immediate)
  10 * 60000,       // Phase 2: Attempts 6-10  (10 minutes)
  30 * 60000,       // Phase 3: Attempts 11-15 (30 minutes)
  60 * 60000,       // Phase 4: Attempts 16-20 (1 hour)
  5 * 60 * 60000,   // Phase 5: Attempts 21-25 (5 hours)
];

export const RETRIES_PER_PHASE = 5;
export const MAX_RETRIES = RETRY_SCHEDULE_MS.length * RETRIES_PER_PHASE; // 25

/**
 * Calculates when the next sync attempt should be scheduled.
 * @param {number} retryCount - Number of attempts already made.
 * @returns {number} Unix timestamp (ms) for the next allowed attempt.
 */
export const getNextRetryTime = (retryCount) => {
  const phase = Math.min(Math.floor(retryCount / RETRIES_PER_PHASE), RETRY_SCHEDULE_MS.length - 1);
  return Date.now() + RETRY_SCHEDULE_MS[phase];
};

/**
 * Generic Sync Queue Item
 * ============================================================
 * @typedef {Object} SyncQueueItem
 * @property {string} id          - Unique ID for this action
 * @property {string} actionType  - One of SYNC_ACTION_TYPES
 * @property {Object} payload     - All data needed to replay this action
 * @property {string} label       - Human-readable description for notifications (e.g. "Mark Present: Ali Hassan")
 * @property {number} timestamp   - When the user triggered the action (ms)
 * @property {number} retryCount  - Failed attempt count
 * @property {number} nextRetryAt - When to try next (ms)
 * @property {'pending'|'failed'} status
 * @property {string|null} errorMessage - Last server error message
 */

const initialState = {
  /** All pending offline actions waiting to be uploaded to the server */
  queue: [],
  /** Actions that exhausted all retries — shown as error notifications */
  conflicts: [],
  /** Lock flag: prevents multiple concurrent sync loops */
  isSyncing: false,
  /**
   * Tombstones: dedupeKeys of items that have already been processed
   * (either synced successfully or confirmed idempotent by the server).
   * Used to prevent re-queuing the same action in the same session
   * even after the queue item has been removed.
   */
  tombstones: [],
};

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    /**
     * Add any action to the offline outbox.
     *
     * Example usage (attendance):
     *   dispatch(enqueueAction({
     *     actionType: SYNC_ACTION_TYPES.MARK_ATTENDANCE,
     *     payload: { studentId, classId },
     *     label: `Mark Present: ${studentName}`,
     *     dedupeKey: `${studentId}_${classId}`,   // Optional: prevents duplicates
     *   }));
     *
     * Example usage (profile update):
     *   dispatch(enqueueAction({
     *     actionType: SYNC_ACTION_TYPES.UPDATE_PROFILE,
     *     payload: { role, formData },
     *     label: `Update Profile: ${firstName}`,
     *     // No dedupeKey - allows multiple profile updates to queue
     *   }));
     */
    enqueueAction: (state, action) => {
      const { actionType, payload, label, dedupeKey } = action.payload;

      // DUPLICATE GUARD: If a dedupeKey is provided, don't add identical actions.
      // Check both the live queue AND the tombstones (already-processed items).
      if (dedupeKey) {
        const alreadyQueued = state.queue.some((item) => item.dedupeKey === dedupeKey);
        const alreadyDone = state.tombstones.includes(dedupeKey);
        if (alreadyQueued || alreadyDone) return;
      }

      state.queue.push({
        id: `${actionType}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        actionType,
        payload,
        label: label || actionType,
        dedupeKey: dedupeKey || null,
        timestamp: Date.now(),
        retryCount: 0,
        nextRetryAt: Date.now(), // First attempt is immediate
        isBursting: false,      // New: whether the item is currently in a recovery burst
        burstAttempts: 0,        // New: attempt counter during a burst
        status: 'pending',
        errorMessage: null,
      });
    },

    /**
     * Start a "Recovery Burst" for all pending items.
     * Called by SyncManager when connection is restored.
     * Sets all items to be retried immediately (ignoring their current wait phase).
     */
    startBurstMode: (state) => {
      state.queue.forEach((item) => {
        if (item.status === 'pending') {
          item.isBursting = true;
          item.burstAttempts = 0;
          item.nextRetryAt = Date.now();
        }
      });
    },

    /**
     * Remove a successfully synced item from the queue.
     */
    dequeueAction: (state, action) => {
      const item = state.queue.find((i) => i.id === action.payload.id);
      // Save dedupeKey to tombstones so the same action can't be re-queued this session
      if (item?.dedupeKey && !state.tombstones.includes(item.dedupeKey)) {
        state.tombstones.push(item.dedupeKey);
      }
      state.queue = state.queue.filter((item) => item.id !== action.payload.id);
    },

    /**
     * Record a sync failure. Increments retry count and calculates
     * next retry time. After MAX_RETRIES, moves item to conflicts list.
     */
    recordSyncFailure: (state, action) => {
      const { id, errorMessage } = action.payload;
      const item = state.queue.find((i) => i.id === id);
      if (!item) return;

      item.retryCount += 1;
      item.errorMessage = errorMessage;

      // ---- BURST MODE HANDLING ----
      if (item.isBursting) {
        item.burstAttempts += 1;
        
        // If we've tried 5 times in a row since going online and still fail,
        // stop "bursting" and return to the normal phase-based schedule.
        if (item.burstAttempts >= 5) {
          item.isBursting = false;
          item.burstAttempts = 0;
          item.nextRetryAt = getNextRetryTime(item.retryCount);
        } else {
          // Otherwise, force the NEXT retry to also be immediate
          item.nextRetryAt = Date.now();
        }
      } else {
        // NORMAL HANDLING (Phase-based delays)
        if (item.retryCount >= MAX_RETRIES) {
          // Max retries exhausted — add to conflicts for user notification
          state.conflicts.push({
            id: item.id,
            actionType: item.actionType,
            label: item.label,
            timestamp: item.timestamp,
            reason: errorMessage || 'Maximum retry attempts exceeded.',
            seenByUser: false,
          });
          // Remove from active queue
          state.queue = state.queue.filter((i) => i.id !== id);
        } else {
          item.nextRetryAt = getNextRetryTime(item.retryCount);
        }
      }
    },

    /** Lock/unlock the sync processing loop to prevent race conditions. */
    setSyncing: (state, action) => {
      state.isSyncing = action.payload;
    },

    /** Mark a conflict notification as "seen" to dismiss the badge. */
    markConflictAsSeen: (state, action) => {
      const conflict = state.conflicts.find((c) => c.id === action.payload.id);
      if (conflict) conflict.seenByUser = true;
    },

    /** Remove all conflicts the user has already seen/acknowledged. */
    clearSeenConflicts: (state) => {
      state.conflicts = state.conflicts.filter((c) => !c.seenByUser);
    },

    /**
     * Emergency wipe — called on logout and account switch.
     * Prevents any queued action from being uploaded under a different session.
     */
    clearSyncQueue: () => initialState, // resets tombstones too (correct on logout/account-switch)
  },
});

export const {
  enqueueAction,
  dequeueAction,
  recordSyncFailure,
  startBurstMode,
  setSyncing,
  markConflictAsSeen,
  clearSeenConflicts,
  clearSyncQueue,
} = syncSlice.actions;

export default syncSlice.reducer;

// ─── Selectors ──────────────────────────────────────────────────────────────

/** Total count of pending records waiting for upload */
export const selectPendingCount = createSelector(
  (state) => state.sync.queue,
  (queue) => queue.filter((i) => i.status === 'pending').length
);

/** All error notifications not yet seen by the user */
export const selectUnseenConflicts = createSelector(
  (state) => state.sync.conflicts,
  (conflicts) => conflicts.filter((c) => !c.seenByUser)
);

/** Count of error notifications not yet seen by the user */
export const selectUnseenConflictCount = createSelector(
  selectUnseenConflicts,
  (unseen) => unseen.length
);

/** Items that are pending AND whose retry delay has elapsed */
export const selectDueItems = createSelector(
  (state) => state.sync.queue,
  (queue) => {
    // Note: We use a fixed 'now' for this execution cycle.
    const now = Date.now();
    return queue.filter(
      (i) => i.status === 'pending' && i.nextRetryAt <= now
    );
  }
);

/**
 * All dedupeKeys that have been fully processed this session
 * (synced successfully or confirmed as already-done by the server).
 * Components can use this to show "Already Marked" UI states.
 */
export const selectTombstones = (state) => state.sync.tombstones;
