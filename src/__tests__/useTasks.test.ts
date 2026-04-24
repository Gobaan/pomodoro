import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTasks } from '../hooks/useTasks'

beforeEach(() => localStorage.clear())
afterEach(() => localStorage.clear())

describe('useTasks', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useTasks())
    expect(result.current.tasks).toHaveLength(0)
  })

  it('addTask appends a task with correct defaults', () => {
    const { result } = renderHook(() => useTasks())
    act(() => result.current.addTask('Write tests', 2))
    expect(result.current.tasks).toHaveLength(1)
    const t = result.current.tasks[0]
    expect(t.name).toBe('Write tests')
    expect(t.estimatedPomodoros).toBe(2)
    expect(t.actualPomodoros).toBe(0)
    expect(t.done).toBe(false)
  })

  it('addTask trims whitespace from name', () => {
    const { result } = renderHook(() => useTasks())
    act(() => result.current.addTask('  Fix bug  ', 1))
    expect(result.current.tasks[0].name).toBe('Fix bug')
  })

  it('removeTask deletes by id', () => {
    const { result } = renderHook(() => useTasks())
    act(() => result.current.addTask('Task A', 1))
    act(() => result.current.addTask('Task B', 2))
    const idA = result.current.tasks[0].id
    act(() => result.current.removeTask(idA))
    expect(result.current.tasks).toHaveLength(1)
    expect(result.current.tasks[0].name).toBe('Task B')
  })

  it('toggleDone flips done state', () => {
    const { result } = renderHook(() => useTasks())
    act(() => result.current.addTask('Task', 1))
    const id = result.current.tasks[0].id
    act(() => result.current.toggleDone(id))
    expect(result.current.tasks[0].done).toBe(true)
    act(() => result.current.toggleDone(id))
    expect(result.current.tasks[0].done).toBe(false)
  })

  it('setActual updates actualPomodoros', () => {
    const { result } = renderHook(() => useTasks())
    act(() => result.current.addTask('Task', 3))
    const id = result.current.tasks[0].id
    act(() => result.current.setActual(id, 5))
    expect(result.current.tasks[0].actualPomodoros).toBe(5)
  })

  it('setActual clamps to 0', () => {
    const { result } = renderHook(() => useTasks())
    act(() => result.current.addTask('Task', 2))
    const id = result.current.tasks[0].id
    act(() => result.current.setActual(id, -3))
    expect(result.current.tasks[0].actualPomodoros).toBe(0)
  })

  it('clearAll removes all tasks', () => {
    const { result } = renderHook(() => useTasks())
    act(() => result.current.addTask('A', 1))
    act(() => result.current.addTask('B', 2))
    act(() => result.current.clearAll())
    expect(result.current.tasks).toHaveLength(0)
  })

  it('resetForSession zeroes actuals and done without removing tasks', () => {
    const { result } = renderHook(() => useTasks())
    act(() => result.current.addTask('Task', 3))
    const id = result.current.tasks[0].id
    act(() => { result.current.setActual(id, 4); result.current.toggleDone(id) })
    expect(result.current.tasks[0].actualPomodoros).toBe(4)
    expect(result.current.tasks[0].done).toBe(true)
    act(() => result.current.resetForSession())
    expect(result.current.tasks).toHaveLength(1)
    expect(result.current.tasks[0].actualPomodoros).toBe(0)
    expect(result.current.tasks[0].done).toBe(false)
  })

  it('totalEstimated and totalActual sum correctly', () => {
    const { result } = renderHook(() => useTasks())
    act(() => result.current.addTask('A', 2))
    act(() => result.current.addTask('B', 3))
    expect(result.current.totalEstimated).toBe(5)
    const idA = result.current.tasks[0].id
    act(() => result.current.setActual(idA, 4))
    expect(result.current.totalActual).toBe(4)
  })

  it('persists tasks to localStorage', () => {
    const { result } = renderHook(() => useTasks())
    act(() => result.current.addTask('Persisted', 2))
    const { result: r2 } = renderHook(() => useTasks())
    expect(r2.current.tasks).toHaveLength(1)
    expect(r2.current.tasks[0].name).toBe('Persisted')
  })
})
