import { useState } from "react"
import type { SliderQuestion } from "./question-types"

interface SliderQuestionProps {
  question: SliderQuestion
  value?: number
  onChange: (value: number) => void
}

export function SliderQuestionComponent({ question, value = question.defaultValue, onChange }: SliderQuestionProps) {
  const [currentValue, setCurrentValue] = useState(value)

  const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(event.target.value)
    setCurrentValue(val)
    onChange(val)
  }

  return (
    <div className="space-y-8 px-4">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold text-gray-900 leading-tight">{question.title}</h2>
        {question.subtitle && <p className="text-gray-600 text-lg">{question.subtitle}</p>}
      </div>

      <div className="space-y-8 mt-12">
        <div className="flex justify-between text-sm text-gray-500 px-2">
          <span className="text-base font-medium">{question.leftLabel}</span>
          <span className="text-base font-medium">{question.rightLabel}</span>
        </div>

        {/* Custom styled range slider for mobile */}
        <div className="relative">
          <input
            type="range"
            min={question.min}
            max={question.max}
            step={question.step}
            value={currentValue}
            onChange={handleValueChange}
            className="w-full h-3 bg-gray-200 rounded-lg touch-button"
            style={{
              background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((currentValue - question.min) / (question.max - question.min)) * 100}%, #e5e7eb ${((currentValue - question.min) / (question.max - question.min)) * 100}%, #e5e7eb 100%)`
            }}
          />
        </div>

        <div className="text-center mt-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full">
            <span className="text-2xl font-bold text-indigo-600">{currentValue}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
