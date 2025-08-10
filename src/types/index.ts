// Type definitions for the Shop Mini app

export interface Question {
  id: number
  prompt: string
  type: 'single_choice' | 'multi_choice'
  options: string[]
}

export interface Answer {
  qid: number
  answer: string | string[]
}

export interface Product {
  product_id: string
  title: string
  vendor: string
  price: string
  currency: string
  url?: string
  thumbnail_url?: string
  images?: string[]
  raw?: any
}

export interface RankedProduct extends Product {
  rank: number
  score: number
  reason: string
}

export interface UIState {
  userId: string
  today: string // YYYY-MM-DD
  questions: Question[]
  answers: Record<number, string | string[]>
  generatedQueries: string[]
  ranked: RankedProduct[]
  frozenIds: Set<string>
  offset: number
  hasMore: boolean
  loading: {
    questions: boolean
    submitAnswers: boolean
    generateQueries: boolean
    search: boolean
    recommended: boolean
    store: boolean
    buildRanking: boolean
    fetchRanking: boolean
    replenish: boolean
  }
  error?: string
  currentScreen: 'quiz' | 'loading' | 'card' | 'fan'
}

export interface AppContextType {
  state: UIState
  dispatch: React.Dispatch<Action>
  // Helper functions
  toggleFreeze: (productId: string) => void
  reshuffleUnfrozen: () => void
  loadMore: () => Promise<void>
}

export type Action =
  | { type: 'SET_QUESTIONS'; payload: Question[] }
  | { type: 'SET_ANSWER'; payload: { qid: number; answer: string | string[] } }
  | { type: 'SET_QUERIES'; payload: string[] }
  | { type: 'SET_RANKED'; payload: RankedProduct[] }
  | { type: 'APPEND_RANKED'; payload: RankedProduct[] }
  | { type: 'TOGGLE_FREEZE'; payload: string }
  | { type: 'SET_LOADING'; payload: { key: keyof UIState['loading']; value: boolean } }
  | { type: 'SET_ERROR'; payload: string | undefined }
  | { type: 'SET_SCREEN'; payload: 'quiz' | 'loading' | 'card' | 'fan' }
  | { type: 'SET_OFFSET'; payload: number }
  | { type: 'SET_HAS_MORE'; payload: boolean }
  | { type: 'RESHUFFLE_UNFROZEN' }
  | { type: 'RESET_QUIZ' }
