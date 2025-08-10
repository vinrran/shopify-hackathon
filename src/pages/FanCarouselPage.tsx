import { usePopularProducts } from '@shopify/shop-minis-react'
import CardFanCarousel from '../components/CardFanCarousel'
import LoadingScreen from '../components/LoadingScreen'
import { useEffect } from 'react'

export function FanCarouselPage() {
  const hookResult = usePopularProducts?.() as { products?: any[] | null; loading?: boolean } | undefined
  const products = (hookResult?.products ?? []) as any[]
  const loading = hookResult?.loading ?? true
  const showLoading = loading

  // Lock body scroll while this page is mounted (assumes no nav bar)
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [])

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col items-center justify-start bg-white">
      <div className="flex-1 w-full flex flex-col items-center justify-start">
        {showLoading ? (
          <LoadingScreen />
        ) : (
          <CardFanCarousel products={products} />
        )}
      </div>
    </div>
  )
}
