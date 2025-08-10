import React from 'react'
import { ProductCard as MiniProductCard } from '@shopify/shop-minis-react'

// Keep old prop names optional to avoid breaking callers.
// We ignore extra props (e.g., isFrozen/onToggleFreeze) but you can
// layer your own badges around <MiniProductCard /> if you want.
type Props = {
  product: any
  rank?: number
  isFrozen?: boolean
  onToggleFreeze?: (id: string) => void
}

export function ProductCard({ product, rank }: Props) {
  return (
    <div className="relative">
      {typeof rank === 'number' && (
        <div className="absolute right-3 top-3 z-10 bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
          #{rank}
        </div>
      )}
      {/* Use Shopify's global ProductCard so price/vendor/url/navigation are correct */}
      <MiniProductCard product={product} />
    </div>
  )
}

export default ProductCard
