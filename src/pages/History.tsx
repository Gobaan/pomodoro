import { useNavigate } from 'react-router-dom'
import { computeSessionSummaries } from '../hooks/useTaskHistory'

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem('pmg_task_history') ?? '[]') ?? []
  } catch {
    return []
  }
}

export function History() {
  const navigate = useNavigate()
  const records  = loadHistory()
  const sessions = computeSessionSummaries(records)

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-12">
      <div className="w-full max-w-lg flex flex-col gap-6">

        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white text-sm transition-colors">← Back</button>
          <button onClick={() => navigate('/settings')} className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Settings</button>
        </div>

        <h1 className="text-3xl font-bold text-white">Task History</h1>

        {sessions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="text-4xl">📋</span>
            <p className="text-slate-400 text-sm max-w-xs">
              No history yet. Plan tasks before a session to start building your log.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sessions.map(s => {
              const date  = new Date(s.sessionDate + 'T12:00:00')
              const label = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
              return (
                <div key={s.sessionDate} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="flex-1 text-sm font-medium text-white">{label}</span>
                    <span className="text-xs text-slate-500">{s.tasks.length} {s.tasks.length === 1 ? 'task' : 'tasks'}</span>
                  </div>
                  <div className="border-t border-white/5 divide-y divide-white/5">
                    {s.tasks.map(t => (
                      <div key={t.id} className="flex items-center gap-2 px-4 py-2">
                        <span className="px-1.5 py-0.5 rounded-full bg-violet-900/40 border border-violet-700/30 text-violet-400 text-xs font-mono shrink-0">
                          {t.tag}
                        </span>
                        <span className="flex-1 text-xs text-slate-300 truncate">{t.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
