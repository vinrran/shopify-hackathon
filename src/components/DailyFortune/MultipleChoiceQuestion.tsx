import { useState } from "react"
import type { MultipleChoiceQuestion } from "./question-types"

interface MultipleChoiceQuestionProps {
  question: MultipleChoiceQuestion
  value?: string[]
  onChange: (value: string[]) => void
}

export function MultipleChoiceQuestionComponent({ question, value = [], onChange }: MultipleChoiceQuestionProps) {
  const [selected, setSelected] = useState<string[]>(value)

  const handleToggle = (optionId: string) => {
    let newSelected: string[]

    if (selected.includes(optionId)) {
      newSelected = selected.filter((id) => id !== optionId)
    } else {
      if (question.maxSelections && selected.length >= question.maxSelections) {
        return // Don't add if max reached
      }
      newSelected = [...selected, optionId]
    }

    setSelected(newSelected)
    onChange(newSelected)
  }

  return (
    <div className="space-y-8 px-4">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold text-gray-900 leading-tight">{question.title}</h2>
        {question.subtitle && <p className="text-gray-600 text-lg">{question.subtitle}</p>}
        {question.maxSelections && (
          <p className="text-sm text-indigo-600 font-medium bg-indigo-50 px-4 py-2 rounded-full inline-block">
            {selected.length} of {question.maxSelections} selected
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-12">
        {question.options.map((option) => {
          const isSelected = selected.includes(option.id)
          const isDisabled = question.maxSelections ? !isSelected && selected.length >= question.maxSelections : false

          return (
            <button
              key={option.id}
              disabled={isDisabled}
              onClick={() => handleToggle(option.id)}
              className={`touch-button relative h-20 flex flex-col items-center justify-center space-y-1 rounded-xl transition-all duration-200 active:scale-95 ${
                option.color ? option.color : "bg-white"
              } ${
                isSelected
                  ? "ring-3 ring-indigo-500 bg-indigo-50 border-2 border-indigo-500 shadow-lg"
                  : isDisabled
                    ? "opacity-50 cursor-not-allowed border-2 border-gray-100 bg-gray-50"
                    : "border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-sm"
              }`}
            >
              {option.emoji && (
                <span className="text-2xl">{option.emoji}</span>
              )}
              <span className="text-xs font-semibold text-gray-800 px-1 text-center leading-tight">
                {option.label}
              </span>
              {isSelected && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
