import { useState, useEffect, useRef } from 'react'
import type { Task } from '../hooks/useTasks'

interface Props {
  tasks: Task[]
  onAdd: (name: string, estimated: number) => void
  onRemove: (id: string) => void
  onStart: () => void
  onSkip: () => void
}

export function TaskPlanner({ tasks, onAdd, onRemove, onStart, onSkip }: Props) {
  const [name, setName] = useState('')
  const [estimate, setEstimate] = useState(1)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Skip on Escape, start on Ctrl+Enter
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onSkip()
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') onStart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onSkip, onStart])

  function handleAdd() {
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed, estimate)
    setName('')
    setEstimate(1)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleAdd()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md flex flex-col gap-6">

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Plan your session</h1>
          <button
            onClick={onSkip}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
            title="Skip (Esc)"
          >
            Skip →
          </button>
        </div>

        {/* Task list */}
        {tasks.length > 0 && (
          <div className="flex flex-col gap-2">
            {tasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <span className="flex-1 text-sm text-white">{task.name}</span>
                <span className="text-xs font-mono text-violet-400 shrink-0">
                  {task.estimatedPomodoros} 🍅
                </span>
                <button
                  onClick={() => onRemove(task.id)}
                  className="text-slate-600 hover:text-slate-300 transition-colors text-sm shrink-0"
                  aria-label="Remove task"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add task row */}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What are you working on?"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setEstimate(e => Math.max(1, e - 1))}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >−</button>
            <span className="w-6 text-center text-sm font-mono text-white">{estimate}</span>
            <button
              onClick={() => setEstimate(e => Math.min(10, e + 1))}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >+</button>
          </div>
          <button
            onClick={handleAdd}
            disabled={!name.trim()}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white text-sm transition-colors shrink-0"
          >
            Add
          </button>
        </div>

        <button
          onClick={onStart}
          className="w-full py-4 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-semibold text-lg transition-colors"
          title="Start (Ctrl+Enter)"
        >
          Start Session →
        </button>

        {tasks.length === 0 && (
          <p className="text-xs text-slate-600 text-center">Add tasks above, or skip to start immediately.</p>
        )}
      </div>
    </div>
  )
}
