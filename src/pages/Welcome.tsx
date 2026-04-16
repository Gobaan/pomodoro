import { useNavigate } from 'react-router-dom'
import { DEFAULT_SESSION_CONFIG } from '../types'

export function Welcome() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="max-w-lg w-full flex flex-col items-center gap-8">

        <div className="flex flex-col items-center gap-3">
          <div className="text-6xl">🎧</div>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Pomodoro Binaural<br />Music Generator
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Scientifically-tuned binaural beats guide your brain through each phase of the
            Pomodoro technique — warm-up, deep focus, cool-down, and recovery.
          </p>
        </div>

        <div className="w-full grid grid-cols-3 gap-3 text-left">
          {[
            { emoji: '🔵', label: 'Alpha · 10 Hz', desc: 'Warm-up & cool-down — calm, alert transition' },
            { emoji: '🟣', label: 'Beta · 15 Hz', desc: 'Focus — active concentration & problem-solving' },
            { emoji: '🟢', label: 'Theta · 6 Hz', desc: 'Breaks — deep relaxation & mental recovery' },
          ].map(({ emoji, label, desc }) => (
            <div key={label} className="bg-white/5 rounded-xl p-4 flex flex-col gap-1 border border-white/10">
              <span className="text-2xl">{emoji}</span>
              <span className="text-sm font-semibold text-white font-mono">{label}</span>
              <span className="text-xs text-slate-400">{desc}</span>
            </div>
          ))}
        </div>

        <div className="w-full bg-white/5 rounded-xl p-5 border border-white/10 text-left">
          <h2 className="text-base font-semibold text-white mb-2">How it works</h2>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-slate-400">
            <li>Configure your session duration and cycle count.</li>
            <li>Hit Start — music switches automatically for each phase.</li>
            <li>Pause anytime, extend breaks, or skip phases as needed.</li>
          </ol>
        </div>

        <div className="w-full grid grid-cols-2 gap-3 text-left">
          {[
            {
              icon: '🎵',
              label: 'Melody',
              badge: 'Default',
              badgeColor: 'bg-violet-700/60 text-violet-200',
              cardColor: 'border-violet-700/30 bg-violet-950/20',
              desc: 'Soft piano and orchestral pieces selected for focus and recovery. Unobtrusive enough to fade into the background.',
            },
            {
              icon: '🌊',
              label: 'Brown noise',
              badge: 'Alternative',
              badgeColor: 'bg-teal-800/60 text-teal-200',
              cardColor: 'border-teal-700/20 bg-teal-950/10',
              desc: 'A deep, warm rumble during focus; gentle rainfall on breaks. Masks distractions and keeps the environment consistent.',
            },
          ].map(({ icon, label, badge, badgeColor, cardColor, desc }) => (
            <div key={label} className={`rounded-xl p-4 flex flex-col gap-2 border ${cardColor}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">{icon}</span>
                  <span className="text-sm font-semibold text-white">{label}</span>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="w-full flex items-start gap-3 bg-amber-950/40 border border-amber-700/40 rounded-xl px-4 py-3 text-left">
          <span className="text-lg shrink-0">🎧</span>
          <p className="text-sm text-amber-200/80 leading-relaxed">
            <span className="font-semibold text-amber-200">Stereo headphones required.</span>{' '}
            Binaural beats work by delivering a slightly different frequency to each ear. Speakers mix the channels before they reach you and cancel the effect.
          </p>
        </div>

        <button
          onClick={() => navigate('/config', { state: { config: DEFAULT_SESSION_CONFIG } })}
          className="px-10 py-4 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-semibold text-lg transition-colors"
        >
          Get Started →
        </button>

<p className="text-xs text-slate-600 text-center leading-relaxed">
          Melody tracks "Compassion (keys version)" &amp; "Decompress" by{' '}
          <a
            href="https://freemusicarchive.org/music/lee-rosevere"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-slate-400 transition-colors"
          >
            Lee Rosevere
          </a>
          {' '}— CC BY 4.0
        </p>
      </div>
    </div>
  )
}
