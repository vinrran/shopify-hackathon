import React from 'react'

export const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 border-t-blue-600" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-blue-700 tracking-wide">Loading</span>
        </div>
      </div>
      <p className="text-sm text-gray-500">Fetching popular products...</p>
    </div>
  )
}

export default LoadingScreen
