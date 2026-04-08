import React, { useState, useEffect, useRef } from 'react';

/**
 * NetworkStatusDot
 * ============================================================
 * A tiny, non-intrusive connection indicator that lives in the TopNavbar.
 *
 * States:
 *   🟢 green  + "Online"    — Fully connected, everything working
 *   🟠 orange + "Unstable"  — Connected but high latency / slow network
 *   🔴 red    + "No Internet" — Browser reports offline
 *
 * Instability detection:
 *   - Uses `navigator.connection.effectiveType` (4g/3g/2g/slow-2g) when available.
 *   - Falls back to a lightweight ping to the backend to measure RTT.
 */

const INSTABILITY_RTT_MS = 2000; // Ping slower than this = "Unstable"
const PING_INTERVAL_MS   = 15000; // Check quality every 15 seconds
const PING_URL = '/registerSW.js'; // Tiny local file, no server load

const STATUS = {
  ONLINE:   'online',
  UNSTABLE: 'unstable',
  OFFLINE:  'offline',
};

const config = {
  [STATUS.ONLINE]:   { dot: 'bg-green-500',  label: 'Online',      text: 'text-green-600 dark:text-green-400' },
  [STATUS.UNSTABLE]: { dot: 'bg-orange-400', label: 'Unstable',    text: 'text-orange-600 dark:text-orange-400' },
  [STATUS.OFFLINE]:  { dot: 'bg-red-500',    label: 'No Internet', text: 'text-red-600 dark:text-red-400' },
};

const NetworkStatusDot = () => {
  const [status, setStatus] = useState(
    navigator.onLine ? STATUS.ONLINE : STATUS.OFFLINE
  );
  const pingTimer = useRef(null);

  const checkQuality = async () => {
    if (!navigator.onLine) {
      setStatus(STATUS.OFFLINE);
      return;
    }

    // Use the Network Information API if available (Chrome/Android)
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      const type = conn.effectiveType; // 'slow-2g' | '2g' | '3g' | '4g'
      if (type === 'slow-2g' || type === '2g') {
        setStatus(STATUS.UNSTABLE);
        return;
      }
    }

    // Fallback: measure RTT with a tiny ping
    try {
      const start = Date.now();
      await fetch(PING_URL, { cache: 'no-store', mode: 'no-cors' });
      const rtt = Date.now() - start;
      setStatus(rtt > INSTABILITY_RTT_MS ? STATUS.UNSTABLE : STATUS.ONLINE);
    } catch {
      // Fetch failed but navigator.onLine is true = network very unstable
      setStatus(STATUS.UNSTABLE);
    }
  };

  useEffect(() => {
    const handleOffline = () => setStatus(STATUS.OFFLINE);
    const handleOnline  = () => checkQuality(); // Detect quality on reconnect

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online',  handleOnline);

    // Periodic quality check
    pingTimer.current = setInterval(checkQuality, PING_INTERVAL_MS);
    checkQuality(); // Initial check on mount

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online',  handleOnline);
      clearInterval(pingTimer.current);
    };
  }, []);

  const { dot, label, text } = config[status];

  return (
    <div
      className="flex items-center gap-1.5 cursor-default select-none"
      title={`Connection: ${label}`}
    >
      {/* Animated dot */}
      <span className="relative flex h-2.5 w-2.5">
        {/* Pulsing ring — only on unstable/offline to draw attention */}
        {status !== STATUS.ONLINE && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${dot}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dot}`} />
      </span>

      {/* Label — hidden on very small screens */}
      <span className={`hidden sm:inline text-[11px] font-semibold ${text}`}>
        {label}
      </span>
    </div>
  );
};

export default NetworkStatusDot;
