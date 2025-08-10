// Global state management with React Context
import React, { createContext, useContext, useReducer, useCallback } from 'react'
import { UIState, AppContextType, Action, RankedProduct } from '../types'
import { api } from '../services/api'

// Initial state
const initialState: UIState = {
  userId: `shop_user_${Date.now()}`, // Generate unique user ID
  today: new Date().toISOString().split('T')[0],
  questions: [],
  answers: {},
  dailyFortuneAnswers: [],
  generatedQueries: [],
  ranked: [],
  frozenIds: new Set(),
  offset: 0,
  hasMore: false,
  loading: {
    questions: false,
    submitAnswers: false,
    generateQueries: false,
    search: false,
    recommended: false,
    store: false,
    buildRanking: false,
    fetchRanking: false,
    replenish: false,
  },
  error: undefined,
  currentScreen: 'quiz',
}

// Reducer
function appReducer(state: UIState, action: Action): UIState {
  switch (action.type) {
    case 'SET_QUESTIONS':
      return { ...state, questions: action.payload }
    
    case 'SET_ANSWER':
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.payload.qid]: action.payload.answer,
        },
      }
    
    case 'SET_DAILY_FORTUNE_ANSWERS':
      return { ...state, dailyFortuneAnswers: action.payload }
    
    case 'SET_QUERIES':
      return { ...state, generatedQueries: action.payload }
    
    case 'SET_RANKED':
      return { ...state, ranked: action.payload }
    
    case 'APPEND_RANKED':
      return { ...state, ranked: [...state.ranked, ...action.payload] }
    
    case 'TOGGLE_FREEZE':
      const newFrozenIds = new Set(state.frozenIds)
      if (newFrozenIds.has(action.payload)) {
        newFrozenIds.delete(action.payload)
      } else {
        newFrozenIds.add(action.payload)
      }
      return { ...state, frozenIds: newFrozenIds }
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: { ...state.loading, [action.payload.key]: action.payload.value },
      }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    
    case 'SET_SCREEN':
      return { ...state, currentScreen: action.payload }
    
    case 'SET_OFFSET':
      return { ...state, offset: action.payload }
    
    case 'SET_HAS_MORE':
      return { ...state, hasMore: action.payload }
    
    case 'RESHUFFLE_UNFROZEN':
      // Fisher-Yates shuffle for unfrozen items only
      const frozen = state.ranked.filter(item => state.frozenIds.has(item.product_id))
      const unfrozen = state.ranked.filter(item => !state.frozenIds.has(item.product_id))
      
      // Shuffle unfrozen
      for (let i = unfrozen.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [unfrozen[i], unfrozen[j]] = [unfrozen[j], unfrozen[i]]
      }
      
      // Merge back maintaining frozen positions
      const reshuffled: RankedProduct[] = []
      let frozenIdx = 0
      let unfrozenIdx = 0
      
      for (const item of state.ranked) {
        if (state.frozenIds.has(item.product_id)) {
          reshuffled.push(frozen[frozenIdx++])
        } else {
          reshuffled.push(unfrozen[unfrozenIdx++])
        }
      }
      
      return { ...state, ranked: reshuffled }
    
    case 'RESET_QUIZ':
      return {
        ...initialState,
        userId: state.userId,
        today: new Date().toISOString().split('T')[0],
      }
    
    default:
      return state
  }
}

// Context
const AppContext = createContext<AppContextType | null>(null)

// Provider component
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Helper: Toggle freeze
  const toggleFreeze = useCallback((productId: string) => {
    dispatch({ type: 'TOGGLE_FREEZE', payload: productId })
  }, [])

  // Helper: Reshuffle unfrozen
  const reshuffleUnfrozen = useCallback(() => {
    dispatch({ type: 'RESHUFFLE_UNFROZEN' })
  }, [])

  // Helper: Load more products
  const loadMore = useCallback(async () => {
    if (state.loading.fetchRanking || state.loading.replenish) return

    try {
      dispatch({ type: 'SET_LOADING', payload: { key: 'fetchRanking', value: true } })
      
      // Try to get more from current ranking
      const newOffset = state.offset + 20
      const response = await api.getRanking(
        state.userId,
        state.today,
        20,
        newOffset
      )

      if (response.top.length > 0) {
        dispatch({ type: 'APPEND_RANKED', payload: response.top })
        dispatch({ type: 'SET_OFFSET', payload: newOffset })
        dispatch({ type: 'SET_HAS_MORE', payload: response.has_more })
      } else if (!response.has_more) {
        // Need to replenish
        dispatch({ type: 'SET_LOADING', payload: { key: 'replenish', value: true } })
        
        // Get all shown product IDs
        const excludeIds = state.ranked.map(p => p.product_id)
        
        await api.replenishRanking(state.userId, state.today, excludeIds)
        
        // Fetch the new products
        const newRanking = await api.getRanking(
          state.userId,
          state.today,
          20,
          state.offset
        )
        
        if (newRanking.top.length > 0) {
          dispatch({ type: 'APPEND_RANKED', payload: newRanking.top })
          dispatch({ type: 'SET_HAS_MORE', payload: newRanking.has_more })
        }
        
        dispatch({ type: 'SET_LOADING', payload: { key: 'replenish', value: false } })
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load more products' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'fetchRanking', value: false } })
    }
  }, [state.loading, state.offset, state.userId, state.today, state.ranked])

  const value: AppContextType = {
    state,
    dispatch,
    toggleFreeze,
    reshuffleUnfrozen,
    loadMore,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// Hook to use context
export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
