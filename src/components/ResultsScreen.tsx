// Results screen component for displaying ranked products (hydrated via useProducts)
import React, { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { useProducts } from '@shopify/shop-minis-react'
import { ProductCard } from '../components/ProductCard' // ← use your local shim

type RankedItem = { product_id: string; score?: number; reason?: string }

// Normalize to Shopify Product GID
const toProductGid = (id: string) =>
  id?.startsWith('gid://shopify/Product/') ? id : `gid://shopify/Product/${id}`

export function ResultsScreen() {
  const { state, dispatch } = useApp()

  const handleReset = () => dispatch({ type: 'RESET_QUIZ' })

  // Build ID list from ranked items
  const ids = useMemo(
    () => (state.ranked || []).map((r: RankedItem) => toProductGid(r.product_id)),
    [state.ranked]
  )

  // Hydrate full product objects for the ranked list
  const { products, loading, error } = useProducts({ ids })

  // Score/reason lookup
  const meta = useMemo(() => {
    const m = new Map<string, { score?: number; reason?: string }>()
    ;(state.ranked || []).forEach((r) => m.set(toProductGid(r.product_id), { score: r.score, reason: r.reason }))
    return m
  }, [state.ranked])

  // Loading
  if (state.loading.fetchRanking || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4" />
        <p className="text-gray-600">Loading your personalized products...</p>
      </div>
    )
  }

  // Error
  if (state.error || error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 max-w-md">
          <p className="text-red-800 text-center">
            {state.error || error?.message || 'Something went wrong.'}
          </p>
        </div>
        <button
          onClick={handleReset}
          className="py-3 px-6 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all"
        >
          Try Again
        </button>
      </div>
    )
  }

  const hydrated = Array.isArray(products) ? products : []

  if (!hydrated.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Found</h3>
          <p className="text-gray-600 mb-4">We couldn't find any products matching your preferences.</p>
        </div>
        <button
          onClick={handleReset}
          className="py-3 px-6 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all"
        >
          Start Over
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-4 border-b border-gray-200">
        <div className="text-xs tracking-wide text-gray-500 mb-1">STEP 3: YOUR COLLECTION</div>
        <h2 className="text-xl font-bold text-gray-900">Shop Mini Experience</h2>
        <p className="text-sm text-gray-600">{hydrated.length} products matched to your style</p>
      </div>

      {/* Product list using the local shim (renders the SDK ProductCard) */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-4 pb-6">
          {hydrated.map((p: any, index: number) => {
            const m = meta.get(p.id)
            const scorePct =
              typeof m?.score === 'number'
                ? Math.round(Math.min(100, Math.max(0, m.score * 100)))
                : null

            return (
              <div key={p.id} className="relative">
                {/* Rank badge */}
                <div className="absolute right-3 top-3 z-10 bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
                  #{index + 1}
                </div>

                {/* Shopify SDK card via local shim */}
                <ProductCard product={p} rank={index + 1} />

                {/* Optional: score + reason under the card */}
                {(scorePct !== null || m?.reason) && (
                  <div className="px-3 pb-2">
                    {scorePct !== null && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Match Score</span>
                          <span>{scorePct}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${scorePct}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {m?.reason && <p className="mt-2 text-xs text-gray-500">Why: {m.reason}</p>}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Action */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <button
            onClick={handleReset}
            className="w-full py-3 px-6 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-all"
          >
            Take Quiz Again
          </button>
        </div>
      </div>
    </div>
  )
}
