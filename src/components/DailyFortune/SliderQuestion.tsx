import { useState, useRef, useEffect, useCallback } from "react"
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

  // Arc slider parameters
  const radius = 140 // px (reduced from 180 to make arc more compact)
  const strokeWidth = 14
  const startAngle = Math.PI // 180° (left)
  const endAngle = 0 // 0° (right)
  const sweepAngle = startAngle - endAngle // PI
  const svgWidth = radius * 2
  const svgHeight = radius + strokeWidth * 1.5 // little extra for stroke
  const pathRef = useRef<SVGPathElement | null>(null)
  const [pathLength, setPathLength] = useState(1)

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength())
    }
  }, [])

  const valueFraction = (currentValue - question.min) / (question.max - question.min)
  const currentAngle = startAngle - valueFraction * sweepAngle
  const thumbX = radius + radius * Math.cos(currentAngle)
  const thumbY = radius + radius * Math.sin(currentAngle)

  const updateFromPointer = useCallback((clientX: number, clientY: number, svg: SVGSVGElement) => {
    const rect = svg.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    const dx = x - radius
    const dy = y - radius
    let angle = Math.atan2(dy, dx) // -PI..PI
    // Only consider top semi-circle (dy <= 0) but allow some tolerance
    if (angle > 0) angle = 0
    if (angle < -Math.PI) angle = -Math.PI
    // Convert angle to 0..1 fraction across semi-circle (PI to 0)
    const frac = (Math.PI - Math.abs(angle)) / Math.PI
    const newVal = Math.round(question.min + frac * (question.max - question.min))
    setCurrentValue(newVal)
    onChange(newVal)
  }, [onChange, question.max, question.min])

  const svgRef = useRef<SVGSVGElement | null>(null)
  const draggingRef = useRef(false)

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (!draggingRef.current || !svgRef.current) return
      updateFromPointer(e.clientX, e.clientY, svgRef.current)
    }
    const stop = () => { draggingRef.current = false }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
    }
  }, [updateFromPointer])

  const startDrag = (e: React.PointerEvent) => {
    if (!svgRef.current) return
    draggingRef.current = true
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    updateFromPointer(e.clientX, e.clientY, svgRef.current)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      const newVal = Math.max(question.min, currentValue - question.step)
      setCurrentValue(newVal); onChange(newVal)
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      const newVal = Math.min(question.max, currentValue + question.step)
      setCurrentValue(newVal); onChange(newVal)
    }
  }

  const progressLength = pathLength * valueFraction

  return (
    <div className="space-y-8 px-4">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold text-gray-900 leading-tight">{question.title}</h2>
        {question.subtitle && <p className="text-gray-600 text-lg">{question.subtitle}</p>}
      </div>

      <div className="space-y-10 mt-10">
        <div className="flex justify-between text-sm text-gray-500 px-2">
          <span className="text-base font-medium select-none">{question.leftLabel}</span>
          <span className="text-base font-medium select-none">{question.rightLabel}</span>
        </div>

        {/* Arc Slider */}
        <div className="w-full flex items-center justify-center select-none">
          <div className="relative" style={{ width: svgWidth, height: svgHeight }}>
            <svg
              ref={svgRef}
              width={svgWidth}
              height={svgHeight}
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="overflow-visible touch-none"
              onPointerDown={startDrag}
              role="slider"
              tabIndex={0}
              aria-valuemin={question.min}
              aria-valuemax={question.max}
              aria-valuenow={currentValue}
              aria-label={question.title}
              onKeyDown={handleKey}
            >
              {/* Background arc */}
              <path
                ref={pathRef}
                d={`M 0 ${radius} A ${radius} ${radius} 0 0 1 ${radius * 2} ${radius}`}
                stroke="#e5e7eb"
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
              />
              {/* Progress arc */}
              <path
                d={`M 0 ${radius} A ${radius} ${radius} 0 0 1 ${radius * 2} ${radius}`}
                stroke="#6366f1"
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${progressLength} ${pathLength - progressLength}`}
              />
              {/* Thumb */}
              <g transform={`translate(${thumbX},${thumbY})`}>
                <circle r={strokeWidth * 0.9} fill="#4f46e5" className="shadow-lg" />
                <circle r={strokeWidth * 0.5} fill="white" />
              </g>
            </svg>
          </div>
        </div>

  {/* Removed visual numeric meter per request; keep value for screen readers */}
  <span className="sr-only" aria-live="polite">{currentValue}</span>
        {/* Hidden conventional input for form compatibility / fallback */}
        <input
          type="range"
          min={question.min}
          max={question.max}
          step={question.step}
          value={currentValue}
          onChange={handleValueChange}
          className="sr-only"
          aria-hidden
        />
      </div>
    </div>
  )
}
