import { Link } from 'react-router-dom'

export default function HealthSnapshot() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-slate-100 px-4 py-4 flex items-center gap-4">
        <Link to="/" className="text-slate-400 hover:text-slate-600">
          ← Back
        </Link>
        <h1 className="text-lg font-semibold text-slate-800">Health Snapshot</h1>
      </header>

      {/* Content placeholder */}
      <div className="p-6 text-center">
        <div className="text-6xl mb-4">📋</div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">No Results Yet</h2>
        <p className="text-slate-500 mb-6">Complete at least one test to see your results.</p>
        <Link 
          to="/"
          className="inline-block px-6 py-3 bg-sky-500 text-white font-medium rounded-xl hover:bg-sky-600 transition-colors"
        >
          Start Testing
        </Link>
      </div>
    </div>
  )
}
