import { useState } from 'react'
import { DailyFortuneQuestions } from '../components/DailyFortune/DailyFortuneQuestions'
import { QUESTIONS } from '../components/DailyFortune/question-data'
// (no direct type usage imported)
import { useBuyerAttributes } from '@shopify/shop-minis-react'
import { useApp } from '../context/AppContext'
import { api } from '../services/api'

export function QuizPage() {
  const { state, dispatch } = useApp()
  const [submitting, setSubmitting] = useState(false)
  const { buyerAttributes } = useBuyerAttributes()
  const genderAffinity = (buyerAttributes as any)?.genderAffinity || (buyerAttributes as any)?.gender || null

  const firstThree = QUESTIONS.slice(0, 3)

  return (
    <DailyFortuneQuestions
      questions={firstThree}
      onComplete={async (ans) => {
        // Immediately navigate to loading (SliderPage) with no visual delay
        dispatch({ type: 'SET_SCREEN', payload: 'loading' })
        if (submitting) return
        setSubmitting(true)
        try {
          // Map answers to a simple backend-friendly shape
          const answers = ans.map((a, idx) => ({
            qid: idx + 1,
            answer: Array.isArray(a.value)
              ? a.value.join(', ')
              : typeof a.value === 'number'
              ? String(a.value)
              : String(a.value ?? '')
          }))

          dispatch({ type: 'SET_LOADING', payload: { key: 'submitAnswers', value: true } })
          await api.submitResponses(state.userId, state.today, answers as any)

          dispatch({ type: 'SET_LOADING', payload: { key: 'generateQueries', value: true } })
          const queriesResponse = await api.generateQueries(state.userId, state.today, {
            buyerAttributes,
            genderAffinity,
          })
          dispatch({ type: 'SET_QUERIES', payload: queriesResponse.queries })

          // Already navigated above; just finish background setup
        } catch (e) {
          dispatch({ type: 'SET_ERROR', payload: 'Failed to submit responses. Please try again.' })
          // If an error occurs, stay on loading flow but state shows error
        } finally {
          setSubmitting(false)
          dispatch({ type: 'SET_LOADING', payload: { key: 'submitAnswers', value: false } })
          dispatch({ type: 'SET_LOADING', payload: { key: 'generateQueries', value: false } })
        }
      }}
    />
  )
}

export default QuizPage
