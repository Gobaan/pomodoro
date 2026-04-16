import type { SessionConfig, PhaseSegment, StageKey } from '../types'

/**
 * Build a flat array of PhaseSegments for an entire session.
 *
 * Phase → StageKey mapping:
 *   warmup     → focus    (opening of work period, uses focus track)
 *   focus      → focus
 *   cooldown   → cooldown
 *   shortBreak → break
 *   longBreak  → break
 *
 * startOffsetSeconds accumulates per stage across cycles and is used for
 * display purposes only — audio elements maintain their own playback position.
 */
export function buildSchedule(config: SessionConfig): PhaseSegment[] {
  const {
    totalCycles,
    cyclesBeforeLongBreak,
    workMinutes,
    warmupMinutes,
    cooldownMinutes,
    shortBreakMinutes,
    longBreakMinutes,
  } = config

  const focusMinutes = workMinutes - warmupMinutes - cooldownMinutes

  // Track cumulative seconds played per stage (for display metadata)
  const offsets: Record<StageKey, number> = { focus: 0, cooldown: 0, break: 0 }

  const segments: PhaseSegment[] = []

  function push(phase: PhaseSegment['phase'], stageKey: StageKey, minutes: number, cycleIndex: number) {
    const durationSeconds = minutes * 60
    segments.push({
      phase,
      stageKey,
      durationSeconds,
      startOffsetSeconds: offsets[stageKey],
      cycleIndex,
    })
    offsets[stageKey] += durationSeconds
  }

  for (let i = 0; i < totalCycles; i++) {
    push('warmup', 'focus', warmupMinutes, i)
    push('focus', 'focus', focusMinutes, i)
    push('cooldown', 'cooldown', cooldownMinutes, i)

    const isLastCycle = i === totalCycles - 1
    const isLongBreakCycle = (i + 1) % cyclesBeforeLongBreak === 0

    if (!isLastCycle) {
      if (isLongBreakCycle) {
        push('longBreak', 'break', longBreakMinutes, i)
      } else {
        push('shortBreak', 'break', shortBreakMinutes, i)
      }
    }
  }

  return segments
}
