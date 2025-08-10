// API service for backend communication
import { Question, Answer, Product, RankedProduct } from '../types'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

console.log('API_BASE configured as:', API_BASE)
console.log('Environment variables:', import.meta.env)

// Helper for making API calls
async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const fullUrl = `${API_BASE}${endpoint}`
  console.log('Making API call to:', fullUrl)
  
  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    console.log('API response status:', response.status, response.statusText)

    if (!response.ok) {
      const error = await response.text().catch(() => 'Network error')
      console.error('API error response:', error)
      throw new Error(error || `API call failed: ${response.status}`)
    }

    const data = await response.json()
    console.log('API response data:', data)
    return data
  } catch (fetchError) {
    console.error('Fetch error:', fetchError)
    throw new Error(`Network error: ${fetchError.message}`)
  }
}

// API functions
export const api = {
  // Fetch questions from backend
  async getQuestions(): Promise<{ questions: Question[] }> {
    return apiCall('/questions')
  },

  // Submit user responses
  async submitResponses(
    userId: string,
    responseDate: string,
    answers: Answer[]
  ): Promise<{ ok: boolean }> {
    return apiCall('/responses', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        response_date: responseDate,
        answers,
      }),
    })
  },

  // Generate search queries
  async generateQueries(
    userId: string,
    responseDate: string,
    buyerData?: {
      buyerAttributes?: any
      genderAffinity?: string | null
    }
  ): Promise<{ queries: string[] }> {
    return apiCall('/queries/generate', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        response_date: responseDate,
        buyer_attributes: buyerData?.buyerAttributes,
        gender_affinity: buyerData?.genderAffinity,
      }),
    })
  },

  // Store search results
  async storeProducts(
    userId: string,
    responseDate: string,
    source: 'search' | 'recommended',
    results: Product[]
  ): Promise<{ ok: boolean; stored: number }> {
    return apiCall('/products/store', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        response_date: responseDate,
        source,
        results,
      }),
    })
  },

  // Store recommended products
  async storeRecommendedProducts(
    userId: string,
    responseDate: string,
    results: Product[]
  ): Promise<{ ok: boolean; stored: number }> {
    return apiCall('/products/recommended/store', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        response_date: responseDate,
        source: 'recommended',
        results,
      }),
    })
  },

  // Build ranking
  async buildRanking(
    userId: string,
    responseDate: string,
    pastDays: number = 5
  ): Promise<{ ok: boolean }> {
    return apiCall('/ranking/build', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        response_date: responseDate,
        past_days: pastDays,
      }),
    })
  },

  // Fetch ranked products
  async getRanking(
    userId: string,
    responseDate: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ top: RankedProduct[]; has_more: boolean }> {
    const params = new URLSearchParams({
      user_id: userId,
      response_date: responseDate,
      limit: limit.toString(),
      offset: offset.toString(),
    })
    const response = await apiCall<{
      products: RankedProduct[]
      total: number
      limit: number
      offset: number
    }>(`/ranking?${params}`)
    
    // Transform backend response to expected frontend format
    return {
      top: response.products || [],
      has_more: response.products.length >= response.limit
    }
  },

  // Replenish ranking
  async replenishRanking(
    userId: string,
    responseDate: string,
    excludeProductIds: string[],
    pastDays: number = 5
  ): Promise<{ added: number }> {
    return apiCall('/ranking/replenish', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        response_date: responseDate,
        exclude_product_ids: excludeProductIds,
        past_days: pastDays,
      }),
    })
  },

  // Process product images with vision AI
  async processProductVision(
    userId: string,
    responseDate: string,
    products: Product[]
  ): Promise<{ processed: number }> {
    return apiCall('/vision/process', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        response_date: responseDate,
        products: products.map(p => ({
          product_id: p.product_id,
          image_url: p.thumbnail_url || p.images?.[0]
        })).filter(p => p.image_url)
      }),
    })
  },
}
