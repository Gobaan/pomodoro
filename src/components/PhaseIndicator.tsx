import { PHASE_LABELS, PHASE_HZ, PHASE_COLORS } from '../data/recommendations'
import type { PhaseType } from '../types'

export function PhaseIndicator({ phase }: { phase: PhaseType }) {
  const label = PHASE_LABELS[phase] ?? phase
  const hz = PHASE_HZ[phase] ?? ''
  const color = PHASE_COLORS[phase] ?? 'text-white'

  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`text-xl font-semibold ${color}`}>{label}</span>
      <span className="text-sm text-slate-400 font-mono">{hz}</span>
    </div>
  )
}
