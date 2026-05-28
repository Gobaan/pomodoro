import { useCallback } from 'react'
import type { Task } from './useTasks'

export interface TaskRecord {
  id: string
  name: string
  tag: string
  sessionDate: string
}

export interface SessionSummary {
  sessionDate: string       // YYYY-MM-DD
  tasks: TaskRecord[]
}

const STORAGE_KEY = 'pmg_task_history'

function loadHistory(): TaskRecord[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') ?? []
  } catch {
    return []
  }
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
    .map(([sessionDate, tasks]) => ({ sessionDate, tasks }))
    .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate))
}

export function useTaskHistory() {
  const recordTasks = useCallback((tasks: Task[]) => {
    if (tasks.length === 0) return
    const now = new Date().toISOString()
    const records: TaskRecord[] = tasks.map(t => ({
      id:          t.id,
      name:        t.name,
      tag:         t.tag,
      sessionDate: now,
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...loadHistory(), ...records]))
  }, [])

  const getSessionSummaries = useCallback((): SessionSummary[] => {
    return computeSessionSummaries(loadHistory())
  }, [])

  return { recordTasks, getSessionSummaries }
}
