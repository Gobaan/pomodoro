export type PhaseType = 'warmup' | 'focus' | 'cooldown' | 'shortBreak' | 'longBreak'

/** Maps a phase to one of the three local audio tracks */
export type StageKey = 'focus' | 'cooldown' | 'break'

// Legacy — kept for the YouTube MusicSetup page
export type VideoKey = 'alpha' | 'beta' | 'theta'

export interface VideoConfig {
  url: string
  videoId: string
}

export interface SessionConfig {
  workMinutes: number
  warmupMinutes: number
  cooldownMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  cyclesBeforeLongBreak: number
  totalCycles: number
  videos: Record<VideoKey, VideoConfig | null>
}

export interface PhaseSegment {
  phase: PhaseType
  stageKey: StageKey
  durationSeconds: number
  /** Cumulative seconds played in this stage across prior cycles — used for display only */
  startOffsetSeconds: number
  cycleIndex: number // 0-based cycle this segment belongs to
}

export interface PomodoroState {
  segmentIndex: number // index into the flat PhaseSegment[]
  timeRemainingSeconds: number
  isRunning: boolean
  isPaused: boolean
  isComplete: boolean
}

export const DEFAULT_VIDEOS: Record<VideoKey, VideoConfig> = {
  beta:  { url: 'https://m.youtube.com/watch?v=U0QHUt55svg', videoId: 'U0QHUt55svg' },
  alpha: { url: 'https://m.youtube.com/watch?v=F27-tw57tvg', videoId: 'F27-tw57tvg' },
  theta: { url: 'https://www.youtube.com/watch?v=fAe3-7_Yn9k', videoId: 'fAe3-7_Yn9k' },
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  workMinutes: 25,
  warmupMinutes: 3,
  cooldownMinutes: 2,
  shortBreakMinutes: 5,
  longBreakMinutes: 20,
  cyclesBeforeLongBreak: 4,
  totalCycles: 4,
  videos: DEFAULT_VIDEOS,
}
