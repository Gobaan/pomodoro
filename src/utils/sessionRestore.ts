import type { PhaseSegment } from '../types'

/**
 * Given a flat segment list and total elapsed seconds since session start,
 * returns which segment the session is currently in and how many seconds
 * have elapsed within that segment.
 *
 * Returns null when elapsed >= total session duration (session is complete).
 */
export function findSegmentAtElapsed(
  segments: PhaseSegment[],
  elapsedSeconds: number,
): { index: number; segmentElapsed: number } | null {
  let cum = 0
  for (let i = 0; i < segments.length; i++) {
    const end = cum + segments[i].durationSeconds
    if (elapsedSeconds < end) {
      return { index: i, segmentElapsed: elapsedSeconds - cum }
    }
    cum = end
  }
  return null
}
