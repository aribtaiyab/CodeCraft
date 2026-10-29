import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Navigation } from './components'
import {
  LandingPage,
  CodeStudioPage,
  AITestLabPage,
  LearnPage,
  NotFoundPage,
} from './pages'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navigation />
        <main className="app-shell__main">
          <Routes>
            <Route path="/"        element={<LandingPage />} />
            <Route path="/studio"  element={<CodeStudioPage />} />
            <Route path="/testlab" element={<AITestLabPage />} />
            <Route path="/learn"   element={<LearnPage />} />
            <Route path="*"        element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
