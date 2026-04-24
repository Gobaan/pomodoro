import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Timer } from '../components/Timer'
import { PhaseIndicator } from '../components/PhaseIndicator'
import { Controls } from '../components/Controls'
import { CycleProgress } from '../components/CycleProgress'
import { usePomodoro } from '../hooks/usePomodoro'
import { useBinauralBeats } from '../hooks/useBinauralBeats'
import { useNoise } from '../hooks/useNoise'
import { useMelody } from '../hooks/useMelody'
import { usePing, shouldPingOnPhase } from '../hooks/usePing'
import { useProgress } from '../hooks/useProgress'
import { useVisibilityResume } from '../hooks/useVisibilityResume'
import { useSessionReminder } from '../hooks/useSessionReminder'
import type { ProgressStats } from '../hooks/useProgress'
import { buildSchedule } from '../utils/phaseSchedule'
import { analytics } from '../utils/analytics'
import type { SessionConfig, PhaseSegment, PhaseType } from '../types'
import { DEFAULT_SESSION_CONFIG } from '../types'
import { PHASE_LABELS, PHASE_HZ, PHASE_COLORS } from '../data/recommendations'

// ─── Audio mode ───────────────────────────────────────────────────────────────

type AudioMode = 'noise' | 'melody' | 'off'

const AUDIO_MODE_KEY = 'pmg_audio_mode'

const MODE_LABELS: Record<AudioMode, string> = {
  noise:  'Brown noise',
  melody: 'Melody',
  off:    'Audio off',
}

const MODE_ICONS: Record<AudioMode, string> = {
  noise:  '🌊',
  melody: '🎵',
  off:    '🔇',
}

// Break-specific label overrides
const BREAK_MODE_LABELS: Record<AudioMode, string> = {
  noise:  'Rainfall',
  melody: 'Melody',
  off:    'Audio off',
}

const MODE_CYCLE: AudioMode[] = ['noise', 'melody', 'off']

// ─── Completion screen ────────────────────────────────────────────────────────

type FeedbackStatus = 'idle' | 'sending' | 'sent' | 'error'

