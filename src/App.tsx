
import { Routes, Route } from 'react-router'
import { useEffect, useState } from 'react'
import { SliderPage, SharePage } from './pages'
import { LandingPage } from './pages/LandingPage'
import { ProductsPage } from './pages/ProductsPage'
import { FanCarouselPage } from './pages/FanCarouselPage'
import { CardLoadingPage } from './pages/CardLoadingPage'
import { AppProvider } from './context/AppContext'
import bg from './components/background.svg'
import { MainFlow } from './components/MainFlow'

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
      "https://res.cloudinary.com/dpbxtwdok/image/upload/v1758901911/sun_rtdf2h.png",
      "https://res.cloudinary.com/dpbxtwdok/image/upload/v1758901915/star_zrazzv.png", 
      "https://res.cloudinary.com/dpbxtwdok/image/upload/v1758901919/moon_xdylgn.png",
      "https://res.cloudinary.com/dpbxtwdok/image/upload/v1758901915/star_zrazzv.png"
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
          <Route path="/share" element={<SharePage />} />
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
    </div>
  )
}
