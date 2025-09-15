

export function TooltipOverlay({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-8 flex flex-col items-center relative animate-fade-in">
        <h2 className="text-2xl font-bold mb-4 gold-title text-purple-700">Welcome to Shopify Divination!</h2>
        <ul className="text-gray-800 text-base mb-6 list-disc list-inside space-y-2 text-left">
          <li>Swipe or tap cards to explore your personalized product fortune.</li>
          <li>Use the swap button to move your favorite card to the top spot.</li>
          <li>Answer a few fun questions to refine your results.</li>
          <li>Share your fortune with friends at the end!</li>
        </ul>
        <button
          onClick={onDismiss}
          className="mt-4 px-6 py-2 rounded-full bg-purple-600 text-white font-semibold shadow hover:bg-purple-700 transition-all focus:outline-none focus:ring-2 focus:ring-purple-400"
        >
          <span className="gold-title">
            Got it!
          </span>
        </button>
      </div>
    </div>
  )
}
