import { useState, useEffect, useRef } from 'react'
import { buildSchedule } from '../utils/phaseSchedule'
import { useAudioPlayer } from '../hooks/useAudioPlayer'
import { DEFAULT_SESSION_CONFIG } from '../types'
import { PHASE_LABELS, PHASE_HZ, PHASE_COLORS } from '../data/recommendations'
import type { PhaseSegment, StageKey } from '../types'

const STAGE_COLOR: Record<StageKey, string> = {
  focus:    'bg-violet-900/40 border-violet-600/50 text-violet-200',
  cooldown: 'bg-blue-900/40 border-blue-600/50 text-blue-200',
  break:    'bg-teal-900/40 border-teal-600/50 text-teal-200',
}

const STAGE_BADGE: Record<StageKey, string> = {
  focus:    'bg-violet-700 text-violet-100',
  cooldown: 'bg-blue-700 text-blue-100',
  break:    'bg-teal-700 text-teal-100',
}

function fmt(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function AudioTest() {
  const segments = useRef(buildSchedule(DEFAULT_SESSION_CONFIG)).current
  const { loadBackground, pause, resume } = useAudioPlayer()

  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function stopTicker() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  function startTicker(initialElapsed: number) {
    stopTicker()
    const startTime = Date.now() - initialElapsed * 1000
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 250)
  }

  useEffect(() => () => stopTicker(), [])

  function playSegment(seg: PhaseSegment, index: number) {
    setActiveIndex(index)
    setElapsed(0)
    loadBackground(seg.stageKey)
    setIsPlaying(true)
    startTicker(0)
  }

  function handlePause() {
    pause()
    setIsPlaying(false)
    stopTicker()
  }

  function handleResume() {
    resume()
    setIsPlaying(true)
    startTicker(elapsed)
  }

  const activeSeg = activeIndex !== null ? segments[activeIndex] : null

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-10 flex flex-col gap-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Audio Test</h1>
        <p className="text-slate-400 text-sm mt-1">
          Click any segment to jump to it and verify audio + context.
        </p>
      </div>

      {/* Now playing panel */}
      <div className={`rounded-xl border p-5 flex flex-col gap-3 transition-all ${
        activeSeg ? STAGE_COLOR[activeSeg.stageKey] : 'bg-slate-900 border-slate-700 text-slate-400'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-widest font-semibold opacity-60">Now Playing</span>
          {activeSeg && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${STAGE_BADGE[activeSeg.stageKey]}`}>
              {activeSeg.stageKey}
            </span>
          )}
        </div>

        {activeSeg ? (
          <>
            <div className="flex items-baseline gap-3">
              <span className={`text-xl font-bold ${PHASE_COLORS[activeSeg.phase]}`}>
                {PHASE_LABELS[activeSeg.phase]}
              </span>
              <span className="text-sm opacity-70">Cycle {activeSeg.cycleIndex + 1}</span>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <div className="opacity-60">Frequency</div>
              <div className="font-mono">{PHASE_HZ[activeSeg.phase]}</div>

              <div className="opacity-60">Stage</div>
              <div className="font-mono">{activeSeg.stageKey}</div>

              <div className="opacity-60">Phase duration</div>
              <div className="font-mono">{fmt(activeSeg.durationSeconds)}</div>

              <div className="opacity-60">Stage offset</div>
              <div className="font-mono">
                {fmt(activeSeg.startOffsetSeconds)} → {fmt(activeSeg.startOffsetSeconds + activeSeg.durationSeconds)}
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-white/10 rounded-full h-1.5 mt-1">
              <div
                className="h-1.5 rounded-full bg-current transition-all"
                style={{ width: `${Math.min(100, (elapsed / activeSeg.durationSeconds) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-mono opacity-50">
              <span>{fmt(elapsed)}</span>
              <span>{fmt(activeSeg.durationSeconds)}</span>
            </div>

            {/* Playback controls */}
            <div className="flex gap-3 mt-1">
              {isPlaying ? (
                <button
                  onClick={handlePause}
                  className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors"
                >
                  ⏸ Pause
                </button>
              ) : (
                <button
                  onClick={handleResume}
                  className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors"
                >
                  ▶ Resume
                </button>
              )}
              {activeIndex !== null && activeIndex > 0 && (
                <button
                  onClick={() => playSegment(segments[activeIndex - 1], activeIndex - 1)}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-colors"
                >
                  ← Prev
                </button>
              )}
              {activeIndex !== null && activeIndex < segments.length - 1 && (
                <button
                  onClick={() => playSegment(segments[activeIndex + 1], activeIndex + 1)}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-colors"
                >
                  Next →
                </button>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm opacity-50">Select a segment below to start playback.</p>
        )}
      </div>

      {/* Segment list */}
      <div className="flex flex-col gap-2">
        <p className="text-xs text-slate-500 uppercase tracking-widest">All Segments ({segments.length})</p>
        {segments.map((seg, i) => {
          const isActive = i === activeIndex

          return (
            <button
              key={i}
              onClick={() => playSegment(seg, i)}
              className={`w-full text-left rounded-lg border px-4 py-3 flex items-center gap-4 transition-all cursor-pointer hover:brightness-110
                ${isActive
                  ? `${STAGE_COLOR[seg.stageKey]} ring-2 ring-white/20`
                  : 'border-slate-700/50 bg-slate-900/60'
                }
              `}
            >
              <span className="text-xs font-mono text-slate-500 w-5 shrink-0">{i + 1}</span>

              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold ${isActive ? PHASE_COLORS[seg.phase] : 'text-slate-200'}`}>
                  {PHASE_LABELS[seg.phase]}
                  <span className="ml-2 text-xs font-normal opacity-50">Cycle {seg.cycleIndex + 1}</span>
                </div>
                <div className="text-xs opacity-50 font-mono">{PHASE_HZ[seg.phase]}</div>
              </div>

              <span className={`text-xs px-2 py-0.5 rounded-full font-mono shrink-0 ${STAGE_BADGE[seg.stageKey]}`}>
                {seg.stageKey}
              </span>

              <span className="text-xs font-mono text-slate-500 shrink-0 hidden sm:block">
                {fmt(seg.startOffsetSeconds)} → {fmt(seg.startOffsetSeconds + seg.durationSeconds)}
              </span>

              <span className="text-xs font-mono text-slate-400 shrink-0">
                {fmt(seg.durationSeconds)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
