import { useRef, useCallback } from 'react'
import type { PhaseType } from '../types'

/**
 * Generates true binaural beats via the Web Audio API.
 *
 * Two sine-wave oscillators play simultaneously — one panned hard left, one
 * hard right — at a small frequency offset. The brain fuses the two tones
 * into a perceived "beat" at the difference frequency, which is the
 * neurological entrainment target.
 *
 * Requires stereo headphones to work as intended.
 *
 * Carrier: 200 Hz (well within the 100–1000 Hz effective range)
 * Beat frequencies per phase:
 *   warmup / cooldown  → Alpha  10 Hz  (relaxed alertness)
 *   focus              → Beta   18 Hz  (active concentration)
 *   shortBreak         → Theta   6 Hz  (deep relaxation)
 *   longBreak          → Theta   6 Hz
 *
 * Audio graph:
 *   leftOsc  → leftGain  → leftPan(-1)  → masterGain → destination
 *   rightOsc → rightGain → rightPan(+1) → masterGain → destination
 *
 * masterGain is controlled by setVolume(); per-channel gains handle fade-in/out.
 */

interface PhaseBeats {
  carrierHz: number
  beatHz: number
  label: string
}

export const PHASE_BEATS: Record<PhaseType, PhaseBeats> = {
  warmup:     { carrierHz: 200, beatHz: 10, label: 'Alpha · 10 Hz' },
  focus:      { carrierHz: 200, beatHz: 18, label: 'Beta · 18 Hz'  },
  cooldown:   { carrierHz: 200, beatHz: 10, label: 'Alpha · 10 Hz' },
  shortBreak: { carrierHz: 200, beatHz: 6,  label: 'Theta · 6 Hz'  },
  longBreak:  { carrierHz: 200, beatHz: 6,  label: 'Theta · 6 Hz'  },
}

/** Maximum per-channel gain when slider is at full. Keep low — these sit under ambient music. */
const MAX_BINAURAL = 0.20

/** Fade-in duration in seconds when starting */
const FADE_IN_S = 3

/** Fade-out duration in seconds when stopping */
const FADE_OUT_S = 4

/** Time constant for smooth frequency transitions between phases (seconds) */
const FREQ_RAMP_TAU = 1.5

export function useBinauralBeats() {
  const ctxRef        = useRef<AudioContext | null>(null)
  const leftOscRef    = useRef<OscillatorNode | null>(null)
  const rightOscRef   = useRef<OscillatorNode | null>(null)
  const leftGainRef   = useRef<GainNode | null>(null)
  const rightGainRef  = useRef<GainNode | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const runningRef    = useRef(false)
  const userVolumeRef = useRef(0.5)  // default: mid-slider → 0.10 effective gain

  // ─── Audio context ────────────────────────────────────────────────────────

  function getCtx(): AudioContext {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new AudioContext()
      masterGainRef.current = null  // reset on new context
    }
    return ctxRef.current
  }

  function getMasterGain(ctx: AudioContext): GainNode {
    if (masterGainRef.current) return masterGainRef.current
    const master = ctx.createGain()
    master.gain.value = userVolumeRef.current
    master.connect(ctx.destination)
    masterGainRef.current = master
    return master
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Start binaural beats for a given phase, or smoothly transition
   * to the new phase's frequencies if already running.
   */
  const start = useCallback((phase: PhaseType) => {
    const { carrierHz, beatHz } = PHASE_BEATS[phase]
    const ctx = getCtx()

    if (ctx.state === 'suspended') ctx.resume()

    const master = getMasterGain(ctx)

    if (runningRef.current) {
      // Already running — ramp to new frequencies without a click
      const now = ctx.currentTime
      leftOscRef.current?.frequency.setTargetAtTime(carrierHz, now, FREQ_RAMP_TAU)
      rightOscRef.current?.frequency.setTargetAtTime(carrierHz + beatHz, now, FREQ_RAMP_TAU)
      return
    }

    // ── Build audio graph ──────────────────────────────────────────────────
    //
    //   leftOsc (carrierHz)        → leftGain  → leftPan (-1) → masterGain → destination
    //   rightOsc (carrier+beatHz)  → rightGain → rightPan(+1) → masterGain → destination

    const leftPan  = ctx.createStereoPanner()
    const rightPan = ctx.createStereoPanner()
    leftPan.pan.value  = -1
    rightPan.pan.value =  1

    const leftGain  = ctx.createGain()
    const rightGain = ctx.createGain()

    // Per-channel gains fade in to MAX_BINAURAL; masterGain controls user volume
    leftGain.gain.setValueAtTime(0, ctx.currentTime)
    leftGain.gain.linearRampToValueAtTime(MAX_BINAURAL, ctx.currentTime + FADE_IN_S)
    rightGain.gain.setValueAtTime(0, ctx.currentTime)
    rightGain.gain.linearRampToValueAtTime(MAX_BINAURAL, ctx.currentTime + FADE_IN_S)

    const leftOsc  = ctx.createOscillator()
    const rightOsc = ctx.createOscillator()
    leftOsc.type  = 'sine'
    rightOsc.type = 'sine'
    leftOsc.frequency.value  = carrierHz
    rightOsc.frequency.value = carrierHz + beatHz

    leftOsc.connect(leftGain)
    leftGain.connect(leftPan)
    leftPan.connect(master)

    rightOsc.connect(rightGain)
    rightGain.connect(rightPan)
    rightPan.connect(master)

    leftOsc.start()
    rightOsc.start()

    leftOscRef.current  = leftOsc
    rightOscRef.current = rightOsc
    leftGainRef.current  = leftGain
    rightGainRef.current = rightGain
    runningRef.current = true
  }, [])

  /** Stop binaural beats with a smooth fade-out. */
  const stop = useCallback(() => {
    if (!runningRef.current) return
    const ctx = ctxRef.current
    const lg  = leftGainRef.current
    const rg  = rightGainRef.current
    const lo  = leftOscRef.current
    const ro  = rightOscRef.current
    if (!ctx || !lg || !rg) return

    // Mark stopped immediately so start() can create fresh oscillators without
    // entering the "already running" ramp branch on a still-fading graph.
    runningRef.current   = false
    leftOscRef.current   = null
    rightOscRef.current  = null
    leftGainRef.current  = null
    rightGainRef.current = null

    const now = ctx.currentTime
    lg.gain.setTargetAtTime(0, now, FADE_OUT_S / 3)
    rg.gain.setTargetAtTime(0, now, FADE_OUT_S / 3)

    setTimeout(() => {
      try { lo?.stop() } catch { /* already stopped */ }
      try { ro?.stop() } catch { /* already stopped */ }
    }, FADE_OUT_S * 1000 + 200)
  }, [])

  /**
   * Suspend the AudioContext (e.g. when the Pomodoro timer is paused).
   * Oscillators stay alive so resume() is seamless.
   */
  const suspend = useCallback(() => {
    ctxRef.current?.suspend()
  }, [])

  /** Resume a previously suspended AudioContext. */
  const resumeCtx = useCallback(() => {
    ctxRef.current?.resume()
  }, [])

  /** Adjust the binaural volume (0–1). Takes effect immediately. */
  const setVolume = useCallback((v: number) => {
    userVolumeRef.current = v
    if (masterGainRef.current) {
      masterGainRef.current.gain.setTargetAtTime(
        v,
        masterGainRef.current.context.currentTime,
        0.05,
      )
    }
  }, [])

  return { start, stop, suspend, resumeCtx, setVolume }
}
