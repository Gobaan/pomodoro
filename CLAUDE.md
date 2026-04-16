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
