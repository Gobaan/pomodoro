import { useRef, useCallback } from 'react'
import type { PhaseType } from '../types'

/**
 * Generates brown noise (focus phases) and rainfall (break phases) via the
 * Web Audio API, crossfading between them on phase changes.
 *
 * Audio graph:
 *   brownSrc → brownGain ─┐
 *                          ├→ compressor → masterGain → destination
 *   rainSrc  → rainGain  ─┘
 *
 * The compressor levels out the perceived loudness difference between brown
 * noise and rainfall. masterGain is the user-controlled volume.
 */

const BROWN_VOLUME  = 0.35
const RAIN_VOLUME   = 0.25
const FADE_IN_S     = 2.5
const FADE_OUT_TAU  = 0.3
const CROSSFADE_TAU = 1.5

type NoiseType = 'brown' | 'rain'

function noiseTypeForPhase(phase: PhaseType): NoiseType {
  return phase === 'shortBreak' || phase === 'longBreak' ? 'rain' : 'brown'
}

// ─── Buffer generators ────────────────────────────────────────────────────────

function buildBrownBuffer(ctx: AudioContext): AudioBuffer {
  const length = ctx.sampleRate * 8
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  let lastOut = 0
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1
    data[i] = (lastOut + 0.02 * white) / 1.02
    lastOut = data[i]
    data[i] *= 3.5
  }
  return buffer
}

function buildWhiteBuffer(ctx: AudioContext): AudioBuffer {
  const length = ctx.sampleRate * 8
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
  return buffer
}

function buildRainGraph(ctx: AudioContext, gainNode: GainNode): AudioBufferSourceNode {
  const src = ctx.createBufferSource()
  src.buffer = buildWhiteBuffer(ctx)
  src.loop = true

  const bands = [
    { freq: 250,  Q: 1.2, gain: 0.6 },
    { freq: 1000, Q: 0.8, gain: 1.0 },
    { freq: 4000, Q: 1.0, gain: 0.5 },
  ]

  bands.forEach(({ freq, Q, gain: bandGain }) => {
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = freq
    filter.Q.value = Q

    const bandGainNode = ctx.createGain()
    bandGainNode.gain.value = bandGain

    src.connect(filter)
    filter.connect(bandGainNode)
    bandGainNode.connect(gainNode)
  })

  src.start()
  return src
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNoise() {
  const ctxRef        = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const brownSrc      = useRef<AudioBufferSourceNode | null>(null)
  const rainSrc       = useRef<AudioBufferSourceNode | null>(null)
  const brownGain     = useRef<GainNode | null>(null)
  const rainGain      = useRef<GainNode | null>(null)
  const activeRef     = useRef(false)
  const currentRef    = useRef<NoiseType>('brown')
  const userVolume    = useRef(1)

  function getCtx(): AudioContext {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new AudioContext()
    }
    return ctxRef.current
  }

  function getMasterGain(ctx: AudioContext): GainNode {
    if (masterGainRef.current) return masterGainRef.current
    const comp        = ctx.createDynamicsCompressor()
    comp.threshold.value = -14
    comp.knee.value      =  6
    comp.ratio.value     =  6
    comp.attack.value    =  0.005
    comp.release.value   =  0.15

    const master = ctx.createGain()
    master.gain.value = userVolume.current
    comp.connect(master)
    master.connect(ctx.destination)
    masterGainRef.current = master

    // return the compressor's input as the "destination" for track gains
    // by storing a reference — track gains connect to comp, not master
    ;(master as GainNode & { _comp: DynamicsCompressorNode })._comp = comp
    return master
  }

  function getCompressorInput(ctx: AudioContext): DynamicsCompressorNode {
    const mg = getMasterGain(ctx)
    return (mg as GainNode & { _comp: DynamicsCompressorNode })._comp
  }

  const start = useCallback((phase: PhaseType) => {
    const type = noiseTypeForPhase(phase)
    const ctx  = getCtx()
    if (ctx.state === 'suspended') ctx.resume()

    if (activeRef.current) {
      if (type !== currentRef.current) {
        const now = ctx.currentTime
        const targetVol = type === 'brown' ? BROWN_VOLUME : RAIN_VOLUME
        const [fadeIn, fadeOut] = type === 'brown'
          ? [brownGain.current, rainGain.current]
          : [rainGain.current,  brownGain.current]
        fadeOut?.gain.setTargetAtTime(0,          now, CROSSFADE_TAU)
        fadeIn?.gain.setTargetAtTime(targetVol,   now, CROSSFADE_TAU)
        currentRef.current = type
      }
      return
    }

    const compIn = getCompressorInput(ctx)
    const bg = ctx.createGain()
    const rg = ctx.createGain()
    const now = ctx.currentTime

    if (type === 'brown') {
      bg.gain.setValueAtTime(0, now)
      bg.gain.linearRampToValueAtTime(BROWN_VOLUME, now + FADE_IN_S)
      rg.gain.setValueAtTime(0, now)
    } else {
      rg.gain.setValueAtTime(0, now)
      rg.gain.linearRampToValueAtTime(RAIN_VOLUME, now + FADE_IN_S)
      bg.gain.setValueAtTime(0, now)
    }

    bg.connect(compIn)
    rg.connect(compIn)

    const bs = ctx.createBufferSource()
    bs.buffer = buildBrownBuffer(ctx)
    bs.loop = true
    bs.connect(bg)
    bs.start()

    const rs = buildRainGraph(ctx, rg)

    brownSrc.current   = bs
    rainSrc.current    = rs
    brownGain.current  = bg
    rainGain.current   = rg
    activeRef.current  = true
    currentRef.current = type
  }, [])

  const stop = useCallback((immediate = false) => {
    if (!activeRef.current || !ctxRef.current) return
    const ctx = ctxRef.current
    const now = ctx.currentTime
    const tau = immediate ? 0.01 : FADE_OUT_TAU

    brownGain.current?.gain.setTargetAtTime(0, now, tau)
    rainGain.current?.gain.setTargetAtTime(0,  now, tau)

    setTimeout(() => {
      try { brownSrc.current?.stop() } catch { /* already stopped */ }
      try { rainSrc.current?.stop()  } catch { /* already stopped */ }
      brownSrc.current = rainSrc.current = null
      brownGain.current = rainGain.current = null
      activeRef.current = false
    }, tau * 4 * 1000 + 50)
  }, [])

  const suspend = useCallback(() => {
    ctxRef.current?.suspend()
  }, [])

  const resumeCtx = useCallback(() => {
    ctxRef.current?.resume()
  }, [])

  const setVolume = useCallback((v: number) => {
    userVolume.current = v
    if (masterGainRef.current) {
      masterGainRef.current.gain.setTargetAtTime(v, masterGainRef.current.context.currentTime, 0.05)
    }
  }, [])

  return { start, stop, suspend, resumeCtx, setVolume }
}
