// Error toast component for displaying error messages
import React, { useEffect, useState } from 'react'

interface ErrorToastProps {
  message: string
  duration?: number
}

export function ErrorToast({ message, duration = 5000 }: ErrorToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, message])

  if (!isVisible) return null

  return (
    <div className="fixed top-20 left-4 right-4 z-50">
      <div className="bg-red-500 rounded-lg px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1 mr-2">
            <p className="text-white text-sm font-medium">
              {message}
            </p>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 text-white hover:text-red-200"
          >
            <span className="text-lg">×</span>
          </button>
        </div>
      </div>
    </div>
  )
}
