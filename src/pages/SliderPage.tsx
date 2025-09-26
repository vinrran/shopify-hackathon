// src/pages/SliderPage.tsx
import { useEffect, useState } from 'react'
import { useProductSearch, useRecommendedProducts } from '@shopify/shop-minis-react'
import { useApp } from '../context/AppContext'
import { api } from '../services/api'
import type { Product, RankedProduct } from '../types'

import InfiniteSlider from '../components/InfiniteSlider'
import LoadingImagesSlider from '../components/LoadingImagesSlider'
import bg from '../components/background.svg'

/**
 * SliderPage (Shop Mini)
 * Phases:
 *  1) search        — useProductSearch across all queries w/ pagination, cache + store
 *  2) recommended   — useRecommendedProducts once, cache + store
 *  3) ranking       — backend builds ranking; hydrate ranked items from cache; go to results
 *
 * UI: Slider-based loading screen (top + bottom image sliders, center text marquees).
 * Hooks and API calls remain exactly the same as before.
 */
interface SliderPageProps { surroundGap?: number }
export function SliderPage({ surroundGap = 30 }: SliderPageProps) {
  const { state, dispatch } = useApp()
  const [phase, setPhase] = useState<'search' | 'recommended' | 'ranking'>('search')
  const [qIndex, setQIndex] = useState(0)

  // Local cache of ALL found products (search + recommended), used to hydrate ranking
  const [accumulated, setAccumulated] = useState<Product[]>([])

  const queries = state.generatedQueries || []
  const currentQuery = queries[qIndex] || ''

  // Build marquee texts from quiz answers
  const marqueeTexts = (() => {
    try {
      const entries = (state.questions || [])
        .map((q: any) => {
          const ans = (state.answers as any)?.[q.id]
          const ansText = typeof ans === 'string' ? ans : ans?.label ?? JSON.stringify(ans)
          return ansText ? `${q.title || q.text || q.prompt || 'Q'}: ${ansText}` : null
        })
        .filter(Boolean) as string[]
      return entries.length > 0 ? entries : ['Preparing your picks', 'Finding your vibe', 'Curating top matches']
    } catch {
      return ['Preparing your picks', 'Finding your vibe', 'Curating top matches']
    }
  })()

  const dedupeById = (list: Product[]) => {
    const seen = new Set<string>()
    return list.filter((p: any) => {
      const id = p?.product_id || p?.id; if (!id || seen.has(id)) return false; seen.add(id); return true
    })
  }
  
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
  const toMapById = (list: Product[]) => {
    const m = new Map<string, Product>(); list.forEach(p => { const id = (p as any)?.product_id || (p as any)?.id; if (id) m.set(id, p) }); return m
  }
  const transformShopifyProduct = (p: any): Product => {
    const image = p?.featuredImage?.url || p?.images?.edges?.[0]?.node?.url || p?.images?.[0]?.url || p?.images?.[0] || ''
    const priceAmount = p?.priceRange?.minVariantPrice?.amount || p?.priceRangeV2?.minVariantPrice?.amount || p?.minPrice || p?.price?.amount || p?.variants?.[0]?.price?.amount || p?.variants?.edges?.[0]?.node?.price?.amount || '0'
    const currencyCode = p?.priceRange?.minVariantPrice?.currencyCode || p?.priceRangeV2?.minVariantPrice?.currencyCode || p?.currency || p?.price?.currencyCode || p?.variants?.[0]?.price?.currencyCode || p?.variants?.edges?.[0]?.node?.price?.currencyCode || 'USD'
    const vendor = p?.vendor || p?.vendorName || p?.brand || p?.merchant?.name || p?.store?.name || 'Unknown'
    const url = p?.onlineStoreUrl || p?.url || p?.webUrl || (p?.handle && p?.store?.domain ? `https://${p.store.domain}/products/${p.handle}` : '')
    return {
      product_id: p?.id || p?.product_id || '',
      title: p?.title || p?.name || '',
      vendor,
      price: String(priceAmount),
      currency: currencyCode,
      url: url || undefined,
      thumbnail_url: image || undefined,
      images: (p?.images?.edges?.map((e: any) => e.node?.url).filter(Boolean)) || (Array.isArray(p?.images) ? p.images : []),
      raw: p
    }
  }

  /** After finishing one query (all pages), merge and store; move to next or to recommended */
  const finishQuery = async (collectedForThisQuery: any[]) => {
    try {
      const transformed = (collectedForThisQuery || []).map(transformShopifyProduct)
      const merged = dedupeById([...accumulated, ...transformed])
      setAccumulated(merged)

      if (qIndex < queries.length - 1) {
        setQIndex((i) => i + 1)
      } else {
        if (merged.length > 0) {
          await api.storeProducts(state.userId, state.today, 'search', merged)
        }
        setPhase('recommended')
      }
    } catch (e) {
      console.error('finishQuery error:', e)
      if (qIndex < queries.length - 1) setQIndex((i) => i + 1)
      else setPhase('recommended')
    }
  }

  const handleRecommendedDone = async (productsFromHook: any[]) => {
    try {
      const transformed = (productsFromHook || []).map(transformShopifyProduct)
      if (transformed.length > 0) {
        setAccumulated((prev) => dedupeById([...prev, ...transformed]))
        await api.storeRecommendedProducts(state.userId, state.today, transformed)
      }
    } catch (e) {
      console.error('processRecommendedProducts error:', e)
    } finally {
      setPhase('ranking')
    }
  }

  // Simply return accumulated products without AI processing
  useEffect(() => {
    if (phase !== 'ranking') return

    const returnSimpleResults = async () => {
      dispatch({ type: 'SET_LOADING', payload: { key: 'buildRanking', value: true } })
      try {
        // Convert accumulated products to ranked format (without actual ranking)
        const hydrated: RankedProduct[] = accumulated.map((product, index) => ({
          ...product,
          rank: index + 1,
          score: 1.0, // All products get same score
          reason: 'Search result' // Simple reason
        }))

        dispatch({ type: 'SET_RANKED', payload: hydrated })
        dispatch({ type: 'SET_HAS_MORE', payload: false }) // No more results since we're showing all
        dispatch({ type: 'SET_SCREEN', payload: 'card' })
      } catch (err) {
        console.error('returnSimpleResults error:', err)
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load products. Please try again.' })
        dispatch({ type: 'SET_SCREEN', payload: 'card' })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: { key: 'buildRanking', value: false } })
        dispatch({ type: 'SET_LOADING', payload: { key: 'fetchRanking', value: false } })
      }
    }

    returnSimpleResults()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // ------- Slider UI while everything runs in the background -------
  //const loadingImages = [
  //  'https://res.cloudinary.com/dttko4svl/image/upload/v1754791508/loading1_itvguf.png',
  //  'https://res.cloudinary.com/dttko4svl/image/upload/v1754791509/loading2_e84zay.png',
  //  'https://res.cloudinary.com/dttko4svl/image/upload/v1754791509/loading3_wxa3dv.png',
  //  'https://res.cloudinary.com/dttko4svl/image/upload/v1754791509/loading4_mbcy1n.png',
  //]
  const loadingImages = [
    "https://res.cloudinary.com/dpbxtwdok/image/upload/v1758901911/sun_rtdf2h.png",
    "https://res.cloudinary.com/dpbxtwdok/image/upload/v1758901915/star_zrazzv.png",
    "https://res.cloudinary.com/dpbxtwdok/image/upload/v1758901919/moon_xdylgn.png",
    "https://res.cloudinary.com/dpbxtwdok/image/upload/v1758901915/star_zrazzv.png"
  ]
  return (
    <div

      className="min-h-screen relative"

      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 flex justify-center">
        <div className="relative w-full">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-stretch">
            {/* Top image slider with adjustable gap below */}
            <div className="w-screen overflow-hidden relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]" style={{ marginBottom: surroundGap }}>
              <LoadingImagesSlider images={loadingImages} direction="right" />
            </div>
            {/* Middle text sliders (centered) */}
            <div className="w-screen overflow-hidden relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] flex flex-col gap-2">
              <InfiniteSlider
                durationSeconds={50}
                gap={36}
                direction="right"
                duplicates={10}
                className="mx-auto h-12 flex items-center"
                itemClassName="text-2xl sm:text-3xl font-semibold whitespace-nowrap px-6 leading-tight justify-center text-[#C8B3FF]"
              >
                {marqueeTexts.map((msg, i) => (
                  <span key={`marquee-a-${i}`}>{msg}</span>
                ))}
              </InfiniteSlider>
              <InfiniteSlider
                durationSeconds={50}
                gap={36}
                direction="right"
                duplicates={10}
                className="mx-auto h-12 flex items-center infinite-slider--delay-half"
                itemClassName="text-2xl sm:text-3xl font-semibold whitespace-nowrap px-6 leading-tight justify-center text-[#C8B3FF]"
              >
                {[...marqueeTexts].reverse().map((msg, i) => (
                  <span key={`marquee-b-${i}`}>{msg}</span>
                ))}
              </InfiniteSlider>
            </div>
            {/* Bottom image slider with adjustable gap above */}
            <div className="w-screen overflow-hidden relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]" style={{ marginTop: surroundGap }}>
              <LoadingImagesSlider images={loadingImages} direction="left" />
            </div>
          </div>
        </div>
      </div>

      {/* Invisible runners for data fetching */}
      {phase === 'search' && !!currentQuery && (
        <SearchStep query={currentQuery} onDone={(items) => finishQuery(items)} onError={() => finishQuery([])} />
      )}
      {phase === 'recommended' && (
        <RecommendedStep onDone={handleRecommendedDone} onError={() => setPhase('ranking')} />
      )}
    </div>
  )
}

