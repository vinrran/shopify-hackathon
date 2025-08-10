// Quiz screen for collecting daily answers
import React, { useEffect, useState } from 'react'
import { useBuyerAttributes } from '@shopify/shop-minis-react'
import { useApp } from '../context/AppContext'
import { api } from '../services/api'
import { QuestionCard } from './QuestionCard'
import { ErrorToast } from './ErrorToast'

export function QuizScreen() {
  const { state, dispatch } = useApp()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Get buyer attributes for personalized query generation
  const { buyerAttributes } = useBuyerAttributes()
  
  // Extract gender affinity from buyer attributes (check available properties)
  const genderAffinity = (buyerAttributes as any)?.genderAffinity || (buyerAttributes as any)?.gender || null

  // Fetch questions on mount
  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'questions', value: true } })
    dispatch({ type: 'SET_ERROR', payload: undefined })
    
    try {
      const response = await api.getQuestions()
      // Limit to 3 questions as per requirement
      const questionsToShow = response.questions.slice(0, 3)
      dispatch({ type: 'SET_QUESTIONS', payload: questionsToShow })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load questions. Please try again.' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'questions', value: false } })
    }
  }

  // Check if all questions are answered
  const allAnswered = state.questions.length > 0 && 
    state.questions.every(q => state.answers[q.id] !== undefined)

  // Handle submission
  const handleSubmit = async () => {
    if (!allAnswered || isSubmitting) return

    setIsSubmitting(true)
    dispatch({ type: 'SET_ERROR', payload: undefined })

    try {
      // Prepare answers
      const answers = state.questions.map(q => ({
        qid: q.id,
        answer: state.answers[q.id]
      }))

      // Submit responses
      dispatch({ type: 'SET_LOADING', payload: { key: 'submitAnswers', value: true } })
      await api.submitResponses(state.userId, state.today, answers)
      
      // Generate queries with buyer attributes for personalization
      dispatch({ type: 'SET_LOADING', payload: { key: 'generateQueries', value: true } })
      const queriesResponse = await api.generateQueries(state.userId, state.today, {
        buyerAttributes,
        genderAffinity
      })
      dispatch({ type: 'SET_QUERIES', payload: queriesResponse.queries })
      
      // Move to loading screen for product fetching
      dispatch({ type: 'SET_SCREEN', payload: 'loading' })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to submit responses. Please try again.' })
    } finally {
      setIsSubmitting(false)
      dispatch({ type: 'SET_LOADING', payload: { key: 'submitAnswers', value: false } })
      dispatch({ type: 'SET_LOADING', payload: { key: 'generateQueries', value: false } })
    }
  }

  if (state.loading.questions) {
    return (
      <div className="flex-1 p-4 bg-gray-50">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading questions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 bg-gray-50">
      {state.questions.length > 0 ? (
        <>
          {/* Quiz Title */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 text-center">
              Daily Style Quiz
            </h2>
            <p className="text-sm text-gray-600 text-center mt-2">
              Answer 3 questions to get personalized recommendations
            </p>
          </div>

          {/* Question Cards */}
          <div className="mb-6">
          {state.questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              questionNumber={index + 1}
              selectedAnswer={state.answers[question.id]}
              onAnswerSelect={(answer) => {
                dispatch({
                  type: 'SET_ANSWER',
                  payload: { qid: question.id, answer }
                })
              }}
            />
          ))}
          </div>

          {/* Submit Button */}
          <div className="mt-auto pb-4">
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || isSubmitting}
              className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all ${
                !allAnswered || isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 active:scale-95'
              }`}
            >
              {isSubmitting ? "Processing..." : "Get My Recommendations"}
            </button>
            {isSubmitting && (
              <p className="text-sm text-gray-600 text-center mt-2">
                Generating personalized search queries...
              </p>
            )}
          </div>
        </>
      ) : null}
      {/* Error Toast */}
      {state.error && <ErrorToast message={state.error} />}
    </div>
  )
}
