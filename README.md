# Pomodoro Binaural Music Generator

A web app that guides Pomodoro work sessions using binaural beats and ambient audio — no ads, no accounts, runs entirely in your browser.

**Live:** https://gobaan.com/pomodoro

## Features

- **Pomodoro timer** — configurable focus/break durations and cycle count
- **Binaural beats** — phase-matched Alpha (warm-up/cool-down), Beta (focus), Theta (breaks) generated via Web Audio API; requires stereo headphones
- **Ambient audio** — Brown noise for focus, rainfall for breaks, or soft piano/orchestral melodies; adjustable volume
- **Seamless transitions** — crossfades between phases, no clicks or gaps
- **Offline-capable** — all audio generated in-browser or served locally; no external streams

## Binaural Beat Frequencies

| Phase | Band | Frequency | Effect |
|-------|------|-----------|--------|
| Warm-up / Cool-down | Alpha | 10 Hz | Calm, relaxed alertness |
| Focus | Beta | 18 Hz | Active concentration |
| Short / Long break | Theta | 6 Hz | Deep relaxation, recovery |

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS v4
- Web Audio API — binaural beat oscillators, brown noise, rainfall synthesis, dynamics compression
- HTML5 Audio API — melody track playback

## Dev

```bash
npm install
npm run dev      # http://localhost:5173/pomodoro/
npm run build
npm run preview
```

## Audio Credits

### Melody tracks — CC BY 4.0

**"Compassion (keys version)"** and **"Decompress"** by **Lee Rosevere**  
From the album *Music For Podcasts - Serious*  
[freemusicarchive.org/music/lee-rosevere](https://freemusicarchive.org/music/lee-rosevere)  
Licensed under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)

## License

MIT
