import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { SessionConfig } from '../types'
import { DEFAULT_SESSION_CONFIG } from '../types'
import { usePlannerUnlock } from '../hooks/usePlannerUnlock'

const STORAGE_KEY = 'pmg_session_config'

function loadConfig(): SessionConfig {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    return saved ? { ...DEFAULT_SESSION_CONFIG, ...saved } : DEFAULT_SESSION_CONFIG
  } catch {
    return DEFAULT_SESSION_CONFIG
  }
}

interface NumFieldProps {
  label: string
  sublabel?: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}

function NumField({ label, sublabel, value, min, max, onChange }: NumFieldProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5">
      <div>
        <span className="text-sm font-medium text-white">{label}</span>
        {sublabel && <p className="text-xs text-slate-500">{sublabel}</p>}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors text-base"
        >−</button>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={e => {
            const n = parseInt(e.target.value, 10)
            if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n)))
          }}
          className="w-14 text-center text-sm font-mono text-white bg-white/5 border border-white/10 rounded-lg py-1 focus:outline-none focus:border-violet-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-xs text-slate-500">m</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors text-base"
        >+</button>
      </div>
    </div>
  )
}

export function Settings() {
  const navigate = useNavigate()
  const [config, setConfig] = useState<SessionConfig>(loadConfig)
  const { isEnabled: plannerEnabled, autoUnlocked, hasManualOverride, setEnabled: setPlannerEnabled } = usePlannerUnlock()

  function update<K extends keyof SessionConfig>(key: K, val: SessionConfig[K]) {
    setConfig(prev => {
      const next = { ...prev, [key]: val }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const focusMinutes = config.workMinutes - config.warmupMinutes - config.cooldownMinutes

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-12">
      <div className="max-w-lg w-full flex flex-col gap-8">

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white text-sm transition-colors">← Back</button>
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/history')} className="text-slate-500 hover:text-slate-300 text-sm transition-colors">History</button>
              <button onClick={() => navigate('/about')} className="text-slate-500 hover:text-slate-300 text-sm transition-colors">About</button>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-slate-400 text-sm">Changes are saved automatically.</p>
        </div>

        <div className="bg-white/5 rounded-xl p-5 border border-white/10 flex flex-col">
          <h2 className="text-base font-semibold text-white mb-1">Work Block</h2>
          <NumField label="Total work duration" sublabel="Warm-up + focus + cool-down" value={config.workMinutes} min={10} max={60} onChange={v => update('workMinutes', v)} />
          <NumField label="Warm-up" sublabel={`Alpha waves — ${config.warmupMinutes}m`} value={config.warmupMinutes} min={1} max={10} onChange={v => update('warmupMinutes', v)} />
          <NumField label="Cool-down" sublabel={`Alpha waves — ${config.cooldownMinutes}m`} value={config.cooldownMinutes} min={1} max={10} onChange={v => update('cooldownMinutes', v)} />
          <div className="pt-3 text-xs text-slate-500 text-center">
            Deep focus: <span className="text-violet-400 font-mono">{Math.max(0, focusMinutes)}m</span> of Beta waves
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-5 border border-white/10 flex flex-col">
          <h2 className="text-base font-semibold text-white mb-1">Breaks</h2>
          <NumField label="Short break" value={config.shortBreakMinutes} min={1} max={30} onChange={v => update('shortBreakMinutes', v)} />
          <NumField label="Long break" sublabel="After every N cycles" value={config.longBreakMinutes} min={5} max={60} onChange={v => update('longBreakMinutes', v)} />
          <NumField label="Cycles before long break" value={config.cyclesBeforeLongBreak} min={2} max={8} onChange={v => update('cyclesBeforeLongBreak', v)} />
        </div>

        <div className="bg-white/5 rounded-xl p-5 border border-white/10 flex flex-col">
          <h2 className="text-base font-semibold text-white mb-1">Session Length</h2>
          <NumField label="Total focus cycles" value={config.totalCycles} min={1} max={12} onChange={v => update('totalCycles', v)} />
        </div>

        <div className="bg-white/5 rounded-xl p-5 border border-white/10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Task Planner</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {autoUnlocked
                  ? 'Plan tasks before each session and track estimates.'
                  : 'Unlocks automatically after 7 days of sessions.'}
              </p>
            </div>
            <button
              onClick={() => setPlannerEnabled(!plannerEnabled)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                plannerEnabled ? 'bg-violet-600' : 'bg-white/10'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                plannerEnabled ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
          {!autoUnlocked && !hasManualOverride && (
            <p className="text-xs text-slate-600">
              Complete sessions on 7 different days to unlock automatically, or toggle above to enable now.
            </p>
          )}
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full py-4 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-semibold text-lg transition-colors"
        >
          Start Session →
        </button>
      </div>
    </div>
  )
}
