import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { SessionConfig, VideoKey, VideoConfig } from '../types'
import { DEFAULT_SESSION_CONFIG } from '../types'

const STORAGE_KEY = 'pmg_session_config'

function loadConfig(): Partial<SessionConfig> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') ?? {}
  } catch {
    return {}
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
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white text-lg flex items-center justify-center transition-colors"
        >−</button>
        <span className="w-10 text-center text-sm font-mono text-white">{value}m</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white text-lg flex items-center justify-center transition-colors"
        >+</button>
      </div>
    </div>
  )
}

export function SessionConfigPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const videos = (location.state as { videos?: Record<VideoKey, VideoConfig | null> } | null)?.videos

  const saved = loadConfig()

  const [config, setConfig] = useState<SessionConfig>({
    ...DEFAULT_SESSION_CONFIG,
    ...saved,
    videos: videos ?? DEFAULT_SESSION_CONFIG.videos,
  })

  function update<K extends keyof SessionConfig>(key: K, val: SessionConfig[K]) {
    setConfig(prev => {
      const next = { ...prev, [key]: val }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const focusMinutes = config.workMinutes - config.warmupMinutes - config.cooldownMinutes

  function handleStart() {
    navigate('/player', { state: { config } })
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-12">
      <div className="max-w-lg w-full flex flex-col gap-8">

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white text-sm transition-colors">← Back</button>
          </div>
          <h1 className="text-3xl font-bold text-white">Session Settings</h1>
          <p className="text-slate-400 text-sm">Customise the timing for each phase of your focus session.</p>
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
          <NumField label="Cycles before long break" sublabel="" value={config.cyclesBeforeLongBreak} min={2} max={8} onChange={v => update('cyclesBeforeLongBreak', v)} />
        </div>

        <div className="bg-white/5 rounded-xl p-5 border border-white/10 flex flex-col">
          <h2 className="text-base font-semibold text-white mb-1">Session Length</h2>
          <NumField label="Total focus cycles" value={config.totalCycles} min={1} max={12} onChange={v => update('totalCycles', v)} />
        </div>

        <button
          onClick={handleStart}
          className="w-full py-4 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-semibold text-lg transition-colors"
        >
          Start Session →
        </button>
      </div>
    </div>
  )
}
