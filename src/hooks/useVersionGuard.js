import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { persistor } from '../store';
import { APP_VERSION } from '../config/version';

const VERSION_KEY = 'app_version';

/**
 * useVersionGuard — Layer 2 of the PWA update strategy.
 *
 * Run once on every app boot. Compares the compiled APP_VERSION against
 * whatever version was last stored in localStorage.
 *
 * If they don't match (i.e., a new build was deployed), it means the user
 * is running freshly downloaded code but still has OLD persisted state
 * (auth token, Redux slices, IndexedDB). This can cause subtle bugs.
 *
 * The guard:
 *   1. Dispatches logout() → wipes Redux auth state and the persisted IndexedDB entry
 *   2. Purges the redux-persist store completely
 *   3. Saves the new version to localStorage
 *   4. Hard-redirects to /login (clears all React state in memory too)
 *
 * HOW TO TRIGGER: Just increment APP_VERSION in src/config/version.js before building.
 */
const useVersionGuard = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        const storedVersion = localStorage.getItem(VERSION_KEY);

        if (storedVersion === APP_VERSION) {
            // Same version — nothing to do
            return;
        }

        console.info(
            `[VersionGuard] Version changed: ${storedVersion ?? 'none'} → ${APP_VERSION}. Clearing session.`
        );

        // 1. Clear Redux auth state (also purges from IndexedDB via redux-persist)
        dispatch(logout());

        // 2. Purge the entire redux-persist store (all slices: auth, ui, dashboard, sync)
        persistor.purge();

        // 3. Clear any remaining localStorage entries (safe - won't affect offline sync queue
        //    because it's also in IndexedDB, which purge() handles above)
        localStorage.clear();
        sessionStorage.clear();

        // 4. Write the new version AFTER clearing, so the next boot sees the correct version
        localStorage.setItem(VERSION_KEY, APP_VERSION);

        // 5. Hard redirect to home — replaces history entry so back button won't return
        //    to the dashboard with empty state
        window.location.replace('/');

    }, [dispatch]);
};

export default useVersionGuard;
