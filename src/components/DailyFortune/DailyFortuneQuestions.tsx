import { useState, useMemo } from "react"
import bg from '../sliderbg2.svg'
import { QUESTIONS } from "./question-data"
import type { QuestionAnswer, Question } from "./question-types"
import { SliderQuestionComponent } from "./SliderQuestion"
import { SingleChoiceQuestionComponent } from "./SingleChoiceQuestion"
import { MultipleChoiceQuestionComponent } from "./MultipleChoiceQuestion"

interface DailyFortuneQuestionsProps {
  questions?: Question[]
  onComplete?: (answers: Array<{ question: string; value: number | string | string[] }>) => void
}

// Function to randomly select 3 questions from the pool with specific types in order
const getRandomQuestions = (questionPool: Question[]): Question[] => {
  // Filter questions by type
  const multipleChoiceQuestions = questionPool.filter(q => q.type === 'multiple-choice')
  const sliderQuestions = questionPool.filter(q => q.type === 'slider')
  const singleChoiceQuestions = questionPool.filter(q => q.type === 'single-choice')
  
  // Randomly select one from each type
  const randomMultipleChoice = multipleChoiceQuestions[Math.floor(Math.random() * multipleChoiceQuestions.length)]
  const randomSlider = sliderQuestions[Math.floor(Math.random() * sliderQuestions.length)]
  const randomSingleChoice = singleChoiceQuestions[Math.floor(Math.random() * singleChoiceQuestions.length)]
  
  // Return in specific order: multiple choice, slider, single choice (radio)
  return [randomMultipleChoice, randomSlider, randomSingleChoice].filter(Boolean)
}

export function DailyFortuneQuestions({ questions, onComplete }: DailyFortuneQuestionsProps) {
  // Use memoized random selection to ensure consistent questions during the session
  const localQuestions = useMemo(() => {
    if (questions && questions.length > 0) {
      return questions.length > 3 ? getRandomQuestions(questions) : questions
    }
    return getRandomQuestions(QUESTIONS)
  }, [questions])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<QuestionAnswer[]>([])
  const [isTransitioning, setIsTransitioning] = useState(false)

  const currentQuestion = localQuestions[currentQuestionIndex]
  // Progress bar removed per design; we still show question count

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
      const enriched = answers.map(a => {
        const q = localQuestions.find(q => q.id === a.questionId)
        return { question: q?.title || '', value: a.value }
      })
      if (onComplete) {
        onComplete(enriched)
      } else {
        console.log("Answers:", enriched)
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
    <div
      className="min-h-screen overflow-x-hidden"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >

      {/* Question Content */}
      <div className="max-w-md mx-auto px-2 py-4">
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
      <div className="fixed bottom-0 left-0 right-0 bg-[#1A0051] safe-area-inset-bottom">
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
                "Get My Fortune"
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
