import { useCallback } from 'react'
import type { Task } from './useTasks'

export interface TaskRecord {
  id: string
  name: string
  tag: string
  estimated: number
  actual: number
  sessionDate: string // ISO timestamp
}

export interface TagSummary {
  tag: string
  count: number          // number of task instances
  avgEstimated: number
  avgActual: number
  accuracyPct: number    // (avgEstimated / avgActual) * 100 — >100 means under-estimated
}

export interface SessionSummary {
  sessionDate: string
  tasks: TaskRecord[]
  accuracyPct: number | null // null if no tasks had actuals set
}

const STORAGE_KEY = 'pmg_task_history'

function loadHistory(): TaskRecord[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') ?? []
  } catch {
    return []
  }
}

export function computeTagSummaries(records: TaskRecord[]): TagSummary[] {
  const byTag = new Map<string, TaskRecord[]>()
  for (const r of records) {
    const group = byTag.get(r.tag) ?? []
    group.push(r)
    byTag.set(r.tag, group)
  }

  return Array.from(byTag.entries())
    .map(([tag, items]) => {
      const avgEstimated = items.reduce((s, r) => s + r.estimated, 0) / items.length
      const avgActual    = items.reduce((s, r) => s + r.actual,    0) / items.length
      const accuracyPct  = avgActual > 0 ? Math.round((avgEstimated / avgActual) * 100) : 100
      return { tag, count: items.length, avgEstimated, avgActual, accuracyPct }
    })
    .sort((a, b) => b.count - a.count)
}

export function computeSessionSummaries(records: TaskRecord[]): SessionSummary[] {
  const bySession = new Map<string, TaskRecord[]>()
  for (const r of records) {
    const key = r.sessionDate.slice(0, 10) // YYYY-MM-DD
    const group = bySession.get(key) ?? []
    group.push(r)
    bySession.set(key, group)
  }

  return Array.from(bySession.entries())
    .map(([sessionDate, tasks]) => {
      const withActuals = tasks.filter(t => t.actual > 0)
      const accuracyPct = withActuals.length > 0
        ? Math.round(
            withActuals.reduce((s, t) => s + t.estimated, 0) /
            withActuals.reduce((s, t) => s + t.actual,    0) * 100
          )
        : null
      return { sessionDate, tasks, accuracyPct }
    })
    .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate))
}

export function useTaskHistory() {
  const recordTasks = useCallback((tasks: Task[]) => {
    const tasksWithActuals = tasks.filter(t => t.estimatedPomodoros > 0)
    if (tasksWithActuals.length === 0) return

    const now = new Date().toISOString()
    const records: TaskRecord[] = tasksWithActuals.map(t => ({
      id:          t.id,
      name:        t.name,
      tag:         t.tag,
      estimated:   t.estimatedPomodoros,
      actual:      t.actualPomodoros,
      sessionDate: now,
    }))

    const history = [...loadHistory(), ...records]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  }, [])

  const getTagSummaries = useCallback((): TagSummary[] => {
    return computeTagSummaries(loadHistory())
  }, [])

  const getSessionSummaries = useCallback((): SessionSummary[] => {
    return computeSessionSummaries(loadHistory())
  }, [])

  return { recordTasks, getTagSummaries, getSessionSummaries }
}
