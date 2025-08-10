import { useState } from 'react'
import { DailyFortuneQuestions } from '../components/DailyFortune/DailyFortuneQuestions'
import { QUESTIONS } from '../components/DailyFortune/question-data'
import type { QuestionAnswer } from '../components/DailyFortune/question-types'

export function QuizPage() {
  const [completed, setCompleted] = useState(false)
  const [collectedAnswers, setCollectedAnswers] = useState<QuestionAnswer[]>([])

  const firstThree = QUESTIONS.slice(0, 3)

  if (completed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Daily Shopping Fortune Ready ✨</h1>
        <p className="text-gray-600 max-w-md mb-8">Thanks for sharing your vibe. Your personalized experience is being crafted.</p>
        <pre className="bg-gray-900 text-indigo-200 text-xs p-4 rounded-lg max-w-md w-full overflow-auto text-left">
{JSON.stringify(collectedAnswers, null, 2)}
        </pre>
        <button onClick={() => { setCompleted(false); setCollectedAnswers([]) }} className="mt-8 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg active:scale-95 transition">
          Retake
        </button>
      </div>
    )
  }

  return <DailyFortuneQuestions questions={firstThree} onComplete={(ans) => { setCollectedAnswers(ans); setCompleted(true) }} />
}

export default QuizPage
