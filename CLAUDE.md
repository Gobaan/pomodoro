# Pomodoro Binaural Music Generator

## Project Goal

A web app that guides Pomodoro work sessions using binaural beats audio. The user provides YouTube video URLs for each frequency band; audio is downloaded locally as `.webm` files and served from `/pomodoro/audio/{videoId}.webm` for low-latency playback via the HTML5 Audio API.

## Tech Stack

- **React 18 + TypeScript** via Vite
- **React Router v6** — 4 pages: Welcome → MusicSetup → SessionConfig → SessionPlayer
- **Tailwind CSS v4** (`@tailwindcss/vite` plugin)
- **HTML5 Audio API** — plays locally downloaded `.webm` audio files; `loop = true` for continuous playback within a phase
- **Web Audio API** — transition ping bell only
- **localStorage** — persist video URLs and session config between visits

## Dev Commands

```bash
npm run dev      # start dev server at http://localhost:5173
npm run build    # production build to dist/
npm run preview  # preview production build
```

## Deployment

Deployment credentials and exact steps live in **`DEPLOY.local.md`** (gitignored — never committed).  
Before deploying or helping with server-side work, read that file first.  
If it is missing, ask the user for the server host, user, and path before proceeding.

## Architecture

### Pages (src/pages/)
| File | Purpose |
|------|---------|
| `Welcome.tsx` | Intro screen with "Get Started" CTA |
| `MusicSetup.tsx` | Recommend + input YouTube URLs for each video type |
| `SessionConfig.tsx` | Configure Pomodoro durations and cycle count |
| `SessionPlayer.tsx` | The live Pomodoro timer + hidden YouTube player |

### Hooks (src/hooks/)
| File | Purpose |
|------|---------|
| `usePomodoro.ts` | Timer state machine: phases, countdown, cycle tracking |
| `useAudioPlayer.ts` | HTML5 Audio element: load local `.webm`, seek, play/pause/loop |
| `useYouTubePlayer.ts` | Unused — kept for reference |
| `usePing.ts` | Web Audio API bell sound on phase transitions |

### Key Utils (src/utils/)
| File | Purpose |
|------|---------|
| `phaseSchedule.ts` | `buildSchedule(config)` → flat `PhaseSegment[]` for full session |
| `youtube.ts` | `extractVideoId(url)` — parses any YouTube URL format |

### Data (src/data/)
- `recommendations.ts` — static binaural beat video recommendations with search queries

## Binaural Beat Frequency Reference

| Band | Frequency | Effect | Phase Used |
|------|-----------|--------|------------|
| Alpha | 8–14 Hz | Relaxed alertness, calm focus | Warm-up, Cool-down |
| Beta | 15–30 Hz | Active concentration, problem-solving | Deep Focus |
| Theta | 4–8 Hz | Deep relaxation, creativity | Short Break, Long Break |

## Default Session Timeline (one 25-min Pomodoro)

```
00:00 → 03:00  Warm-up     Alpha 10 Hz   (alpha video)
03:00 → 23:00  Focus       Beta  18 Hz   (beta video)
23:00 → 25:00  Cool-down   Alpha 10 Hz   (alpha video, continues)
25:00           PING        transition bell
25:00 → 30:00  Short break Theta  6 Hz   (theta video)
30:00           PING        → next cycle
```

After 4 cycles → long break (20 min, theta video).

Video offsets **accumulate across cycles** so the user never hears the same section twice. Videos should be ≥ 2 hours long.

## Phase Schedule Logic

`buildSchedule(config)` in `src/utils/phaseSchedule.ts` returns a flat `PhaseSegment[]` array. Each segment records:
- `phase` — which phase type
- `videoKey` — which of the 3 videos to use (`alpha` | `beta` | `theta`)
- `durationSeconds`
- `startOffsetSeconds` — the timestamp in the YouTube video to seek to

Offsets for each video key are tracked separately and advance as cycles progress.

## Local Audio Notes

Audio files live in `public/audio/` and are served at `/pomodoro/audio/` (due to `base: '/pomodoro/'` in vite.config.ts).

| File | Track | Artist | License |
|------|-------|--------|---------|
| `focus_background.mp3` | 20 Minute Meditation 1 | HoliznaCC0 | CC0 |
| `cooldown_background.mp3` | DreamScape | HoliznaCC0 | CC0 |
| `break_background.mp3` | Cosmic Waves | HoliznaCC0 | CC0 |
| `focus_melody.mp3` | Compassion (keys version) | Lee Rosevere | CC BY 4.0 |
| `break_melody.mp3` | Decompress | Lee Rosevere | CC BY 4.0 |

