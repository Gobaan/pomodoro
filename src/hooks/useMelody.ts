import { useRef, useCallback } from 'react'
import type { PhaseType } from '../types'

/**
 * Plays local melody tracks routed through the Web Audio API.
 *
 * Focus phases  → /audio/focus_melody.mp3  ("Compassion (keys version)" — Lee Rosevere, CC BY 4.0)
 * Break phases  → /audio/break_melody.mp3  ("Decompress" — Lee Rosevere, CC BY 4.0)
 *
 * Both tracks are from the "Music For Podcasts - Serious" album on Free Music Archive.
 * https://freemusicarchive.org/music/Lee_Rosevere
 *
 * Audio graph per track:
 *   HTMLAudioElement → MediaElementSourceNode → GainNode → BiquadFilter (HP 300 Hz) → destination
 *
 * The 300 Hz high-pass gently rolls off bass that competes with the 200 Hz binaural
 * carrier tones, reducing frequency masking without noticeably thinning the music.
 *
 * Both tracks loop. Switching phases crossfades via Web Audio gain ramps.
 */

const MELODY_SRC: Record<'focus' | 'break', string> = {
  focus: '/flowbeats/audio/focus_melody.mp3',
  break: '/flowbeats/audio/break_melody.mp3',
}

const TARGET_VOLUME = 0.9
const FADE_IN_S     = 1.5
const FADE_OUT_S    = 0.4
const HP_FREQ_HZ    = 300   // high-pass cutoff — rolls off bass competing with 200 Hz carrier
const HP_Q          = 0.7   // gentle slope (Butterworth-ish)

type MelodyKey = 'focus' | 'break'

function keyForPhase(phase: PhaseType): MelodyKey {
  return phase === 'shortBreak' || phase === 'longBreak' ? 'break' : 'focus'
}

interface MelodyTrack {
  el:         HTMLAudioElement
  sourceNode: MediaElementAudioSourceNode | null  // created once per el
  gainNode:   GainNode | null
}

function createTrack(src: string): MelodyTrack {
  const el = new Audio(src)
  el.loop    = true
  el.preload = 'auto'
  return { el, sourceNode: null, gainNode: null }
}

