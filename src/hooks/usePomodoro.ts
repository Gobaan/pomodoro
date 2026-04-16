import { useReducer, useEffect, useRef, useCallback } from 'react'
import type { PomodoroState, PhaseSegment } from '../types'

type Action =
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'TICK' }
  | { type: 'NEXT_SEGMENT' }
  | { type: 'EXTEND_BREAK'; extraSeconds: number }
  | { type: 'SKIP_PHASE' }
  | { type: 'JUMP_TO_SEGMENT'; index: number }
  | { type: 'SEEK_IN_SEGMENT'; elapsedSeconds: number }

function makeInitial(segments: PhaseSegment[]): PomodoroState {
  return {
    segmentIndex: 0,
    timeRemainingSeconds: segments[0]?.durationSeconds ?? 0,
    isRunning: false,
    isPaused: false,
    isComplete: false,
  }
}

function reducer(
  state: PomodoroState,
  action: Action,
  segments: PhaseSegment[],
): PomodoroState {
  switch (action.type) {
    case 'START':
      return { ...state, isRunning: true, isPaused: false }
    case 'PAUSE':
      return { ...state, isRunning: false, isPaused: true }
    case 'RESUME':
      return { ...state, isRunning: true, isPaused: false }
    case 'TICK': {
      if (state.timeRemainingSeconds > 1) {
        return { ...state, timeRemainingSeconds: state.timeRemainingSeconds - 1 }
      }
      // Segment finished — advance
      const next = state.segmentIndex + 1
      if (next >= segments.length) {
        return { ...state, timeRemainingSeconds: 0, isRunning: false, isComplete: true }
      }
      return {
        ...state,
        segmentIndex: next,
        timeRemainingSeconds: segments[next].durationSeconds,
      }
    }
    case 'NEXT_SEGMENT': {
      const next = state.segmentIndex + 1
      if (next >= segments.length) {
        return { ...state, isRunning: false, isComplete: true }
      }
      return { ...state, segmentIndex: next, timeRemainingSeconds: segments[next].durationSeconds }
    }
    case 'SKIP_PHASE': {
      const next = state.segmentIndex + 1
      if (next >= segments.length) {
        return { ...state, isRunning: false, isComplete: true }
      }
      return { ...state, segmentIndex: next, timeRemainingSeconds: segments[next].durationSeconds }
    }
    case 'EXTEND_BREAK':
      return { ...state, timeRemainingSeconds: state.timeRemainingSeconds + action.extraSeconds }
    case 'SEEK_IN_SEGMENT': {
      const seg = segments[state.segmentIndex]
      if (!seg) return state
      const remaining = seg.durationSeconds - action.elapsedSeconds
      if (remaining <= 0) return state
      return { ...state, timeRemainingSeconds: remaining }
    }
    case 'JUMP_TO_SEGMENT': {
      const seg = segments[action.index]
      if (!seg) return state
      return {
        ...state,
        segmentIndex: action.index,
        timeRemainingSeconds: seg.durationSeconds,
        isRunning: true,
        isPaused: false,
        isComplete: false,
      }
    }
    default:
      return state
  }
}

interface UsePomodoroOptions {
  segments: PhaseSegment[]
  onPhaseChange: (segment: PhaseSegment, prevSegment: PhaseSegment | null) => void
  onComplete: () => void
}

export function usePomodoro({ segments, onPhaseChange, onComplete }: UsePomodoroOptions) {
  const segmentsRef = useRef(segments)
  segmentsRef.current = segments

  const [state, dispatchRaw] = useReducer(
    (s: PomodoroState, a: Action) => reducer(s, a, segmentsRef.current),
    undefined,
    () => makeInitial(segments),
  )

  const prevSegmentIndexRef = useRef<number>(-1)

  const dispatch = useCallback(dispatchRaw, [dispatchRaw])

  // Tick every second when running
  useEffect(() => {
    if (!state.isRunning) return
    const id = setInterval(() => dispatch({ type: 'TICK' }), 1000)
    return () => clearInterval(id)
  }, [state.isRunning, dispatch])

  // Fire callbacks on segment change
  useEffect(() => {
    if (state.segmentIndex !== prevSegmentIndexRef.current) {
      const prev = prevSegmentIndexRef.current >= 0
        ? segmentsRef.current[prevSegmentIndexRef.current]
        : null
      prevSegmentIndexRef.current = state.segmentIndex
      onPhaseChange(segmentsRef.current[state.segmentIndex], prev)
    }
  }, [state.segmentIndex, onPhaseChange])

  // Fire complete callback
  useEffect(() => {
    if (state.isComplete) onComplete()
  }, [state.isComplete, onComplete])

  const currentSegment = segments[state.segmentIndex] ?? null

  return {
    state,
    currentSegment,
    start: () => dispatch({ type: 'START' }),
    pause: () => dispatch({ type: 'PAUSE' }),
    resume: () => dispatch({ type: 'RESUME' }),
    skipPhase: () => dispatch({ type: 'SKIP_PHASE' }),
    extendBreak: (minutes: number) =>
      dispatch({ type: 'EXTEND_BREAK', extraSeconds: minutes * 60 }),
    jumpToSegment: (index: number) => dispatch({ type: 'JUMP_TO_SEGMENT', index }),
    seekInSegment: (elapsedSeconds: number) => dispatch({ type: 'SEEK_IN_SEGMENT', elapsedSeconds }),
  }
}
