import { useEffect } from 'react'
import { useApp } from '../context/AppContext'

interface LoadingScreenProps {
  className?: string
}

export function LoadingScreen({ 
  className = ''
}: LoadingScreenProps) {
  const tarotImages = [
    'https://res.cloudinary.com/dttko4svl/image/upload/v1754791509/loading3_wxa3dv.png',
    'https://res.cloudinary.com/dttko4svl/image/upload/v1754791509/loading4_mbcy1n.png',
    'https://res.cloudinary.com/dttko4svl/image/upload/v1754791509/loading2_e84zay.png',
    'https://res.cloudinary.com/dttko4svl/image/upload/v1754791508/loading1_itvguf.png',
    'https://res.cloudinary.com/dttko4svl/image/upload/v1754791509/loading2_e84zay.png',
    'https://res.cloudinary.com/dttko4svl/image/upload/v1754791509/loading3_wxa3dv.png'
  ]
  const animationDelays = ['0.7s', '0.6s', '0.5s', '0.4s', '0.3s', '0.2s']

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-10 bg-[linear-gradient(to_bottom,#1A0051_0%,#3A00B7_50%,#1A0051_100%)] ${className}`}>
      <div className="relative h-[280px] w-[130px] -mt-[30px]">
        {tarotImages.map((imageUrl, index) => (
          <div
            key={index}
            className="absolute origin-[50%_125%] animate-spin-and-exit"
            style={{
              animationDelay: animationDelays[index],
            }}
          >
            <div className="relative h-[160px] w-[120px] bg-white rounded-[15%] border border-orange-300 shadow-[0_4px_10px_rgba(0,0,0,0.15)] overflow-hidden">
              <img
                src={imageUrl}
                alt={`Tarot Card ${index + 1}`}
                className="w-full h-full object-cover select-none pointer-events-none block rounded-[15%]"
                draggable={false}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function CardLoadingPage() {
  const { dispatch } = useApp()

  // Auto-advance to fan view after the animation
  useEffect(() => {
    const t = setTimeout(() => {
      dispatch({ type: 'SET_SCREEN', payload: 'fan' })
    }, 2500)
    return () => clearTimeout(t)
  }, [dispatch])

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom,#1A0051_0%,#3A00B7_50%,#1A0051_100%)] flex items-center justify-center">
      <LoadingScreen />
    </div>
  )
}

export default CardLoadingPage
