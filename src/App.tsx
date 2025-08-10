import {SliderPage} from './pages'
import {QuizPage} from './pages/QuizPage'
import {AboutPage} from './pages/AboutPage'
import {ProductsPage} from './pages/ProductsPage'
import {FanCarouselPage} from './pages/FanCarouselPage'
import {CardLoadingPage} from './pages/CardLoadingPage'
import {useEffect, useState} from 'react'
import {AppProvider} from './context/AppContext'

export function App() {
  const [route, setRoute] = useState<string>(() => window.location.hash.slice(1) || 'about')

  useEffect(() => {
  const onHash = () => setRoute(window.location.hash.slice(1) || 'about')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const Page = (() => {
    switch (route) {
      case 'about':
        return AboutPage
      case 'products':
        return ProductsPage
      case 'slider':
        return SliderPage
      case 'quiz':
        return QuizPage
      case 'fan':
        return FanCarouselPage
      case 'card-loading':
        return CardLoadingPage
      default:
        return AboutPage
    }
  })()

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="sticky top-0 z-10 flex gap-4 items-center px-4 py-3 bg-white/80 backdrop-blur border-b text-sm">
        {[
          {to: 'slider', label: 'Slider'},
          {to: 'fan', label: 'Fan Carousel'},
          {to: 'card-loading', label: 'Card Loading'},
          {to: 'products', label: 'Products'},
          {to: 'quiz', label: 'Quiz'},
          {to: 'about', label: 'About'},
        ].map(link => (
          <a
            key={link.to}
            href={`#${link.to}`}
            className={[
              'px-3 py-1 rounded transition-colors',
              route === link.to ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700',
            ].join(' ')}
          >
            {link.label}
          </a>
        ))}
      </nav>
      <main className="flex-1">
        {route === 'quiz' ? (
          <AppProvider>
            <QuizPage />
          </AppProvider>
        ) : (
          <Page />
        )}
      </main>
    </div>
  )
}
