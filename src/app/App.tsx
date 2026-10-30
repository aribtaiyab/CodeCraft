// ============================================================================
// CodeCraft Application Shell & Route Declarations
// ============================================================================

import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Navigation, Spinner } from '../components'
import { LandingPage } from '../features/LandingPage/LandingPage'
import { NotFoundPage } from '../features/NotFoundPage/NotFoundPage'

// Lazy-load heavy workspaces containing Monaco Editor and Assessment Runner
const CodeStudioPage = lazy(() =>
  import('../features/CodeStudioPage/CodeStudioPage').then((m) => ({
    default: m.CodeStudioPage,
  }))
)
const AITestLabPage = lazy(() =>
  import('../features/AITestLabPage/AITestLabPage').then((m) => ({
    default: m.AITestLabPage,
  }))
)
const LearnPage = lazy(() =>
  import('../features/LearnPage/LearnPage').then((m) => ({
    default: m.LearnPage,
  }))
)

function PageLoader() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
      }}
    >
      <Spinner size="lg" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navigation />
        <main className="app-shell__main">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/studio" element={<CodeStudioPage />} />
              <Route path="/testlab" element={<AITestLabPage />} />
              <Route path="/test-lab" element={<AITestLabPage />} />
              <Route path="/learn" element={<LearnPage />} />
              <Route path="/progress" element={<LearnPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  )
}
