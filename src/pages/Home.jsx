import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-b from-sky-50 to-white">
      {/* Header */}
      <header className="pt-12 pb-8 px-6 text-center">
        <div className="text-6xl mb-4">👁️</div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">EyeCheck</h1>
        <p className="text-slate-600">Preliminary Eye Health Assessment</p>
      </header>

      {/* Medical Disclaimer */}
      <div className="mx-6 mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <div className="flex gap-3">
          <span className="text-amber-600 text-xl">⚠️</span>
          <div>
            <p className="text-sm text-amber-800 font-medium mb-1">Medical Disclaimer</p>
            <p className="text-sm text-amber-700">
              This app is for <strong>educational screening purposes only</strong> and is 
              <strong> NOT a medical diagnosis</strong>. Results are approximate and should not 
              replace professional eye care. Always consult a qualified eye care professional 
              for accurate assessment and treatment.
            </p>
          </div>
        </div>
      </div>

      {/* Test Options */}
      <div className="px-6 space-y-4">
        <Link
          to="/visual-acuity"
          className="block p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-sky-100 rounded-xl flex items-center justify-center text-2xl">
              📖
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-800">Visual Acuity Test</h2>
              <p className="text-sm text-slate-500">Test how clearly you can see at distance</p>
            </div>
            <div className="text-slate-400">→</div>
          </div>
        </Link>

        <Link
          to="/color-vision"
          className="block p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl">
              🎨
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-800">Color Vision Test</h2>
              <p className="text-sm text-slate-500">Check for color vision deficiencies</p>
            </div>
            <div className="text-slate-400">→</div>
          </div>
        </Link>

        <Link
          to="/eye-photo"
          className="block p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-violet-100 rounded-xl flex items-center justify-center text-2xl">
              📸
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-800">Eye Photo Analysis</h2>
              <p className="text-sm text-slate-500">AI analysis of your eye photo</p>
            </div>
            <div className="text-slate-400">→</div>
          </div>
        </Link>

        <Link
          to="/results"
          className="block p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-rose-100 rounded-xl flex items-center justify-center text-2xl">
              📋
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-800">View Results</h2>
              <p className="text-sm text-slate-500">See your eye health snapshot</p>
            </div>
            <div className="text-slate-400">→</div>
          </div>
        </Link>
      </div>

      {/* Footer */}
      <footer className="mt-12 pb-8 px-6 text-center">
        <div className="max-w-md mx-auto">
          <p className="text-sm text-slate-400 mb-2">
            Built for educational purposes only
          </p>
          <p className="text-xs text-slate-300">
            EyeCheck v1.0 | Not intended for medical diagnosis
          </p>
        </div>
      </footer>
    </div>
  )
}
