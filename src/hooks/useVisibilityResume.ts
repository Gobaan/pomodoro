import { useEffect } from 'react'

/**
 * Fires `onResume` when the page becomes visible again after being hidden.
 * Guards against double-fires: only calls onResume on visible, never on hidden.
 *
 * Also handles `pageshow` with persisted=true for Android Firefox, which may
 * fire pageshow instead of visibilitychange when returning from another app.
 *
 * Does nothing when `enabled` is false (session paused, not started, complete).
 */
export function useVisibilityResume(onResume: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') onResume()
    }

    function handlePageShow(e: PageTransitionEvent) {
      // persisted=true means the page was restored from the bfcache (back/forward).
      // Non-persisted pageshow is a fresh load — audio hasn't started yet so skip.
      if (e.persisted) onResume()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pageshow', handlePageShow)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [enabled, onResume])
}
