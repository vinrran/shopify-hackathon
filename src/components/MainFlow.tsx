// Main flow orchestrator component
import React, { useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { QuizScreen } from './QuizScreen'
import { LoadingBridge } from './LoadingBridge'
import { ResultsScreen } from './ResultsScreen'

export function MainFlow() {
  const { state } = useApp()

  // Render different screens based on current state
  switch (state.currentScreen) {
    case 'quiz':
      return <QuizScreen />
    
    case 'loading':
      return <LoadingBridge />
    
    case 'results':
      return <ResultsScreen />
    
    default:
      return <QuizScreen />
  }
}
