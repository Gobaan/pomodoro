import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SessionPlayer } from './pages/SessionPlayer'
import { Settings } from './pages/Settings'
import { About } from './pages/About'
import { History } from './pages/History'
import { AudioTest } from './pages/AudioTest'

export default function App() {
  return (
    <BrowserRouter basename="/flowbeats">
      <Routes>
        <Route path="/" element={<SessionPlayer />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/about" element={<About />} />
        <Route path="/history" element={<History />} />
        <Route path="/test" element={<AudioTest />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
