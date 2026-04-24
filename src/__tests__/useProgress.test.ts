import { describe, it, expect } from 'vitest'
import { computeStats } from '../hooks/useProgress'
import type { CompletedSession } from '../hooks/useProgress'

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString()
}

function thisMonth(dayOfMonth: number): string {
  const d = new Date()
  d.setDate(dayOfMonth)
  return d.toISOString()
}

describe('computeStats', () => {
  it('returns zeros for empty session list', () => {
    const stats = computeStats([])
    expect(stats.weekly.cycles).toBe(0)
    expect(stats.monthly.cycles).toBe(0)
    expect(stats.allTime.sessions).toBe(0)
  })

  it('counts sessions within the last 7 days as weekly', () => {
    const sessions: CompletedSession[] = [
      { date: daysAgo(1), cycles: 4, focusMinutes: 100 },
      { date: daysAgo(6), cycles: 2, focusMinutes: 50 },
      { date: daysAgo(8), cycles: 3, focusMinutes: 75 }, // outside window
    ]
    const stats = computeStats(sessions)
    expect(stats.weekly.cycles).toBe(6)
    expect(stats.weekly.focusMinutes).toBe(150)
  })

  it('excludes sessions older than 7 days from weekly', () => {
    const sessions: CompletedSession[] = [
      { date: daysAgo(8), cycles: 4, focusMinutes: 100 },
    ]
    expect(computeStats(sessions).weekly.cycles).toBe(0)
  })

  it('counts sessions in the current calendar month as monthly', () => {
    const sessions: CompletedSession[] = [
      { date: thisMonth(1), cycles: 3, focusMinutes: 75 },
      { date: thisMonth(2), cycles: 1, focusMinutes: 25 },
    ]
    const stats = computeStats(sessions)
    expect(stats.monthly.cycles).toBe(4)
    expect(stats.monthly.focusMinutes).toBe(100)
  })

  it('all-time totals include every session', () => {
    const sessions: CompletedSession[] = [
      { date: daysAgo(100), cycles: 10, focusMinutes: 250 },
      { date: daysAgo(1), cycles: 4, focusMinutes: 100 },
    ]
    const stats = computeStats(sessions)
    expect(stats.allTime.sessions).toBe(2)
    expect(stats.allTime.cycles).toBe(14)
    expect(stats.allTime.focusMinutes).toBe(350)
  })
})
