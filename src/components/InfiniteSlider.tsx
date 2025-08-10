import React, {ReactNode, useMemo} from 'react'
import './InfiniteSlider.css'

export interface InfiniteSliderProps {
  children: ReactNode | ReactNode[]
  /** Animation duration in seconds for one full cycle */
  durationSeconds?: number
  /** Gap in pixels between items */
  gap?: number
  /** Scroll direction */
  direction?: 'left' | 'right'
  /** Pause animation when user hovers */
  pauseOnHover?: boolean
  /** Optional className for outer wrapper */
  className?: string
  /** Inline style overrides for outer wrapper */
  style?: React.CSSProperties
  /** Class applied to each duplicated item wrapper */
  itemClassName?: string
  /** Style applied to each duplicated item wrapper */
  itemStyle?: React.CSSProperties
  /** How many times to duplicate the children sequence for seamless loop (>=2) */
  duplicates?: number
}

/**
 * InfiniteSlider duplicates its children to create a seamless, infinitely looping marquee.
 * Children should have fixed (or at least stable) widths to avoid layout shift mid-animation.
 */
export const InfiniteSlider: React.FC<InfiniteSliderProps> = ({
  children,
  durationSeconds = 30,
  gap = 24,
  direction = 'right',
  pauseOnHover = false,
  className = '',
  style,
  itemClassName = '',
  itemStyle,
  duplicates = 2,
}) => {
  const items = useMemo(() => React.Children.toArray(children), [children])

  // Ensure at least 2 duplicates for seamless loop
  const safeDuplicates = Math.max(2, duplicates)
  const duplicated = useMemo(() => {
    const arr: ReactNode[] = []
    for (let i = 0; i < safeDuplicates; i++) {
      for (let j = 0; j < items.length; j++) {
        const original = items[j]
        // Mark duplicates beyond first set as aria-hidden to reduce verbosity for screen readers
        arr.push(
          i === 0 ? (
            original
          ) : (
            <span aria-hidden key={`dup-${i}-${j}`}>{original}</span>
          )
        )
      }
    }
    return arr
  }, [items, safeDuplicates])

  return (
    <div
      className={[
        'infinite-slider',
        direction === 'right' ? 'infinite-slider--reverse' : '',
        pauseOnHover ? 'infinite-slider--pause-on-hover' : '',
        className,
      ].join(' ')}
      style={style}
    >
      <div
        className="infinite-slider__track"
        style={{
          // Duration proportional to content length: allow consumer override by passing durationSeconds
          ['--duration' as any]: `${durationSeconds}s`,
          columnGap: gap, // for future-proof even though we set marginRight below
        }}
      >
  {duplicated.map((child, idx) => (
          <div
            className={["infinite-slider__item", itemClassName].filter(Boolean).join(' ')}
            style={{marginRight: gap, ...itemStyle}}
            key={idx}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}

export default InfiniteSlider
