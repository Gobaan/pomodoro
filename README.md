# FlowBeats — Binaural Focus Timer

A browser-based focus timer that uses scientifically-tuned binaural beats to guide your brain through structured work sessions — no ads, no accounts, no installs.

**Live:** https://gobaan.com/pomodoro

## Features

- **Binaural beats** — phase-matched Alpha (warm-up/cool-down), Beta (focus), Theta (breaks) generated via Web Audio API; requires stereo headphones
- **Structured focus sessions** — configurable work/break durations and cycle count
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
