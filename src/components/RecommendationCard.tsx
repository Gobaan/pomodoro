import { useState } from 'react'
import type { Recommendation } from '../data/recommendations'
import { extractVideoId } from '../utils/youtube'

interface RecommendationCardProps {
  rec: Recommendation
  value: string
  onChange: (url: string, videoId: string | null) => void
}

export function RecommendationCard({ rec, value, onChange }: RecommendationCardProps) {
  const [error, setError] = useState('')

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const url = e.target.value
    if (!url) {
      setError('')
      onChange('', null)
      return
    }
    const id = extractVideoId(url)
    if (!id) {
      setError('Could not find a valid YouTube video ID in this URL.')
    } else {
      setError('')
    }
    onChange(url, id)
  }

  const videoId = extractVideoId(value)
  const isValid = !!videoId

  return (
    <div className={`rounded-xl border p-5 ${rec.bgColor} flex flex-col gap-3`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className={`font-semibold text-lg ${rec.color}`}>{rec.title}</h3>
          <p className="text-sm text-slate-300 font-mono">{rec.band} · {rec.hz}</p>
        </div>
        <span className="text-xs text-slate-400 mt-1">{rec.minDuration}</span>
      </div>

      <p className="text-sm text-slate-300">{rec.effect}</p>

      <div className="bg-black/20 rounded-lg px-3 py-2 text-xs text-slate-400">
        <span className="text-slate-500">Search YouTube: </span>
        <span className="font-mono text-slate-300">"{rec.searchQuery}"</span>
      </div>

      <div className="flex flex-col gap-1">
        <div className="relative">
          <input
            type="url"
            placeholder="Paste YouTube URL here…"
            value={value}
            onChange={handleInput}
            className={`w-full bg-black/30 border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 transition-all ${
              isValid
                ? 'border-green-600/60 focus:ring-green-500/30'
                : error
                ? 'border-red-600/60 focus:ring-red-500/30'
                : 'border-white/10 focus:ring-violet-500/30'
            }`}
          />
          {isValid && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 text-sm">✓</span>
          )}
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    </div>
  )
}
