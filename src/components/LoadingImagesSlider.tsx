import InfiniteSlider from './InfiniteSlider'
import React from 'react'

export interface LoadingImagesSliderProps {
  direction?: 'left' | 'right'
  images: string[]
  durationSeconds?: number
  gap?: number
  className?: string
  itemClassName?: string
}

/**
 * Reusable slider for loading state images.
 */
export const LoadingImagesSlider: React.FC<LoadingImagesSliderProps> = ({
  direction = 'right',
  images,
  durationSeconds = 20,
  gap = 28,
  className = '',
  itemClassName = 'flex items-center justify-center overflow-visible',
}) => {
  return (
    <InfiniteSlider
      durationSeconds={durationSeconds}
      gap={gap}
      duplicates={12}
      direction={direction}
      className={['mx-auto', className].filter(Boolean).join(' ')}
      itemClassName={itemClassName}
    >
      {images.map((src, i) => (
        <div
          key={`${direction}-${i}`}
          className="relative h-60 sm:h-44 md:h-48 flex items-center justify-center overflow-hidden rounded-xl"
          style={{paddingLeft: '2px', paddingRight: '2px', paddingTop: '2px', paddingBottom: '2px'}}
        >
          <img
            src={src}
            alt={`Loading state ${i + 1}`}
            loading="lazy"
            className="select-none h-full w-auto object-contain"
            draggable={false}
          />
          {/* overlay masks to crop exactly 2px on each side visually (optional, kept minimal) */}
          <span className="pointer-events-none absolute inset-y-0 left-0 w-[2px] bg-blue-900" />
          <span className="pointer-events-none absolute inset-y-0 right-0 w-[2px] bg-blue-900" />
        </div>
      ))}
    </InfiniteSlider>
  )
}

export default LoadingImagesSlider
