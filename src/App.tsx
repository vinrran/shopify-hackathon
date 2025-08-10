
import { Routes, Route } from 'react-router'
import { useEffect, useState, useCallback } from 'react'
import { SliderPage } from './pages'
import { QuizPage } from './pages/QuizPage'
import { LandingPage } from './pages/LandingPage'
import { FanCarouselPage } from './pages/FanCarouselPage'
import { CardLoadingPage } from './pages/CardLoadingPage'
import { AppProvider } from './context/AppContext'
import bg from './components/background.svg'

export function App() {
  const links = [
    { to: '/', label: 'Home' },
    { to: '/slider', label: 'Slider' },
    { to: '/fan', label: 'Fan Carousel' },
    { to: '/card-loading', label: 'Card Loading' },
    { to: '/quiz', label: 'Quiz' },
  ]

  const [path, setPath] = useState(() => window.location.pathname || '/')

  // Basic popstate listener so React Router (provided by MinisRouter) updates
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname || '/')
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // Navigate using history API (Minis host can also intercept if needed)
  const navigate = useCallback((to: string) => {
    if (to !== window.location.pathname) {
      window.history.pushState({}, '', to)
      // manually trigger listeners
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }, [])

  const isLanding = path === '/'

  return (
    <div className="min-h-screen flex flex-col relative" style={isLanding ? undefined : { backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}>
      <nav className="sticky top-0 z-10 flex flex-wrap gap-2 items-center px-4 py-3 bg-white/60 backdrop-blur border-b text-sm">
        {links.map(l => {
          const active = path === l.to
          return (
            <button
              key={l.to}
              onClick={() => navigate(l.to)}
              className={[
                'px-3 py-1 rounded transition-colors font-medium',
                active ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'
              ].join(' ')}
              type="button"
            >
              {l.label}
            </button>
          )
        })}
      </nav>

  <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/slider" element={<SliderPage />} />
          <Route path="/fan" element={<FanCarouselPage />} />
          <Route path="/card-loading" element={<CardLoadingPage />} />
          <Route
            path="/quiz"
            element={
              <AppProvider>
                <QuizPage />
              </AppProvider>
            }
          />
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </main>
    </div>
  )
}
