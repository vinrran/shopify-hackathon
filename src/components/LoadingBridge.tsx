import { useEffect, useMemo, useState } from 'react'
import { useProductSearch, useRecommendedProducts } from '@shopify/shop-minis-react'
import { useApp } from '../context/AppContext'
import { api } from '../services/api'
import type { Product } from '../types'

/**
 * LoadingBridge (Shop Mini)
 * Phases:
 *  1) search        — useProductSearch across all queries w/ pagination, cache + store
 *  2) recommended   — useRecommendedProducts once, cache + store
 *  3) ranking       — shuffle products directly and go to results (no vision processing)
 */
export function LoadingBridge() {
  const { state, dispatch } = useApp()
  const [phase, setPhase] = useState<'search' | 'recommended' | 'ranking'>('search')
  const [qIndex, setQIndex] = useState(0)

  // Local cache of ALL found products (search + recommended), used to hydrate ranking
  const [accumulated, setAccumulated] = useState<Product[]>([])

  const queries = state.generatedQueries || []
  const currentQuery = queries[qIndex] || ''

  const dedupeById = (list: Product[]) => {
    const seen = new Set<string>()
    return list.filter((p: any) => {
      const id = p?.product_id || p?.id
      if (!id) return false
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })
  }


  // --- replace your transformShopifyProduct with this ---
const transformShopifyProduct = (p: any): Product => {
  // image
  const image =
    p?.featuredImage?.url ??
    p?.images?.edges?.[0]?.node?.url ??
    p?.images?.[0]?.url ??
    p?.images?.[0] ??
    ''

  // price + currency (check several shapes)
  const priceAmount =
    p?.priceRange?.minVariantPrice?.amount ??
    p?.priceRangeV2?.minVariantPrice?.amount ??
    p?.minPrice ??
    p?.price?.amount ??
    p?.variants?.[0]?.price?.amount ??
    p?.variants?.edges?.[0]?.node?.price?.amount ??
    null

  const currencyCode =
    p?.priceRange?.minVariantPrice?.currencyCode ??
    p?.priceRangeV2?.minVariantPrice?.currencyCode ??
    p?.currency ??
    p?.price?.currencyCode ??
    p?.variants?.[0]?.price?.currencyCode ??
    p?.variants?.edges?.[0]?.node?.price?.currencyCode ??
    'USD'

  // vendor / brand
  const vendor =
    p?.vendor ??
    p?.vendorName ??
    p?.brand ??
    p?.merchant?.name ??
    p?.store?.name ??
    'Unknown'

  // product URL (try multiple paths)
  const url =
    p?.onlineStoreUrl ??
    p?.url ??
    p?.webUrl ??
    (p?.handle && p?.store?.domain
      ? `https://${p.store.domain}/products/${p.handle}`
      : '')

  return {
    product_id: p?.id ?? p?.product_id ?? '',
    title: p?.title ?? p?.name ?? '',
    vendor,
    price: priceAmount ?? undefined,
    currency: currencyCode,
    url: url || undefined,
    thumbnail_url: image || undefined,
    images:
      p?.images?.edges?.map((e: any) => e.node?.url).filter(Boolean) ??
      (Array.isArray(p?.images) ? p.images : []),
    raw: p,
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
        // cache too, so we can hydrate later
        setAccumulated((prev) => dedupeById([...prev, ...transformed]))
        await api.storeRecommendedProducts(state.userId, state.today, transformed)
      }
    } catch (e) {
      console.error('processRecommendedProducts error:', e)
    } finally {
      setPhase('ranking')
    }
  }

  // Trigger ranking exactly once when we enter phase='ranking'
  useEffect(() => {
    if (phase !== 'ranking') return

    const buildAndShuffleProducts = async () => {
      dispatch({ type: 'SET_LOADING', payload: { key: 'buildRanking', value: true } })
      try {
        // Skip vision processing and ranking - go directly to shuffling
        console.log('Shuffling products directly without vision processing...')
        console.log(`Total products collected: ${accumulated.length}`)
        
        // SHUFFLE: randomly shuffle all accumulated products
        const shuffled = [...accumulated].sort(() => Math.random() - 0.5)
        
        // Convert to RankedProduct format for compatibility
        const rankedProducts = shuffled.map((product, index) => ({
          ...product,
          rank: index + 1,
          score: 1.0,
          reason: 'Randomly shuffled'
        }))
        
        dispatch({ type: 'SET_RANKED', payload: rankedProducts })
        dispatch({ type: 'SET_HAS_MORE', payload: false }) // No pagination needed for shuffled products
        dispatch({ type: 'SET_SCREEN', payload: 'card' })
      } catch (err) {
        console.error('buildAndShuffleProducts error:', err)
        dispatch({ type: 'SET_ERROR', payload: 'Failed to build recommendations. Please try again.' })
        dispatch({ type: 'SET_SCREEN', payload: 'card' }) // proceed to animation
      } finally {
        dispatch({ type: 'SET_LOADING', payload: { key: 'buildRanking', value: false } })
        dispatch({ type: 'SET_LOADING', payload: { key: 'fetchRanking', value: false } })
      }
    }

    buildAndShuffleProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  return (
    <div className="flex-1 bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto" />
          </div>

          <div className="text-lg font-semibold text-gray-900 mb-1">Finding Perfect Products</div>
          <div className="text-sm text-gray-600 mb-6">
            {progressMessage(phase, queries, qIndex, currentQuery)}
          </div>

          <Stepper phase={phase} />

          {phase === 'search' && !!currentQuery && (
            <SearchStep
              query={currentQuery}
              onDone={(items) => finishQuery(items)}
              onError={() => finishQuery([])} // skip on error
            />
          )}

          {phase === 'recommended' && (
            <RecommendedStep
              onDone={handleRecommendedDone}
              onError={() => setPhase('ranking')}
            />
          )}

          <div className="mt-8 text-xs text-gray-500">This may take a few moments...</div>
        </div>
      </div>
    </div>
  )
}

/* --------------------------------- Helpers -------------------------------- */

function progressMessage(
  phase: 'search' | 'recommended' | 'ranking',
  queries: string[],
  idx: number,
  current: string
) {
  if (phase === 'search') {
    if (queries.length === 0) return 'Preparing search...'
    return `Searching for "${current}"... (${idx + 1}/${queries.length})`
  }
  if (phase === 'recommended') return 'Getting personalized recommendations...'
  return 'Preparing your collection...'
}

function Stepper({ phase }: { phase: 'search' | 'recommended' | 'ranking' }) {
  const steps = useMemo(() => ['Search', 'Recommend', 'Rank'] as const, [])
  const activeIdx = phase === 'search' ? 0 : phase === 'recommended' ? 1 : 2

  return (
    <div className="w-full max-w-sm mx-auto mb-2">
      {steps.map((label, index) => {
        const active = index === activeIdx
        return (
          <div key={label} className="flex items-center mb-3">
            <div
              className={[
                'w-8 h-8 rounded-full mr-3 flex items-center justify-center',
                active ? (label === 'Rank' ? 'bg-green-500' : 'bg-blue-500') : 'bg-gray-300'
              ].join(' ')}
            >
              {label === 'Rank' && active ? (
                <span className="text-white font-bold">✓</span>
              ) : (
                <span className="text-white text-xs">{index + 1}</span>
              )}
            </div>
            <span className={`flex-1 text-sm text-left ${active ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/* --------------------------- Phase subcomponents --------------------------- */
/** These isolate hook usage and paginate results before calling onDone. */

function normalizeProductsShape(products: any): any[] {
  if (!products) return []
  if (Array.isArray(products)) return products
  if (products.edges) return products.edges.map((e: any) => e.node)
  if (products.items) return products.items
  if (products.results) return products.results
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
  // As per docs: useProductSearch({ query, first? })
  // Get 10 products per search query for better variety
  const {
    products,
    loading,
    error,
    hasNextPage,
    fetchMore,
  } = useProductSearch({ query, first: 10 })

  const [collected, setCollected] = useState<any[]>([])
  const [pagesFetched, setPagesFetched] = useState(0)
  const MAX_PAGES = 3 // Get more products per query (up to 30 products per query) 

  // Timeout fallback: if nothing arrives within 6s, move on with what we have
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

    // no more pages
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
  // Limit recommended products to match search optimization (3 products)
  const {
    products,
    loading,
    error,
    hasNextPage,
    fetchMore,
  } = useRecommendedProducts({ first: 10 })

  const [collected, setCollected] = useState<any[]>([])
  const [pagesFetched, setPagesFetched] = useState(0)
  const MAX_PAGES = 2 // Get more recommended products (up to 20 recommended products)

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
 