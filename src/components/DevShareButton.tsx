import React, { useState } from 'react'
import { SimpleShareScreen } from './SimpleShareScreen'

export function DevShareButton() {
  const [showShareScreen, setShowShareScreen] = useState(false)

  // Sample answers for testing the share screen
  const sampleAnswers = [
    { questionId: 'mood-emoji', value: 'sparkles' },
    { questionId: 'energy-level', value: 75 },
    { questionId: 'current-season-feel', value: 'spring' },
    { questionId: 'shopping-style', value: ['trendy', 'sustainable'] },
    { questionId: 'budget-range', value: 'medium' }
  ]

  return (
    <>
      {/* Floating Dev Button - Bottom Left */}
      <div className="fixed bottom-4 left-4 z-[100]">
        <button
          onClick={() => setShowShareScreen(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white w-14 h-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center font-bold text-lg border-2 border-white/20"
          title="Test Share Screen (Dev Mode)"
          aria-label="Open share screen for testing"
        >
          🔗
        </button>
      </div>

      {/* Share Screen Modal */}
      {showShareScreen && (
        <SimpleShareScreen
          answers={sampleAnswers}
          selectedProducts={[]} // Empty to test recommended products fallback
          onClose={() => setShowShareScreen(false)}
        />
      )}
    </>
  )
}
