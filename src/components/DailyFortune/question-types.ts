export interface BaseQuestion {
  id: string
  type: "slider" | "single-choice" | "multiple-choice"
  title: string
  subtitle?: string
}

export interface SliderQuestion extends BaseQuestion {
  type: "slider"
  min: number
  max: number
  step: number
  leftLabel: string
  rightLabel: string
  defaultValue: number
}

export interface SingleChoiceQuestion extends BaseQuestion {
  type: "single-choice"
  options: Array<{
    id: string
    label: string
    emoji?: string
    color?: string
  }>
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multiple-choice"
  maxSelections?: number
  options: Array<{
    id: string
    label: string
    emoji?: string
    color?: string
  }>
}

export type Question = SliderQuestion | SingleChoiceQuestion | MultipleChoiceQuestion

export interface QuestionAnswer {
  questionId: string
  value: number | string | string[]
}
