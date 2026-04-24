import { useState, useCallback } from 'react'
import type { CompletedSession } from './useProgress'

const SESSIONS_KEY = 'pmg_completed_sessions'
const MANUAL_KEY   = 'pmg_planner_manual' // 'true' | 'false' | absent

function loadSessions(): CompletedSession[] {
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? '[]') ?? []
  } catch {
    return []
  }
}

/** Returns the number of distinct calendar days (YYYY-MM-DD) in the session list. */
export function countDistinctDays(sessions: CompletedSession[]): number {
  return new Set(sessions.map(s => s.date.slice(0, 10))).size
}

const UNLOCK_THRESHOLD = 7

export function usePlannerUnlock() {
  const [manualOverride, setManualOverride] = useState<boolean | null>(() => {
    const raw = localStorage.getItem(MANUAL_KEY)
    if (raw === 'true')  return true
    if (raw === 'false') return false
    return null
  })

  // Auto-unlock is derived from session history — no state needed, computed once on mount.
  const autoUnlocked = countDistinctDays(loadSessions()) >= UNLOCK_THRESHOLD

  // Manual toggle wins over auto-unlock once set.
  const isEnabled = manualOverride !== null ? manualOverride : autoUnlocked

  const setEnabled = useCallback((value: boolean) => {
    localStorage.setItem(MANUAL_KEY, String(value))
    setManualOverride(value)
  }, [])

  const clearOverride = useCallback(() => {
    localStorage.removeItem(MANUAL_KEY)
    setManualOverride(null)
  }, [])

  return {
    isEnabled,
    autoUnlocked,
    hasManualOverride: manualOverride !== null,
    setEnabled,
    clearOverride,
  }
}
