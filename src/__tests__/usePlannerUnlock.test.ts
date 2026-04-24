import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePlannerUnlock, countDistinctDays } from '../hooks/usePlannerUnlock'
import type { CompletedSession } from '../hooks/useProgress'

const SESSIONS_KEY = 'pmg_completed_sessions'
const MANUAL_KEY   = 'pmg_planner_manual'

function makeSessions(days: string[]): CompletedSession[] {
  return days.map(d => ({ date: `${d}T10:00:00.000Z`, cycles: 1, focusMinutes: 25 }))
}

function writeSessions(days: string[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(makeSessions(days)))
}

beforeEach(() => localStorage.clear())
afterEach(() => localStorage.clear())

// ─── countDistinctDays ────────────────────────────────────────────────────────

describe('countDistinctDays', () => {
  it('returns 0 for empty list', () => {
    expect(countDistinctDays([])).toBe(0)
  })

  it('counts multiple sessions on the same day as one', () => {
    const sessions = makeSessions(['2025-01-01', '2025-01-01', '2025-01-02'])
    expect(countDistinctDays(sessions)).toBe(2)
  })

  it('counts 7 distinct days correctly', () => {
    const days = ['2025-01-01','2025-01-02','2025-01-03','2025-01-04','2025-01-05','2025-01-06','2025-01-07']
    expect(countDistinctDays(makeSessions(days))).toBe(7)
  })
})

// ─── usePlannerUnlock ─────────────────────────────────────────────────────────

describe('usePlannerUnlock', () => {
  it('is disabled by default with no sessions and no manual override', () => {
    const { result } = renderHook(() => usePlannerUnlock())
    expect(result.current.isEnabled).toBe(false)
    expect(result.current.autoUnlocked).toBe(false)
    expect(result.current.hasManualOverride).toBe(false)
  })

  it('auto-unlocks after 7 distinct session days', () => {
    const days = ['2025-01-01','2025-01-02','2025-01-03','2025-01-04','2025-01-05','2025-01-06','2025-01-07']
    writeSessions(days)
    const { result } = renderHook(() => usePlannerUnlock())
    expect(result.current.autoUnlocked).toBe(true)
    expect(result.current.isEnabled).toBe(true)
  })

  it('does not auto-unlock with fewer than 7 distinct days', () => {
    writeSessions(['2025-01-01','2025-01-02','2025-01-03'])
    const { result } = renderHook(() => usePlannerUnlock())
    expect(result.current.autoUnlocked).toBe(false)
    expect(result.current.isEnabled).toBe(false)
  })

  it('manual setEnabled(true) overrides auto-unlock=false', () => {
    const { result } = renderHook(() => usePlannerUnlock())
    act(() => result.current.setEnabled(true))
    expect(result.current.isEnabled).toBe(true)
    expect(result.current.hasManualOverride).toBe(true)
    expect(localStorage.getItem(MANUAL_KEY)).toBe('true')
  })

  it('manual setEnabled(false) overrides auto-unlock=true', () => {
    const days = ['2025-01-01','2025-01-02','2025-01-03','2025-01-04','2025-01-05','2025-01-06','2025-01-07']
    writeSessions(days)
    const { result } = renderHook(() => usePlannerUnlock())
    act(() => result.current.setEnabled(false))
    expect(result.current.isEnabled).toBe(false)
    expect(result.current.hasManualOverride).toBe(true)
  })

  it('clearOverride removes manual preference and falls back to auto', () => {
    localStorage.setItem(MANUAL_KEY, 'true')
    const { result } = renderHook(() => usePlannerUnlock())
    expect(result.current.hasManualOverride).toBe(true)
    act(() => result.current.clearOverride())
    expect(result.current.hasManualOverride).toBe(false)
    expect(localStorage.getItem(MANUAL_KEY)).toBeNull()
    // no sessions → auto = false
    expect(result.current.isEnabled).toBe(false)
  })

  it('persists manual override across remounts', () => {
    const { result: r1 } = renderHook(() => usePlannerUnlock())
    act(() => r1.current.setEnabled(true))

    const { result: r2 } = renderHook(() => usePlannerUnlock())
    expect(r2.current.isEnabled).toBe(true)
    expect(r2.current.hasManualOverride).toBe(true)
  })
})
