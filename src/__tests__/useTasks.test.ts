import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTasks, autoTag } from '../hooks/useTasks'

beforeEach(() => localStorage.clear())
afterEach(() => localStorage.clear())

describe('useTasks', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useTasks())
    expect(result.current.tasks).toHaveLength(0)
  })

  it('addTask appends a task with correct defaults', () => {
    const { result } = renderHook(() => useTasks())
    act(() => result.current.addTask('Write tests'))
    expect(result.current.tasks).toHaveLength(1)
    const t = result.current.tasks[0]
    expect(t.name).toBe('Write tests')
    expect(t.done).toBe(false)
    expect(t.tag).toBe('write') // auto-filled from first word
  })

  it('addTask uses provided tag when given', () => {
    const { result } = renderHook(() => useTasks())
    act(() => result.current.addTask('Refactor auth module', 'refactor'))
    expect(result.current.tasks[0].tag).toBe('refactor')
  })

  it('setTag updates the tag for a task', () => {
    const { result } = renderHook(() => useTasks())
    act(() => result.current.addTask('Fix bug'))
    const id = result.current.tasks[0].id
    act(() => result.current.setTag(id, 'bugfix'))
    expect(result.current.tasks[0].tag).toBe('bugfix')
  })

  it('addTask trims whitespace from name', () => {
    const { result } = renderHook(() => useTasks())
    act(() => result.current.addTask('  Fix bug  '))
    expect(result.current.tasks[0].name).toBe('Fix bug')
  })

  it('removeTask deletes by id', () => {
    const { result } = renderHook(() => useTasks())
    act(() => result.current.addTask('Task A'))
    act(() => result.current.addTask('Task B'))
    const idA = result.current.tasks[0].id
    act(() => result.current.removeTask(idA))
    expect(result.current.tasks).toHaveLength(1)
    expect(result.current.tasks[0].name).toBe('Task B')
  })

  it('toggleDone flips done state', () => {
    const { result } = renderHook(() => useTasks())
    act(() => result.current.addTask('Task'))
    const id = result.current.tasks[0].id
    act(() => result.current.toggleDone(id))
    expect(result.current.tasks[0].done).toBe(true)
    act(() => result.current.toggleDone(id))
    expect(result.current.tasks[0].done).toBe(false)
  })

  it('clearAll removes all tasks', () => {
    const { result } = renderHook(() => useTasks())
    act(() => result.current.addTask('A'))
    act(() => result.current.addTask('B'))
    act(() => result.current.clearAll())
    expect(result.current.tasks).toHaveLength(0)
  })

  it('resetForSession clears all tasks for a fresh session', () => {
    const { result } = renderHook(() => useTasks())
    act(() => result.current.addTask('Task A'))
    act(() => result.current.addTask('Task B'))
    act(() => result.current.resetForSession())
    expect(result.current.tasks).toHaveLength(0)
  })

  it('persists tag to localStorage', () => {
    const { result } = renderHook(() => useTasks())
    act(() => result.current.addTask('Code review'))
    const { result: r2 } = renderHook(() => useTasks())
    expect(r2.current.tasks[0].tag).toBe('code')
  })

  it('persists tasks to localStorage', () => {
    const { result } = renderHook(() => useTasks())
    act(() => result.current.addTask('Persisted'))
    const { result: r2 } = renderHook(() => useTasks())
    expect(r2.current.tasks).toHaveLength(1)
    expect(r2.current.tasks[0].name).toBe('Persisted')
  })
})

// ─── autoTag ──────────────────────────────────────────────────────────────────

describe('autoTag', () => {
  it('returns first word lowercased', () => {
    expect(autoTag('Write tests')).toBe('write')
  })

  it('strips non-alphanumeric characters', () => {
    expect(autoTag('Fix: auth bug')).toBe('fix')
  })

  it('handles single word input', () => {
    expect(autoTag('Refactor')).toBe('refactor')
  })

  it('trims leading whitespace', () => {
    expect(autoTag('  Code review')).toBe('code')
  })
})
