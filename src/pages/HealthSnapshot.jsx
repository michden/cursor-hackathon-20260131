import { useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTestResults } from '../context/TestResultsContext'

function ResultCard({ title, icon, status, children, color = 'sky' }) {
  const colorClasses = {
    sky: 'bg-sky-50 border-sky-200',
    emerald: 'bg-emerald-50 border-emerald-200',
    violet: 'bg-violet-50 border-violet-200',
    amber: 'bg-amber-50 border-amber-200',
  }

  const statusColors = {
    complete: 'text-emerald-600 bg-emerald-100',
    pending: 'text-slate-500 bg-slate-100',
    warning: 'text-amber-600 bg-amber-100',
  }

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <h3 className="font-semibold text-slate-800">{title}</h3>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[status]}`}>
          {status === 'complete' ? 'Complete' : status === 'warning' ? 'Review' : 'Not Done'}
        </span>
      </div>
      {children}
    </div>
  )
}

function VisualAcuityResult({ data }) {
  if (!data) {
    return (
      <p className="text-sm text-slate-500">
        Complete the visual acuity test to see results.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-sky-600">{data.snellen}</span>
        <span className="text-sm text-slate-500">Snellen equivalent</span>
      </div>
      <p className="text-sm text-slate-600">
        Level {data.level} of {data.maxLevel} achieved
      </p>
      {data.level >= 8 && (
        <p className="text-sm text-emerald-600">✓ Normal vision range</p>
      )}
      {data.level >= 5 && data.level < 8 && (
        <p className="text-sm text-amber-600">Consider an eye exam</p>
      )}
      {data.level < 5 && (
        <p className="text-sm text-red-600">Recommend professional evaluation</p>
      )}
    </div>
  )
}

function ColorVisionResult({ data }) {
  if (!data) {
    return (
      <p className="text-sm text-slate-500">
        Complete the color vision test to see results.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-emerald-600">
          {data.correctCount}/{data.totalPlates}
        </span>
        <span className="text-sm text-slate-500">plates correct</span>
      </div>
      <p className="text-sm text-slate-600">
        Red-green plates: {data.redGreenCorrect}/{data.redGreenTotal}
      </p>
      {data.status === 'normal' && (
        <p className="text-sm text-emerald-600">✓ Normal color vision likely</p>
      )}
      {data.status === 'mild_difficulty' && (
        <p className="text-sm text-amber-600">Mild difficulty detected</p>
      )}
      {data.status === 'possible_deficiency' && (
        <p className="text-sm text-red-600">Possible color vision deficiency</p>
      )}
    </div>
  )
}

function EyePhotoResult({ data }) {
  if (!data) {
    return (
      <p className="text-sm text-slate-500">
        Complete the eye photo analysis to see results.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {data.imageData && (
        <div className="flex justify-center">
          <img
            src={data.imageData}
            alt="Analyzed eye"
            className="w-16 h-16 object-cover rounded-full border-2 border-violet-200"
          />
        </div>
      )}
      <div className="text-sm text-slate-600 line-clamp-4">
        {data.analysis?.substring(0, 200)}...
      </div>
      <p className="text-xs text-violet-600">AI analysis complete</p>
    </div>
  )
}

export default function HealthSnapshot() {
  const { results, hasAnyResults, clearResults } = useTestResults()
  const reportRef = useRef(null)

  const getOverallStatus = useCallback(() => {
    const tests = [results.visualAcuity, results.colorVision, results.eyePhoto]
    const completed = tests.filter(Boolean).length
    
    if (completed === 0) return { status: 'none', message: 'No tests completed' }
    if (completed === 3) return { status: 'complete', message: 'All tests complete' }
    return { status: 'partial', message: `${completed}/3 tests complete` }
  }, [results])

  const getRecommendation = useCallback(() => {
    const recommendations = []
    
    if (results.visualAcuity) {
      if (results.visualAcuity.level < 5) {
        recommendations.push('Schedule an eye exam for vision assessment')
      } else if (results.visualAcuity.level < 8) {
        recommendations.push('Consider an eye checkup')
      }
    }
    
    if (results.colorVision) {
      if (results.colorVision.status === 'possible_deficiency') {
        recommendations.push('Get a professional color vision evaluation')
      } else if (results.colorVision.status === 'mild_difficulty') {
        recommendations.push('Discuss color vision with your eye doctor')
      }
    }
    
    if (recommendations.length === 0) {
      if (hasAnyResults()) {
        return 'Your screening results look good! Continue with regular eye care.'
      }
      return 'Complete the tests to get personalized recommendations.'
    }
    
    return recommendations.join('. ') + '.'
  }, [results, hasAnyResults])

  const handleShare = useCallback(async () => {
    const shareData = {
      title: 'EyeCheck - Eye Health Snapshot',
      text: generateShareText(),
      url: window.location.origin,
    }

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err)
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(generateShareText())
        alert('Results copied to clipboard!')
      } catch (err) {
        console.error('Copy failed:', err)
      }
    }
  }, [results])

  const generateShareText = () => {
    let text = '👁️ EyeCheck - Eye Health Snapshot\n\n'
    
    if (results.visualAcuity) {
      text += `📖 Visual Acuity: ${results.visualAcuity.snellen}\n`
    }
    
    if (results.colorVision) {
      text += `🎨 Color Vision: ${results.colorVision.correctCount}/${results.colorVision.totalPlates} correct\n`
    }
    
    if (results.eyePhoto) {
      text += `📸 AI Eye Analysis: Complete\n`
    }
    
    text += `\n📋 Recommendation: ${getRecommendation()}\n`
    text += `\n⚠️ This is a screening tool only, not a medical diagnosis.\n`
    text += `\nTry it at: ${window.location.origin}`
    
    return text
  }

  const handleDownload = useCallback(() => {
    const text = generateShareText()
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `eyecheck-snapshot-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [results])

  const overallStatus = getOverallStatus()

  if (!hasAnyResults()) {
    return (
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 bg-white border-b border-slate-100 px-4 py-4 flex items-center gap-4">
          <Link to="/" className="text-slate-400 hover:text-slate-600">
            ← Back
          </Link>
          <h1 className="text-lg font-semibold text-slate-800">Health Snapshot</h1>
        </header>

        <div className="p-6 text-center max-w-md mx-auto">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">No Results Yet</h2>
          <p className="text-slate-500 mb-6">
            Complete at least one test to see your eye health snapshot.
          </p>
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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 bg-white border-b border-slate-100 px-4 py-4 flex items-center gap-4 z-10">
        <Link to="/" className="text-slate-400 hover:text-slate-600">
          ← Back
        </Link>
        <h1 className="text-lg font-semibold text-slate-800">Health Snapshot</h1>
      </header>

      <div className="p-6 max-w-2xl mx-auto" ref={reportRef}>
        {/* Header Card */}
        <div className="bg-linear-to-br from-sky-500 to-violet-500 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-4xl">👁️</div>
            <div>
              <h2 className="text-xl font-bold">EyeCheck</h2>
              <p className="text-white/80 text-sm">Eye Health Snapshot</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Status</p>
              <p className="font-semibold">{overallStatus.message}</p>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm">Date</p>
              <p className="font-semibold">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="space-y-4 mb-6">
          <ResultCard
            title="Visual Acuity"
            icon="📖"
            color="sky"
            status={results.visualAcuity ? 'complete' : 'pending'}
          >
            <VisualAcuityResult data={results.visualAcuity} />
          </ResultCard>

          <ResultCard
            title="Color Vision"
            icon="🎨"
            color="emerald"
            status={results.colorVision ? 
              (results.colorVision.status === 'normal' ? 'complete' : 'warning') : 
              'pending'
            }
          >
            <ColorVisionResult data={results.colorVision} />
          </ResultCard>

          <ResultCard
            title="AI Eye Analysis"
            icon="📸"
            color="violet"
            status={results.eyePhoto ? 'complete' : 'pending'}
          >
            <EyePhotoResult data={results.eyePhoto} />
          </ResultCard>
        </div>

        {/* Recommendation */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <h3 className="font-semibold text-slate-800 mb-2">📋 Recommendation</h3>
          <p className="text-slate-600">{getRecommendation()}</p>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-amber-800">
            <strong>Important:</strong> This is a screening tool for educational purposes only. 
            It is NOT a medical diagnosis. Please consult an eye care professional for 
            accurate assessment and any health concerns.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleShare}
            className="w-full py-4 bg-sky-500 text-white font-semibold rounded-xl hover:bg-sky-600 transition-colors flex items-center justify-center gap-2"
          >
            <span>📤</span> Share Results
          </button>
          
          <button
            onClick={handleDownload}
            className="w-full py-4 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
          >
            <span>💾</span> Download Summary
          </button>
          
          <Link
            to="/"
            className="block w-full py-4 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors text-center"
          >
            Back to Home
          </Link>

          <button
            onClick={() => {
              if (confirm('Are you sure you want to clear all results?')) {
                clearResults()
              }
            }}
            className="w-full py-3 text-red-500 font-medium hover:text-red-600 transition-colors text-center"
          >
            Clear All Results
          </button>
        </div>
      </div>
    </div>
  )
}
