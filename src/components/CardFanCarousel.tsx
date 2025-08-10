import React, { useState, useRef, useEffect } from 'react'
import { ProductCard } from '@shopify/shop-minis-react'
import { SimpleShareScreen } from './SimpleShareScreen'
import type { QuestionAnswer } from './DailyFortune/question-types'

export interface CardFanCarouselProps {
  products?: any[]
  loading?: boolean
  answers?: QuestionAnswer[]
}

export const CardFanCarousel: React.FC<CardFanCarouselProps> = ({ products, loading, answers = [] }) => {
  // Create sample answers if none provided (for testing/demo purposes)
  const sampleAnswers: QuestionAnswer[] = [
    { questionId: 'mood-emoji', value: 'sparkles' },
    { questionId: 'energy-level', value: 75 },
    { questionId: 'current-season-feel', value: 'spring' }
  ]
  const displayAnswers = answers.length > 0 ? answers : sampleAnswers
  const [currentIndex, setCurrentIndex] = useState(2)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [currentX, setCurrentX] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const [topSpots, setTopSpots] = useState<any[]>([])
  const [draggedCard, setDraggedCard] = useState<{ product: any; fromIndex?: number; fromSpot?: number } | null>(null)
  const [dragOverSpot, setDragOverSpot] = useState<number | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [usedProductIds, setUsedProductIds] = useState<Set<string>>(new Set())
  const [shuffleCount, setShuffleCount] = useState(0)
  const [showShareScreen, setShowShareScreen] = useState(false)

  if (loading || !products || products.length === 0) {
    return (
      <div className="w-full max-w-xl mx-auto p-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Popular Products</h2>
          <p className="text-gray-600 text-sm">Loading amazing products for you...</p>
        </div>
        <div className="relative h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-blue-500" />
        </div>
      </div>
    )
  }

  const getDisplayProducts = () => {
    const available = products.filter(p => !usedProductIds.has(p.id || p.product_id))
    const shuffled = [...available].sort(() => ((Math.sin(shuffleCount * 9999) * 10000) % 1) - 0.5)
    return shuffled.slice(0, 5)
  }
  const displayProducts = getDisplayProducts()

  useEffect(() => {
    if (products.length && topSpots.length === 0) {
      const initial = products.slice(0, 3)
      setTopSpots(initial)
      setUsedProductIds(new Set(initial.map(p => p.id || p.product_id)))
    }
  }, [products, topSpots.length])

  const handleDragStart = (e: React.DragEvent, product: any, fromIndex?: number, fromSpot?: number) => {
    setDraggedCard({ product, fromIndex, fromSpot })
    setIsDragActive(true)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', product.id || product.product_id)
    setIsDragging(false)
  }
  const handleDragOver = (e: React.DragEvent, spotIndex: number) => { e.preventDefault(); setDragOverSpot(spotIndex) }
  const handleDragLeave = () => setDragOverSpot(null)
  const handleDrop = (e: React.DragEvent, targetSpotIndex: number) => {
    e.preventDefault(); setDragOverSpot(null); setIsDragActive(false)
    if (!draggedCard) return
    const newTop = [...topSpots]
    if (draggedCard.fromIndex !== undefined) {
      const oldProduct = newTop[targetSpotIndex]
      newTop[targetSpotIndex] = draggedCard.product
      setTopSpots(newTop)
      const newUsed = new Set(usedProductIds)
      if (oldProduct) newUsed.delete(oldProduct.id || oldProduct.product_id)
      newUsed.add(draggedCard.product.id || draggedCard.product.product_id)
      setUsedProductIds(newUsed)
    }
    setDraggedCard(null)
  }
  const handleDragEnd = () => { setIsDragActive(false); setDragOverSpot(null); setDraggedCard(null) }

  const handleSwapWithCenter = (spotIndex: number) => {
    const pSpot = topSpots[spotIndex]; if (!pSpot) return
    const center = displayProducts[currentIndex]; if (!center) return
    const newTop = [...topSpots]; newTop[spotIndex] = center; setTopSpots(newTop)
    const newUsed = new Set(usedProductIds)
    newUsed.delete(pSpot.id || pSpot.product_id)
    newUsed.add(center.id || center.product_id)
    setUsedProductIds(newUsed)
  }

  const handleTouchStart = (e: React.TouchEvent) => { setIsDragging(true); setStartX(e.touches[0].clientX); setCurrentX(e.touches[0].clientX) }
  const handleTouchMove = (e: React.TouchEvent) => { if (isDragging) setCurrentX(e.touches[0].clientX) }
  const handleTouchEnd = () => {
    if (!isDragging) return
    setIsDragging(false)
    const diff = startX - currentX
    if (Math.abs(diff) > 50) {
      setCurrentIndex(prev => diff > 0 ? (prev + 1) % displayProducts.length : (prev - 1 + displayProducts.length) % displayProducts.length)
    }
    setCurrentX(0); setStartX(0)
  }

  const getCardStyle = (index: number) => {
    let position = index - currentIndex
    if (position > displayProducts.length / 2) position -= displayProducts.length
    else if (position < -displayProducts.length / 2) position += displayProducts.length
    const isCenter = index === currentIndex
    const baseAngle = position * (35 / 2)
    let rotation = baseAngle
    if (isDragging) rotation += (currentX - startX) * 0.1
    const radius = 135
    const angleRad = rotation * Math.PI / 180
    const translateX = Math.sin(angleRad) * radius
    const translateY = -Math.cos(angleRad) * radius + radius
    const distance = Math.abs(position)
    const scale = isCenter ? 1 : Math.max(0.85, 1 - distance * 0.08)
    const opacity = isCenter ? 1 : Math.max(0.4, 1 - distance * 0.2)
    const zIndex = isCenter ? 50 : 50 - distance
    return {
      transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotation}deg) scale(${scale})`,
      transformOrigin: 'bottom center', opacity, zIndex,
      transition: isDragging ? 'none' : 'all 0.6s cubic-bezier(0.25,0.46,0.45,0.94)'
    } as React.CSSProperties
  }
  const getCardContentOpacity = (index: number) => {
    let position = Math.abs(index - currentIndex)
    if (position > displayProducts.length / 2) position = displayProducts.length - position
    return position === 0 ? 1 : Math.max(0.2, 1 - position * 0.3)
  }

  const handleShuffle = () => { setShuffleCount(c => c + 1); setCurrentIndex(2) }

  return (
    <div className="w-full max-w-lg mx-auto px-1 py-2 overflow-visible">
      <div className="mb-3 mt-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-1 text-center">Fortunes</h3>
        <div className="flex justify-center gap-2 px-2">
          {[0,1,2].map(spotIndex => (
            <div key={spotIndex} className={`w-30 rounded-lg transition-all duration-200 ${
              dragOverSpot === spotIndex
                ? 'bg-blue-50 scale-105 shadow-lg border-2 border-blue-500'
                : topSpots[spotIndex]
                ? 'bg-transparent shadow-md hover:shadow-lg'
                : 'bg-gray-50 hover:bg-gray-100 border-2 border-dashed border-gray-300 h-40'
            }`} onDragOver={e => handleDragOver(e, spotIndex)} onDragLeave={handleDragLeave} onDrop={e => handleDrop(e, spotIndex)}>
              {topSpots[spotIndex] ? (
                <div className="w-full h-full flex flex-col items-center">
                  <div className="w-full overflow-hidden rounded-lg">
                    <ProductCard product={topSpots[spotIndex]} variant="compact" />
                  </div>
                  <button onClick={e => { e.stopPropagation(); handleSwapWithCenter(spotIndex) }} className="mt-2 w-full bg-gradient-to-b from-slate-700 to-slate-900 hover:from-slate-600 hover:to-slate-800 text-amber-100 text-xs font-medium py-2 rounded border border-amber-300/30 shadow-lg transition-all duration-300 hover:shadow-amber-200/20 hover:border-amber-300/50 backdrop-blur-sm" title="Swap with center card">
                    <span className="inline-flex items-center gap-1 tracking-wide uppercase">Swap</span>
                  </button>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-gray-400 text-xs text-center"><div className="text-2xl mb-1">+</div><div>Drag here</div></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div ref={containerRef} className="relative h-[350px] flex items-end justify-center overflow-visible mt-4" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} style={{ touchAction: 'pan-y' }}>
        {displayProducts.map((product, index) => {
          const isCenter = index === currentIndex
          return (
            <div key={product.id || product.product_id || index} className={`absolute w-64 h-80 select-none bg-white shadow-2xl overflow-hidden rounded-xl border border-gray-200 ${isCenter ? 'cursor-move' : 'cursor-pointer'} ${isCenter && isDragActive ? 'opacity-50 scale-95' : ''} transition-all duration-200`} style={getCardStyle(index)} onClick={() => { if (!isCenter) setCurrentIndex(index) }} draggable={isCenter} onDragStart={isCenter ? e => handleDragStart(e, product, index) : undefined} onDragEnd={isCenter ? handleDragEnd : undefined}>
              <div className={`w-full h-full ${!isCenter ? 'pointer-events-none' : ''}`} style={{ opacity: getCardContentOpacity(index) }}>
                <ProductCard product={product} />
              </div>
            </div>
          )
        })}
      </div>
      {/* Action buttons */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex gap-4 z-50">
        <button
          onClick={handleShuffle}
          className="bg-gradient-to-b from-slate-700 to-slate-900 hover:from-slate-600 hover:to-slate-800 text-amber-100 w-16 h-16 rounded-full border border-amber-300/30 shadow-xl transition-all duration-300 hover:shadow-amber-200/20 hover:border-amber-300/50 backdrop-blur-sm hover:scale-110 active:scale-95 flex items-center justify-center"
          title="Shuffle the cards to reveal new products"
          aria-label="Shuffle products"
          type="button"
        >
          🔮
        </button>
        
        <button
          onClick={() => setShowShareScreen(true)}
          className="bg-gradient-to-b from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white w-16 h-16 rounded-full border border-purple-300/30 shadow-xl transition-all duration-300 hover:shadow-purple-200/20 hover:border-purple-300/50 backdrop-blur-sm hover:scale-110 active:scale-95 flex items-center justify-center"
          title="Share your fortune"
          aria-label="Share fortune"
          type="button"
        >
          📤
        </button>
      </div>
      
      <div className="pb-8" />
      
      {/* Share Screen Modal */}
      {showShareScreen && (
        <SimpleShareScreen
          answers={displayAnswers}
          selectedProducts={topSpots.filter(Boolean).length > 0 ? topSpots.filter(Boolean) : displayProducts.slice(0, 3)}
          onClose={() => setShowShareScreen(false)}
        />
      )}
    </div>
  )
}

export default CardFanCarousel
