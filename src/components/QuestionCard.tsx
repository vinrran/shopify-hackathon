// Question card component for displaying individual questions
import React from 'react'
import { Question } from '../types'

interface QuestionCardProps {
  question: Question
  questionNumber: number
  selectedAnswer: string | string[] | undefined
  onAnswerSelect: (answer: string | string[]) => void
}

export function QuestionCard({
  question,
  questionNumber,
  selectedAnswer,
  onAnswerSelect,
}: QuestionCardProps) {
  const isSingleChoice = question.type === 'single_choice'

  const handleOptionPress = (option: string) => {
    if (isSingleChoice) {
      // Single choice - just set the option
      onAnswerSelect(option)
    } else {
      // Multi choice - toggle the option
      const currentAnswers = (selectedAnswer as string[]) || []
      const newAnswers = currentAnswers.includes(option)
        ? currentAnswers.filter(a => a !== option)
        : [...currentAnswers, option]
      onAnswerSelect(newAnswers)
    }
  }

  const isOptionSelected = (option: string): boolean => {
    if (isSingleChoice) {
      return selectedAnswer === option
    } else {
      return ((selectedAnswer as string[]) || []).includes(option)
    }
  }

  return (
    <div className="mb-6 bg-white rounded-2xl p-4 shadow-sm">
      {/* Question Header */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-1">
          Question {questionNumber} of 3
        </p>
        <h3 className="text-lg font-semibold text-gray-900">
          {question.prompt}
        </h3>
        <p className="text-xs text-gray-600 mt-1">
          {isSingleChoice ? 'Select one' : 'Select all that apply'}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {question.options.map((option) => (
          <button
            key={option}
            onClick={() => handleOptionPress(option)}
            className={`
              w-full text-left py-3 px-4 rounded-xl border-2 transition-all
              ${isOptionSelected(option)
                ? 'bg-blue-50 border-blue-500'
                : 'bg-white border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-center">
              {/* Checkbox/Radio indicator */}
              <div
                className={`
                  w-5 h-5 mr-3 border-2 flex items-center justify-center
                  ${isSingleChoice ? 'rounded-full' : 'rounded'}
                  ${isOptionSelected(option)
                    ? 'bg-blue-500 border-blue-500'
                    : 'bg-white border-gray-300'
                  }
                `}
              >
                {isOptionSelected(option) && (
                  <span className="text-white text-xs font-bold">✓</span>
                )}
              </div>
              
              {/* Option text */}
              <span
                className={`
                  text-base capitalize
                  ${isOptionSelected(option)
                    ? 'text-blue-900 font-medium'
                    : 'text-gray-700'
                  }
                `}
              >
                {option}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
