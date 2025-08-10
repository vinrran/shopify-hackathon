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
      duplicates={10}
      direction={direction}
      className={['mx-auto', className].filter(Boolean).join(' ')}
      itemClassName={itemClassName}
    >
      {images.map((src, i) => (
        <div
          key={`${direction}-${i}`}
          className="relative h-60 sm:h-44 md:h-48 flex items-center justify-center overflow-hidden rounded-xl"
        >
          <img
            src={src}
            alt={`Loading state ${i + 1}`}
            loading="lazy"
            className="select-none h-full w-auto object-contain"
            draggable={false}
          />
        </div>
      ))}
    </InfiniteSlider>
  )
}

export default LoadingImagesSlider
