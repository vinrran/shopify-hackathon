import InfiniteSlider from '../components/InfiniteSlider'

export function SliderPage() {
  const loadingImages = [
    'https://res.cloudinary.com/dttko4svl/image/upload/v1754791508/loading1_itvguf.png',
    'https://res.cloudinary.com/dttko4svl/image/upload/v1754791509/loading2_e84zay.png',
    'https://res.cloudinary.com/dttko4svl/image/upload/v1754791509/loading3_wxa3dv.png',
    'https://res.cloudinary.com/dttko4svl/image/upload/v1754791509/loading4_mbcy1n.png',
  ]

  return (
    <div className="pt-12 px-4 pb-6 space-y-8">
      {/* Image slider (top, scrolling right) */}
      <InfiniteSlider
        durationSeconds={40}
        gap={32}
        pauseOnHover={false}
        duplicates={12}
        direction="right"
        className="mx-auto"
        itemClassName="flex items-center justify-center overflow-visible"
      >
        {loadingImages.map((src, i) => (
          <img
            key={`top-${i}`}
            src={src}
            alt={`Loading state ${i + 1}`}
            loading="lazy"
            className="select-none h-20 sm:h-24 w-auto object-contain"
            draggable={false}
          />
        ))}
      </InfiniteSlider>

      {/* Text marquee (middle) */}
      <InfiniteSlider
        durationSeconds={50}
        gap={64}
        direction="right"
        pauseOnHover={false}
        duplicates={10}
        className="mx-auto py-4 bg-white/70 backdrop-blur-sm"
        itemClassName="text-base sm:text-lg font-medium whitespace-nowrap px-8 min-h-[2rem]"
      >
        {[
          'asnwer!',
          'Njiojioj',
          'Ljiect items',
          'Ratshoppers',
          'Securckout',
        ].map((msg, i) => (
          <span key={`marquee-${i}`}>{msg}</span>
        ))}
      </InfiniteSlider>

      {/* Image slider (bottom, scrolling left) */}
      <InfiniteSlider
        durationSeconds={40}
        gap={32}
        pauseOnHover={false}
        duplicates={12}
        direction="left"
        className="mx-auto"
        itemClassName="flex items-center justify-center overflow-visible"
      >
        {loadingImages.map((src, i) => (
          <img
            key={`bottom-${i}`}
            src={src}
            alt={`Loading state ${i + 1}`}
            loading="lazy"
            className="select-none h-20 sm:h-24 w-auto object-contain"
            draggable={false}
          />
        ))}
      </InfiniteSlider>
    </div>
  )
}

export default SliderPage