/* --------------------------- Phase subcomponents --------------------------- */

function normalizeProductsShape(products: any): any[] {
  if (!products) return []
  if (Array.isArray(products)) return products
  if ((products as any).edges) return (products as any).edges.map((e: any) => e.node)
  if ((products as any).items) return (products as any).items
  if ((products as any).results) return (products as any).results
  return []
}

function SearchStep({
  query,
  onDone,
  onError
}: {
  query: string
  onDone: (products: any[]) => void
  onError: (err: unknown) => void
}) {
  const { products, loading, error, hasNextPage, fetchMore } = useProductSearch({ query, first: 10 })

  const [collected, setCollected] = useState<any[]>([])
  const [pagesFetched, setPagesFetched] = useState(0)
  const MAX_PAGES = 1

  useEffect(() => {
    const t = setTimeout(() => {
      if (!loading && collected.length === 0 && !hasNextPage) {
        onDone([])
      }
    }, 6000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, hasNextPage, collected.length])

  useEffect(() => {
    if (loading) return

    if (error) {
      onError(error)
      return
    }

    const current = normalizeProductsShape(products)
    setCollected((prev) => [...prev, ...current])

    if (hasNextPage && pagesFetched < MAX_PAGES) {
      setPagesFetched((n) => n + 1)
      fetchMore?.().catch((e: any) => {
        console.error('fetchMore failed:', e)
        onDone([...collected, ...current])
      })
      return
    }

    onDone([...collected, ...current])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, loading, error, hasNextPage])

  useEffect(() => {
    setCollected([])
    setPagesFetched(0)
  }, [query])

  return null
}

function RecommendedStep({
  onDone,
  onError
}: {
  onDone: (products: any[]) => void
  onError: (err: unknown) => void
}) {
  const { products, loading, error, hasNextPage, fetchMore } = useRecommendedProducts({ first: 10 })

  const [collected, setCollected] = useState<any[]>([])
  const [pagesFetched, setPagesFetched] = useState(0)
  const MAX_PAGES = 1

  useEffect(() => {
    if (loading) return

    if (error) {
      onError(error)
      return
    }

    const current = normalizeProductsShape(products)
    setCollected((prev) => [...prev, ...current])

    if (hasNextPage && pagesFetched < MAX_PAGES) {
      setPagesFetched((n) => n + 1)
      fetchMore?.().catch((e: any) => {
        console.error('fetchMore (recommended) failed:', e)
        onDone([...collected, ...current])
      })
      return
    }

    onDone([...collected, ...current])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, loading, error, hasNextPage])

  useEffect(() => {
    setCollected([])
    setPagesFetched(0)
  }, [])

  return null
}

export default SliderPage
