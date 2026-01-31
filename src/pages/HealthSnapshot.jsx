import { useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import html2pdf from 'html2pdf.js'
import { useTestResults } from '../context/TestResultsContext'

function ResultCard({ title, icon, status, children, color = 'sky' }) {
  const colorClasses = {
    sky: 'bg-sky-50 border-sky-200',
    emerald: 'bg-emerald-50 border-emerald-200',
    violet: 'bg-violet-50 border-violet-200',
    amber: 'bg-amber-50 border-amber-200',
    purple: 'bg-purple-50 border-purple-200',
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

function ContrastSensitivityResult({ data }) {
  if (!data) {
    return (
      <p className="text-sm text-slate-500">
        Complete the contrast sensitivity test to see results.
      </p>
    )
  }

  const getInterpretation = (logCS) => {
    if (logCS >= 1.2) return { text: 'Excellent sensitivity', color: 'emerald' }
    if (logCS >= 0.9) return { text: 'Good sensitivity', color: 'emerald' }
    if (logCS >= 0.6) return { text: 'Mild reduction', color: 'amber' }
    if (logCS >= 0.3) return { text: 'Moderate reduction', color: 'amber' }
    return { text: 'Reduced sensitivity', color: 'red' }
  }

  const interpretation = getInterpretation(data.logCS)

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-amber-600">{data.logCS.toFixed(2)}</span>
        <span className="text-sm text-slate-500">logCS</span>
      </div>
      <p className="text-sm text-slate-600">
        Level {data.level} of {data.maxLevel} achieved
      </p>
      <p className={`text-sm text-${interpretation.color}-600`}>
        {interpretation.color === 'emerald' && '✓ '}{interpretation.text}
      </p>
    </div>
  )
}

function AmslerGridResult({ data }) {
  if (!data) {
    return (
      <p className="text-sm text-slate-500">
        Complete the Amsler grid test to see results.
      </p>
    )
  }

  const issueLabels = {
    missing: 'Missing or blank areas',
    wavy: 'Wavy or bent lines',
    blurry: 'Blurry or unclear areas',
    distorted: 'Distorted squares',
  }

  const reportedIssues = data.answers 
    ? Object.entries(data.answers).filter(([, v]) => v).map(([k]) => issueLabels[k])
    : []

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-bold ${data.hasIssues ? 'text-amber-600' : 'text-purple-600'}`}>
          {data.hasIssues ? 'Concerns Noted' : 'Normal'}
        </span>
      </div>
      {data.hasIssues && reportedIssues.length > 0 && (
        <ul className="text-sm text-slate-600 list-disc list-inside">
          {reportedIssues.map((issue, i) => (
            <li key={i}>{issue}</li>
          ))}
        </ul>
      )}
      {data.hasIssues ? (
        <p className="text-sm text-amber-600">Recommend professional evaluation</p>
      ) : (
        <p className="text-sm text-emerald-600">✓ No distortions detected</p>
      )}
    </div>
  )
}

function HistoryChart({ history }) {
  if (history.length < 2) return null

  // Filter sessions with visual acuity data
  const sessions = history
    .filter(s => s.visualAcuity)
    .slice(0, 5)
    .reverse()

  if (sessions.length < 2) return null

  // Calculate trend text
  const oldest = sessions[0]
  const newest = sessions[sessions.length - 1]
  let trendText = null
  
  if (oldest.visualAcuity && newest.visualAcuity) {
    const oldSnellen = oldest.visualAcuity.snellen
    const newSnellen = newest.visualAcuity.snellen
    const oldLevel = oldest.visualAcuity.level
    const newLevel = newest.visualAcuity.level
    
    if (newLevel > oldLevel) {
      trendText = `Your visual acuity improved from ${oldSnellen} to ${newSnellen}`
    } else if (newLevel < oldLevel) {
      trendText = `Your visual acuity changed from ${oldSnellen} to ${newSnellen}`
    } else {
      trendText = `Your visual acuity has remained stable at ${newSnellen}`
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
      <h3 className="font-semibold text-slate-800 mb-3">Your Progress</h3>
      <div className="flex items-end justify-between h-24 gap-2">
        {sessions.map((session) => (
          <div key={session.id} className="flex-1 flex flex-col items-center">
            <div
              className="w-full bg-sky-400 rounded-t"
              style={{ height: `${(session.visualAcuity.level / 10) * 100}%` }}
            />
            <span className="text-xs text-slate-500 mt-1">
              {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 text-center mt-2">Visual acuity over time</p>
      {trendText && (
        <p className="text-sm text-sky-600 text-center mt-2 font-medium">{trendText}</p>
      )}
    </div>
  )
}

export default function HealthSnapshot() {
  const { results, hasAnyResults, clearResults, history, saveToHistory, clearHistory } = useTestResults()
  const reportRef = useRef(null)

  const getOverallStatus = useCallback(() => {
    const tests = [results.visualAcuity, results.colorVision, results.contrastSensitivity, results.amslerGrid, results.eyePhoto]
    const completed = tests.filter(Boolean).length
    
    if (completed === 0) return { status: 'none', message: 'No tests completed' }
    if (completed === 5) return { status: 'complete', message: 'All tests complete' }
    return { status: 'partial', message: `${completed}/5 tests complete` }
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

    if (results.amslerGrid) {
      if (results.amslerGrid.hasIssues) {
        recommendations.push('Schedule an eye exam for macular evaluation')
      }
    }

    if (results.contrastSensitivity) {
      if (results.contrastSensitivity.logCS < 0.6) {
        recommendations.push('Get a professional evaluation for contrast sensitivity')
      } else if (results.contrastSensitivity.logCS < 0.9) {
        recommendations.push('Discuss contrast sensitivity with your eye doctor')
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
      title: 'VisionCheck AI - Eye Health Snapshot',
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
    let text = '👁️ VisionCheck AI - Eye Health Snapshot\n\n'
    
    if (results.visualAcuity) {
      text += `📖 Visual Acuity: ${results.visualAcuity.snellen}\n`
    }
    
    if (results.colorVision) {
      text += `🎨 Color Vision: ${results.colorVision.correctCount}/${results.colorVision.totalPlates} correct\n`
    }

    if (results.contrastSensitivity) {
      text += `🔆 Contrast Sensitivity: ${results.contrastSensitivity.logCS.toFixed(2)} logCS\n`
    }

    if (results.amslerGrid) {
      text += `# Amsler Grid: ${results.amslerGrid.hasIssues ? 'Concerns Noted' : 'Normal'}\n`
    }
    
    if (results.eyePhoto) {
      text += `📸 AI Eye Analysis: Complete\n`
    }
    
    text += `\n📋 Recommendation: ${getRecommendation()}\n`
    text += `\n⚠️ This is a screening tool only, not a medical diagnosis.\n`
    text += `\nTry it at: ${window.location.origin}`
    
    return text
  }

  const handleDownloadPDF = useCallback(async () => {
    // Create a styled container for the PDF
    const element = document.createElement('div')
    element.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 40px; max-width: 600px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #0ea5e9; margin: 0;">👁️ VisionCheck AI</h1>
          <p style="color: #64748b;">Mobile Eye Health Pre-Screening</p>
          <p style="color: #94a3b8; font-size: 14px;">${new Date().toLocaleDateString()}</p>
        </div>
        
        ${results.visualAcuity ? `
          <div style="background: #f0f9ff; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0;">📖 Visual Acuity</h3>
            <p style="font-size: 32px; font-weight: bold; color: #0ea5e9; margin: 0;">
              ${results.visualAcuity.snellen}
            </p>
            <p style="color: #64748b; margin: 5px 0 0 0;">
              Level ${results.visualAcuity.level} of ${results.visualAcuity.maxLevel}
            </p>
          </div>
        ` : ''}
        
        ${results.colorVision ? `
          <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0;">🎨 Color Vision</h3>
            <p style="font-size: 32px; font-weight: bold; color: #10b981; margin: 0;">
              ${results.colorVision.correctCount}/${results.colorVision.totalPlates}
            </p>
            <p style="color: #64748b; margin: 5px 0 0 0;">
              ${results.colorVision.message || 'plates correct'}
            </p>
          </div>
        ` : ''}
        
        ${results.contrastSensitivity ? `
          <div style="background: #fffbeb; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0;">🔆 Contrast Sensitivity</h3>
            <p style="font-size: 32px; font-weight: bold; color: #f59e0b; margin: 0;">
              ${results.contrastSensitivity.logCS.toFixed(2)}
            </p>
            <p style="color: #64748b; margin: 5px 0 0 0;">
              logCS - Level ${results.contrastSensitivity.level} of ${results.contrastSensitivity.maxLevel}
            </p>
          </div>
        ` : ''}
        
        ${results.amslerGrid ? `
          <div style="background: #faf5ff; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0;"># Amsler Grid</h3>
            <p style="font-size: 32px; font-weight: bold; color: ${results.amslerGrid.hasIssues ? '#f59e0b' : '#a855f7'}; margin: 0;">
              ${results.amslerGrid.hasIssues ? 'Concerns Noted' : 'Normal'}
            </p>
            <p style="color: #64748b; margin: 5px 0 0 0;">
              ${results.amslerGrid.message || 'Macular degeneration screening'}
            </p>
          </div>
        ` : ''}
        
        ${results.eyePhoto ? `
          <div style="background: #faf5ff; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0;">📸 AI Eye Analysis</h3>
            <p style="color: #64748b; white-space: pre-wrap; font-size: 14px;">
              ${results.eyePhoto.analysis?.substring(0, 500)}...
            </p>
          </div>
        ` : ''}
        
        <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 12px; padding: 20px; margin-top: 30px;">
          <p style="color: #92400e; font-size: 12px; margin: 0;">
            <strong>Disclaimer:</strong> This is a screening tool for educational purposes only.
            It is NOT a medical diagnosis. Please consult an eye care professional for accurate assessment.
          </p>
        </div>
        
        <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
          Generated by VisionCheck AI • ${window.location.origin}
        </p>
      </div>
    `
    
    const opt = {
      margin: 10,
      filename: `visioncheck-report-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }
    
    await html2pdf().set(opt).from(element).save()
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
              <h2 className="text-xl font-bold">VisionCheck AI</h2>
              <p className="text-white/80 text-sm">Mobile Eye Health Pre-Screening</p>
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

        {/* History Chart */}
        <HistoryChart history={history} />

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
            title="Contrast Sensitivity"
            icon="🔆"
            color="amber"
            status={results.contrastSensitivity ? 
              (results.contrastSensitivity.logCS >= 0.9 ? 'complete' : 'warning') : 
              'pending'
            }
          >
            <ContrastSensitivityResult data={results.contrastSensitivity} />
          </ResultCard>

          <ResultCard
            title="Amsler Grid"
            icon="#"
            color="purple"
            status={results.amslerGrid ? 
              (results.amslerGrid.hasIssues ? 'warning' : 'complete') : 
              'pending'
            }
          >
            <AmslerGridResult data={results.amslerGrid} />
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
            onClick={handleDownloadPDF}
            className="w-full py-4 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
          >
            <span>📄</span> Download PDF Report
          </button>

          <button
            onClick={() => {
              saveToHistory()
              alert('Session saved to history!')
            }}
            disabled={!results.visualAcuity && !results.colorVision && !results.contrastSensitivity && !results.amslerGrid}
            className="w-full py-4 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>📊</span> Save to History
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

          {history.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear all session history?')) {
                  clearHistory()
                }
              }}
              className="w-full py-3 text-slate-400 font-medium hover:text-slate-500 transition-colors text-center"
            >
              Clear History ({history.length} sessions)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
