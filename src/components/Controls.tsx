interface ControlsProps {
  isRunning: boolean
  isPaused: boolean
  isBreak: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onSkip: () => void
  onExtendBreak: (minutes: number) => void
}

export function Controls({
  isRunning,
  isPaused,
  isBreak,
  onStart,
  onPause,
  onResume,
  onSkip,
  onExtendBreak,
}: ControlsProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        {!isRunning && !isPaused && (
          <button
            onClick={onStart}
            className="px-8 py-3 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-semibold text-lg transition-colors"
          >
            Start Session
          </button>
        )}

        {isRunning && (
          <button
            onClick={onPause}
            className="px-8 py-3 rounded-full bg-slate-700 hover:bg-slate-600 text-white font-semibold text-lg transition-colors"
          >
            Pause
          </button>
        )}

        {isPaused && (
          <button
            onClick={onResume}
            className="px-8 py-3 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-semibold text-lg transition-colors"
          >
            Resume
          </button>
        )}

        {(isRunning || isPaused) && (
          <button
            onClick={onSkip}
            className="px-5 py-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
            title="Skip to next phase"
          >
            Skip →
          </button>
        )}
      </div>

      {isBreak && (isRunning || isPaused) && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Need more time?</span>
          {[5, 10, 15].map(m => (
            <button
              key={m}
              onClick={() => onExtendBreak(m)}
              className="px-3 py-1 rounded-full bg-teal-900/50 hover:bg-teal-800/60 text-teal-300 text-sm border border-teal-700/40 transition-colors"
            >
              +{m}m
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
