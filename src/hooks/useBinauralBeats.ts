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

/** Master volume of the binaural layer (0–1). Keep low — these sit under ambient music. */
const VOLUME = 0.10

/** Fade-in duration in seconds when starting */
const FADE_IN_S = 3

/** Fade-out duration in seconds when stopping */
const FADE_OUT_S = 4

/** Time constant for smooth frequency transitions between phases (seconds) */
const FREQ_RAMP_TAU = 1.5

export function useBinauralBeats() {
  const ctxRef      = useRef<AudioContext | null>(null)
  const leftOscRef  = useRef<OscillatorNode | null>(null)
  const rightOscRef = useRef<OscillatorNode | null>(null)
  const leftGainRef = useRef<GainNode | null>(null)
  const rightGainRef= useRef<GainNode | null>(null)
  const runningRef  = useRef(false)

  // ─── Audio context ────────────────────────────────────────────────────────

  function getCtx(): AudioContext {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new AudioContext()
    }
    return ctxRef.current
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

    if (runningRef.current) {
      // Already running — ramp to new frequencies without a click
      const now = ctx.currentTime
      leftOscRef.current?.frequency.setTargetAtTime(carrierHz, now, FREQ_RAMP_TAU)
      rightOscRef.current?.frequency.setTargetAtTime(carrierHz + beatHz, now, FREQ_RAMP_TAU)
      return
    }

    // ── Build audio graph ──────────────────────────────────────────────────
    //
    //   leftOsc (carrierHz)        → leftGain  → leftPan (-1) → destination
    //   rightOsc (carrier+beatHz)  → rightGain → rightPan(+1) → destination
    //
    // Panning hard left/right means:
    //   left ear  receives ONLY leftOsc
    //   right ear receives ONLY rightOsc
    // The brain perceives the beat = rightFreq - leftFreq.

    const leftPan  = ctx.createStereoPanner()
    const rightPan = ctx.createStereoPanner()
    leftPan.pan.value  = -1
    rightPan.pan.value =  1

    const leftGain  = ctx.createGain()
    const rightGain = ctx.createGain()

    // Start silent, ramp up to target volume
    leftGain.gain.setValueAtTime(0, ctx.currentTime)
    leftGain.gain.linearRampToValueAtTime(VOLUME, ctx.currentTime + FADE_IN_S)
    rightGain.gain.setValueAtTime(0, ctx.currentTime)
    rightGain.gain.linearRampToValueAtTime(VOLUME, ctx.currentTime + FADE_IN_S)

    const leftOsc  = ctx.createOscillator()
    const rightOsc = ctx.createOscillator()
    leftOsc.type  = 'sine'
    rightOsc.type = 'sine'
    leftOsc.frequency.value  = carrierHz
    rightOsc.frequency.value = carrierHz + beatHz

    leftOsc.connect(leftGain)
    leftGain.connect(leftPan)
    leftPan.connect(ctx.destination)

    rightOsc.connect(rightGain)
    rightGain.connect(rightPan)
    rightPan.connect(ctx.destination)

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
    if (!ctx || !lg || !rg) return

    const now = ctx.currentTime
    // Exponential-style fade via setTargetAtTime (time constant = FADE_OUT_S/3)
    lg.gain.setTargetAtTime(0, now, FADE_OUT_S / 3)
    rg.gain.setTargetAtTime(0, now, FADE_OUT_S / 3)

    const stopAfterMs = FADE_OUT_S * 1000 + 200
    setTimeout(() => {
      try { leftOscRef.current?.stop()  } catch { /* already stopped */ }
      try { rightOscRef.current?.stop() } catch { /* already stopped */ }
      leftOscRef.current  = null
      rightOscRef.current = null
      leftGainRef.current  = null
      rightGainRef.current = null
      runningRef.current = false
    }, stopAfterMs)
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

  return { start, stop, suspend, resumeCtx }
}
