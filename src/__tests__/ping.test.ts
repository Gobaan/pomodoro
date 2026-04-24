import { describe, it, expect } from 'vitest'
import { shouldPingOnPhase } from '../hooks/usePing'
import type { PhaseType } from '../types'

describe('shouldPingOnPhase', () => {
  const silent: PhaseType[] = ['warmup', 'focus', 'cooldown']
  const loud: PhaseType[] = ['shortBreak', 'longBreak']

  it.each(loud)('pings on %s', (phase) => {
    expect(shouldPingOnPhase(phase)).toBe(true)
  })

  it.each(silent)('does not ping on %s', (phase) => {
    expect(shouldPingOnPhase(phase)).toBe(false)
  })
})
