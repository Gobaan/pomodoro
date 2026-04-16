interface CycleProgressProps {
  totalCycles: number
  currentCycleIndex: number
  completedCycles: number
}

export function CycleProgress({ totalCycles, currentCycleIndex, completedCycles }: CycleProgressProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm text-slate-400">
        Cycle {currentCycleIndex + 1} of {totalCycles}
      </span>
      <div className="flex gap-2">
        {Array.from({ length: totalCycles }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-colors ${
              i < completedCycles
                ? 'bg-violet-400'
                : i === currentCycleIndex
                ? 'bg-violet-600 ring-2 ring-violet-400/50'
                : 'bg-slate-700'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
