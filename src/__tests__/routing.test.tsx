import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

vi.mock('../pages/SessionPlayer', () => ({
  SessionPlayer: () => <div data-testid="session-player">SessionPlayer</div>,
}))
vi.mock('../pages/Settings', () => ({
  Settings: () => <div data-testid="settings">Settings</div>,
}))
vi.mock('../pages/About', () => ({
  About: () => <div data-testid="about">About</div>,
}))
vi.mock('../pages/AudioTest', () => ({
  AudioTest: () => <div data-testid="audio-test">AudioTest</div>,
}))

const originalPath = window.location.pathname

afterEach(() => {
  window.history.pushState({}, '', originalPath)
})

describe('App routing with basename /flowbeats', () => {
  it('renders SessionPlayer at /flowbeats/', () => {
    window.history.pushState({}, '', '/flowbeats/')
    render(<App />)
    expect(screen.getByTestId('session-player')).toBeInTheDocument()
  })

  it('renders SessionPlayer for old /flowbeats/player — Android resume deep-link still lands correctly', () => {
    window.history.pushState({}, '', '/flowbeats/player')
    render(<App />)
    expect(screen.getByTestId('session-player')).toBeInTheDocument()
  })

  it('renders Settings at /flowbeats/settings', () => {
    window.history.pushState({}, '', '/flowbeats/settings')
    render(<App />)
    expect(screen.getByTestId('settings')).toBeInTheDocument()
  })

  it('renders About at /flowbeats/about', () => {
    window.history.pushState({}, '', '/flowbeats/about')
    render(<App />)
    expect(screen.getByTestId('about')).toBeInTheDocument()
  })

  it('redirects unknown paths within /flowbeats to SessionPlayer', () => {
    window.history.pushState({}, '', '/flowbeats/unknown-route')
    render(<App />)
    expect(screen.getByTestId('session-player')).toBeInTheDocument()
  })
})
