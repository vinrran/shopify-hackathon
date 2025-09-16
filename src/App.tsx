
import { Routes, Route } from 'react-router'
import { useEffect, useState } from 'react'
import { SliderPage } from './pages'
import { LandingPage } from './pages/LandingPage'
import { ProductsPage } from './pages/ProductsPage'
import { FanCarouselPage } from './pages/FanCarouselPage'
import { CardLoadingPage } from './pages/CardLoadingPage'
import { AppProvider } from './context/AppContext'
import bg from './components/background.svg'
import { MainFlow } from './components/MainFlow'
import { DevShareButton } from './components/DevShareButton'

export function App() {
  // Navbar removed per design request

  const [path, setPath] = useState(() => window.location.pathname || '/')

  // Basic popstate listener so React Router (provided by MinisRouter) updates
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname || '/')
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // Preload SliderPage assets (images) on app start to eliminate first-render delay
  useEffect(() => {
    const sliderImages = [
      'https://res.cloudinary.com/dttko4svl/image/upload/v1754791508/loading1_itvguf.png',
      'https://res.cloudinary.com/dttko4svl/image/upload/v1754791509/loading2_e84zay.png',
      'https://res.cloudinary.com/dttko4svl/image/upload/v1754791509/loading3_wxa3dv.png',
      'https://res.cloudinary.com/dttko4svl/image/upload/v1754791509/loading4_mbcy1n.png',
    ]
    const tags: HTMLImageElement[] = []
    for (const src of sliderImages) {
      const img = new Image()
      img.src = src
      tags.push(img)
    }
    return () => {
      // cleanup references
      tags.splice(0, tags.length)
    }
  }, [])

  const isLanding = path === '/'

  return (
    <div className="min-h-screen flex flex-col relative" style={isLanding ? undefined : { backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}>
      {/* Navbar removed */}

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/slider" element={<SliderPage />} />
          <Route path="/fan" element={<FanCarouselPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/card-loading" element={<CardLoadingPage />} />
          <Route
            path="/quiz"
            element={
              <AppProvider>
                <MainFlow  />
              </AppProvider>
            }
          />
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </main>

      {/* Global Dev Share Button - Only show in development */}
      {process.env.NODE_ENV === 'development' && <DevShareButton />}
    </div>
  )
}
