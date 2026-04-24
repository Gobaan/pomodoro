import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSessionReminder } from '../hooks/useSessionReminder'

const STORAGE_KEY = 'pmg_pending_reminder'

function futureISO(msFromNow = 60_000): string {
  return new Date(Date.now() + msFromNow).toISOString()
}

function pastISO(msAgo = 60_000): string {
  return new Date(Date.now() - msAgo).toISOString()
}

// Minimal Notification mock — must use class syntax so `new Notification()` works.
// Returns a `getCallCount()` helper since a class is not a Vitest spy.
function mockNotification(permission: NotificationPermission = 'granted') {
  let callCount = 0
  class NotifMock {
    onclick: (() => void) | null = null
    static permission: NotificationPermission = permission
    static requestPermission = vi.fn().mockResolvedValue(permission)
    constructor() { callCount++ }
  }
  Object.defineProperty(window, 'Notification', { value: NotifMock, configurable: true, writable: true })
  return { getCallCount: () => callCount }
}

beforeEach(() => {
  vi.useFakeTimers()
  localStorage.clear()
  mockNotification('granted')
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('useSessionReminder', () => {
  it('starts with no pending reminder', () => {
    const { result } = renderHook(() => useSessionReminder())
    expect(result.current.pendingAt).toBeNull()
  })

  it('scheduleReminder persists timestamp to localStorage', async () => {
    const { result } = renderHook(() => useSessionReminder())
    const ts = futureISO()

    await act(async () => {
      await result.current.scheduleReminder(ts)
    })

    expect(localStorage.getItem(STORAGE_KEY)).toBe(ts)
    expect(result.current.pendingAt).toBe(ts)
  })

  it('scheduleReminder returns "scheduled" when permission granted', async () => {
    const { result } = renderHook(() => useSessionReminder())

    let outcome: string | undefined
    await act(async () => {
      outcome = await result.current.scheduleReminder(futureISO())
    })

    expect(outcome).toBe('scheduled')
  })

  it('scheduleReminder returns "denied" when permission denied', async () => {
    mockNotification('denied')
    const { result } = renderHook(() => useSessionReminder())

    let outcome: string | undefined
    await act(async () => {
      outcome = await result.current.scheduleReminder(futureISO())
    })

    expect(outcome).toBe('denied')
    expect(result.current.pendingAt).toBeNull()
  })

  it('fires Notification after the scheduled delay', async () => {
    const { getCallCount } = mockNotification()
    const { result } = renderHook(() => useSessionReminder())
    const delay = 5_000

    await act(async () => {
      await result.current.scheduleReminder(futureISO(delay))
    })

    expect(getCallCount()).toBe(0)
    act(() => { vi.advanceTimersByTime(delay + 100) })
    expect(getCallCount()).toBe(1)
  })

  it('clears localStorage after notification fires', async () => {
    const { result } = renderHook(() => useSessionReminder())
    const delay = 3_000

    await act(async () => {
      await result.current.scheduleReminder(futureISO(delay))
    })

    act(() => { vi.advanceTimersByTime(delay + 100) })
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(result.current.pendingAt).toBeNull()
  })

  it('cancelReminder clears localStorage and timeout', async () => {
    const { getCallCount } = mockNotification()
    const { result } = renderHook(() => useSessionReminder())
    const delay = 10_000

    await act(async () => {
      await result.current.scheduleReminder(futureISO(delay))
    })

    act(() => { result.current.cancelReminder() })

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(result.current.pendingAt).toBeNull()

    // Advance past when the notification would have fired — should not fire
    act(() => { vi.advanceTimersByTime(delay + 100) })
    expect(getCallCount()).toBe(0)
  })

  it('re-arms timeout on mount if a future reminder is in localStorage', () => {
    const { getCallCount } = mockNotification()
    const delay = 8_000
    localStorage.setItem(STORAGE_KEY, futureISO(delay))

    renderHook(() => useSessionReminder())

    act(() => { vi.advanceTimersByTime(delay + 100) })
    expect(getCallCount()).toBe(1)
  })

  it('clears stale reminder from localStorage on mount without firing', () => {
    const { getCallCount } = mockNotification()
    localStorage.setItem(STORAGE_KEY, pastISO())

    const { result } = renderHook(() => useSessionReminder())

    expect(result.current.pendingAt).toBeNull()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    act(() => { vi.advanceTimersByTime(60_000) })
    expect(getCallCount()).toBe(0)
  })

  it('returns unsupported when Notification API is unavailable', async () => {
    Object.defineProperty(window, 'Notification', { value: undefined, configurable: true, writable: true })
    const { result } = renderHook(() => useSessionReminder())

    let outcome: string | undefined
    await act(async () => {
      outcome = await result.current.scheduleReminder(futureISO())
    })

    expect(outcome).toBe('unsupported')
  })
})