function CompletionScreen({
  totalCycles, stats, onRestart,
  scheduleReminder, cancelReminder, pendingAt, notificationsSupported,
}: {
  totalCycles: number
  stats: ProgressStats
  onRestart: () => void
  scheduleReminder: (iso: string) => Promise<'scheduled' | 'denied' | 'unsupported'>
  cancelReminder: () => void
  pendingAt: string | null
  notificationsSupported: boolean
}) {
  const [reminderTime, setReminderTime] = useState('')
  const [reminderStatus, setReminderStatus] = useState<'idle' | 'denied'>('idle')

  async function handleSchedule() {
    if (!reminderTime) return
    const [h, m] = reminderTime.split(':').map(Number)
    const d = new Date()
    d.setHours(h, m, 0, 0)
    if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1) // wrap to tomorrow
    const result = await scheduleReminder(d.toISOString())
    if (result === 'denied') setReminderStatus('denied')
  }

  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackEmail, setFeedbackEmail] = useState('')
  const [status, setStatus] = useState<FeedbackStatus>('idle')

  async function submitFeedback() {
    if (!feedbackText.trim()) return
    setStatus('sending')
    try {
      const res = await fetch('/flowbeats/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: feedbackText.trim(),
          email: feedbackEmail.trim() || undefined,
        }),
      })
      if (!res.ok) throw new Error()
      setStatus('sent')
      analytics.feedbackSubmit({ hasEmail: !!feedbackEmail.trim() })
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-6">
      <div className="text-6xl">🎉</div>
      <h1 className="text-3xl font-bold text-white">Session Complete!</h1>
      <p className="text-slate-400">
        You completed {totalCycles} focus cycle{totalCycles !== 1 ? 's' : ''}. Great work!
      </p>

      {/* Progress stats */}
      <div className="w-full max-w-xs grid grid-cols-2 gap-3">
        {[
          { label: 'This week', cycles: stats.weekly.cycles, minutes: stats.weekly.focusMinutes },
          { label: 'This month', cycles: stats.monthly.cycles, minutes: stats.monthly.focusMinutes },
        ].map(({ label, cycles, minutes }) => (
          <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-1 text-left">
            <span className="text-xs text-slate-500">{label}</span>
            <span className="text-2xl font-bold text-white">{cycles}</span>
            <span className="text-xs text-slate-400">{cycles === 1 ? 'cycle' : 'cycles'} · {Math.round(minutes / 60 * 10) / 10}h focus</span>
          </div>
        ))}
      </div>

      {/* Reminder widget */}
      {notificationsSupported && (
        <div className="w-full max-w-xs flex flex-col gap-2">
          {pendingAt ? (
            <div className="flex items-center justify-between bg-violet-900/30 border border-violet-700/40 rounded-xl px-4 py-3">
              <span className="text-sm text-violet-300">
                Reminder set for {new Date(pendingAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <button onClick={cancelReminder} className="text-xs text-slate-400 hover:text-white transition-colors">Cancel</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={reminderTime}
                onChange={e => { setReminderTime(e.target.value); setReminderStatus('idle') }}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
              />
              <button
                onClick={handleSchedule}
                disabled={!reminderTime}
                className="px-4 py-2 rounded-xl bg-violet-700/60 hover:bg-violet-600/70 disabled:opacity-40 text-white text-sm font-medium transition-colors"
              >
                Remind me
              </button>
            </div>
          )}
          {reminderStatus === 'denied' && (
            <p className="text-xs text-amber-400 text-center">Notification permission denied — enable it in browser settings.</p>
          )}
        </div>
      )}

      <button
        onClick={onRestart}
        className="px-8 py-3 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors"
      >
        Start New Session
      </button>

      <div className="flex items-center gap-3">
        <a
          href="https://www.buymeacoffee.com/Gobaan"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-900/40 border border-violet-700/50 text-violet-300 text-xs font-medium transition-colors hover:bg-violet-800/50"
        >
          ☕ Buy me a coffee
        </a>
        <a
          href="https://github.com/Gobaan/pomodoro"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-400 text-xs font-medium transition-colors hover:bg-white/10"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden="true"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>
          GitHub
        </a>
        <button
          onClick={() => { setFeedbackOpen(true); setStatus('idle'); setFeedbackText(''); setFeedbackEmail('') }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-400 text-xs font-medium transition-colors hover:bg-white/10"
        >
          💬 Feedback
        </button>
      </div>

      {/* Feedback modal */}
      {feedbackOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-6 z-50"
          onClick={e => { if (e.target === e.currentTarget) setFeedbackOpen(false) }}
        >
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 flex flex-col gap-4">
            <h2 className="text-white font-semibold text-lg text-left">Send feedback</h2>

            {status === 'sent' ? (
              <p className="text-slate-300 text-sm text-left">Thanks — message received!</p>
            ) : (
              <>
                <textarea
                  className="w-full h-28 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-violet-500"
                  placeholder="What's working, what's not, ideas…"
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  disabled={status === 'sending'}
                />
                <input
                  type="email"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  placeholder="Your email (optional — if you'd like a reply)"
                  value={feedbackEmail}
                  onChange={e => setFeedbackEmail(e.target.value)}
                  disabled={status === 'sending'}
                />
                {status === 'error' && (
                  <p className="text-red-400 text-xs text-left">Something went wrong — try again.</p>
                )}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setFeedbackOpen(false)}
                    className="px-4 py-2 rounded-full text-sm text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitFeedback}
                    disabled={!feedbackText.trim() || status === 'sending'}
                    className="px-5 py-2 rounded-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-medium transition-colors"
                  >
                    {status === 'sending' ? 'Sending…' : 'Send'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Config loading ───────────────────────────────────────────────────────────

const SESSION_CONFIG_KEY = 'pmg_session_config'

function loadConfig(): SessionConfig {
  try {
    const saved = JSON.parse(localStorage.getItem(SESSION_CONFIG_KEY) ?? 'null')
    return saved ? { ...DEFAULT_SESSION_CONFIG, ...saved } : DEFAULT_SESSION_CONFIG
  } catch {
    return DEFAULT_SESSION_CONFIG
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SessionPlayer() {
  const navigate = useNavigate()
  const config: SessionConfig = loadConfig()
  const { recordSession, getStats } = useProgress()
  const { scheduleReminder, cancelReminder, pendingAt, notificationsSupported } = useSessionReminder()

  const segments = useRef(buildSchedule(config)).current
  const { start: startBeats, stop: stopBeats, suspend: suspendBeats, resumeCtx: resumeBeats } = useBinauralBeats()
  const { start: startNoise, stop: stopNoise, suspend: suspendNoise, resumeCtx: resumeNoise, setVolume: setVolumeNoise } = useNoise()
  const { start: startMelody, stop: stopMelody, suspend: suspendMelody, resumeCtx: resumeMelody, setVolume: setVolumeMelody } = useMelody()
  const ping = usePing()

  const [audioMode, setAudioMode] = useState<AudioMode>(
    () => (localStorage.getItem(AUDIO_MODE_KEY) as AudioMode | null) ?? 'melody'
  )
  const audioModeRef = useRef(audioMode)
  audioModeRef.current = audioMode

  const VOLUME_KEY = 'pmg_ambient_volume'
  const [ambientVolume, setAmbientVolume] = useState<number>(
    () => Number(localStorage.getItem(VOLUME_KEY) ?? 0.8)
  )

  useEffect(() => {
    localStorage.setItem(VOLUME_KEY, String(ambientVolume))
    setVolumeNoise(ambientVolume)
    setVolumeMelody(ambientVolume)
  }, [ambientVolume]) // eslint-disable-line react-hooks/exhaustive-deps

  function startAmbient(phase: PhaseType) {
    const mode = audioModeRef.current
    if (mode === 'noise')  startNoise(phase)
    if (mode === 'melody') startMelody(phase)
  }

  function stopAmbient() {
    stopNoise()
    stopMelody()
  }

  const handlePhaseChange = useCallback(
    (segment: PhaseSegment, prev: PhaseSegment | null) => {
      // prev === null is the initial mount call before the session starts.
      // Audio for the first phase is started explicitly in handleStart.
      if (prev === null) return
      if (forceCompleteRef.current) return
      if (shouldPingOnPhase(segment.phase)) ping()
      startBeats(segment.phase)
      startAmbient(segment.phase)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [startBeats, ping],
  )

  const handleComplete = useCallback(() => {
    stopBeats()
    stopAmbient()
    analytics.sessionComplete({ cycles: config.totalCycles, audioMode: audioModeRef.current })
    recordSession(config.totalCycles, config.totalCycles * config.workMinutes)
  }, [stopBeats, stopNoise, stopMelody]) // eslint-disable-line react-hooks/exhaustive-deps

  const { state, currentSegment, start, pause, resume, skipPhase, extendBreak, jumpToSegment, seekInSegment, reset } =
    usePomodoro({
      segments,
      onPhaseChange: handlePhaseChange,
      onComplete: handleComplete,
    })

  useEffect(() => {
    if (state.isPaused) {
      suspendBeats()
      suspendNoise()
      suspendMelody()
    }
  }, [state.isPaused, suspendBeats, suspendNoise, suspendMelody])


  // Kill all audio on unmount
  useEffect(() => {
    return () => {
      stopBeats()
      stopNoise()
      stopMelody()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Swap ambient layer when mode changes mid-session
  useEffect(() => {
    localStorage.setItem(AUDIO_MODE_KEY, audioMode)
    if (!state.isRunning) return
    const phase = currentSegment?.phase ?? 'focus'
    stopNoise(true)   // immediate — user actively switched, no overlap
    stopMelody(true)
    if (audioMode === 'noise')  startNoise(phase)
    if (audioMode === 'melody') startMelody(phase)
  }, [audioMode]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const autostart = new URLSearchParams(window.location.search).get('autostart') === '1'
    // AudioContext starts 'suspended' when autoplay is blocked by the browser.
    // On return visits after prior audio interaction, it starts 'running'.
    // Notification deep-links pass ?autostart=1 — treat as allowed since the
    // tab was opened by user interaction (clicking the notification).
    const probe = new AudioContext()
    const allowed = autostart || probe.state === 'running'
    probe.close()
    if (allowed) handleStart()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleStart() {
    start()
    startBeats(segments[0].phase)
    startAmbient(segments[0].phase)
    analytics.sessionStart({
      cycles:    config.totalCycles,
      focusMin:  config.workMinutes,
      audioMode: audioMode,
    })
  }

  function handleResume() {
    resume()
    resumeBeats()
    if (audioMode === 'noise')  resumeNoise()
    if (audioMode === 'melody') resumeMelody()
  }

  function cycleMode() {
    setAudioMode(m => {
      const next = MODE_CYCLE[(MODE_CYCLE.indexOf(m) + 1) % MODE_CYCLE.length]
      analytics.audioModeChange({ from: m, to: next })
      return next
    })
  }

  const [debugOpen, setDebugOpen] = useState(false)
  const [forceComplete, setForceComplete] = useState(false)
  const forceCompleteRef = useRef(false)
  forceCompleteRef.current = forceComplete

  useVisibilityResume(
    useCallback(() => {
      resumeBeats()
      if (audioModeRef.current === 'noise')  resumeNoise()
      if (audioModeRef.current === 'melody') resumeMelody()
    }, [resumeBeats, resumeNoise, resumeMelody]),
    state.isRunning && !state.isPaused && !forceCompleteRef.current,
  )

  const isBreak = currentSegment?.phase === 'shortBreak' || currentSegment?.phase === 'longBreak'
  const cycleIndex = currentSegment?.cycleIndex ?? 0
  const completedCycles = segments
    .slice(0, state.segmentIndex)
    .filter(s => s.phase === 'cooldown')
    .length

  if (state.isComplete || forceComplete) {
    return (
      <CompletionScreen
        totalCycles={completedCycles}
        stats={getStats()}
        scheduleReminder={scheduleReminder}
        cancelReminder={cancelReminder}
        pendingAt={pendingAt}
        notificationsSupported={notificationsSupported}
        onRestart={() => {
          reset()
          setForceComplete(false)
          handleStart()
        }}
      />
    )
  }

  const modeLabel = isBreak ? BREAK_MODE_LABELS[audioMode] : MODE_LABELS[audioMode]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 gap-10">

      {/* Nav icons */}
      <div className="fixed top-4 right-4 flex items-center gap-2">
        <button
          onClick={() => navigate('/about')}
          title="About"
          className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-sm flex items-center justify-center transition-colors"
        >i</button>
        <button
          onClick={() => navigate('/settings')}
          title="Settings"
          className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
        </button>
      </div>

      {/* Headphones reminder — shown only before session starts */}
      {!state.isRunning && !state.isPaused && (
        <div className="flex items-center gap-2 bg-amber-950/40 border border-amber-700/40 rounded-full px-4 py-2">
          <span className="text-base">🎧</span>
          <p className="text-xs text-amber-200/80">Put on stereo headphones for binaural beats</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-lg font-semibold text-slate-400">Focus Session</h1>
        <CycleProgress
          totalCycles={config.totalCycles}
          currentCycleIndex={cycleIndex}
          completedCycles={completedCycles}
        />
      </div>

      {/* Timer */}
      <div className="flex flex-col items-center gap-6">
        {currentSegment && (
          <Timer
            phase={currentSegment.phase}
            timeRemainingSeconds={state.timeRemainingSeconds}
            totalSeconds={currentSegment.durationSeconds}
            isRunning={state.isRunning}
          />
        )}
        {currentSegment && <PhaseIndicator phase={currentSegment.phase} />}
      </div>

      {/* Controls */}
      <Controls
        isRunning={state.isRunning}
        isPaused={state.isPaused}
        isBreak={isBreak}
        onStart={handleStart}
        onPause={pause}
        onResume={handleResume}
        onSkip={skipPhase}
        onExtendBreak={extendBreak}
      />

      {/* Phase timeline */}
      {segments.length > 0 && (
        <div className="w-full max-w-sm flex flex-col gap-1">
          <p className="text-xs text-slate-500 text-center mb-2">Session Overview</p>
          <div className="flex gap-1">
            {segments.map((seg, i) => (
              <div
                key={i}
                title={PHASE_LABELS[seg.phase]}
                className={`h-1.5 rounded-full flex-1 transition-colors ${
                  i < state.segmentIndex
                    ? 'bg-violet-600'
                    : i === state.segmentIndex
                    ? 'bg-violet-400'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Audio mode toggle */}
      <button
        onClick={cycleMode}
        className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-medium transition-colors ${
          audioMode === 'off'
            ? 'bg-white/5 border-white/10 text-slate-500'
            : audioMode === 'melody'
            ? 'bg-violet-900/40 border-violet-700/50 text-violet-300'
            : 'bg-teal-900/40 border-teal-700/50 text-teal-300'
        }`}
      >
        <span>{MODE_ICONS[audioMode]}</span>
        {modeLabel}
      </button>

      {/* Ambient volume slider */}
      {audioMode !== 'off' && (
        <div className="flex items-center gap-3 w-full max-w-xs">
          <span className="text-slate-500 text-sm">🔈</span>
          <input
            type="range"
            min={0} max={1} step={0.01}
            value={ambientVolume}
            onChange={e => setAmbientVolume(Number(e.target.value))}
            className="flex-1 accent-violet-500 cursor-pointer"
          />
          <span className="text-slate-500 text-sm">🔊</span>
        </div>
      )}

      {/* Back link */}
      <button
        onClick={() => {
          if (confirm('End session early?')) {
            analytics.sessionAbandon({
              segmentsComplete: state.segmentIndex,
              segmentsTotal:    segments.length,
              audioMode:        audioMode,
            })
            pause()
            stopBeats()
            stopAmbient()
            if (completedCycles > 0) recordSession(completedCycles, completedCycles * config.workMinutes)
            setForceComplete(true)
          }
        }}
        className="text-sm text-slate-600 hover:text-slate-400 transition-colors"
      >
        End session
      </button>

      {/* Debug panel — dev only */}
      {import.meta.env.DEV && (
        <div className="w-full max-w-sm">
          <button
            onClick={() => setDebugOpen(o => !o)}
            className="w-full text-xs text-slate-600 hover:text-slate-400 transition-colors py-1 flex items-center justify-center gap-1"
          >
            <span>{debugOpen ? '▲' : '▼'}</span> Test / Debug
          </button>

          {debugOpen && (
            <div className="mt-2 rounded-xl border border-slate-700 bg-slate-900 overflow-hidden">
              {currentSegment && (() => {
                const dur = currentSegment.durationSeconds
                const elapsed = dur - state.timeRemainingSeconds
                const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
                const seek = (toElapsed: number) => {
                  const clamped = Math.max(0, Math.min(dur - 1, toElapsed))
                  seekInSegment(clamped)
                }
                return (
                  <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/60 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${PHASE_COLORS[currentSegment.phase]}`}>
                        {PHASE_LABELS[currentSegment.phase]}
                      </span>
                      <span className="text-xs font-mono text-slate-400">{PHASE_HZ[currentSegment.phase]}</span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      stage: {currentSegment.stageKey} &nbsp;·&nbsp; base offset: {currentSegment.startOffsetSeconds}s
                    </div>
                    <input
                      type="range" min={0} max={dur} value={elapsed}
                      onChange={e => seek(Number(e.target.value))}
                      className="w-full accent-violet-500 cursor-pointer"
                    />
                    <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                      <span>{fmt(elapsed)} elapsed</span>
                      <span>{fmt(state.timeRemainingSeconds)} left</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {[1, 2, 5, 10].map(m => (
                        <button key={m} onClick={() => seek(m * 60)}
                          className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-xs font-mono transition-colors">
                          +{m}m
                        </button>
                      ))}
                      <button onClick={() => seek(0)}
                        className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-xs font-mono transition-colors">
                        ↩ start
                      </button>
                    </div>
                  </div>
                )
              })()}

              <div className="max-h-64 overflow-y-auto divide-y divide-slate-800">
                {segments.map((seg, i) => {
                  const isActive = i === state.segmentIndex
                  return (
                    <button key={i} onClick={() => jumpToSegment(i)}
                      className={`w-full text-left px-4 py-2 flex items-center gap-3 transition-colors cursor-pointer
                        ${isActive ? 'bg-violet-900/40' : 'hover:bg-slate-800'}`}
                    >
                      <span className="text-xs font-mono text-slate-600 w-4 shrink-0">{i + 1}</span>
                      <span className={`text-xs flex-1 ${isActive ? PHASE_COLORS[seg.phase] : 'text-slate-300'}`}>
                        {PHASE_LABELS[seg.phase]}
                        <span className="ml-1 text-slate-600">C{seg.cycleIndex + 1}</span>
                      </span>
                      <span className="text-xs font-mono text-slate-500 shrink-0">{PHASE_HZ[seg.phase]}</span>
                      <span className="text-xs font-mono text-slate-600 shrink-0">
                        {Math.floor(seg.startOffsetSeconds / 60)}:{String(seg.startOffsetSeconds % 60).padStart(2, '0')}
                      </span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
