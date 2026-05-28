import { useState, useCallback } from 'react'

export interface Task {
  id: string
  name: string
  tag: string
  done: boolean
}

export function autoTag(name: string): string {
  return name.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9-]/g, '')
}

const STORAGE_KEY = 'pmg_tasks'

function loadTasks(): Task[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') ?? []
  } catch {
    return []
  }
}

function saveTasks(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks)

  const update = useCallback((next: Task[] | ((prev: Task[]) => Task[])) => {
    setTasks(prev => {
      const result = typeof next === 'function' ? next(prev) : next
      saveTasks(result)
      return result
    })
  }, [])

  const addTask = useCallback((name: string, tag?: string) => {
    const trimmed = name.trim()
    update(prev => [...prev, {
      id: makeId(),
      name: trimmed,
      tag: tag?.trim() || autoTag(trimmed),
      done: false,
    }])
  }, [update])

  const setTag = useCallback((id: string, tag: string) => {
    update(prev => prev.map(t => t.id === id ? { ...t, tag: tag.trim() } : t))
  }, [update])

  const removeTask = useCallback((id: string) => {
    update(prev => prev.filter(t => t.id !== id))
  }, [update])

  const toggleDone = useCallback((id: string) => {
    update(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }, [update])

  const clearAll = useCallback(() => {
    update([])
  }, [update])

  const resetForSession = useCallback(() => {
    update([])
  }, [update])

  return { tasks, addTask, removeTask, toggleDone, setTag, clearAll, resetForSession }
}
