import bg from './background.svg'
import React from 'react'

interface BackgroundWrapperProps {
  className?: string
  children?: React.ReactNode
  fullScreen?: boolean
}

// Shared background image wrapper (excludes LandingPage)
export const BackgroundWrapper: React.FC<BackgroundWrapperProps> = ({ className = '', children, fullScreen = true }) => {
  return (
    <div
      className={[
        fullScreen ? 'min-h-screen w-full' : 'w-full',
        'relative',
        className,
      ].join(' ')}
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      {children}
    </div>
  )
}

export default BackgroundWrapper
