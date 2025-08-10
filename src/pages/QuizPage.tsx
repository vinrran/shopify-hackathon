import {useApp} from '../context/AppContext'
import {QuizScreen} from '../components/QuizScreen'
import {LoadingBridge} from '../components/LoadingBridge'
import {ResultsScreen} from '../components/ResultsScreen'

export function QuizPage() {
  const {state} = useApp()
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-4 py-3 pt-safe">
        <p className="text-center text-xs text-gray-500 uppercase tracking-wide">
          {state.currentScreen === 'quiz' && 'Step 1: Daily Quiz'}
          {state.currentScreen === 'loading' && 'Step 2: Finding Products'}
          {state.currentScreen === 'results' && 'Step 3: Your Collection'}
        </p>
        <h1 className="text-center text-xl font-bold text-gray-900 mt-1">Shop Mini Experience</h1>
      </div>
      <div className="flex-1 overflow-auto">
        {state.currentScreen === 'quiz' && <QuizScreen />}
        {state.currentScreen === 'loading' && <LoadingBridge />}
        {state.currentScreen === 'results' && <ResultsScreen />}
      </div>
      <div className="px-4 py-2 bg-gray-100 border-t border-gray-200">
        <p className="text-xs text-gray-600 text-center">
          Current Screen: {state.currentScreen} | Questions: {state.questions.length} | Products: {state.ranked.length}
        </p>
      </div>
    </div>
  )
}

export default QuizPage
