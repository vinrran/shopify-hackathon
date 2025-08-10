
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
    <div className="w-screen h-screen overflow-hidden flex flex-col items-center justify-start bg-white">
      <div className="flex-1 w-full flex flex-col items-center justify-start">
        {showLoading ? (
          <LoadingScreen />
        ) : (
          <CardFanCarousel products={products} />
        )}
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
