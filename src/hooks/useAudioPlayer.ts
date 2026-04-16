import { useRef, useCallback } from 'react'
import type { StageKey } from '../types'

/**
 * Local audio file paths served from /public/audio/.
 * Background tracks loop seamlessly — the focus track (21 min) is shorter than
 * a full multi-cycle work period so looping ensures continuous audio.
 */

const BACKGROUND_SRC: Record<StageKey, string> = {
  focus:    '/pomodoro/audio/focus_background.mp3',
  cooldown: '/pomodoro/audio/cooldown_background.mp3',
  break:    '/pomodoro/audio/break_background.mp3',
}

export function useAudioPlayer() {
  /** One persistent HTMLAudioElement per background stage */
  const bgRefs = useRef<Partial<Record<StageKey, HTMLAudioElement>>>({})
  /** Which stage is currently active */
  const activeStageRef = useRef<StageKey | null>(null)

  // ─── Background helpers ──────────────────────────────────────────────────

  function getBgAudio(stageKey: StageKey): HTMLAudioElement {
    if (!bgRefs.current[stageKey]) {
      const audio = new Audio(BACKGROUND_SRC[stageKey])
      audio.preload = 'auto'
      audio.loop = true

      bgRefs.current[stageKey] = audio
    }
    return bgRefs.current[stageKey]!
  }

  /**
   * Switch to (or continue) the background track for `stageKey`.
   * If the stage has not changed the audio keeps playing uninterrupted.
   */
  const loadBackground = useCallback((stageKey: StageKey) => {
    const prev = activeStageRef.current

    if (prev === stageKey) {
      // Same stage — just ensure it's playing (handles resume-after-init)
      const audio = getBgAudio(stageKey)
      audio.play().catch(() => {})
      return
    }

    // Pause the outgoing stage (if any)
    if (prev) {
      bgRefs.current[prev]?.pause()
    }

    activeStageRef.current = stageKey
    const audio = getBgAudio(stageKey)
    audio.play().catch(() => {})
  }, [])

  // ─── Playback controls ───────────────────────────────────────────────────

  const pause = useCallback(() => {
    const stage = activeStageRef.current
    if (stage) bgRefs.current[stage]?.pause()
  }, [])

  const resume = useCallback(() => {
    const stage = activeStageRef.current
    if (stage) bgRefs.current[stage]?.play().catch(() => {})
  }, [])

  /**
   * Seek the active background track to `seconds` (clamped to track duration).
   * Useful for the debug scrubber in SessionPlayer.
   */
  const seekBackground = useCallback((seconds: number) => {
    const stage = activeStageRef.current
    if (!stage) return
    const audio = bgRefs.current[stage]
    if (!audio) return
    const target = audio.duration ? Math.min(seconds, audio.duration - 0.5) : seconds
    audio.currentTime = Math.max(0, target)
  }, [])

  return { loadBackground, pause, resume, seekBackground }
}
