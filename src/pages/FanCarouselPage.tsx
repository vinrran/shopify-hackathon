import { useState } from 'react'
import { usePopularProducts } from '@shopify/shop-minis-react'
import CardFanCarousel from '../components/CardFanCarousel'
import LoadingScreen from '../components/LoadingScreen'

export function FanCarouselPage() {
  const hookResult = usePopularProducts?.() as { products?: any[] | null; loading?: boolean } | undefined
  const products = (hookResult?.products ?? []) as any[]
  const loading = hookResult?.loading ?? true
  const [devLoading, setDevLoading] = useState(false)

  const showLoading = loading || devLoading

  return (
    <div className="relative max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Popular Products</h2>
        <button
          onClick={() => setDevLoading(l => !l)}
          className={`text-xs px-3 py-1.5 rounded border transition-colors ${devLoading ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700'}`}
          title="Toggle simulated loading state"
        >
          {devLoading ? 'Stop Loading' : 'Simulate Loading'}
        </button>
      </div>

      {showLoading ? (
        <LoadingScreen />
      ) : (
        <CardFanCarousel products={products} />
      )}
    </div>
  )
}
