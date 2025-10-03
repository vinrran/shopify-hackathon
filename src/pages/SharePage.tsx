import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useShare } from '@shopify/shop-minis-react'
import { QUESTIONS } from '../components/DailyFortune/question-data'
import type { QuestionAnswer, Question } from '../components/DailyFortune/question-types'

interface SharePageState {
  answers: QuestionAnswer[]
  selectedProducts: any[]
}

export function SharePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { share } = useShare()
  
  const [state, setState] = useState<SharePageState | null>(null)
  const [imageBlob, setImageBlob] = useState<Blob | null>(null)
  const [isGenerating, setIsGenerating] = useState(true)

  useEffect(() => {
    console.log('Location state:', location.state)
    if (location.state) {
      const shareState = location.state as SharePageState
      console.log('Setting state with:', shareState)
      setState(shareState)
    } else {
      console.log('No location state, redirecting to fan page')
      navigate('/fan')
    }
  }, [location.state, navigate])

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

  const getProductPrice = (product: any): string => {
    console.log('Getting price for product:', product.title, {
      price: product.price,
      currency: product.currency,
      variants: product.variants
    })

    if (product.price) {
      if (typeof product.price === 'string') {
        return `${product.price} ${product.currency || 'USD'}`
      } else if (typeof product.price === 'object' && product.price.amount) {
        return `${product.price.amount} ${product.price.currencyCode || product.currency || 'USD'}`
      } else {
        return `${String(product.price)} ${product.currency || 'USD'}`
      }
    }

    if (product.variants && product.variants.length > 0) {
      const variant = product.variants[0]
      if (variant.price) {
        if (typeof variant.price === 'string') {
          return variant.price
        } else if (typeof variant.price === 'object' && variant.price.amount) {
          return `${variant.price.amount} ${variant.price.currencyCode || 'USD'}`
        } else {
          return `${String(variant.price)} USD`
        }
      }
    }

    return 'Price not available'
  }

  const generateShareImage = async (): Promise<Blob | null> => {
    if (!state) {
      console.error('No state available for image generation')
      return null
    }

    if (!state.answers || !Array.isArray(state.answers)) {
      console.error('Invalid answers data:', state.answers)
      return null
    }

    if (!state.selectedProducts || !Array.isArray(state.selectedProducts)) {
      console.error('Invalid selectedProducts data:', state.selectedProducts)
      return null
    }

    console.log('Generating image with:', {
      answersCount: state.answers.length,
      productsCount: state.selectedProducts.length,
      answers: state.answers,
      products: state.selectedProducts
    })
    
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        console.error('Could not get canvas context')
        return null
      }

      canvas.width = 380
      canvas.height = 710

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, '#1A0051')
      gradient.addColorStop(1, '#3A00B7')
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.strokeStyle = '#FFBF36'
      ctx.lineWidth = 4
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 90)
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

      const padding = 25
      const contentWidth = canvas.width - (padding * 2)
      const contentHeight = canvas.height - (padding * 2)
      const halfHeight = contentHeight / 2

      const topHalfY = padding + 15
      const topHalfHeight = halfHeight - 30

      ctx.fillStyle = '#FFD700'
      ctx.font = 'bold 20px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('🔮 My Vibe Today', canvas.width / 2, topHalfY + 30)

      let yPos = topHalfY + 60
      const maxQuestions = Math.min(state.answers.length, 3)
      const questionHeight = (topHalfHeight - 100) / maxQuestions
      
      for (let i = 0; i < maxQuestions; i++) {
        const answer = state.answers[i]
        const question = QUESTIONS.find(q => q.id === answer.questionId)
        if (!question) continue

        const questionY = yPos + (i * questionHeight)

        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
        ctx.fillRect(padding + 10, questionY - 8, contentWidth - 20, questionHeight - 15)

        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 12px Arial'
        ctx.textAlign = 'left'
        wrapText(question.title, padding + 20, questionY + 8, contentWidth - 40, 16)

        ctx.fillStyle = '#FFD700'
        ctx.font = '11px Arial'
        const answerText = getAnswerDisplay(question, answer)
        wrapText(String(answerText), padding + 20, questionY + 28, contentWidth - 40, 14)
      }

      const bottomHalfY = padding + halfHeight - 25
      const productHeight = (halfHeight - 80) / 3

      ctx.fillStyle = '#FFD700'
      ctx.font = 'bold 20px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('⭐ Recommended Products', canvas.width / 2, bottomHalfY + 18)
      const products = state.selectedProducts.slice(0, 3)
      for (let i = 0; i < products.length; i++) {
        const product = products[i]
        const productY = bottomHalfY + 40 + (i * productHeight)

        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.fillRect(padding + 10, productY, contentWidth - 20, productHeight - 10)
        const imageUrl = product.thumbnail_url || product.featuredImage?.url || product.images?.[0]?.url || product.images?.[0]
        if (imageUrl) {
          try {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            await new Promise<void>((resolve) => {
              img.onload = () => {
                const imageSize = 50
                const imageX = padding + 15
                const imageY = productY + 8
                ctx.save()
                ctx.beginPath()
                ctx.moveTo(imageX + 6, imageY)
                ctx.lineTo(imageX + imageSize - 6, imageY)
                ctx.quadraticCurveTo(imageX + imageSize, imageY, imageX + imageSize, imageY + 6)
                ctx.lineTo(imageX + imageSize, imageY + imageSize - 6)
                ctx.quadraticCurveTo(imageX + imageSize, imageY + imageSize, imageX + imageSize - 6, imageY + imageSize)
                ctx.lineTo(imageX + 6, imageY + imageSize)
                ctx.quadraticCurveTo(imageX, imageY + imageSize, imageX, imageY + imageSize - 6)
                ctx.lineTo(imageX, imageY + 6)
                ctx.quadraticCurveTo(imageX, imageY, imageX + 6, imageY)
                ctx.clip()
                ctx.drawImage(img, imageX, imageY, imageSize, imageSize)
                ctx.restore()
                
                resolve()
              }
              img.onerror = () => {
                console.log('Failed to load product image:', imageUrl)
                resolve()
              }
              img.src = imageUrl
            })
          } catch (error) {
            console.log('Error loading product image:', error)
          }
        }

        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 14px Arial'
        ctx.textAlign = 'left'
        const textX = imageUrl ? padding + 75 : padding + 20
        const textWidth = contentWidth - (imageUrl ? 95 : 40)
        const titleY = productY + 23
        wrapText(product.title || 'Product', textX, titleY, textWidth, 16)
        
        ctx.fillStyle = '#FFD700'
        ctx.font = 'bold 12px Arial'
        const priceText = getProductPrice(product)
        const productNameLength = (product.title || 'Product').length
        const priceY = productY + 45 + (productNameLength > 20 ? 13 : 0)
        
        wrapText(priceText, textX, priceY, textWidth, 14)
      }

      return new Promise(resolve => {
        canvas.toBlob(resolve, 'image/png')
      })
    } catch (error) {
      console.error('Error generating share image:', error)
      return null
    }
  }

  useEffect(() => {
    if (state) {
      console.log('Starting image generation with state:', state)
      generateShareImage()
        .then(blob => {
          console.log('Image generation successful:', blob ? 'Blob created' : 'No blob')
          setImageBlob(blob)
          setIsGenerating(false)
        })
        .catch(error => {
          console.error('Image generation failed:', error)
          setImageBlob(null)
          setIsGenerating(false)
        })
    } else {
      console.log('No state available for image generation')
      setIsGenerating(false)
    }
  }, [state])

  const handleShare = async () => {
    if (!imageBlob) return

    const productShareText = `✨ Discover these amazing products recommended for me! ✨

${state?.selectedProducts.map((product: any, index: number) => {
  const priceText = getProductPrice(product)
  return `${index + 1}. ${product.title} - ${priceText}`
}).join('\n')}

Based on my preferences:
${state?.answers.slice(0, 2).map(answer => {
  const question = QUESTIONS.find(q => q.id === answer.questionId)
  if (!question) return ''
  return `• ${question.title}: ${getAnswerDisplay(question, answer)}`
}).filter(Boolean).join('\n')}

Find your perfect products on Shop! 🛍️`

    try {
      const result = await share({
        title: 'My Personalized Product Recommendations ✨',
        url: 'https://shop.app/diviners'
      })
      
      console.log('Shopify share result:', result)
      
      if (result) {
        navigate('/fan')
        return
      }
      try {
        const productLinks = state?.selectedProducts.map((product: any, index: number) => {
          const productUrl = product.url || `https://shop.app/products/${product.handle || product.id}`
          return `${index + 1}. ${product.title}: ${productUrl}`
        }).join('\n\n')
        
        const fullShareText = `${productShareText}\n\nProduct Links:\n${productLinks}\n\nVisit: https://shop.app/diviners`
        
        await navigator.clipboard.writeText(fullShareText)
        
        const url = URL.createObjectURL(imageBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'my-product-recommendations.png'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        alert('Product recommendations copied to clipboard and image downloaded!')
        navigate('/fan')
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError)
        alert('Unable to share. Please try again.')
      }
    } catch (error) {
      console.error('Error sharing:', error)
      alert('Unable to share. Please try again.')
    }
  }

  const handleDownload = () => {
    if (!imageBlob) return
    
    const url = URL.createObjectURL(imageBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'my-product-recommendations.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      {isGenerating ? (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1A0051] to-[#3A00B7]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : imageBlob ? (
        <div className="relative">
          <img 
            src={URL.createObjectURL(imageBlob)} 
            alt="Shareable recommendations" 
            className="w-full h-screen object-cover"
          />
          
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3">
            <button
              onClick={handleShare}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-4 py-2 rounded-lg shadow-lg transition-all duration-200 active:scale-95 text-sm backdrop-blur-sm"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                Share
              </div>
            </button>

            <button
              onClick={handleDownload}
              className="bg-gradient-to-r from-white/20 to-white/30 hover:from-white/30 hover:to-white/40 text-white font-medium px-4 py-2 rounded-lg shadow-lg transition-all duration-200 active:scale-95 text-sm backdrop-blur-sm"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </div>
            </button>
          </div>

          <button
            onClick={() => navigate('/')}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors z-10 backdrop-blur-sm"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1A0051] to-[#3A00B7] p-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 text-center space-y-4">
            <div className="text-white/70">
              Failed to generate image. Please try again.
            </div>
            <button
              onClick={() => {
                setIsGenerating(true)
                generateShareImage()
                  .then(blob => {
                    setImageBlob(blob)
                    setIsGenerating(false)
                  })
                  .catch(error => {
                    console.error('Retry failed:', error)
                    setImageBlob(null)
                    setIsGenerating(false)
                  })
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SharePage
