// Corrected relative path to SVG (LandingPage is in pages/, asset is in components/)
import divination from '../components/divination.svg'
import { useCallback } from 'react'

export function LandingPage() {
  const handleStart = useCallback(() => {
    if (window.location.pathname !== '/quiz') {
      window.history.pushState({}, '', '/quiz')
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }, [])
  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Full-screen SVG background */}
      <div className="absolute inset-0 w-full h-full">
        <img 
          src={divination}
          alt="Shopify Divination Landing Page"
          className="w-full h-full object-cover object-center"
          style={{
            filter: 'drop-shadow(0 0 20px rgba(139, 69, 193, 0.3))'
          }}
          onError={(e) => {
            // Fallback if SVG doesn't load
            console.error('Failed to load SVG:', e)
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
          }}
        />
      </div>
      
      {/* GET STARTED Button Overlay - positioned above the line, below "What will you foresee today?" */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-116">
        <button
          onClick={handleStart}
          className="bg-transparent touch-button transition-all duration-300 hover:bg-purple-500/20 active:scale-95 active:bg-purple-500/30 flex items-center justify-center"
          style={{
            width: '243px',
            height: '41px',
            borderRadius: '40px',
            border: '2px solid rgba(107, 81, 255, 0.75)',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.25)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
          }}
        >
          <span 
            className="uppercase"
            style={{
              fontFamily: 'Castoro Titling, serif',
              fontSize: '20px',
              fontWeight: 400,
              letterSpacing: '0.6px', // 3% of 20px
              textAlign: 'center',
              color: '#FFCD61'
            }}
          >Get Started</span>
        </button>
      </div>
      
      {/* Optional subtle overlay to ensure button visibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
    </div>
  )
}
