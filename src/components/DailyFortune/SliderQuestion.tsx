import { useState, useCallback, useRef, useEffect } from "react"
import type { SliderQuestion } from "./question-types"
import { getDynamicTitleSize, getDynamicSubtitleSize } from "./text-utils"
import '../DailyFortune/SliderQuestion.css'

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

  /* ---------------------- Arch (Arc) Slider internals ---------------------- */
  // visual
  const radius = 135 // px
  const strokeWidth = 14
  const startAngle = Math.PI // 180° (left)
  const endAngle = 0         // 0° (right)
  const sweepAngle = startAngle - endAngle
  const svgWidth = radius * 2
  const svgHeight = radius + strokeWidth * 1.5

  // path + dash progress
  const pathRef = useRef<SVGPathElement | null>(null)
  const [pathLength, setPathLength] = useState(1)
  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength())
    }
  }, [])

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))
  const snapToStep = (n: number) => {
    const stepped = Math.round((n - question.min) / question.step) * question.step + question.min
    return clamp(stepped, question.min, question.max)
  }

  const valueFraction = (currentValue - question.min) / (question.max - question.min)
  const currentAngle = startAngle - valueFraction * sweepAngle
  const thumbX = radius + radius * Math.cos(currentAngle)
  const thumbY = radius + radius * Math.sin(currentAngle)
  
  // Mirror thumb position (flip across the horizontal center line)
  const mirrorThumbX = thumbX
  const mirrorThumbY = radius - (thumbY - radius) // Mirror across y = radius line
  
  const progressLength = pathLength * valueFraction

  const svgRef = useRef<SVGSVGElement | null>(null)
  const draggingRef = useRef(false)

  const updateFromPointer = useCallback((clientX: number, clientY: number, svg: SVGSVGElement) => {
    const rect = svg.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    const dx = x - radius
    const dy = y - radius
    let angle = Math.atan2(dy, dx) // -PI..PI

    // constrain to top semicircle
    if (angle > 0) angle = 0
    if (angle < -Math.PI) angle = -Math.PI

    // convert angle to fraction across the semi-circle (PI → 0 maps to 0 → 1)
    const frac = (Math.PI - Math.abs(angle)) / Math.PI
    const rawVal = question.min + frac * (question.max - question.min)
    const newVal = snapToStep(rawVal)

    setCurrentValue(newVal)
    onChange(newVal)
  }, [onChange, question.max, question.min, question.step])

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
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    updateFromPointer(e.clientX, e.clientY, svgRef.current)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      const newVal = snapToStep(currentValue - question.step)
      setCurrentValue(newVal); onChange(newVal)
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      const newVal = snapToStep(currentValue + question.step)
      setCurrentValue(newVal); onChange(newVal)
    }
  }
  /* ------------------------------------------------------------------------ */

  return (
    <div className="space-y-8 px-4 df-range -mx-4">
      <div className="text-center space-y-3 pt-4">
        <div className="bg-black/30 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-xl h-[25vh] min-h-[160px] max-h-[220px] flex flex-col justify-center overflow-hidden">
          <h2 className="white-title">{question.title}</h2>
          {question.subtitle && <p className={`text-white/95 ${getDynamicSubtitleSize(question.subtitle)} drop-shadow-md mt-2 font-medium`} style={{fontFamily: "'Castoro Titling', serif"}}>{question.subtitle}</p>}
        </div>
      </div>

      <div className="space-y-6 mt-2">
        <div className="flex justify-between px-4">
          <span className="text-xl font-bold text-white bg-black/40 px-3 py-2 rounded-full border border-white/20 backdrop-blur-sm drop-shadow-lg" style={{fontFamily: "'Castoro Titling', serif"}}>{question.leftLabel}</span>
          <span className="text-xl font-bold text-white bg-black/40 px-3 py-2 rounded-full border border-white/20 backdrop-blur-sm drop-shadow-lg" style={{fontFamily: "'Castoro Titling', serif"}}>{question.rightLabel}</span>
        </div>

        {/* === Arch Slider (replaces straight horizontal slider) === */}
        <div className="w-full max-w-md mx-auto px-4 mt-15">
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
                  stroke="rgba(255,205,97,0.25)"  /* amber-200 @ 25% */
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeLinecap="round"
                />
                {/* Progress arc */}
                <path
                  d={`M 0 ${radius} A ${radius} ${radius} 0 0 1 ${radius * 2} ${radius}`}
                  stroke="#ffcd61" /* amber progress */
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${progressLength} ${pathLength - progressLength}`}
                />
                {/* Center value inside (aligned with background inner circle) */}
                <text
                  x={radius}
                  y={radius + 45}
                  fill="#ffcd61"
                  fontSize={40}
                  fontWeight={700}
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {currentValue}
                </text>
                {/* Original Thumb (smaller) */}
                <g transform={`translate(${thumbX},${thumbY})`}>
                  <circle r={strokeWidth * 0.9 -5} fill="#ffcd61" />
                  <circle r={strokeWidth * 0.5 - 2} fill="white" />
                </g>
                {/* Mirrored Thumb */}
                <g transform={`translate(${mirrorThumbX},${mirrorThumbY})`}>
                  <circle r={strokeWidth * 0.9} fill="#ffcd61" />
                  <circle r={strokeWidth * 0.5} fill="white" />
                </g>
              </svg>
            </div>
          </div>

          {/* Hidden native range for accessibility/fallback (kept functional) */}
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

        {/* Numeric bubble removed; number rendered inside the inner circle */}
      </div>
    </div>
  )
}