export function useMelody() {
  const ctxRef          = useRef<AudioContext | null>(null)
  const compressorRef   = useRef<DynamicsCompressorNode | null>(null)
  const masterGainRef   = useRef<GainNode | null>(null)
  const tracksRef       = useRef<Record<MelodyKey, MelodyTrack> | null>(null)
  const userVolume      = useRef(1)
  const activeRef       = useRef<MelodyKey | null>(null)
  const pauseTimerRef   = useRef<Record<MelodyKey, ReturnType<typeof setTimeout> | null>>({
    focus: null,
    break: null,
  })

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function getCtx(): AudioContext {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new AudioContext()
    }
    return ctxRef.current
  }

  function getTracks(): Record<MelodyKey, MelodyTrack> {
    if (!tracksRef.current) {
      tracksRef.current = {
        focus: createTrack(MELODY_SRC.focus),
        break: createTrack(MELODY_SRC.break),
      }
    }
    return tracksRef.current
  }

  /**
   * Lazily wire the audio graph for a track.
   * MediaElementSourceNode can only be created once per HTMLAudioElement,
   * so this is idempotent after the first call.
   */
  function getMasterGain(ctx: AudioContext): GainNode {
    if (masterGainRef.current) return masterGainRef.current
    const master = ctx.createGain()
    master.gain.value = userVolume.current
    master.connect(ctx.destination)
    masterGainRef.current = master
    return master
  }

  function getCompressor(ctx: AudioContext): DynamicsCompressorNode {
    if (compressorRef.current) return compressorRef.current
    const comp        = ctx.createDynamicsCompressor()
    comp.threshold.value = -14
    comp.knee.value      =  6
    comp.ratio.value     =  6
    comp.attack.value    =  0.005
    comp.release.value   =  0.15
    comp.connect(getMasterGain(ctx))
    compressorRef.current = comp
    return comp
  }

  function getGain(track: MelodyTrack, ctx: AudioContext): GainNode {
    if (track.gainNode) return track.gainNode

    const source = ctx.createMediaElementSource(track.el)
    const gain   = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    filter.type            = 'highpass'
    filter.frequency.value = HP_FREQ_HZ
    filter.Q.value         = HP_Q

    gain.gain.value = 0   // start silent

    source.connect(gain)
    gain.connect(filter)
    filter.connect(getCompressor(ctx))

    track.sourceNode = source
    track.gainNode   = gain
    return gain
  }

  function clearPauseTimer(key: MelodyKey) {
    if (pauseTimerRef.current[key] !== null) {
      clearTimeout(pauseTimerRef.current[key]!)
      pauseTimerRef.current[key] = null
    }
  }

  function fadeIn(key: MelodyKey, track: MelodyTrack, ctx: AudioContext) {
    clearPauseTimer(key)  // cancel any pending pause from a prior fade-out
    const gain = getGain(track, ctx)
    const now  = ctx.currentTime
    gain.gain.cancelScheduledValues(now)
    gain.gain.setValueAtTime(gain.gain.value, now)
    gain.gain.linearRampToValueAtTime(TARGET_VOLUME, now + FADE_IN_S)
    track.el.play().catch(() => {})
  }

  function fadeOut(key: MelodyKey, track: MelodyTrack, ctx: AudioContext, fadeSecs = FADE_OUT_S) {
    clearPauseTimer(key)
    if (!track.gainNode) return
    const gain = track.gainNode
    const now  = ctx.currentTime
    gain.gain.cancelScheduledValues(now)
    gain.gain.setValueAtTime(gain.gain.value, now)
    gain.gain.linearRampToValueAtTime(0, now + fadeSecs)
    // Pause the element after the fade completes so it doesn't waste CPU
    pauseTimerRef.current[key] = setTimeout(() => {
      track.el.pause()
      pauseTimerRef.current[key] = null
    }, (fadeSecs + 0.1) * 1000)
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  const start = useCallback((phase: PhaseType) => {
    const key    = keyForPhase(phase)
    const ctx    = getCtx()
    const tracks = getTracks()
    if (ctx.state === 'suspended') ctx.resume()

    if (activeRef.current === key) {
      // Same track — resume if paused
      if (tracks[key].el.paused) fadeIn(key, tracks[key], ctx)
      return
    }

    // Fade out the outgoing track
    if (activeRef.current) {
      fadeOut(activeRef.current, tracks[activeRef.current], ctx)
    }

    activeRef.current = key
    fadeIn(key, tracks[key], ctx)
  }, [])

  const stop = useCallback((immediate = false) => {
    if (!ctxRef.current) return
    const ctx    = ctxRef.current
    const tracks = getTracks()
    const fadeSecs = immediate ? 0.03 : FADE_OUT_S
    ;(['focus', 'break'] as MelodyKey[]).forEach(key => {
      fadeOut(key, tracks[key], ctx, fadeSecs)
    })
    activeRef.current = null
  }, [])

  const suspend = useCallback(() => {
    const tracks = getTracks()
    ;(['focus', 'break'] as MelodyKey[]).forEach(key => {
      clearPauseTimer(key)
      if (tracks[key].gainNode && ctxRef.current) {
        // Snap gain to 0 immediately so there's no bleed when paused
        const gain = tracks[key].gainNode!
        const now  = ctxRef.current.currentTime
        gain.gain.cancelScheduledValues(now)
        gain.gain.setValueAtTime(0, now)
      }
      tracks[key].el.pause()
    })
  }, [])

  const resumeCtx = useCallback(() => {
    const key = activeRef.current
    if (!key) return
    const ctx    = getCtx()
    const tracks = getTracks()
    if (ctx.state === 'suspended') ctx.resume()
    fadeIn(key, tracks[key], ctx)
  }, [])

  const setVolume = useCallback((v: number) => {
    userVolume.current = v
    if (masterGainRef.current) {
      masterGainRef.current.gain.setTargetAtTime(v, masterGainRef.current.context.currentTime, 0.05)
    }
  }, [])

  return { start, stop, suspend, resumeCtx, setVolume }
}
