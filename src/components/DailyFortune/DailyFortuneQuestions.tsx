import { useState } from "react"
import { QUESTIONS } from "./question-data"
import type { QuestionAnswer, Question } from "./question-types"
import { SliderQuestionComponent } from "./SliderQuestion"
import { SingleChoiceQuestionComponent } from "./SingleChoiceQuestion"
import { MultipleChoiceQuestionComponent } from "./MultipleChoiceQuestion"

interface DailyFortuneQuestionsProps {
  questions?: Question[]
  onComplete?: (answers: QuestionAnswer[]) => void
}

export function DailyFortuneQuestions({ questions, onComplete }: DailyFortuneQuestionsProps) {
  const localQuestions = questions && questions.length > 0 ? questions : QUESTIONS
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<QuestionAnswer[]>([])
  const [isTransitioning, setIsTransitioning] = useState(false)

  const currentQuestion = localQuestions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / localQuestions.length) * 100

  const getCurrentAnswer = () => {
    return answers.find((a) => a.questionId === currentQuestion.id)?.value
  }

  const updateAnswer = (questionId: string, value: number | string | string[]) => {
    setAnswers((prev) => {
      const existing = prev.find((a) => a.questionId === questionId)
      if (existing) {
        return prev.map((a) => (a.questionId === questionId ? { ...a, value } : a))
      }
      return [...prev, { questionId, value }]
    })
  }

  const handleNext = () => {
    if (currentQuestionIndex < localQuestions.length - 1) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => prev + 1)
        setIsTransitioning(false)
      }, 200)
    } else {
      if (onComplete) {
        onComplete(answers)
      } else {
        console.log("Answers:", answers)
        alert("Questions completed! Ready to generate your daily fortune. ✨")
      }
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => prev - 1)
        setIsTransitioning(false)
      }, 200)
    }
  }

  const isAnswered = () => {
    const answer = getCurrentAnswer()
    if (currentQuestion.type === "multiple-choice") {
      return Array.isArray(answer) && answer.length > 0
    }
    return answer !== undefined && answer !== ""
  }

  const renderQuestion = () => {
    const answer = getCurrentAnswer()

    switch (currentQuestion.type) {
      case "slider":
        return (
          <SliderQuestionComponent
            question={currentQuestion}
            value={typeof answer === "number" ? answer : undefined}
            onChange={(value) => updateAnswer(currentQuestion.id, value)}
          />
        )
      case "single-choice":
        return (
          <SingleChoiceQuestionComponent
            question={currentQuestion}
            value={typeof answer === "string" ? answer : undefined}
            onChange={(value) => updateAnswer(currentQuestion.id, value)}
          />
        )
      case "multiple-choice":
        return (
          <MultipleChoiceQuestionComponent
            question={currentQuestion}
            value={Array.isArray(answer) ? answer : undefined}
            onChange={(value) => updateAnswer(currentQuestion.id, value)}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-200/50 z-10">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Daily Shopping Fortune</h1>
              <p className="text-sm text-gray-500">Question {currentQuestionIndex + 1} of {localQuestions.length}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-indigo-600">{Math.round(progress)}%</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-md mx-auto px-2 py-8">
        <div
          className={`transition-all duration-300 ease-in-out ${
            isTransitioning 
              ? "opacity-0 transform translate-y-4" 
              : "opacity-100 transform translate-y-0"
          }`}
        >
          {renderQuestion()}
        </div>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200/50 safe-area-inset-bottom">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className={`touch-button flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                currentQuestionIndex === 0
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100 active:scale-95"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            <button
              onClick={handleNext}
              disabled={!isAnswered()}
              className={`touch-button flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                isAnswered()
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95 shadow-lg"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {currentQuestionIndex === localQuestions.length - 1 ? (
                "Get My Fortune ✨"
              ) : (
                <>
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
