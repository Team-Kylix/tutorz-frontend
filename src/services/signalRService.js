import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { addNotification } from '../store/notificationSlice';
import { BASE_URL } from './api/apiClient';

class SignalRService {
  connection = null;
  // Tracks whether a start() is currently in-flight.
  // React 18 Strict Mode runs effect cleanup before the remount, so stopConnection()
  // can be called while negotiation is still happening. This flag prevents us from
  // aborting a brand-new connection that was just created.
  _activeToken = null;

  startConnection = async (token, dispatch) => {
    // Already connected with the same token — nothing to do
    if (this.connection && this._activeToken === token) return;

    // If there's an old connection (different token / leftover), clean it up first
    if (this.connection) {
      await this._safeStop();
    }

    this._activeToken = token;

    const conn = new HubConnectionBuilder()
      .withUrl(`${BASE_URL}/hubs/notifications?access_token=${token}`)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Critical) // Suppress expected React Strict Mode abort noise
      .build();

    this.connection = conn;

    // Wire up the event listener before start() so no events are missed
    conn.on('ReceiveNotification', (notification) => {
      console.log('[SignalR] Live notification received:', notification);
      dispatch(addNotification(notification));

      // Optional: native browser notification when app is in background
      if ('Notification' in window && window.Notification.permission === 'granted') {
        new window.Notification(notification.title, { body: notification.message });
      }
    });

    try {
      await conn.start();
      console.log('[SignalR] Connected successfully.');
    } catch (err) {
      // Only log an error if this connection is still the active one.
      // If stopConnection() was called while we were connecting (React Strict Mode
      // cleanup), the connection ref will have been nullified — that's expected,
      // not an error worth logging.
      if (this.connection === conn) {
        console.error('[SignalR] Connection failed:', err);
        this.connection = null;
        this._activeToken = null;
      }
    }
  };

  stopConnection = () => {
    if (!this.connection) return;

    // Null the refs immediately so any in-flight start() catch block
    // can detect that stopConnection() was intentionally called and
    // suppress the spurious error log.
    const conn = this.connection;
    this.connection = null;
    this._activeToken = null;

    // Always call stop() regardless of the current state:
    //   • Disconnected  → no-op (SignalR JS does nothing)
    //   • Connecting    → aborts the ongoing negotiation (expected + handled in catch)
    //   • Connected     → graceful close
    // We do NOT guard with state checks because React 18 Strict Mode cleanup fires
    // synchronously before `start()` has had a chance to transition from Disconnected,
    // so a state guard would silently skip stop() and leave a ghost connection running.
    conn.stop().catch(() => {
      // Swallow — connection may already be cleaning itself up
    });
  };

  // Internal helper: await a graceful stop before reconnecting with a new token
  _safeStop = async () => {
    const conn = this.connection;
    this.connection = null;
    this._activeToken = null;
    if (conn) {
      try { await conn.stop(); } catch { /* ignore */ }
    }
  };
}

const signalRService = new SignalRService();
export default signalRService;
