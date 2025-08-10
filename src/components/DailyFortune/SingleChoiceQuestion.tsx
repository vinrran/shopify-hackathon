import { useState } from "react"
import { Button } from "@shopify/shop-minis-react"
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
        <h2 className="text-3xl font-bold text-gray-900 leading-tight">{question.title}</h2>
        {question.subtitle && <p className="text-gray-600 text-lg">{question.subtitle}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4 mt-12">
        {question.options.map((option) => {
          const isSelected = selected === option.id

          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={`touch-button relative h-24 flex flex-col items-center justify-center space-y-2 rounded-xl transition-all duration-200 active:scale-95 ${
                option.color ? option.color : "bg-white"
              } ${
                isSelected
                  ? "ring-3 ring-indigo-500 bg-indigo-50 border-2 border-indigo-500 shadow-lg"
                  : "border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-sm"
              }`}
            >
              {option.emoji && (
                <span className="text-3xl mb-1">{option.emoji}</span>
              )}
              <span className="text-sm font-semibold text-gray-800 px-2 text-center leading-tight">
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
