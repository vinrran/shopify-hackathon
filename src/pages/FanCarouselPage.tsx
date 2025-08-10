import { useMemo, useState } from 'react'
import { useProducts } from '@shopify/shop-minis-react'
import CardFanCarousel from '../components/CardFanCarousel'
import LoadingScreen from '../components/LoadingScreen'
import { useApp } from '../context/AppContext'

export function FanCarouselPage() {
  const { state } = useApp()

  // Build Shopify product GIDs from ranked list to hydrate
  const ids = useMemo(
    () => (state.ranked || []).map(r => r.product_id?.startsWith('gid://shopify/Product/') ? r.product_id : `gid://shopify/Product/${r.product_id}`),
    [state.ranked]
  )

  const { products, loading, error } = useProducts({ ids })
  const [devLoading, setDevLoading] = useState(false)

  const hydrated = Array.isArray(products) ? products : []
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
      ) : error ? (
        <div className="text-sm text-red-600">Failed to load products.</div>
      ) : (
        <CardFanCarousel products={hydrated} />
      )}
    </div>
  )
}
