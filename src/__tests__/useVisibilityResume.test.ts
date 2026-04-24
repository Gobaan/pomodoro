import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useVisibilityResume } from '../hooks/useVisibilityResume'

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

function firePageShow(persisted: boolean) {
  const e = new Event('pageshow') as PageTransitionEvent
  Object.defineProperty(e, 'persisted', { value: persisted })
  window.dispatchEvent(e)
}

describe('useVisibilityResume', () => {
  beforeEach(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // Scenarios 1–3: tab/OS focus loss — audio should continue, no callback on hidden
  it('does not call onResume when page becomes hidden', () => {
    const onResume = vi.fn()
    renderHook(() => useVisibilityResume(onResume, true))
    setVisibility('hidden')
    expect(onResume).not.toHaveBeenCalled()
  })

  // Scenarios 2, 4, 5: tab/browser restored — onResume fires to re-arm audio
  it('calls onResume when page becomes visible', () => {
    const onResume = vi.fn()
    renderHook(() => useVisibilityResume(onResume, true))
    setVisibility('hidden')
    setVisibility('visible')
    expect(onResume).toHaveBeenCalledTimes(1)
  })

  // Scenario 6: autoplay policy suspends AudioContext on re-focus — onResume must fire
  // Browsers only dispatch visibilitychange on actual state transitions, so the
  // handler correctly covers the hidden→visible restore path.
  it('fires onResume on each hidden→visible transition', () => {
    const onResume = vi.fn()
    renderHook(() => useVisibilityResume(onResume, true))
    setVisibility('hidden')
    setVisibility('visible')
    expect(onResume).toHaveBeenCalledTimes(1)
  })

  // Scenario 7: multiple rapid focus/blur cycles — one call per restore, not cumulative
  it('calls onResume exactly once per visible transition across rapid cycles', () => {
    const onResume = vi.fn()
    renderHook(() => useVisibilityResume(onResume, true))
    setVisibility('hidden')
    setVisibility('visible')
    setVisibility('hidden')
    setVisibility('visible')
    setVisibility('hidden')
    setVisibility('visible')
    expect(onResume).toHaveBeenCalledTimes(3)
  })

  // Scenarios 8–9: Firefox fires visibilitychange correctly — same path as Chrome
  it('works the same for Firefox (visibilitychange is the recovery trigger)', () => {
    const onResume = vi.fn()
    renderHook(() => useVisibilityResume(onResume, true))
    setVisibility('hidden')
    setVisibility('visible')
    expect(onResume).toHaveBeenCalledTimes(1)
  })

  // Scenarios 10–11: Android Chrome — app switch / screen lock fire visibilitychange
  it('recovers on Android Chrome app switch (visibilitychange → hidden → visible)', () => {
    const onResume = vi.fn()
    renderHook(() => useVisibilityResume(onResume, true))
    setVisibility('hidden') // user switches to another app
    setVisibility('visible') // user returns
    expect(onResume).toHaveBeenCalledTimes(1)
  })

  // Scenario 12: Android Firefox — pageshow with persisted=true instead of visibilitychange
  it('calls onResume on pageshow with persisted=true (Android Firefox bfcache restore)', () => {
    const onResume = vi.fn()
    renderHook(() => useVisibilityResume(onResume, true))
    firePageShow(true)
    expect(onResume).toHaveBeenCalledTimes(1)
  })

  it('does not call onResume on pageshow with persisted=false (fresh load)', () => {
    const onResume = vi.fn()
    renderHook(() => useVisibilityResume(onResume, true))
    firePageShow(false)
    expect(onResume).not.toHaveBeenCalled()
  })

  // enabled=false: session not running or paused — no resume attempts
  it('does not call onResume when enabled is false', () => {
    const onResume = vi.fn()
    renderHook(() => useVisibilityResume(onResume, false))
    setVisibility('hidden')
    setVisibility('visible')
    firePageShow(true)
    expect(onResume).not.toHaveBeenCalled()
  })

  // enabled flips from false → true: listener should now activate
  it('registers listener when enabled switches from false to true', () => {
    const onResume = vi.fn()
    const { rerender } = renderHook(
      ({ enabled }) => useVisibilityResume(onResume, enabled),
      { initialProps: { enabled: false } },
    )
    setVisibility('hidden')
    setVisibility('visible')
    expect(onResume).toHaveBeenCalledTimes(0)

    rerender({ enabled: true })
    setVisibility('hidden')
    setVisibility('visible')
    expect(onResume).toHaveBeenCalledTimes(1)
  })

  // enabled flips true → false: listener removed, no further calls
  it('removes listener when enabled switches from true to false', () => {
    const onResume = vi.fn()
    const { rerender } = renderHook(
      ({ enabled }) => useVisibilityResume(onResume, enabled),
      { initialProps: { enabled: true } },
    )
    rerender({ enabled: false })
    setVisibility('hidden')
    setVisibility('visible')
    expect(onResume).not.toHaveBeenCalled()
  })

  // cleanup: listeners removed on unmount
  it('cleans up listeners on unmount', () => {
    const onResume = vi.fn()
    const { unmount } = renderHook(() => useVisibilityResume(onResume, true))
    unmount()
    setVisibility('hidden')
    setVisibility('visible')
    firePageShow(true)
    expect(onResume).not.toHaveBeenCalled()
  })
})
