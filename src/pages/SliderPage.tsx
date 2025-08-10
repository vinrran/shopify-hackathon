import InfiniteSlider from '../components/InfiniteSlider'
import LoadingImagesSlider from '../components/LoadingImagesSlider'

export function SliderPage() {
  const loadingImages = [
    'https://res.cloudinary.com/dttko4svl/image/upload/v1754791508/loading1_itvguf.png',
    'https://res.cloudinary.com/dttko4svl/image/upload/v1754791509/loading2_e84zay.png',
    'https://res.cloudinary.com/dttko4svl/image/upload/v1754791509/loading3_wxa3dv.png',
    'https://res.cloudinary.com/dttko4svl/image/upload/v1754791509/loading4_mbcy1n.png',
  ]

  return (
  <div className="min-h-screen flex flex-col px-4 py-6 bg-[linear-gradient(to_bottom,#1A0051_0%,#3A00B7_50%,#1A0051_100%)]">
      {/* Top image slider */}
      <div className="flex-shrink-0 pb-4">
        <LoadingImagesSlider images={loadingImages} direction="right" />
      </div>

      {/* Center content (text marquees) */}
      <div className="flex-1 flex flex-col justify-center gap-4">
      {/* Text marquees (staggered) */}
      <InfiniteSlider
        durationSeconds={50}
        gap={36}
        direction="right"
        pauseOnHover={false}
        duplicates={10}
  className="mx-auto h-16 flex items-center"
  itemClassName="text-2xl sm:text-3xl font-semibold whitespace-nowrap px-6 leading-tight justify-center text-[#C8B3FF]"
      >
        {[
          'asnwer!',
          'Njiojioj',
          'Ljiect items',
          'Ratshoppers',
          'Securckout',
        ].map((msg, i) => (
          <span key={`marquee-a-${i}`}>{msg}</span>
        ))}
      </InfiniteSlider>
      <InfiniteSlider
        durationSeconds={50}
        gap={36}
        direction="right"
        pauseOnHover={false}
        duplicates={10}
  className="mx-auto h-16 flex items-center infinite-slider--delay-half"
  itemClassName="text-2xl sm:text-3xl font-semibold whitespace-nowrap px-6 leading-tight justify-center text-[#C8B3FF]"
      >
        {[
          'afdwfasr',
          'Njiojioj',
          'awfwaf',
          'Ratshoppers',
          'feijfesjfie',
        ].map((msg, i) => (
          <span key={`marquee-b-${i}`}>{msg}</span>
        ))}
      </InfiniteSlider>
      </div>
      {/* Bottom image slider */}
  <div className="flex-shrink-0 pt-4 pb-10">
        <LoadingImagesSlider images={loadingImages} direction="left" />
      </div>
    </div>
  )
}

export default SliderPage
