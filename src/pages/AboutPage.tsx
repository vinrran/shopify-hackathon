export function AboutPage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">About</h1>
      <p className="text-sm text-gray-600">This is a stub About page. Add your own content here.</p>
      <button
        onClick={() => { window.location.hash = 'quiz' }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 active:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300"
      >
        Get Started
      </button>
    </div>
  )
}

export default AboutPage
