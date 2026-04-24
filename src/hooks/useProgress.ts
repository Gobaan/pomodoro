import { useCallback, useMemo, useState } from 'react'

export interface CompletedSession {
  date: string // ISO timestamp
  cycles: number
  focusMinutes: number
}

const STORAGE_KEY = 'pmg_completed_sessions'

function loadSessions(): CompletedSession[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') ?? []
  } catch {
    return []
  }
}

function isWithinDays(isoDate: string, days: number): boolean {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return new Date(isoDate).getTime() >= cutoff
}

function isCurrentMonth(isoDate: string): boolean {
  const d = new Date(isoDate)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

export interface ProgressStats {
  weekly: { cycles: number; focusMinutes: number }
  monthly: { cycles: number; focusMinutes: number }
  allTime: { sessions: number; cycles: number; focusMinutes: number }
}

export function computeStats(sessions: CompletedSession[]): ProgressStats {
  const weekly = { cycles: 0, focusMinutes: 0 }
  const monthly = { cycles: 0, focusMinutes: 0 }
  const allTime = { sessions: sessions.length, cycles: 0, focusMinutes: 0 }

  for (const s of sessions) {
    allTime.cycles += s.cycles
    allTime.focusMinutes += s.focusMinutes
    if (isWithinDays(s.date, 7)) {
      weekly.cycles += s.cycles
      weekly.focusMinutes += s.focusMinutes
    }
    if (isCurrentMonth(s.date)) {
      monthly.cycles += s.cycles
      monthly.focusMinutes += s.focusMinutes
    }
  }

  return { weekly, monthly, allTime }
}

export function useProgress() {
  const [sessions, setSessions] = useState<CompletedSession[]>(loadSessions)

  const recordSession = useCallback((cycles: number, focusMinutes: number) => {
    setSessions(prev => {
      const next = [...prev, { date: new Date().toISOString(), cycles, focusMinutes }]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const stats = useMemo(() => computeStats(sessions), [sessions])

  return { recordSession, stats }
}
