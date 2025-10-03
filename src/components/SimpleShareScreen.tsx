
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

  const generateShareImage = async (): Promise<Blob | null> => {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return null

      // Set canvas size to match the background SVG dimensions
      canvas.width = 402
      canvas.height = 874

      // Load and draw the background SVG
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
          <svg width="402" height="874" viewBox="0 0 402 874" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_66_4)">
              <g clip-path="url(#clip1_66_4)">
                <rect width="402" height="874" fill="url(#paint0_linear_66_4)"/>
                <rect x="27" y="88" width="348" height="687" stroke="#FFBF36" stroke-opacity="0.63" stroke-width="4"/>
                <line x1="202" y1="148" x2="202" y2="253" stroke="#DA9920" stroke-width="2"/>
                <path d="M266.942 136.663L303 225" stroke="#DA9920" stroke-width="2"/>
                <path d="M135.438 136.663L100 219" stroke="#DA9920" stroke-width="2"/>
                <path d="M234.992 147.871L246.5 207.5" stroke="#DA9920" stroke-width="2"/>
                <path d="M290 121L329.5 172.5" stroke="#DA9920" stroke-width="2"/>
                <path d="M318 110L351 143.5" stroke="#DA9920" stroke-width="2"/>
                <path d="M90 110L57 143.5" stroke="#DA9920" stroke-width="2"/>
                <path d="M112.811 125L75.5 169.5" stroke="#DA9920" stroke-width="2"/>
                <path d="M167.008 147.871L156.5 209" stroke="#DA9920" stroke-width="2"/>
                <path d="M203 259L205.701 266.299L213 269L205.701 271.701L203 279L200.299 271.701L193 269L200.299 266.299L203 259Z" fill="#AE7A19"/>
                <path d="M306.319 230.684L309.984 234.571L315.322 234.319L311.434 237.984L311.686 243.322L308.021 239.434L302.684 239.686L306.571 236.021L306.319 230.684Z" fill="#4C30BC"/>
                <path d="M355.201 148.096L360.031 150.38L364.909 148.201L362.625 153.031L364.805 157.909L359.974 155.625L355.096 157.805L357.38 152.974L355.201 148.096Z" fill="#AE7A19"/>
                <path d="M95.9685 225.437L96.0017 230.992L100.24 234.583L94.6852 234.616L91.0944 238.855L91.0612 233.3L86.8226 229.709L92.3777 229.676L95.9685 225.437Z" fill="#4C30BC"/>
                <path d="M51.9671 147.878L49.8138 152.999L52.2995 157.967L47.1786 155.814L42.2106 158.299L44.364 153.179L41.8783 148.211L46.9991 150.364L51.9671 147.878Z" fill="#AE7A19"/>
                <circle cx="201" cy="-27" r="171" stroke="#B57D1C" stroke-width="2"/>
                <circle cx="201" r="170" stroke="#A8751D" stroke-width="4"/>
              </g>
            </g>
            <defs>
              <linearGradient id="paint0_linear_66_4" x1="201" y1="0" x2="201" y2="874" gradientUnits="userSpaceOnUse">
                <stop offset="0.418269" stop-color="#1A0051"/>
                <stop offset="1" stop-color="#3A00B7"/>
              </linearGradient>
              <clipPath id="clip0_66_4">
                <rect width="402" height="874" fill="white"/>
              </clipPath>
              <clipPath id="clip1_66_4">
                <rect width="402" height="874" fill="white"/>
              </clipPath>
            </defs>
          </svg>
        `)}`
      })

      // Draw the background SVG
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      // Helper function to wrap text
      const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
        const words = text.split(' ')
        let line = ''
        let currentY = y

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' '
          const metrics = ctx.measureText(testLine)
          const testWidth = metrics.width
          if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, currentY)
            line = words[n] + ' '
            currentY += lineHeight
          } else {
            line = testLine
          }
        }
        ctx.fillText(line, x, currentY)
        return currentY + lineHeight
      }

      // Box outline coordinates (matching the SVG rect)
      const boxX = 27
      const boxY = 88
      const boxWidth = 348
      const boxHeight = 687
      const halfHeight = boxHeight / 2

      // TOP HALF - Questions and Answers
      const topHalfY = boxY + 20
      const topHalfHeight = halfHeight - 40

      // Title for top half
      ctx.fillStyle = '#FFD700'
      ctx.font = 'bold 18px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('🔮 My Vibe Today', boxX + boxWidth/2, topHalfY + 25)

      // Questions and answers
      let yPos = topHalfY + 55
      const maxQuestions = Math.min(answers.length, 3)
      const questionHeight = (topHalfHeight - 80) / maxQuestions
      
      for (let i = 0; i < maxQuestions; i++) {
        const answer = answers[i]
        const question = QUESTIONS.find(q => q.id === answer.questionId)
        if (!question) continue

        const questionY = yPos + (i * questionHeight)

        // Question background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
        ctx.fillRect(boxX + 10, questionY - 10, boxWidth - 20, questionHeight - 10)

        // Question
        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 12px Arial'
        ctx.textAlign = 'left'
        wrapText(question.title, boxX + 20, questionY + 8, boxWidth - 40, 15)

        // Answer
        ctx.fillStyle = '#FFD700'
        ctx.font = '11px Arial'
        const answerText = getAnswerDisplay(question, answer)
        wrapText(String(answerText), boxX + 20, questionY + 28, boxWidth - 40, 14)
      }

      // BOTTOM HALF - Staggered Products
      const bottomHalfY = boxY + halfHeight + 20
      const productHeight = (halfHeight - 60) / 3

      // Title for bottom half
      ctx.fillStyle = '#FFD700'
      ctx.font = 'bold 18px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('⭐ My Curated Products', boxX + boxWidth/2, bottomHalfY + 25)

      // Staggered products layout
      const products = displayProducts.slice(0, 3)
      for (let i = 0; i < products.length; i++) {
        const product = products[i]
        const productY = bottomHalfY + 45 + (i * productHeight)
        const isLeftImage = i % 2 === 0 // 0: left, 1: right, 2: left

        // Product background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.fillRect(boxX + 10, productY, boxWidth - 20, productHeight - 15)

        if (isLeftImage) {
          // Image on left, text on right
          // Product image placeholder
          ctx.fillStyle = 'rgba(255, 215, 0, 0.3)'
          ctx.fillRect(boxX + 20, productY + 10, 80, productHeight - 35)
          
          // Product text
          ctx.fillStyle = '#FFFFFF'
          ctx.font = 'bold 11px Arial'
          ctx.textAlign = 'left'
          wrapText(product.title || 'Product', boxX + 115, productY + 25, boxWidth - 135, 14)
          
          // Price or description
          ctx.fillStyle = '#FFD700'
          ctx.font = '10px Arial'
          const price = product.price || product.variants?.[0]?.price || 'Price not available'
          wrapText(`${price}`, boxX + 115, productY + 45, boxWidth - 135, 12)
        } else {
          // Image on right, text on left
          // Product text
          ctx.fillStyle = '#FFFFFF'
          ctx.font = 'bold 11px Arial'
          ctx.textAlign = 'left'
          wrapText(product.title || 'Product', boxX + 20, productY + 25, boxWidth - 135, 14)
          
          // Price or description
          ctx.fillStyle = '#FFD700'
          ctx.font = '10px Arial'
          const price = product.price || product.variants?.[0]?.price || 'Price not available'
          wrapText(`${price}`, boxX + 20, productY + 45, boxWidth - 135, 12)
          
          // Product image placeholder
          ctx.fillStyle = 'rgba(255, 215, 0, 0.3)'
          ctx.fillRect(boxX + boxWidth - 100, productY + 10, 80, productHeight - 35)
        }
      }

      return new Promise(resolve => {
        canvas.toBlob(resolve, 'image/png')
      })
    } catch (error) {
      console.error('Error generating share image:', error)
      return null
    }
  }

  const handleShopifyShare = async () => {
    const shareText = `✨ Check out my Daily Shopping Fortune! ✨

My Vibe Today:
${answers.map(answer => {
  const question = QUESTIONS.find(q => q.id === answer.questionId)
  if (!question) return ''
  return `${question.title}: ${getAnswerDisplay(question, answer)}`
}).filter(Boolean).join('\n')}

My Curated Fortune:
${displayProducts.map((product: any, index: number) => `${index + 1}. ${product.title}`).join('\n')}

Join me on Shop and discover your perfect products! 🛍️`

    try {
      // Generate share image first
      const imageBlob = await generateShareImage()
      
      // Use native Web Share API if available (iOS will show native share sheet)
      if (navigator.share) {
        const shareData: any = {
          title: 'My Daily Shopping Fortune ✨',
          text: shareText,
          url: 'https://shop.app/diviners'
        }

        // Add image if supported
        if (imageBlob && navigator.canShare) {
          const imageFile = new File([imageBlob], 'my-diviners-fortune.png', { type: 'image/png' })
          
          // Test if we can share files
          if (navigator.canShare({ files: [imageFile] })) {
            shareData.files = [imageFile]
            console.log('Native share with image')
          } else {
            console.log('Native share without image (files not supported)')
          }
        }

        await navigator.share(shareData)
        console.log('Native share completed')
        onClose()
        return
      }

      // Fallback: Use Shopify's share hook
      const result = await share({
        title: 'My Daily Shopping Fortune ✨',
        url: 'https://shop.app/diviners'
      })
      
      console.log('Shopify share result:', result)
      
      if (result) {
        onClose()
      }
    } catch (error) {
      console.error('Error sharing:', error)
      
      // Final fallback: clipboard + download
      try {
        await navigator.clipboard.writeText(`${shareText}\n\nVisit: https://shop.app/diviners`)
        
        // Download the image
        const imageBlob = await generateShareImage()
        if (imageBlob) {
          const url = URL.createObjectURL(imageBlob)
          const link = document.createElement('a')
          link.href = url
          link.download = 'my-diviners-fortune.png'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }
        
        alert('Content copied to clipboard and image downloaded!')
        onClose()
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError)
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
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {answers && answers.length > 0 ? (
                answers.map(answer => {
                  const question = QUESTIONS.find(q => q.id === answer.questionId)
                  if (!question) {
                    console.log('Question not found for answer:', answer)
                    return null
                  }
                  
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
                })
              ) : (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20 text-center">
                  <div className="text-white/70">
                    No quiz answers found. Complete the quiz to see your vibe!
                  </div>
                </div>
              )}
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
