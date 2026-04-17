// Analytics via Umami — cookie-free, no PII collected.
// Gracefully no-ops in dev or if the script hasn't loaded.

declare global {
  interface Window {
    umami?: { track: (event: string, data?: Record<string, unknown>) => void }
  }
}

function track(event: string, data?: Record<string, unknown>) {
  window.umami?.track(event, data)
}

export const analytics = {
  /** User pressed Start on a session */
  sessionStart(opts: { cycles: number; focusMin: number; audioMode: string }) {
    track('session_start', {
      cycles:      opts.cycles,
      focus_min:   opts.focusMin,
      audio_mode:  opts.audioMode,
    })
  },

  /** User completed all cycles */
  sessionComplete(opts: { cycles: number; audioMode: string }) {
    track('session_complete', {
      cycles:     opts.cycles,
      audio_mode: opts.audioMode,
    })
  },

  /** User clicked "End session" early */
  sessionAbandon(opts: { segmentsComplete: number; segmentsTotal: number; audioMode: string }) {
    track('session_abandon', {
      progress_pct: Math.round((opts.segmentsComplete / opts.segmentsTotal) * 100),
      audio_mode:   opts.audioMode,
    })
  },

  /** User toggled the audio mode */
  audioModeChange(opts: { from: string; to: string }) {
    track('audio_mode_change', { from: opts.from, to: opts.to })
  },

  /** User submitted feedback */
  feedbackSubmit(opts: { hasEmail: boolean }) {
    track('feedback_submit', { has_email: opts.hasEmail })
  },
}
