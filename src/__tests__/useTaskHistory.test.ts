import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { computeSessionSummaries, useTaskHistory } from '../hooks/useTaskHistory'
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
    sessionDate: '2025-01-15T10:00:00.000Z',
    ...overrides,
  }
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'abc',
    name: 'Write tests',
    tag: 'writing',
    done: true,
    ...overrides,
  }
}

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

  it('returns empty for no records', () => {
    expect(computeSessionSummaries([])).toHaveLength(0)
  })

  it('includes all tasks within a session', () => {
    const records = [
      makeRecord({ id: '1', name: 'Task A', sessionDate: '2025-01-15T10:00:00.000Z' }),
      makeRecord({ id: '2', name: 'Task B', sessionDate: '2025-01-15T11:00:00.000Z' }),
    ]
    const [summary] = computeSessionSummaries(records)
    expect(summary.tasks).toHaveLength(2)
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

  it('recordTasks skips empty task list', () => {
    const { result } = renderHook(() => useTaskHistory())
    act(() => result.current.recordTasks([]))
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    expect(stored).toHaveLength(0)
  })

  it('getSessionSummaries returns one entry per day', () => {
    const { result } = renderHook(() => useTaskHistory())
    act(() => result.current.recordTasks([makeTask(), makeTask()]))
    const sessions = result.current.getSessionSummaries()
    expect(sessions).toHaveLength(1)
    expect(sessions[0].tasks).toHaveLength(2)
  })

  it('getSessionSummaries accumulates across multiple record calls', () => {
    const { result } = renderHook(() => useTaskHistory())
    act(() => result.current.recordTasks([makeTask({ id: '1', name: 'A' })]))
    act(() => result.current.recordTasks([makeTask({ id: '2', name: 'B' })]))
    const sessions = result.current.getSessionSummaries()
    expect(sessions[0].tasks).toHaveLength(2)
  })
})
