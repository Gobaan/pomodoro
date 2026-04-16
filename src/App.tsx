import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Welcome } from './pages/Welcome'
import { MusicSetup } from './pages/MusicSetup'
import { SessionConfigPage } from './pages/SessionConfig'
import { SessionPlayer } from './pages/SessionPlayer'
import { AudioTest } from './pages/AudioTest'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/setup" element={<MusicSetup />} />
        <Route path="/config" element={<SessionConfigPage />} />
        <Route path="/player" element={<SessionPlayer />} />
        <Route path="/test" element={<AudioTest />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
