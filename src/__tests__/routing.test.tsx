import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

vi.mock('../pages/Welcome', () => ({
  Welcome: () => <div data-testid="welcome">Welcome</div>,
}))
vi.mock('../pages/MusicSetup', () => ({
  MusicSetup: () => <div data-testid="music-setup">MusicSetup</div>,
}))
vi.mock('../pages/SessionConfig', () => ({
  SessionConfigPage: () => <div data-testid="session-config">SessionConfig</div>,
}))
vi.mock('../pages/SessionPlayer', () => ({
  SessionPlayer: () => <div data-testid="session-player">SessionPlayer</div>,
}))
vi.mock('../pages/AudioTest', () => ({
  AudioTest: () => <div data-testid="audio-test">AudioTest</div>,
}))

const originalPath = window.location.pathname

afterEach(() => {
  window.history.pushState({}, '', originalPath)
})

describe('App routing with basename /flowbeats', () => {
  it('renders Welcome at /flowbeats/', () => {
    window.history.pushState({}, '', '/flowbeats/')
    render(<App />)
    expect(screen.getByTestId('welcome')).toBeInTheDocument()
  })

  it('renders SessionPlayer at /flowbeats/player — the broken route on Android focus resume', () => {
    // This is the URL Android reloads when resuming from background.
    // Without basename="/flowbeats", the router sees /flowbeats/player, matches no route,
    // and the catch-all redirects to / (outside the app).
    window.history.pushState({}, '', '/flowbeats/player')
    render(<App />)
    expect(screen.getByTestId('session-player')).toBeInTheDocument()
  })

  it('renders MusicSetup at /flowbeats/setup', () => {
    window.history.pushState({}, '', '/flowbeats/setup')
    render(<App />)
    expect(screen.getByTestId('music-setup')).toBeInTheDocument()
  })

  it('renders SessionConfig at /flowbeats/config', () => {
    window.history.pushState({}, '', '/flowbeats/config')
    render(<App />)
    expect(screen.getByTestId('session-config')).toBeInTheDocument()
  })

  it('redirects unknown paths within /flowbeats to Welcome', () => {
    window.history.pushState({}, '', '/flowbeats/unknown-route')
    render(<App />)
    expect(screen.getByTestId('welcome')).toBeInTheDocument()
  })
})
