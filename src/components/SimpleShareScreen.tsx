
import { useShare, useRecommendedProducts } from '@shopify/shop-minis-react'
import { QUESTIONS } from './DailyFortune/question-data'
import type { QuestionAnswer, Question } from './DailyFortune/question-types'

interface SimpleShareScreenProps {
  answers: QuestionAnswer[]
  selectedProducts: any[]
  onClose: () => void
}

export function SimpleShareScreen({ answers, selectedProducts, onClose }: SimpleShareScreenProps) {
  const { share } = useShare()
  
  // Get recommended products as fallback if we don't have enough selected products
  const { products: recommendedProducts, loading: recommendedLoading, error: recommendedError } = useRecommendedProducts({ first: 8 })
  
  // Debug logging
  console.log('SimpleShareScreen render:', { 
    answersCount: answers?.length,
    selectedProductsCount: selectedProducts?.length,
    recommendedProductsCount: recommendedProducts?.length,
    recommendedLoading,
    recommendedError,
    answers,
    selectedProducts,
    recommendedProducts
  })
  
  // Transform recommended products to match our expected format
  const transformedRecommended = (recommendedProducts || []).map((p: any) => ({
    id: p?.id || p?.product_id || '',
    product_id: p?.id || p?.product_id || '',
    title: p?.title || p?.name || '',
    vendor: p?.vendor || p?.brand || 'Shop',
    price: p?.priceRange?.minVariantPrice?.amount || p?.price || '0',
    currency: p?.priceRange?.minVariantPrice?.currencyCode || p?.currency || 'USD',
    thumbnail_url: p?.featuredImage?.url || p?.images?.edges?.[0]?.node?.url || p?.images?.[0]?.url || '',
    url: p?.onlineStoreUrl || p?.url || `${window.location.origin}/products/${p?.handle || p?.id}` || '',
    onlineStoreUrl: p?.onlineStoreUrl || p?.url || '',
    raw: p
  }))
  
  // Use actual products from the user's session, fill with recommended products if needed
  const allAvailableProducts = [...(selectedProducts || []), ...transformedRecommended]
  const displayProducts = allAvailableProducts.slice(0, 4)
  
  // Create fallback products if we don't have enough real products
  const fallbackProducts = Array.from({ length: 4 - displayProducts.length }, (_, index) => ({
    id: `fallback-${index}`,
    product_id: `fallback-${index}`,
    title: `Amazing Product ${index + 1}`,
    vendor: 'Shop',
    price: '29.99',
    currency: 'USD',
    thumbnail_url: '',
    url: '#',
    raw: {}
  }))
  
  const finalDisplayProducts = [...displayProducts, ...fallbackProducts].slice(0, 4)
  const getAnswerDisplay = (question: Question, answer: QuestionAnswer) => {
    const value = answer.value

    switch (question.type) {
      case 'slider':
        const sliderQuestion = question as any
        const numericValue = typeof value === 'number' ? value : 50
        return `${numericValue}% (${numericValue < 25 ? sliderQuestion.leftLabel : numericValue > 75 ? sliderQuestion.rightLabel : 'Balanced'})`
      
      case 'single-choice':
        const singleChoiceQuestion = question as any
        const selectedOption = singleChoiceQuestion.options.find((opt: any) => opt.id === value)
        return selectedOption ? `${selectedOption.emoji} ${selectedOption.label}` : value
      
      case 'multiple-choice':
        const multipleChoiceQuestion = question as any
        if (Array.isArray(value)) {
          return value.map(v => {
            const option = multipleChoiceQuestion.options.find((opt: any) => opt.id === v)
            return option ? `${option.emoji} ${option.label}` : v
          }).join(', ')
        }
        return value
      
      default:
        return String(value)
    }
  }

  const generateShareText = () => {
    return `✨ Check out my Daily Shopping Fortune! ✨

My Vibe Today:
${answers.slice(0, 3).map(answer => {
  const question = QUESTIONS.find(q => q.id === answer.questionId)
  if (!question) return ''
  return `${question.title}: ${getAnswerDisplay(question, answer)}`
}).filter(Boolean).join('\n')}

My Perfect Picks:
${finalDisplayProducts.map((product: any, index: number) => {
  const price = typeof product.price === 'string' ? product.price : String(product.price || '0')
  const currency = product.currency || 'USD'
  const priceDisplay = currency === 'USD' ? `$${price}` : `${price} ${currency}`
  const productUrl = product.onlineStoreUrl || product.url
  return `${index + 1}. ${product.title} by ${product.vendor} - ${priceDisplay}${productUrl ? `\n   🔗 ${productUrl}` : ''}`
}).join('\n\n')}

Join me on Shop and discover your perfect products! 🛍️`
  }
  const handleShare = async (platform: string) => {
    const shareText = generateShareText()
    const shareUrl = `${window.location.origin}/invite?ref=fortune`
  
    console.log('Share initiated:', { platform, shareText, shareUrl })
  
    try {
      switch (platform) {
        case 'native':
          if (navigator.share) {
            // Use iOS/Android native sheet
            await navigator.share({
              title: 'My Daily Shopping Fortunea ✨',
              text: shareText,
              url: shareUrl,
            })
            onClose()
          } else {
            // Fallback to copy
            await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
            alert('Copied to clipboard!')
          }
          break
  
        case 'shopify':
          await share({
            title: 'My Daily Shopping Fortune ✨',
            url: shareUrl,
          })
          onClose()
          break
  
        case 'copy':
          await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
          alert('Copied to clipboard!')
          break
  
        default:
          // Always show our custom share modal (your bottom sheet UI)
          break
      }
    } catch (error) {
      console.error('Error sharing:', error)
      if ((error as any).name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
          alert('Copied to clipboard!')
        } catch (clipboardError) {
          console.error('Clipboard error:', clipboardError)
          alert('Unable to share. Please try again.')
        }
      }
    }
  }
  

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      {/* iOS-like share sheet */}
      <div className="bg-white rounded-t-3xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl animate-slide-up">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
        </div>
        
        {/* Header */}
        <div className="px-4 py-2 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">My Daily Fortune</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto">
          {/* Products Preview */}
          <div className="p-4">
            {recommendedLoading && displayProducts.length === 0 && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-3 text-gray-600">Loading products...</span>
              </div>
            )}
            
            {recommendedError && displayProducts.length === 0 && (
              <div className="text-center py-8">
                <div className="text-red-500 text-sm mb-2">⚠️ Unable to load products</div>
                <div className="text-gray-500 text-xs">Using sample products for demo</div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-2">
              {finalDisplayProducts.map((product: any, index: number) => (
                <div key={product.id || product.product_id} className="relative bg-gray-50 rounded-lg overflow-hidden">
                  {/* Product Image */}
                  <div className="aspect-square bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                    {product.thumbnail_url ? (
                      <img 
                        src={product.thumbnail_url} 
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-3xl">🛍️</div>
                    )}
                  </div>
                  
                  {/* Rank badge */}
                  <div className="absolute top-1 right-1 bg-black/70 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    #{index + 1}
                  </div>
                  
                  {/* Product info */}
                  <div className="p-2">
                    <h3 className="font-medium text-gray-900 text-xs line-clamp-1 mb-1">
                      {product.title}
                    </h3>
                    <p className="text-xs text-gray-500 mb-1">{product.vendor}</p>
                    <p className="text-xs font-bold text-gray-900">
                      {(() => {
                        const price = typeof product.price === 'string' ? product.price : String(product.price || '0')
                        const currency = product.currency || 'USD'
                        return currency === 'USD' ? `$${price}` : `${price} ${currency}`
                      })()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Share Actions */}
          <div className="px-4 pb-4">
            <div className="space-y-3">
              {/* Main Share Button - Opens Native iOS Share Sheet */}
              <button
                onClick={() => handleShare('native')}
                className="w-full flex items-center justify-center p-4 bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors text-white font-semibold text-lg shadow-lg"
              >
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                Share My Fortune
              </button>
              
              {/* Debug info for native share */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-500 text-center">
                  Native Share Available: {'share' in navigator ? '✅ Yes' : '❌ No'}
                  {!window.isSecureContext && ' | ⚠️ Requires HTTPS'}
                </div>
              )}

              {/* Shopify Share */}
              <button
                onClick={() => handleShare('shopify')}
                className="w-full flex items-center justify-between p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors border border-purple-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <span className="font-medium text-purple-900">Share to Shop</span>
                </div>
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Copy Link */}
              <button
                onClick={() => handleShare('copy')}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-900">Copy Link</span>
                </div>
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Safe area for iOS */}
          <div className="h-8"></div>
        </div>
      </div>
    </div>
  )
}
