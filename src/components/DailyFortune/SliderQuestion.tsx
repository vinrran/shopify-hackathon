import { useEffect, useRef, useState } from "react"
import type { SliderQuestion } from "./question-types"
import '../DailyFortune/SliderQuestion.css'
import bg from '../../components/sliderbg2.svg'

interface SliderQuestionProps {
  question: SliderQuestion
  value?: number
  onChange: (value: number) => void
}

export function SliderQuestionComponent({ question, value = question.defaultValue, onChange }: SliderQuestionProps) {
  const [currentValue, setCurrentValue] = useState(value)
  const isDragging = useRef(false)
  const svgRef = useRef<SVGSVGElement | null>(null)

  const min = question.min
  const max = question.max
  const startAngle = 180 // degrees (left)
  const endAngle = 0 // degrees (right)
  const size = 280
  const stroke = 14
  const radius = (size / 2) - stroke - 4
  const cx = size / 2
  const cy = size / 2

  // Linear slider handler removed; using pointer-driven arc slider instead

  const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))
  const valueToAngle = (v: number) => startAngle + ((v - min) / (max - min)) * (endAngle - startAngle)
  const angleToValue = (a: number) => {
    const t = (a - startAngle) / (endAngle - startAngle)
    return Math.round(min + t * (max - min))
  }
  const toRad = (deg: number) => (deg - 90) * Math.PI / 180
  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const a = toRad(angleInDegrees)
    return { x: centerX + (r * Math.cos(a)), y: centerY + (r * Math.sin(a)) }
  }
  const describeArc = (x: number, y: number, r: number, start: number, end: number) => {
    const startPt = polarToCartesian(x, y, r, end)
    const endPt = polarToCartesian(x, y, r, start)
    const largeArcFlag = end - start <= 180 ? 0 : 1
    return [
      "M", startPt.x, startPt.y,
      "A", r, r, 0, largeArcFlag, 0, endPt.x, endPt.y
    ].join(" ")
  }

  const updateFromPointer = (clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    const dx = x - cx
    const dy = y - cy
    let ang = Math.atan2(dy, dx) * 180 / Math.PI + 90 // convert to our 0 at top
    if (ang < 0) ang += 360
    // Map to [startAngle..endAngle] across top semicircle
    // Our valid arc is from 180 down to 0
    if (ang > 180) ang = 180
    if (ang < 0) ang = 0
    ang = clamp(ang, endAngle, startAngle)
    const newVal = clamp(angleToValue(ang), min, max)
    setCurrentValue(newVal)
    onChange(newVal)
  }

  useEffect(() => {
    const onMove = (e: PointerEvent) => { if (isDragging.current) updateFromPointer(e.clientX, e.clientY) }
    const onUp = () => { isDragging.current = false }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
  }, [])

  return (
    <div
      className="space-y-8 px-4 df-range min-h-screen -mx-4"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      <div className="text-center space-y-3 pt-10">
        <h2 className="text-3xl font-semibold text-[#ffcd61] leading-tight">{question.title}</h2>
        {question.subtitle && <p className="text-amber-100/80 text-lg">{question.subtitle}</p>}
      </div>

      <div className="space-y-8 mt-8">
        <div className="flex justify-between text-sm px-2 text-amber-100/80">
          <span className="text-base font-medium">{question.leftLabel}</span>
          <span className="text-base font-medium">{question.rightLabel}</span>
        </div>

        {/* Circular arc slider */}
        <div className="relative flex items-center justify-center">
          <svg
            ref={svgRef}
            width={size}
            height={size / 1.2}
            viewBox={`0 0 ${size} ${size/1.2}`}
            onPointerDown={(e) => { isDragging.current = true; updateFromPointer(e.clientX, e.clientY) }}
            className="touch-none select-none"
          >
            {/* Track */}
            <path d={describeArc(cx, cy, radius, startAngle, endAngle)} stroke="rgba(255,205,97,0.25)" strokeWidth={stroke} fill="none" strokeLinecap="round" />
            {/* Progress */}
            <path d={describeArc(cx, cy, radius, startAngle, valueToAngle(currentValue))} stroke="#ffcd61" strokeWidth={stroke} fill="none" strokeLinecap="round" />
            {/* Handle */}
            {(() => {
              const a = valueToAngle(currentValue)
              const p = polarToCartesian(cx, cy, radius, a)
              return (
                <g>
                  <circle cx={p.x} cy={p.y} r={stroke/1.4} fill="#ffcd61" stroke="rgba(0,0,0,0.25)" strokeWidth="2" />
                </g>
              )
            })()}
          </svg>
        </div>

        <div className="text-center mt-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100/20 border border-amber-200/30 rounded-full">
            <span className="text-2xl font-bold text-[#ffcd61]">{currentValue}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
