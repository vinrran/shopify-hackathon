
import { ProductCard, useShare } from '@shopify/shop-minis-react'
import { QUESTIONS } from './DailyFortune/question-data'
import type { QuestionAnswer, Question } from './DailyFortune/question-types'

interface SimpleShareScreenProps {
  answers: QuestionAnswer[]
  selectedProducts: any[]
  onClose: () => void
}

export function SimpleShareScreen({ answers, selectedProducts, onClose }: SimpleShareScreenProps) {
  const { share } = useShare()
  
  // Debug logging
  console.log('SimpleShareScreen render:', { 
    answersCount: answers?.length,
    selectedProductsCount: selectedProducts?.length,
    answers,
    selectedProducts
  })
  
  // Use the actual selected/recommended products from the user's session
  const displayProducts = selectedProducts.slice(0, 3)
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

  const handleShopifyShare = async () => {
    const shareText = `✨ Check out my Daily Shopping Fortune! ✨

My Vibe Today:
${answers.slice(0, 3).map(answer => {
  const question = QUESTIONS.find(q => q.id === answer.questionId)
  if (!question) return ''
  return `${question.title}: ${getAnswerDisplay(question, answer)}`
}).filter(Boolean).join('\n')}

My Curated Fortune:
${displayProducts.map((product: any, index: number) => `${index + 1}. ${product.title}`).join('\n')}

Join me on Shop and discover your perfect products! 🛍️`

    try {
      const result = await share({
        title: 'My Daily Shopping Fortune ✨',
        url: `${window.location.origin}/invite?ref=fortune`
      })
      
      console.log('Share result:', result)
      
      // Close the modal after successful share
      if (result) {
        onClose()
      }
    } catch (error) {
      console.error('Error sharing via Shopify:', error)
      // Fallback to clipboard if Shopify share fails
      try {
        await navigator.clipboard.writeText(shareText)
        alert('Content copied to clipboard!')
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError)
        alert('Unable to share. Please try again.')
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-[#1A0051] to-[#3A00B7] rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#1A0051] to-[#3A00B7] rounded-t-2xl border-b border-purple-300/20 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">My Shopping Fortune ✨</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* My Vibe Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-yellow-300">🔮</span>
              My Vibe Today
            </h3>
            <div className="space-y-3">
              {answers.slice(0, 3).map(answer => {
                const question = QUESTIONS.find(q => q.id === answer.questionId)
                if (!question) return null
                
                return (
                  <div key={answer.questionId} className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <div className="text-sm font-medium text-white/80 mb-1">
                      {question.title}
                    </div>
                    <div className="text-white font-semibold">
                      {getAnswerDisplay(question, answer)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Selected Products Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-yellow-300">⭐</span>
              My Curated Products
            </h3>
            
            {displayProducts.length === 0 ? (
              <div className="flex justify-center py-8 text-white/70">
                No products selected yet
              </div>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1">
                {displayProducts.map((product: any) => (
                  <div key={product.id || product.product_id} className="flex-shrink-0" style={{ width: 'calc(33.333% - 8px)' }}>
                    {/* Product Card */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden border border-white/20 hover:bg-white/20 transition-all duration-200">
                      <ProductCard product={product} variant="compact" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Join Me Section */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center space-y-3 border border-white/20">
            <div className="text-2xl">🛍️</div>
            <h3 className="text-lg font-semibold text-white">
              Ready to share your fortune?
            </h3>
            <p className="text-sm text-white/80">
              Let your friends discover their perfect products with personalized shopping experiences on Shop
            </p>
          </div>

          {/* Share Button */}
          <div className="pt-2">
            <button
              onClick={handleShopifyShare}
              className="w-full bg-gradient-to-r from-white/20 to-white/30 hover:from-white/30 hover:to-white/40 text-white font-semibold py-4 rounded-xl shadow-lg transition-all duration-200 active:scale-95 border border-white/30 backdrop-blur-sm"
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                Share My Fortune
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
