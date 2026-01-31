import { Link } from 'react-router-dom'

export default function VisualAcuityTest() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-slate-100 px-4 py-4 flex items-center gap-4">
        <Link to="/" className="text-slate-400 hover:text-slate-600">
          ← Back
        </Link>
        <h1 className="text-lg font-semibold text-slate-800">Visual Acuity Test</h1>
      </header>

      {/* Content placeholder */}
      <div className="p-6 text-center">
        <div className="text-6xl mb-4">📖</div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Coming Soon</h2>
        <p className="text-slate-500">Visual acuity test will be implemented here.</p>
      </div>
    </div>
  )
}
