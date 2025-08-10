import {usePopularProducts, ProductCard} from '@shopify/shop-minis-react'
import InfiniteSlider from '../components/InfiniteSlider'

export function SliderPage() {
  const {products} = usePopularProducts()

  return (
    <div className="pt-12 px-4 pb-6 space-y-8">
      
      {/* Text marquee style infinite slider */}
      <InfiniteSlider
        durationSeconds={50}
        gap={64}
        direction="right"
        pauseOnHover={false}
        duplicates={10}
        className="mx-auto border-y py-4 bg-white/70 backdrop-blur-sm"
        itemClassName="text-base sm:text-lg font-medium whitespace-nowrap px-8 min-h-[2rem]"
      >
        {[
          'Free shipping over $50',
          'New arrivals dropping weekly',
          'Limited time: 20% off select items',
          'Rated 5⭐ by shoppers',
          'Secure checkout',
        ].map((msg, i) => (
          <span key={i}>{msg}</span>
        ))}
      </InfiniteSlider>

      {/* Product cards slider */}
      <InfiniteSlider
        durationSeconds={80}
        gap={20}
        pauseOnHover={false}
        duplicates={10}
        direction="right"
        className="mx-auto"
        itemClassName="w-36 h-36 flex items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm"
      >
        {products?.map(product => (
          <div className="w-full h-full flex items-center justify-center pointer-events-none" key={product.id}>
            <ProductCard product={product} variant="compact" />
          </div>
        ))}
      </InfiniteSlider>

      
    </div>
  )
}

export default SliderPage