Lee Rosevere tracks are from *Music For Podcasts - Serious* on [FMA](https://freemusicarchive.org/music/lee-rosevere).  
CC BY 4.0 requires attribution — see README.md.

## Types

All shared types live in `src/types/index.ts`:
- `PhaseType` — `'warmup' | 'focus' | 'cooldown' | 'shortBreak' | 'longBreak'`
- `VideoKey` — `'alpha' | 'beta' | 'theta'`
- `VideoConfig` — `{ url, videoId }`
- `SessionConfig` — full timer + video config
- `PhaseSegment` — one entry in the schedule
- `PomodoroState` — live timer state

---

## Planned Changes

### 1. Remove mid-session pings [x]

**Goal:** Only ping at break transitions; silence the ping at warmup→focus and focus→cooldown boundaries.

- In `usePing.ts` (or wherever `ping()` is called), fire the bell only when transitioning **into** a break phase (`shortBreak`, `longBreak`), not between work sub-phases (`warmup→focus`, `focus→cooldown`).
- Verify: run a fast-forward session in dev and confirm no bell during warmup/cooldown transitions.

---

### 2. Restructure navigation — session-first flow [x]

**Goal:** App opens directly to the session player. Setup lives in Settings; the old Welcome screen becomes About.

**New route map:**

| Route | Page | Purpose |
|-------|------|---------|
| `/` | `SessionPlayer.tsx` | Live timer — default landing page |
| `/settings` | `Settings.tsx` | Merged MusicSetup + SessionConfig; persisted to localStorage |
| `/about` | `About.tsx` | Current Welcome content (intro, how it works) |

**Steps:**
1. Rename `Welcome.tsx` → `About.tsx`; update route to `/about`.
2. Create `Settings.tsx` that renders MusicSetup + SessionConfig panels in a single page; keep existing localStorage keys unchanged.
3. Change the root route `/` to render `SessionPlayer.tsx` directly. On first load (no config saved), show an inline prompt linking to `/settings`.
4. Add a nav bar / hamburger with links to Settings and About.
5. Remove the old Welcome → MusicSetup → SessionConfig wizard flow from the router.

---

### 3. Notification system — schedule a session reminder [x]

**Goal:** After a session completes, offer users the ability to schedule a browser notification for a future time; clicking that notification deep-links to launch a new session immediately.

**Design:**
- On the session-complete screen, show a "Remind me at…" time picker.
- Use the [Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API) (`Notification.requestPermission()`).
- Schedule via `setTimeout` (for same-tab reminders) persisted to localStorage so reminders survive page refreshes but are cleared after firing.
- Notification `data` / click handler navigates to `/?autostart=1`, which causes `SessionPlayer` to auto-start without user interaction.
- Persist pending notification timestamp in localStorage key `pendingReminder`; check on app load and re-arm the timeout if it hasn't fired yet.

**New hook:** `useSessionReminder.ts`
- `scheduleReminder(isoTimestamp)` — requests permission, persists, arms timeout
- `cancelReminder()` — clears localStorage + timeout
- Auto-arms on mount if `pendingReminder` is in the future

---

### 4. Session-complete reward screen + progress tracking [x]

**Goal:** Celebrate completing all pomodoros and show weekly/monthly stats.

**Completion screen (`SessionComplete.tsx`):**
- Shown when all cycles finish (currently just resets timer).
- Animated congratulations message.
- Summary: cycles completed, total focus minutes.
- "Remind me" widget (feeds into feature 3).
- "Start another session" CTA → back to `/`.

**Progress tracking:**
- Store each completed session in localStorage as `completedSessions: Array<{ date: ISO string, cycles: number, focusMinutes: number }>`.
- Compute weekly (last 7 days) and monthly (current calendar month) aggregates in a `useProgress.ts` hook.
- Display a simple stats card on the completion screen: pomodoros this week / this month, total focus time.
- Optionally surface a mini-stats widget on the main session page (collapsed by default).

**New files:**
- `src/pages/SessionComplete.tsx`
- `src/hooks/useProgress.ts`
- `src/hooks/useSessionReminder.ts`

---

### 5. Task planner — progressive disclosure [ ]

**Goal:** Introduce Pomodoro-style task planning only after the user has established a habit, so it never blocks the instant-start experience for new users.

**Progressive disclosure sequence:**
1. **Week 0–1 (instant start)** — no task UI shown anywhere; user builds the core habit.
2. **Week 1+ (notification habit)** — reminder system activates, user is returning regularly.
3. **Week 1+ unlock** — planner feature auto-unlocks after 7 days of recorded sessions; a one-time prompt invites them to try it.

**Planner feature (once unlocked):**
- Optional "Plan your session" step shown before the timer starts — fully skippable with one keypress / click.
- User adds tasks and estimates pomodoro count per task.
- During short breaks, a dismissible card asks "what did you just finish?" and "what's next?" — auto-dismisses after 30 seconds so rest isn't blocked.
- Completion screen shows actuals vs estimates, closing the feedback loop.

**Toggle:**
- Settings page exposes a manual on/off toggle for the planner (default: off).
- Auto-unlock writes `plannerUnlocked: true` to localStorage after `completedSessions` spans ≥ 7 distinct calendar days.
- Once manually toggled, the auto-unlock logic no longer overrides the user's choice.

**Estimation tracking (feeds into feature 4 progress stats):**
- Each task stores `{ name, estimatedPomodoros, actualPomodoros }`.
- `useProgress.ts` surfaces average estimation error over time so users can improve their forecasting.

**New files:**
- `src/components/TaskPlanner.tsx` — pre-session task list
- `src/components/BreakCheckIn.tsx` — mid-break task card
- `src/hooks/useTasks.ts` — task CRUD + estimation tracking, persisted to localStorage
- `src/hooks/usePlannerUnlock.ts` — checks 7-day threshold, manages auto-unlock state

---

## Feature Sequencing Philosophy

Features are ordered to match user commitment level:

| Stage | Feature | User ask |
|-------|---------|----------|
| Day 1 | Instant session start | Nothing — just click |
| Day 1+ | Completion screen + stats | Finish a session |
| Day 2+ | Notification reminders | Grant notification permission |
| Day 7+ | Task planner (auto-unlocked) | Invest in planning |

Never gate the core timer behind any of these. Each feature is layered on top of a working foundation and is independently skippable.

---

## Audio Resilience — Test Cases [x]

Browser focus/blur events can suspend or kill HTML5 Audio playback. These cases must have test coverage.

**Scenarios to cover in `src/__tests__/useAudioPlayer.test.ts`:**

| # | Scenario | Expected behaviour |
|---|----------|--------------------|
| 1 | Tab loses focus mid-phase | Audio continues uninterrupted |
| 2 | Tab regains focus after background | Audio is still playing at correct position |
| 3 | OS-level focus loss (alt-tab, lock screen) | Same as tab blur — no interruption |
| 4 | Browser minimised for full phase duration | On restore, timer has advanced correctly and audio is in sync |
| 5 | Page visibility changes to `hidden` then `visible` | Audio resumes; timer did not drift |
| 6 | Audio suspended by browser (autoplay policy on re-focus) | `play()` is re-called on `visibilitychange` → `visible`; no double-play |
| 7 | Multiple rapid focus/blur cycles | No duplicate audio elements created; single source of truth |
| 8 | Firefox: tab switched away mid-phase | Audio continues; Firefox aggressively throttles background tabs so `visibilitychange` must be the recovery trigger, not `blur` |
| 9 | Firefox: browser window loses focus to OS | Same recovery path; confirm no double-play on re-focus |
| 10 | Android Chrome: user switches to another app | `visibilitychange → hidden` fires; audio should continue if OS permits, recover on `visible` |
| 11 | Android Chrome: screen locked mid-session | Audio paused by OS; on unlock `visibilitychange → visible` fires `play()` to resume |
| 12 | Android Firefox: switching away then returning | Same as Android Chrome but Firefox may fire `pagehide`/`pageshow` instead — handle both event pairs |
| 13 | Mobile: another app plays audio (e.g. phone call) | `play()` rejected with `NotAllowedError`; catch and retry once on next `visibilitychange` |

**Implementation note:** Use `document.addEventListener('visibilitychange', ...)` in `useAudioPlayer.ts` to re-call `audio.play()` when `document.visibilityState === 'visible'` and the phase is active. Guard with a `isPlaying` ref to prevent double-play. Do **not** rely on `window.blur` / `window.focus` — these are unreliable on mobile and Firefox. On mobile, also listen for `pagehide`/`pageshow` as a fallback for browsers that don't consistently fire `visibilitychange`.

Tests should mock `document.visibilityState` and dispatch synthetic `visibilitychange` and `pageshow` events rather than relying on real browser focus. Tag browser-specific cases with a comment noting the engine quirk being guarded against.
