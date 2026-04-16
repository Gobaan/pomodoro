import { useEffect, useRef, useState } from 'react'
import { PHASE_RING_COLORS } from '../data/recommendations'
import type { PhaseType } from '../types'

interface TimerProps {
  phase: PhaseType
  timeRemainingSeconds: number
  totalSeconds: number
  isRunning: boolean
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function Timer({ phase, timeRemainingSeconds, totalSeconds, isRunning }: TimerProps) {
  const radius = 100
  const stroke = 8
  const normalizedRadius = radius - stroke / 2
  const circumference = 2 * Math.PI * normalizedRadius

  // Sub-second smooth progress via rAF + wall clock.
  // timeRemainingSeconds from the reducer is an integer that ticks every ~1000ms.
  // setInterval is not perfectly accurate on mobile — if it fires late the circle
  // would rush to catch up then halt. Instead we interpolate continuously using
  // performance.now() between integer ticks.
  const [smoothOffset, setSmoothOffset] = useState(0)

  // Refs hold the interpolation baseline — updated each time an integer tick arrives.
  const baseWallRef      = useRef(performance.now())
  const baseRemainingRef = useRef(timeRemainingSeconds)
  const totalRef         = useRef(totalSeconds)
  const rafRef           = useRef<number | null>(null)

  // When the integer countdown changes, reset the interpolation base.
  useEffect(() => {
    baseWallRef.current      = performance.now()
    baseRemainingRef.current = timeRemainingSeconds
    totalRef.current         = totalSeconds
  }, [timeRemainingSeconds, totalSeconds])

  // rAF loop — runs only while the timer is running.
  useEffect(() => {
    if (!isRunning) {
      // When paused/stopped, show exact integer position.
      const progress = totalSeconds > 0 ? timeRemainingSeconds / totalSeconds : 1
      setSmoothOffset(circumference * (1 - progress))
      return
    }

    function tick() {
      const elapsed    = (performance.now() - baseWallRef.current) / 1000
      const remaining  = Math.max(0, baseRemainingRef.current - elapsed)
      const progress   = totalRef.current > 0 ? remaining / totalRef.current : 1
      setSmoothOffset(circumference * (1 - progress))
      rafRef.current   = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [isRunning, circumference, timeRemainingSeconds, totalSeconds])

  const color = PHASE_RING_COLORS[phase] ?? '#a78bfa'
  const minutes = Math.floor(timeRemainingSeconds / 60)
  const seconds = timeRemainingSeconds % 60

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={radius * 2} height={radius * 2} className="rotate-[-90deg]">
        {/* Track */}
        <circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        {/* Progress — no CSS transition; rAF drives it smoothly */}
        <circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={smoothOffset}
          style={{ transition: 'stroke 0.5s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-5xl font-mono font-light text-white tabular-nums">
          {pad(minutes)}:{pad(seconds)}
        </span>
      </div>
    </div>
  )
}
