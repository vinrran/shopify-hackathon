import { useState } from "react"
import type { SingleChoiceQuestion } from "./question-types"

interface SingleChoiceQuestionProps {
  question: SingleChoiceQuestion
  value?: string
  onChange: (value: string) => void
}

export function SingleChoiceQuestionComponent({ question, value, onChange }: SingleChoiceQuestionProps) {
  const [selected, setSelected] = useState<string>(value || "")

  const handleSelect = (optionId: string) => {
    setSelected(optionId)
    onChange(optionId)
  }

  return (
    <div className="space-y-8 px-4">
      <div className="text-center space-y-3">
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-lg">
          <h2 className="text-3xl font-bold text-white drop-shadow-lg leading-tight">{question.title}</h2>
          {question.subtitle && <p className="text-white/90 text-lg drop-shadow-md mt-2">{question.subtitle}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-12">
        {question.options.map((option) => {
          const isSelected = selected === option.id

          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={`touch-button relative h-24 flex flex-col items-center justify-center space-y-2 rounded-xl transition-all duration-200 active:scale-95 backdrop-blur-sm ${
                option.color ? option.color : "bg-white/90"
              } ${
                isSelected
                  ? "ring-4 ring-white bg-white border-2 border-white shadow-2xl scale-105"
                  : "border-2 border-white/50 hover:border-white hover:bg-white/95 shadow-lg hover:shadow-xl"
              }`}
            >
              {option.emoji && (
                <span className="text-3xl mb-1">{option.emoji}</span>
              )}
              <span className="text-sm font-bold text-gray-900 px-2 text-center leading-tight drop-shadow-sm">
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
