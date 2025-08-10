// Main flow orchestrator component
import React, { useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { QuizPage } from '../pages/QuizPage'
import { CardLoadingPage } from '../pages/CardLoadingPage'
import { FanCarouselPage } from '../pages/FanCarouselPage'
import { SliderPage } from '../pages/SliderPage'

export function MainFlow() {
  const { state } = useApp()

  // Render different screens based on current state
  switch (state.currentScreen) {
    case 'quiz':
      return <QuizPage />
    
    case 'loading':
      return <SliderPage />
    
    case 'card':
      return <CardLoadingPage />

    case 'fan':
      return <FanCarouselPage />
    
    default:
      return <QuizPage />
  }
}
