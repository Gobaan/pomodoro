import type { VideoKey } from '../types'

export interface Recommendation {
  key: VideoKey
  title: string
  hz: string
  band: string
  effect: string
  color: string
  bgColor: string
  searchQuery: string
  minDuration: string
}

export const RECOMMENDATIONS: Recommendation[] = [
  {
    key: 'beta',
    title: 'Focus Video',
    hz: '15–20 Hz',
    band: 'Beta Waves',
    effect: 'Active concentration and problem-solving',
    color: 'text-violet-300',
    bgColor: 'bg-violet-900/30 border-violet-700/50',
    searchQuery: '2 hour beta waves 18hz binaural beats focus concentration',
    minDuration: '2+ hours recommended',
  },
  {
    key: 'alpha',
    title: 'Transition Video',
    hz: '10–12 Hz',
    band: 'Alpha Waves',
    effect: 'Relaxed alertness — bridges rest and focus',
    color: 'text-blue-300',
    bgColor: 'bg-blue-900/30 border-blue-700/50',
    searchQuery: '2 hour alpha waves 10hz binaural beats relaxed focus',
    minDuration: '1+ hour recommended',
  },
  {
    key: 'theta',
    title: 'Break Video',
    hz: '6–8 Hz',
    band: 'Theta Waves',
    effect: 'Deep relaxation and mental recovery',
    color: 'text-teal-300',
    bgColor: 'bg-teal-900/30 border-teal-700/50',
    searchQuery: '2 hour theta waves 6hz binaural beats relaxation meditation',
    minDuration: '1+ hour recommended',
  },
]

export const PHASE_LABELS: Record<string, string> = {
  warmup: 'Warm-up',
  focus: 'Focus',
  cooldown: 'Cool-down',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
}

export const PHASE_HZ: Record<string, string> = {
  warmup: 'Alpha · 10 Hz',
  focus: 'Beta · 18 Hz',
  cooldown: 'Alpha · 10 Hz',
  shortBreak: 'Theta · 6 Hz',
  longBreak: 'Theta · 6 Hz',
}

export const PHASE_COLORS: Record<string, string> = {
  warmup: 'text-blue-300',
  focus: 'text-violet-300',
  cooldown: 'text-blue-300',
  shortBreak: 'text-teal-300',
  longBreak: 'text-teal-300',
}

export const PHASE_RING_COLORS: Record<string, string> = {
  warmup: '#60a5fa',
  focus: '#a78bfa',
  cooldown: '#60a5fa',
  shortBreak: '#2dd4bf',
  longBreak: '#2dd4bf',
}
