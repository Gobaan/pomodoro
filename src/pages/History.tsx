import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { computeTagSummaries, computeSessionSummaries } from '../hooks/useTaskHistory'
import type { TagSummary, SessionSummary } from '../hooks/useTaskHistory'

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem('pmg_task_history') ?? '[]') ?? []
  } catch {
    return []
  }
}

function AccuracyBadge({ pct }: { pct: number }) {
  const color = pct >= 90 ? 'text-green-400 bg-green-900/30 border-green-700/40'
              : pct >= 70 ? 'text-amber-400 bg-amber-900/30 border-amber-700/40'
              :              'text-red-400 bg-red-900/30 border-red-700/40'
  return (
    <span className={`px-2 py-0.5 rounded-full border text-xs font-mono ${color}`}>
      {pct}%
    </span>
  )
}

function TagView({ summaries }: { summaries: TagSummary[] }) {
  if (summaries.length === 0) return null
  return (
    <div className="flex flex-col gap-2">
      {summaries.map(s => (
        <div key={s.tag} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="px-2 py-0.5 rounded-full bg-violet-900/50 border border-violet-700/40 text-violet-300 text-xs font-mono shrink-0">
            {s.tag}
          </span>
          <div className="flex-1 flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{s.count} {s.count === 1 ? 'task' : 'tasks'}</span>
              <span className="text-slate-600">·</span>
              <span>avg est <span className="text-white font-mono">{s.avgEstimated.toFixed(1)}</span> 🍅</span>
              <span className="text-slate-600">·</span>
              <span>avg actual <span className="text-white font-mono">{s.avgActual.toFixed(1)}</span> 🍅</span>
            </div>
            {s.accuracyPct < 90 && (
              <p className="text-xs text-slate-600">
                {s.accuracyPct < 70
                  ? `You consistently underestimate by ${Math.round((s.avgActual / s.avgEstimated - 1) * 100)}%`
                  : 'Slightly underestimated on average'}
              </p>
            )}
          </div>
          <AccuracyBadge pct={s.accuracyPct} />
        </div>
      ))}
    </div>
  )
}

function SessionView({ summaries }: { summaries: SessionSummary[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  if (summaries.length === 0) return null
  return (
    <div className="flex flex-col gap-2">
      {summaries.map(s => {
        const isOpen = expanded === s.sessionDate
        const date = new Date(s.sessionDate + 'T12:00:00')
        const label = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
        return (
          <div key={s.sessionDate} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : s.sessionDate)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
            >
              <span className="flex-1 text-sm text-white">{label}</span>
              <span className="text-xs text-slate-500">{s.tasks.length} {s.tasks.length === 1 ? 'task' : 'tasks'}</span>
              {s.accuracyPct !== null
                ? <AccuracyBadge pct={s.accuracyPct} />
                : <span className="text-xs text-slate-600">no actuals</span>}
              <span className="text-slate-600 text-xs">{isOpen ? '▲' : '▼'}</span>
            </button>
            {isOpen && (
              <div className="border-t border-white/5 divide-y divide-white/5">
                {s.tasks.map(t => (
                  <div key={t.id} className="flex items-center gap-2 px-4 py-2">
                    <span className="px-1.5 py-0.5 rounded-full bg-violet-900/40 border border-violet-700/30 text-violet-400 text-xs font-mono shrink-0">
                      {t.tag}
                    </span>
                    <span className="flex-1 text-xs text-slate-300 truncate">{t.name}</span>
                    <span className="text-xs text-slate-500 font-mono shrink-0">
                      {t.estimated}→{t.actual} 🍅
                    </span>
                    {t.actual > 0 && (
                      <AccuracyBadge pct={Math.round((t.estimated / t.actual) * 100)} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function History() {
  const navigate = useNavigate()
  const records = loadHistory()
  const tagSummaries     = computeTagSummaries(records)
  const sessionSummaries = computeSessionSummaries(records)
  const [tab, setTab] = useState<'tags' | 'sessions'>('tags')

  const isEmpty = records.length === 0

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-12">
      <div className="w-full max-w-lg flex flex-col gap-6">

        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white text-sm transition-colors">← Back</button>
          <button onClick={() => navigate('/settings')} className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Settings</button>
        </div>

        <h1 className="text-3xl font-bold text-white">Task History</h1>

        {isEmpty ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="text-4xl">📋</span>
            <p className="text-slate-400 text-sm max-w-xs">
              No history yet. Plan tasks before a session, then save your actuals on the completion screen.
            </p>
          </div>
        ) : (
          <>
            {/* Tab switcher */}
            <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
              {(['tags', 'sessions'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    tab === t ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {t === 'tags' ? 'By Tag' : 'By Session'}
                </button>
              ))}
            </div>

            {tab === 'tags'     && <TagView     summaries={tagSummaries} />}
            {tab === 'sessions' && <SessionView summaries={sessionSummaries} />}
          </>
        )}
      </div>
    </div>
  )
}
