import { describe, it, expect } from 'vitest'
import { findSegmentAtElapsed } from '../utils/sessionRestore'
import { buildSchedule } from '../utils/phaseSchedule'
import { DEFAULT_SESSION_CONFIG } from '../types'

// Default 4-cycle session: warmup(3m) + focus(20m) + cooldown(2m) + break per cycle
const segments = buildSchedule(DEFAULT_SESSION_CONFIG)
const totalSeconds = segments.reduce((s, seg) => s + seg.durationSeconds, 0)

function mins(m: number) { return m * 60 }
function hours(h: number) { return h * 3600 }

describe('findSegmentAtElapsed', () => {

  // ─── Basic positioning ────────────────────────────────────────────────────

  it('returns segment 0 at elapsed = 0', () => {
    const r = findSegmentAtElapsed(segments, 0)
    expect(r).not.toBeNull()
    expect(r!.index).toBe(0)
    expect(r!.segmentElapsed).toBe(0)
  })

  it('stays in segment 0 during warmup', () => {
    const r = findSegmentAtElapsed(segments, mins(1))
    expect(r!.index).toBe(0)
    expect(r!.segmentElapsed).toBe(mins(1))
  })

  it('advances to segment 1 (focus) after warmup ends', () => {
    // Segment 0 = warmup (3m = 180s)
    const r = findSegmentAtElapsed(segments, mins(3))
    expect(r!.index).toBe(1) // focus segment
    expect(r!.segmentElapsed).toBe(0)
  })

  it('is mid-focus at elapsed = warmup + 10m', () => {
    const r = findSegmentAtElapsed(segments, mins(3 + 10))
    expect(r!.index).toBe(1)
    expect(r!.segmentElapsed).toBe(mins(10))
  })

  it('returns correct segment elapsed within any segment', () => {
    // Advance past warmup(3m) + focus(20m) into cooldown(2m)
    const r = findSegmentAtElapsed(segments, mins(3 + 20 + 1))
    expect(r!.index).toBe(2) // cooldown
    expect(r!.segmentElapsed).toBe(mins(1))
  })

  // ─── Segment boundaries ───────────────────────────────────────────────────

  it('lands on next segment exactly at a boundary', () => {
    const seg0end = segments[0].durationSeconds
    const r = findSegmentAtElapsed(segments, seg0end)
    expect(r!.index).toBe(1)
    expect(r!.segmentElapsed).toBe(0)
  })

  it('is still in last segment at one second before session end', () => {
    const r = findSegmentAtElapsed(segments, totalSeconds - 1)
    expect(r).not.toBeNull()
    expect(r!.index).toBe(segments.length - 1)
  })

  // ─── Session complete (null) ──────────────────────────────────────────────

  it('returns null when elapsed equals total session duration', () => {
    expect(findSegmentAtElapsed(segments, totalSeconds)).toBeNull()
  })

  it('returns null when elapsed exceeds total — user away for a long time', () => {
    expect(findSegmentAtElapsed(segments, totalSeconds + mins(30))).toBeNull()
  })

  it('returns null after hours — typical overnight scenario', () => {
    expect(findSegmentAtElapsed(segments, hours(8))).toBeNull()
  })

  it('returns null after days', () => {
    expect(findSegmentAtElapsed(segments, hours(72))).toBeNull()
  })

  // ─── Empty / degenerate ───────────────────────────────────────────────────

  it('returns null for an empty segment list', () => {
    expect(findSegmentAtElapsed([], 0)).toBeNull()
  })

  it('returns null for an empty segment list with large elapsed', () => {
    expect(findSegmentAtElapsed([], hours(1))).toBeNull()
  })

  // ─── Realistic restore scenarios ──────────────────────────────────────────

  it('restores correctly after 25 minutes away (mid-session)', () => {
    // 25 minutes in: warmup(3) + focus(20) + cooldown(2) = 25m → into first break
    const r = findSegmentAtElapsed(segments, mins(25))
    expect(r).not.toBeNull()
    expect(segments[r!.index].phase).toBe('shortBreak')
  })

  it('restores to focus phase after 5 minutes away', () => {
    const r = findSegmentAtElapsed(segments, mins(5))
    expect(r).not.toBeNull()
    expect(segments[r!.index].phase).toBe('focus')
    expect(r!.segmentElapsed).toBe(mins(2)) // 5m - 3m warmup = 2m into focus
  })

  it('restores to second cycle after first cycle completes', () => {
    // Cycle 1: warmup(3) + focus(20) + cooldown(2) + shortBreak(5) = 30m
    const r = findSegmentAtElapsed(segments, mins(30))
    expect(r).not.toBeNull()
    expect(segments[r!.index].cycleIndex).toBe(1)
    expect(r!.segmentElapsed).toBe(0)
  })

  it('handles exactly 1 second elapsed', () => {
    const r = findSegmentAtElapsed(segments, 1)
    expect(r!.index).toBe(0)
    expect(r!.segmentElapsed).toBe(1)
  })
})
