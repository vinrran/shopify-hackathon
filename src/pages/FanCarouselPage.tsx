import React, { useState, useRef, useEffect } from "react"
import { ProductCard } from '@shopify/shop-minis-react'

interface CardFanCarouselProps {
  products?: any[]
  loading?: boolean
}



export function FanCarouselPage({ products, loading }: CardFanCarouselProps = {}) {
  const [currentIndex, setCurrentIndex] = useState(2) // Start with middle card
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [currentX, setCurrentX] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Top spots state - can hold up to 3 products
  const [topSpots, setTopSpots] = useState<Array<any>>([])
  
  // Drag and drop state
  const [draggedCard, setDraggedCard] = useState<{product: any, fromIndex?: number, fromSpot?: number} | null>(null)
  const [dragOverSpot, setDragOverSpot] = useState<number | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  
  // Product pool management - tracks used products and available ones
  const [usedProductIds, setUsedProductIds] = useState<Set<string>>(new Set())
  const [shuffleCount, setShuffleCount] = useState(0)
  


  // If no products or still loading, show loading state
  if (loading || !products || products.length === 0) {
    return (
      <div className="w-full max-w-xl mx-auto p-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Popular Products</h2>
          <p className="text-gray-600 text-sm">Loading amazing products for you...</p>
        </div>
        <div className="relative h-96 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  // Update displayProducts to exclude used products
  const getDisplayProducts = () => {
    if (!products) return []
    const availableProducts = products.filter(product => !usedProductIds.has(product.id))
    // Shuffle the available products based on shuffleCount to get different sets
    const shuffledProducts = [...availableProducts].sort(() => {
      // Use shuffleCount to create deterministic randomness for each shuffle
      return (Math.sin(shuffleCount * 9999) * 10000) % 1 - 0.5
    })
    return shuffledProducts.slice(0, 5)
  }

  const handleShuffle = () => {
    setShuffleCount(prev => prev + 1)
    setCurrentIndex(2) // Reset to center position
  }

  // Get current display products (excluding used ones)
  const displayProducts = getDisplayProducts()

  // Initialize top spots and available products (only once when products load)
  useEffect(() => {
    if (products && products.length > 0 && topSpots.length === 0) {
      const initialTopSpots = products.slice(0, 3)
      setTopSpots(initialTopSpots)
      
      // Mark initial top spots as used
      const initialUsedIds = new Set(initialTopSpots.map(p => p.id))
      setUsedProductIds(initialUsedIds)
    }
  }, [products, topSpots.length])

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, product: any, fromIndex?: number, fromSpot?: number) => {
    setDraggedCard({ product, fromIndex, fromSpot })
    setIsDragActive(true)
    
    // Add some visual feedback
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', product.id)
    
    // Create a custom drag image (optional)
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement
    dragImage.style.transform = 'rotate(5deg) scale(0.8)'
    dragImage.style.opacity = '0.8'
    
    // Prevent touch events from interfering
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent, spotIndex: number) => {
    e.preventDefault()
    setDragOverSpot(spotIndex)
  }

  const handleDragLeave = () => {
    setDragOverSpot(null)
  }

  const handleDrop = (e: React.DragEvent, targetSpotIndex: number) => {
    e.preventDefault()
    setDragOverSpot(null)
    setIsDragActive(false)
    
    if (!draggedCard) return

    const newTopSpots = [...topSpots]
    
    // If dropping from carousel (center card)
    if (draggedCard.fromIndex !== undefined) {
      const oldProduct = newTopSpots[targetSpotIndex]
      
      // Place the dragged card in the target spot
      newTopSpots[targetSpotIndex] = draggedCard.product
      setTopSpots(newTopSpots)
      
      // Update used products
      const newUsedIds = new Set(usedProductIds)
      if (oldProduct) {
        newUsedIds.delete(oldProduct.id) // Remove old product from used
      }
      newUsedIds.add(draggedCard.product.id) // Add new product to used
      setUsedProductIds(newUsedIds)
      
      // Visual feedback - briefly highlight the spot
      setTimeout(() => {
        // Could add some success animation here
      }, 200)
    }
    
    setDraggedCard(null)
  }

  const handleDragEnd = () => {
    setIsDragActive(false)
    setDragOverSpot(null)
    setDraggedCard(null)
  }

  const handleSwapWithCenter = (spotIndex: number) => {
    const productInSpot = topSpots[spotIndex]
    if (!productInSpot) return
    
    const centerProduct = displayProducts[currentIndex]
    if (!centerProduct) return
    
    // Swap the products
    const newTopSpots = [...topSpots]
    newTopSpots[spotIndex] = centerProduct
    setTopSpots(newTopSpots)
    
    // Update used products - remove the old one from spot, add the new one
    const newUsedIds = new Set(usedProductIds)
    newUsedIds.delete(productInSpot.id) // Remove old product from used
    newUsedIds.add(centerProduct.id) // Add new product to used
    setUsedProductIds(newUsedIds)
  }
  


  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    setStartX(e.touches[0].clientX)
    setCurrentX(e.touches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    setCurrentX(e.touches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    setIsDragging(false)

    const diff = startX - currentX
    const threshold = 50

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // Swipe right - go to next card (loop to first if at end)
        setCurrentIndex((prev) => (prev + 1) % displayProducts.length)
      } else {
        // Swipe left - go to previous card (loop to last if at beginning)
        setCurrentIndex((prev) => (prev - 1 + displayProducts.length) % displayProducts.length)
      }
    }

    setCurrentX(0)
    setStartX(0)
  }

  const getCardStyle = (index: number) => {
    // Calculate position with wrapping for infinite effect
    let position = index - currentIndex

    // Handle wrapping - choose the shortest path
    if (position > displayProducts.length / 2) {
      position -= displayProducts.length
    } else if (position < -displayProducts.length / 2) {
      position += displayProducts.length
    }

    const isCenter = index === currentIndex

    // Fan angles - cards spread from -35° to +35°
    const maxAngle = 35
    const baseAngle = position * (maxAngle / 2)
    let rotation = baseAngle

    // Add drag rotation for smoother interaction
    if (isDragging) {
      const dragRotation = (currentX - startX) * 0.1
      rotation += dragRotation
    }

    // Calculate position based on fan layout
    const radius = 135 // Distance from pivot point
    const angleRad = (rotation * Math.PI) / 180

    // Position cards along the arc
    const translateX = Math.sin(angleRad) * radius
    const translateY = -Math.cos(angleRad) * radius + radius // Offset to bring cards up

    // Scale and opacity based on distance from center
    const distance = Math.abs(position)
    const scale = isCenter ? 1 : Math.max(0.85, 1 - distance * 0.08)
    const opacity = isCenter ? 1 : Math.max(0.4, 1 - distance * 0.2)

    // Z-index: center card highest, then decreasing as we go away from center
    const zIndex = isCenter ? 50 : 50 - Math.abs(position)

    return {
      transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotation}deg) scale(${scale})`,
      transformOrigin: "bottom center",
      opacity,
      zIndex,
      transition: isDragging ? "none" : "all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    }
  }

  const getCardContentOpacity = (index: number) => {
    let position = Math.abs(index - currentIndex)

    // Handle wrapping for opacity calculation
    if (position > displayProducts.length / 2) {
      position = displayProducts.length - position
    }

    return position === 0 ? 1 : Math.max(0.2, 1 - position * 0.3)
  }



  return (
    <div className="w-full max-w-lg mx-auto px-1 py-2 overflow-hidden">


      {/* Top Spots for Selected Products */}
      <div className="mb-3 mt-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-1 text-center">My Selections</h3>
        <div className="flex justify-center gap-2 px-2">
          {[0, 1, 2].map((spotIndex) => (
            <div
              key={spotIndex}
                className={`w-30 rounded-lg transition-all duration-200 ${
                  dragOverSpot === spotIndex
                    ? 'bg-blue-50 scale-105 shadow-lg border-2 border-blue-500'
                    : topSpots[spotIndex]
                    ? 'bg-transparent shadow-md hover:shadow-lg'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-dashed border-gray-300 h-40'
                }`}
              onDragOver={(e) => handleDragOver(e, spotIndex)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, spotIndex)}
            >
              {topSpots[spotIndex] ? (
                <div className="w-full h-full flex flex-col items-center">
                  <div className="w-full overflow-hidden rounded-lg">
                    <ProductCard product={topSpots[spotIndex]} variant="compact" />
                  </div>
                  {/* Mystical Swap Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSwapWithCenter(spotIndex)
                    }}
                    className="mt-2 w-full bg-gradient-to-b from-slate-700 to-slate-900 hover:from-slate-600 hover:to-slate-800 text-amber-100 text-xs font-medium py-2 rounded border border-amber-300/30 shadow-lg transition-all duration-300 hover:shadow-amber-200/20 hover:border-amber-300/50 backdrop-blur-sm"
                    title="Swap with center card"
                  >
                    <span className="inline-flex items-center gap-5 tracking-wide uppercase">
                      <svg className="w-3 h-3 text-amber-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      Swap
                      <svg className="w-4.5 h-4.5 text-amber-300" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="4"/>
                        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 6.34L4.93 4.93M19.07 19.07l-1.41-1.41"/>
                      </svg>
                    </span>
                  </button>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-gray-400 text-xs text-center">
                    <div className="text-2xl mb-1">+</div>
                    <div>Drag here</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mystical Shuffle Button */}
      <div className="flex justify-center mt-9 mb-3">
        <button
          onClick={handleShuffle}
          className="bg-gradient-to-b from-slate-700 to-slate-900 hover:from-slate-600 hover:to-slate-800 text-amber-100 w-15 h-15 rounded-full border border-amber-300/30 shadow-lg transition-all duration-300 hover:shadow-amber-200/20 hover:border-amber-300/50 backdrop-blur-sm hover:scale-110 active:scale-95 flex items-center justify-center"
          title="Shuffle the cards to reveal new products"
        >
          🔮
        </button>
      </div>

      <div
        ref={containerRef}
        className="relative h-[350px] flex items-end justify-center overflow-visible"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: "pan-y" }}
      >
        {displayProducts.map((product, index) => {
          const isCenter = index === currentIndex

          return (
                          <div
                key={product.id}
                className={`absolute w-64 h-80 select-none bg-white shadow-2xl overflow-hidden rounded-xl border border-gray-200 ${
                  isCenter ? 'cursor-move' : 'cursor-pointer'
                } ${isCenter && isDragActive ? 'opacity-50 scale-95' : ''} transition-all duration-200`}
                style={getCardStyle(index)}
                onClick={() => {
                  if (!isCenter) {
                    setCurrentIndex(index)
                  }
                }}
                draggable={isCenter}
                onDragStart={isCenter ? (e) => handleDragStart(e, product, index) : undefined}
                onDragEnd={isCenter ? handleDragEnd : undefined}
              >
              <div 
                className={`w-full h-full ${!isCenter ? 'pointer-events-none' : ''}`}
                style={{ opacity: getCardContentOpacity(index) }}
              >
                <ProductCard 
                  product={product}
                />
              </div>
            </div>
          )
        })}
      </div>



      {/* Bottom padding for carousel */}
      <div className="pb-8"></div>




    </div>
  )
}
