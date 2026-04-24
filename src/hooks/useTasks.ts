import { useState, useCallback } from 'react'

export interface Task {
  id: string
  name: string
  estimatedPomodoros: number
  actualPomodoros: number
  done: boolean
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

  const addTask = useCallback((name: string, estimatedPomodoros: number) => {
    update(prev => [...prev, {
      id: makeId(),
      name: name.trim(),
      estimatedPomodoros,
      actualPomodoros: 0,
      done: false,
    }])
  }, [update])

  const removeTask = useCallback((id: string) => {
    update(prev => prev.filter(t => t.id !== id))
  }, [update])

  const toggleDone = useCallback((id: string) => {
    update(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }, [update])

  const setActual = useCallback((id: string, actualPomodoros: number) => {
    update(prev => prev.map(t => t.id === id ? { ...t, actualPomodoros: Math.max(0, actualPomodoros) } : t))
  }, [update])

  const clearAll = useCallback(() => {
    update([])
  }, [update])

  // Reset actuals and done state for a new session while keeping the task list
  const resetForSession = useCallback(() => {
    update(prev => prev.map(t => ({ ...t, actualPomodoros: 0, done: false })))
  }, [update])

  const totalEstimated = tasks.reduce((sum, t) => sum + t.estimatedPomodoros, 0)
  const totalActual    = tasks.reduce((sum, t) => sum + t.actualPomodoros, 0)

  return {
    tasks,
    addTask,
    removeTask,
    toggleDone,
    setActual,
    clearAll,
    resetForSession,
    totalEstimated,
    totalActual,
  }
}
