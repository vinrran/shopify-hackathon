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
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-lg">
          <h2 className="text-3xl font-bold text-white drop-shadow-lg leading-tight">{question.title}</h2>
          {question.subtitle && <p className="text-white/90 text-lg drop-shadow-md mt-2">{question.subtitle}</p>}
          {question.maxSelections && (
            <p className="text-sm text-white font-bold bg-white/20 px-4 py-2 mt-3 rounded-full inline-block border border-white/30 backdrop-blur-sm">
              {selected.length} of {question.maxSelections} selected
            </p>
          )}
        </div>
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
              className={`touch-button relative h-20 flex flex-col items-center justify-center space-y-1 rounded-xl transition-all duration-200 active:scale-95 backdrop-blur-sm ${
                option.color ? option.color : "bg-white/90"
              } ${
                isSelected
                  ? "ring-4 ring-white bg-white border-2 border-white shadow-2xl scale-105"
                  : isDisabled
                    ? "opacity-40 cursor-not-allowed border-2 border-white/20 bg-white/30"
                    : "border-2 border-white/50 hover:border-white hover:bg-white/95 shadow-lg hover:shadow-xl"
              }`}
            >
              {option.emoji && (
                <span className="text-2xl">{option.emoji}</span>
              )}
              <span className="text-xs font-bold text-gray-900 px-1 text-center leading-tight drop-shadow-sm">
                {option.label}
              </span>
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
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
