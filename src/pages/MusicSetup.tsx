import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { RecommendationCard } from '../components/RecommendationCard'
import { RECOMMENDATIONS } from '../data/recommendations'
import { extractVideoId } from '../utils/youtube'
import type { VideoKey, VideoConfig } from '../types'
import { DEFAULT_VIDEOS } from '../types'

const STORAGE_KEY = 'pmg_videos'

function loadSaved(): Record<VideoKey, { url: string; videoId: string } | null> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') ?? { alpha: null, beta: null, theta: null }
  } catch {
    return { alpha: null, beta: null, theta: null }
  }
}

export function MusicSetup() {
  const navigate = useNavigate()
  const saved = loadSaved()

  const [urls, setUrls] = useState<Record<VideoKey, string>>({
    alpha: saved.alpha?.url ?? DEFAULT_VIDEOS.alpha.url,
    beta:  saved.beta?.url  ?? DEFAULT_VIDEOS.beta.url,
    theta: saved.theta?.url ?? DEFAULT_VIDEOS.theta.url,
  })

  // Recompute from current urls
  const configs = Object.fromEntries(
    Object.entries(urls).map(([k, url]) => {
      const id = extractVideoId(url)
      return [k, id ? { url, videoId: id } : null]
    }),
  ) as Record<VideoKey, VideoConfig | null>

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs))
  }, [urls]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(key: VideoKey, url: string, _id: string | null) {
    setUrls(prev => ({ ...prev, [key]: url }))
  }

  const canProceed = RECOMMENDATIONS.every(r => !!extractVideoId(urls[r.key]))

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-12">
      <div className="max-w-2xl w-full flex flex-col gap-8">

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white text-sm transition-colors">← Back</button>
            <span className="text-slate-600">|</span>
            <span className="text-sm text-slate-500">Step 1 of 2</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Add Your Music</h1>
          <p className="text-slate-400">
            Find the 3 YouTube videos below and paste their URLs. The app will control
            playback automatically — no downloads needed.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {RECOMMENDATIONS.map(rec => (
            <RecommendationCard
              key={rec.key}
              rec={rec}
              value={urls[rec.key]}
              onChange={(url, id) => handleChange(rec.key, url, id)}
            />
          ))}
        </div>

        {!canProceed && (
          <p className="text-center text-sm text-slate-500">
            Add all 3 YouTube URLs to continue.
          </p>
        )}

        <button
          onClick={() => navigate('/config', { state: { videos: configs } })}
          disabled={!canProceed}
          className={`w-full py-4 rounded-full font-semibold text-lg transition-colors ${
            canProceed
              ? 'bg-violet-600 hover:bg-violet-500 text-white'
              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
          }`}
        >
          Configure Session →
        </button>
      </div>
    </div>
  )
}
