import { useCallback } from 'react'

/**
 * Returns a `ping()` function that plays a 3-tone bell using the Web Audio API.
 * No external audio files required.
 */
export function usePing() {
  const ping = useCallback(() => {
    try {
      const ctx = new AudioContext()
      const tones = [523, 659, 784] // C5, E5, G5

      tones.forEach((freq, i) => {
        const oscillator = ctx.createOscillator()
        const gain = ctx.createGain()

        oscillator.connect(gain)
        gain.connect(ctx.destination)

        oscillator.type = 'sine'
        oscillator.frequency.value = freq

        const start = ctx.currentTime + i * 0.18
        const end = start + 0.4

        gain.gain.setValueAtTime(0, start)
        gain.gain.linearRampToValueAtTime(0.3, start + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, end)

        oscillator.start(start)
        oscillator.stop(end)
        oscillator.onended = () => {
          if (i === tones.length - 1) ctx.close()
        }
      })
    } catch {
      // AudioContext may be unavailable in some environments; silently ignore
    }
  }, [])

  return ping
}
