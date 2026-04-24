import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  computeTagSummaries,
  computeSessionSummaries,
  useTaskHistory,
} from '../hooks/useTaskHistory'
import type { TaskRecord } from '../hooks/useTaskHistory'
import type { Task } from '../hooks/useTasks'

const STORAGE_KEY = 'pmg_task_history'

beforeEach(() => localStorage.clear())
afterEach(() => localStorage.clear())

function makeRecord(overrides: Partial<TaskRecord> = {}): TaskRecord {
  return {
    id: 'abc',
    name: 'Write tests',
    tag: 'writing',
    estimated: 2,
    actual: 3,
    sessionDate: '2025-01-15T10:00:00.000Z',
    ...overrides,
  }
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'abc',
    name: 'Write tests',
    tag: 'writing',
    estimatedPomodoros: 2,
    actualPomodoros: 3,
    done: true,
    ...overrides,
  }
}

// ─── computeTagSummaries ──────────────────────────────────────────────────────

describe('computeTagSummaries', () => {
  it('returns empty for no records', () => {
    expect(computeTagSummaries([])).toHaveLength(0)
  })

  it('groups records by tag', () => {
    const records = [
      makeRecord({ tag: 'writing', estimated: 2, actual: 3 }),
      makeRecord({ tag: 'writing', estimated: 2, actual: 2 }),
      makeRecord({ tag: 'review',  estimated: 1, actual: 1 }),
    ]
    const summaries = computeTagSummaries(records)
    expect(summaries).toHaveLength(2)
    expect(summaries[0].tag).toBe('writing')
    expect(summaries[0].count).toBe(2)
  })

  it('computes avgEstimated and avgActual correctly', () => {
    const records = [
      makeRecord({ tag: 'code', estimated: 2, actual: 4 }),
      makeRecord({ tag: 'code', estimated: 4, actual: 4 }),
    ]
    const [summary] = computeTagSummaries(records)
    expect(summary.avgEstimated).toBe(3)
    expect(summary.avgActual).toBe(4)
  })

  it('accuracyPct is 100 when estimated equals actual on average', () => {
    const records = [makeRecord({ estimated: 3, actual: 3 })]
    const [summary] = computeTagSummaries(records)
    expect(summary.accuracyPct).toBe(100)
  })

  it('accuracyPct below 100 means under-estimated (actual > estimated)', () => {
    const records = [makeRecord({ estimated: 2, actual: 4 })]
    const [summary] = computeTagSummaries(records)
    expect(summary.accuracyPct).toBe(50)
  })

  it('sorts by count descending', () => {
    const records = [
      makeRecord({ tag: 'rare' }),
      makeRecord({ tag: 'common' }),
      makeRecord({ tag: 'common' }),
    ]
    const summaries = computeTagSummaries(records)
    expect(summaries[0].tag).toBe('common')
  })
})

// ─── computeSessionSummaries ──────────────────────────────────────────────────

describe('computeSessionSummaries', () => {
  it('groups records by calendar day', () => {
    const records = [
      makeRecord({ sessionDate: '2025-01-15T09:00:00.000Z' }),
      makeRecord({ sessionDate: '2025-01-15T18:00:00.000Z' }),
      makeRecord({ sessionDate: '2025-01-16T10:00:00.000Z' }),
    ]
    const summaries = computeSessionSummaries(records)
    expect(summaries).toHaveLength(2)
  })

  it('sorts sessions newest first', () => {
    const records = [
      makeRecord({ sessionDate: '2025-01-14T10:00:00.000Z' }),
      makeRecord({ sessionDate: '2025-01-16T10:00:00.000Z' }),
    ]
    const summaries = computeSessionSummaries(records)
    expect(summaries[0].sessionDate).toBe('2025-01-16')
  })

  it('accuracyPct is null when no actuals were set', () => {
    const records = [makeRecord({ estimated: 2, actual: 0 })]
    const [summary] = computeSessionSummaries(records)
    expect(summary.accuracyPct).toBeNull()
  })

  it('computes session accuracy from tasks with actuals', () => {
    const records = [
      makeRecord({ estimated: 2, actual: 4, sessionDate: '2025-01-15T10:00:00.000Z' }),
      makeRecord({ estimated: 2, actual: 4, sessionDate: '2025-01-15T10:00:00.000Z' }),
    ]
    const [summary] = computeSessionSummaries(records)
    expect(summary.accuracyPct).toBe(50) // estimated 4 / actual 8
  })
})

// ─── useTaskHistory ───────────────────────────────────────────────────────────

describe('useTaskHistory', () => {
  it('recordTasks persists to localStorage', () => {
    const { result } = renderHook(() => useTaskHistory())
    act(() => result.current.recordTasks([makeTask()]))
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    expect(stored).toHaveLength(1)
    expect(stored[0].tag).toBe('writing')
  })

  it('recordTasks skips tasks with no estimated pomodoros', () => {
    const { result } = renderHook(() => useTaskHistory())
    act(() => result.current.recordTasks([makeTask({ estimatedPomodoros: 0 })]))
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    expect(stored).toHaveLength(0)
  })

  it('getTagSummaries reflects recorded tasks', () => {
    const { result } = renderHook(() => useTaskHistory())
    act(() => result.current.recordTasks([makeTask({ tag: 'review', estimatedPomodoros: 1, actualPomodoros: 2 })]))
    const summaries = result.current.getTagSummaries()
    expect(summaries).toHaveLength(1)
    expect(summaries[0].tag).toBe('review')
  })

  it('getSessionSummaries returns one entry per day', () => {
    const { result } = renderHook(() => useTaskHistory())
    act(() => result.current.recordTasks([makeTask(), makeTask()]))
    const sessions = result.current.getSessionSummaries()
    expect(sessions).toHaveLength(1)
    expect(sessions[0].tasks).toHaveLength(2)
  })
})
