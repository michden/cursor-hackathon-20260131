import { useRef, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import html2pdf from 'html2pdf.js'
import ReactMarkdown from 'react-markdown'
import { useTranslation } from 'react-i18next'
import { useTestResults } from '../context/TestResultsContext'
import AchievementBadge, { ACHIEVEMENTS } from '../components/AchievementBadge'
import Celebration from '../components/Celebration'
import FindDoctorButton from '../components/FindDoctorButton'

function ResultCard({ title, icon, status, children, color = 'sky', t }) {
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

  const statusText = {
    complete: t('status.complete'),
    pending: t('status.notDone'),
    warning: t('status.review'),
  }

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <h3 className="font-semibold text-slate-800">{title}</h3>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[status]}`}>
          {statusText[status]}
        </span>
      </div>
      {children}
    </div>
  )
}

function VisualAcuityResult({ data, t }) {
  const hasLeft = data?.left
  const hasRight = data?.right
  const hasAny = hasLeft || hasRight

  if (!hasAny) {
    return (
      <p className="text-sm text-slate-500">
        {t('results:noResults.description')}
      </p>
    )
  }

  const getStatusMessage = (level) => {
    if (!level && level !== 0) return null
    if (level >= 8) return { text: `✓ ${t('results:status.normal')}`, color: 'emerald' }
    if (level >= 5) return { text: t('results:recommendations.followUp'), color: 'amber' }
    return { text: t('results:recommendations.seeDoctor'), color: 'red' }
  }

  // Check for asymmetry
  const hasAsymmetry = hasLeft && hasRight && Math.abs(data.left.level - data.right.level) >= 2

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        {/* Left Eye */}
        <div className="text-center p-3 bg-white rounded-lg border">
          <div className="text-xs text-slate-500 mb-1">{t('results:eyeLabels.leftEye')}</div>
          <div className="text-2xl font-bold text-sky-600">
            {hasLeft ? data.left.snellen : '—'}
          </div>
          {hasLeft && (
            <div className="text-xs text-slate-500 mt-1">
              Level {data.left.level}/{data.left.maxLevel}
            </div>
          )}
        </div>
        
        {/* Right Eye */}
        <div className="text-center p-3 bg-white rounded-lg border">
          <div className="text-xs text-slate-500 mb-1">{t('results:eyeLabels.rightEye')}</div>
          <div className="text-2xl font-bold text-sky-600">
            {hasRight ? data.right.snellen : '—'}
          </div>
          {hasRight && (
            <div className="text-xs text-slate-500 mt-1">
              Level {data.right.level}/{data.right.maxLevel}
            </div>
          )}
        </div>
      </div>

      {/* Asymmetry warning */}
      {hasAsymmetry && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          ⚠️ {t('results:recommendations.followUp')}
        </div>
      )}
    </div>
  )
}

function ColorVisionResult({ data, t }) {
  if (!data) {
    return (
      <p className="text-sm text-slate-500">
        {t('results:noResults.description')}
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-emerald-600">
          {data.correctCount}/{data.totalPlates}
        </span>
        <span className="text-sm text-slate-500">{t('tests:colorVision.results.score', { correct: '', total: '' }).replace('/', '').trim()}</span>
      </div>
      {data.status === 'normal' && (
        <p className="text-sm text-emerald-600">✓ {t('tests:colorVision.results.status.normal')}</p>
      )}
      {data.status === 'mild_difficulty' && (
        <p className="text-sm text-amber-600">{t('tests:colorVision.results.status.mild')}</p>
      )}
      {data.status === 'possible_deficiency' && (
        <p className="text-sm text-red-600">{t('tests:colorVision.results.status.significant')}</p>
      )}
    </div>
  )
}

// Helper to strip markdown formatting for plain text display
function stripMarkdown(text) {
  if (!text) return ''
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove **bold**
    .replace(/\*([^*]+)\*/g, '$1')     // Remove *italic*
    .replace(/^#+\s*/gm, '')           // Remove # headers
    .replace(/^[-*]\s+/gm, '')         // Remove list markers
    .replace(/\n{2,}/g, ' ')           // Collapse multiple newlines
    .replace(/\n/g, ' ')               // Replace single newlines with space
    .trim()
}

// Extract summary or recommendations from AI analysis, skipping disclaimers
function extractSummary(analysis) {
  if (!analysis) return null
  
  // Try to find Summary or Recommendations section
  const summaryMatch = analysis.match(/(?:Summary|Recommendations?)[:\s]*\n?([\s\S]{30,200}?)(?=\n\n|\n\d\.|\n[-*]|$)/i)
  if (summaryMatch) {
    return stripMarkdown(summaryMatch[1]).substring(0, 150)
  }
  
  // Try to find "Looks healthy" or similar recommendation phrases
  const healthMatch = analysis.match(/(Looks healthy[^.]*\.|Continue regular[^.]*\.|No visible[^.]*\.|Consider scheduling[^.]*\.|Recommend seeing[^.]*\.)/i)
  if (healthMatch) {
    return stripMarkdown(healthMatch[1])
  }
  
  // Fallback: skip disclaimers and get first meaningful sentence
  const lines = analysis.split('\n').filter(line => {
    const lower = line.toLowerCase()
    return line.trim() && 
           !lower.includes('disclaimer') && 
           !lower.includes('not a medical diagnosis') &&
           !lower.includes('educational') &&
           !lower.includes('screening purposes') &&
           !lower.includes('consult an eye care')
  })
  
  if (lines.length > 0) {
    return stripMarkdown(lines[0]).substring(0, 150)
  }
  
  return null
}

function EyePhotoResult({ data, t }) {
  const [showFullAnalysis, setShowFullAnalysis] = useState(false)

  if (!data) {
    return (
      <p className="text-sm text-slate-500">
        {t('results:noResults.description')}
      </p>
    )
  }

  const summary = extractSummary(data.analysis)

  const handleCardClick = () => {
    setShowFullAnalysis(true)
  }

  return (
    <>
      <div 
        className="space-y-3 cursor-pointer hover:bg-violet-100/50 -m-2 p-2 rounded-lg transition-colors" 
        onClick={handleCardClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(); } }}
        role="button"
        tabIndex={0}
        aria-label={t('results:cards.eyePhoto')}
      >
        {data.imageData && (
          <div className="flex justify-center">
            <img
              src={data.imageData}
              alt={t('results:cards.eyePhoto')}
              className="w-16 h-16 object-cover rounded-full border-2 border-violet-200"
            />
          </div>
        )}
        
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
          <span className="text-sm font-medium text-emerald-600">{t('tests:eyePhoto.status.complete')}</span>
        </div>
        
        {/* Summary text */}
        {summary && (
          <p className="text-sm text-slate-600">
            {summary}{summary.length >= 150 ? '...' : ''}
          </p>
        )}
        
        {/* View details hint */}
        <p className="text-xs text-violet-600 flex items-center gap-1">
          <span>{t('actions.viewResults')}</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </p>
      </div>

      {/* Full Analysis Modal */}
      {showFullAnalysis && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowFullAnalysis(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-violet-50 p-4 border-b border-violet-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📸</span>
                <h3 className="font-semibold text-slate-800">{t('results:cards.eyePhoto')}</h3>
              </div>
              <button
                onClick={() => setShowFullAnalysis(false)}
                className="w-8 h-8 rounded-full bg-violet-100 hover:bg-violet-200 flex items-center justify-center transition-colors"
                aria-label={t('actions.close')}
              >
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {data.imageData && (
                <div className="flex justify-center mb-4">
                  <img
                    src={data.imageData}
                    alt={t('results:cards.eyePhoto')}
                    className="w-24 h-24 object-cover rounded-full border-4 border-violet-200"
                  />
                </div>
              )}
              
              {/* Full analysis text with markdown rendering */}
              <div className="text-slate-700 text-sm leading-relaxed space-y-3 [&>h2]:text-base [&>h2]:font-semibold [&>h2]:mt-4 [&>h2]:mb-2 [&>h3]:text-sm [&>h3]:font-semibold [&>h3]:mt-3 [&>h3]:mb-1 [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-4 [&>ul]:space-y-1 [&>ol]:list-decimal [&>ol]:pl-4 [&>ol]:space-y-1 [&>hr]:my-3 [&>hr]:border-slate-200">
                <ReactMarkdown>{data.analysis}</ReactMarkdown>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setShowFullAnalysis(false)}
                className="w-full py-3 bg-violet-500 text-white font-medium rounded-xl hover:bg-violet-600 transition-colors"
              >
                {t('actions.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ContrastSensitivityResult({ data, t }) {
  const hasLeft = data?.left
  const hasRight = data?.right
  const hasAny = hasLeft || hasRight

  if (!hasAny) {
    return (
      <p className="text-sm text-slate-500">
        {t('results:noResults.description')}
      </p>
    )
  }

  const getInterpretation = (logCS) => {
    if (logCS >= 1.2) return { text: t('tests:contrastSensitivity.results.interpretations.excellent.label'), color: 'emerald' }
    if (logCS >= 0.9) return { text: t('tests:contrastSensitivity.results.interpretations.normal.label'), color: 'emerald' }
    if (logCS >= 0.6) return { text: t('tests:contrastSensitivity.results.interpretations.mild.label'), color: 'amber' }
    if (logCS >= 0.3) return { text: t('tests:contrastSensitivity.results.interpretations.moderate.label'), color: 'amber' }
    return { text: t('tests:contrastSensitivity.results.interpretations.significant.label'), color: 'red' }
  }

  // Check for asymmetry
  const hasAsymmetry = hasLeft && hasRight && Math.abs(data.left.logCS - data.right.logCS) >= 0.3

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        {/* Left Eye */}
        <div className="text-center p-3 bg-white rounded-lg border">
          <div className="text-xs text-slate-500 mb-1">{t('results:eyeLabels.leftEye')}</div>
          <div className="text-2xl font-bold text-amber-600">
            {hasLeft ? data.left.logCS.toFixed(2) : '—'}
          </div>
          {hasLeft && (
            <div className={`text-xs mt-1 text-${getInterpretation(data.left.logCS).color}-600`}>
              {getInterpretation(data.left.logCS).text}
            </div>
          )}
        </div>
        
        {/* Right Eye */}
        <div className="text-center p-3 bg-white rounded-lg border">
          <div className="text-xs text-slate-500 mb-1">{t('results:eyeLabels.rightEye')}</div>
          <div className="text-2xl font-bold text-amber-600">
            {hasRight ? data.right.logCS.toFixed(2) : '—'}
          </div>
          {hasRight && (
            <div className={`text-xs mt-1 text-${getInterpretation(data.right.logCS).color}-600`}>
              {getInterpretation(data.right.logCS).text}
            </div>
          )}
        </div>
      </div>

      {/* Asymmetry warning */}
      {hasAsymmetry && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          ⚠️ {t('results:recommendations.followUp')}
        </div>
      )}
    </div>
  )
}

function AmslerGridResult({ data, t }) {
  const hasLeft = data?.left
  const hasRight = data?.right
  const hasAny = hasLeft || hasRight

  if (!hasAny) {
    return (
      <p className="text-sm text-slate-500">
        {t('results:noResults.description')}
      </p>
    )
  }

  const getEyeStatus = (eyeData) => {
    if (!eyeData) return null
    return eyeData.hasIssues ? t('results:status.concerns') : t('results:status.normal')
  }

  const getEyeColor = (eyeData) => {
    if (!eyeData) return 'slate'
    return eyeData.hasIssues ? 'amber' : 'purple'
  }

  const anyIssues = (hasLeft && data.left.hasIssues) || (hasRight && data.right.hasIssues)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        {/* Left Eye */}
        <div className="text-center p-3 bg-white rounded-lg border">
          <div className="text-xs text-slate-500 mb-1">{t('results:eyeLabels.leftEye')}</div>
          <div className={`text-xl font-bold text-${getEyeColor(data.left)}-600`}>
            {hasLeft ? getEyeStatus(data.left) : '—'}
          </div>
        </div>
        
        {/* Right Eye */}
        <div className="text-center p-3 bg-white rounded-lg border">
          <div className="text-xs text-slate-500 mb-1">{t('results:eyeLabels.rightEye')}</div>
          <div className={`text-xl font-bold text-${getEyeColor(data.right)}-600`}>
            {hasRight ? getEyeStatus(data.right) : '—'}
          </div>
        </div>
      </div>

      {anyIssues ? (
        <p className="text-sm text-amber-600">⚠️ {t('results:recommendations.seeDoctor')}</p>
      ) : (
        <p className="text-sm text-emerald-600">✓ {t('tests:amslerGrid.results.normal')}</p>
      )}
    </div>
  )
}

function HistoryChart({ history, t, i18n }) {
  if (history.length < 2) return null

  // Helper to get best level from per-eye data
  // Note: level can be 0 (very poor acuity), so use != null checks, not truthy checks
  const getBestLevel = (va) => {
    if (!va) return null
    // Handle both old format (single value) and new format (per-eye)
    if (va.level !== undefined) return va.level // Old format
    const leftLevel = va.left?.level
    const rightLevel = va.right?.level
    if (leftLevel != null && rightLevel != null) return Math.max(leftLevel, rightLevel)
    if (leftLevel != null) return leftLevel
    if (rightLevel != null) return rightLevel
    return null
  }

  const getSnellen = (va) => {
    if (!va) return null
    if (va.snellen) return va.snellen // Old format
    // New format - show better eye
    const leftLevel = va.left?.level ?? 0
    const rightLevel = va.right?.level ?? 0
    if (leftLevel >= rightLevel && va.left) return va.left.snellen
    if (va.right) return va.right.snellen
    return null
  }

  // Filter sessions with visual acuity data
  const sessions = history
    .filter(s => getBestLevel(s.visualAcuity) !== null)
    .slice(0, 5)
    .reverse()

  if (sessions.length < 2) return null

  // Calculate trend text
  const oldest = sessions[0]
  const newest = sessions[sessions.length - 1]
  let trendText = null
  
  const oldLevel = getBestLevel(oldest.visualAcuity)
  const newLevel = getBestLevel(newest.visualAcuity)
  const oldSnellen = getSnellen(oldest.visualAcuity)
  const newSnellen = getSnellen(newest.visualAcuity)
  
  if (oldLevel != null && newLevel != null) {
    if (newLevel > oldLevel) {
      trendText = t('results:history.improved', { from: oldSnellen, to: newSnellen })
    } else if (newLevel < oldLevel) {
      trendText = t('results:history.changed', { from: oldSnellen, to: newSnellen })
    } else {
      trendText = t('results:history.stable', { value: newSnellen })
    }
  }

  const dateLocale = i18n.language === 'de' ? 'de-DE' : 'en-US'

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
      <h3 className="font-semibold text-slate-800 mb-3">{t('results:history.progress')}</h3>
      <div className="flex items-end justify-between h-24 gap-2">
        {sessions.map((session) => (
          <div key={session.id} className="flex-1 flex flex-col items-center">
            <div
              className="w-full bg-sky-400 rounded-t"
              style={{ height: `${(getBestLevel(session.visualAcuity) / 10) * 100}%` }}
            />
            <span className="text-xs text-slate-500 mt-1">
              {new Date(session.date).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 text-center mt-2">{t('results:history.acuityOverTime')}</p>
      {trendText && (
        <p className="text-sm text-sky-600 text-center mt-2 font-medium">{trendText}</p>
      )}
    </div>
  )
}

export default function HealthSnapshot() {
  const { t, i18n } = useTranslation(['common', 'results', 'tests'])
  const { 
    results, 
    hasAnyResults, 
    clearResults, 
    history, 
    saveToHistory, 
    clearHistory,
    getUnlockedAchievements,
    isAchievementNew,
    markAchievementSeen,
    checkAndUnlockAchievements
  } = useTestResults()
  const reportRef = useRef(null)
  const [showCelebration, setShowCelebration] = useState(false)
  
  // Get unlocked achievements
  const unlockedAchievementIds = getUnlockedAchievements()
  const hasNewAchievements = unlockedAchievementIds.some(id => isAchievementNew(id))
  
  // Check for achievements on page load and trigger celebration if new ones
  useEffect(() => {
    const unlocked = checkAndUnlockAchievements()
    if (unlocked.length > 0) {
      setShowCelebration(true)
    }
  }, [])
  
  // Mark achievements as seen after viewing
  useEffect(() => {
    if (hasNewAchievements) {
      const timer = setTimeout(() => {
        unlockedAchievementIds.forEach(id => {
          if (isAchievementNew(id)) {
            markAchievementSeen(id)
          }
        })
      }, 3000) // Mark as seen after 3 seconds
      return () => clearTimeout(timer)
    }
  }, [hasNewAchievements, unlockedAchievementIds])

  const getOverallStatus = useCallback(() => {
    // Check if per-eye tests have at least one eye completed
    const hasVisualAcuity = results.visualAcuity?.left || results.visualAcuity?.right
    const hasContrastSensitivity = results.contrastSensitivity?.left || results.contrastSensitivity?.right
    const hasAmslerGrid = results.amslerGrid?.left || results.amslerGrid?.right
    
    const tests = [hasVisualAcuity, results.colorVision, hasContrastSensitivity, hasAmslerGrid, results.eyePhoto]
    const completed = tests.filter(Boolean).length
    
    if (completed === 0) return { status: 'none', message: t('results:header.noTests') }
    if (completed === 5) return { status: 'complete', message: t('results:header.allTests') }
    return { status: 'partial', message: t('results:header.someTests', { count: completed }) }
  }, [results, t])

  const getRecommendation = useCallback(() => {
    const recommendations = []
    
    // Visual Acuity - check both eyes, use worst case
    const vaLeft = results.visualAcuity?.left
    const vaRight = results.visualAcuity?.right
    if (vaLeft || vaRight) {
      const worstLevel = Math.min(vaLeft?.level ?? 10, vaRight?.level ?? 10)
      if (worstLevel < 5) {
        recommendations.push(t('results:recommendations.seeDoctor'))
      } else if (worstLevel < 8) {
        recommendations.push(t('results:recommendations.followUp'))
      }
      // Check asymmetry
      if (vaLeft && vaRight && Math.abs(vaLeft.level - vaRight.level) >= 2) {
        recommendations.push(t('results:recommendations.followUp'))
      }
    }
    
    if (results.colorVision) {
      if (results.colorVision.status === 'possible_deficiency') {
        recommendations.push(t('results:recommendations.seeDoctor'))
      } else if (results.colorVision.status === 'mild_difficulty') {
        recommendations.push(t('results:recommendations.followUp'))
      }
    }

    // Amsler Grid - check both eyes
    const amslerLeft = results.amslerGrid?.left
    const amslerRight = results.amslerGrid?.right
    if (amslerLeft || amslerRight) {
      const anyIssues = amslerLeft?.hasIssues || amslerRight?.hasIssues
      if (anyIssues) {
        recommendations.push(t('results:recommendations.seeDoctor'))
      }
    }

    // Contrast Sensitivity - check both eyes, use worst case
    const csLeft = results.contrastSensitivity?.left
    const csRight = results.contrastSensitivity?.right
    if (csLeft || csRight) {
      const worstLogCS = Math.min(csLeft?.logCS ?? 1.5, csRight?.logCS ?? 1.5)
      if (worstLogCS < 0.6) {
        recommendations.push(t('results:recommendations.seeDoctor'))
      } else if (worstLogCS < 0.9) {
        recommendations.push(t('results:recommendations.followUp'))
      }
      // Check asymmetry
      if (csLeft && csRight && Math.abs(csLeft.logCS - csRight.logCS) >= 0.3) {
        recommendations.push(t('results:recommendations.followUp'))
      }
    }
    
    if (recommendations.length === 0) {
      if (hasAnyResults()) {
        return t('results:recommendations.allNormal')
      }
      return t('results:noResults.description')
    }
    
    // Remove duplicates and join
    const uniqueRecommendations = [...new Set(recommendations)]
    return uniqueRecommendations.join(' ')
  }, [results, hasAnyResults, t])

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
    
    const vaLeft = results.visualAcuity?.left
    const vaRight = results.visualAcuity?.right
    if (vaLeft || vaRight) {
      text += `📖 Visual Acuity: `
      if (vaLeft) text += `L: ${vaLeft.snellen}`
      if (vaLeft && vaRight) text += ' / '
      if (vaRight) text += `R: ${vaRight.snellen}`
      text += '\n'
    }
    
    if (results.colorVision) {
      text += `🎨 Color Vision: ${results.colorVision.correctCount}/${results.colorVision.totalPlates} correct\n`
    }

    const csLeft = results.contrastSensitivity?.left
    const csRight = results.contrastSensitivity?.right
    if (csLeft || csRight) {
      text += `🔆 Contrast Sensitivity: `
      if (csLeft) text += `L: ${csLeft.logCS.toFixed(2)}`
      if (csLeft && csRight) text += ' / '
      if (csRight) text += `R: ${csRight.logCS.toFixed(2)}`
      text += ' logCS\n'
    }

    const amslerLeft = results.amslerGrid?.left
    const amslerRight = results.amslerGrid?.right
    if (amslerLeft || amslerRight) {
      const anyIssues = amslerLeft?.hasIssues || amslerRight?.hasIssues
      text += `# Amsler Grid: ${anyIssues ? 'Concerns Noted' : 'Normal'}\n`
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
    const vaLeft = results.visualAcuity?.left
    const vaRight = results.visualAcuity?.right
    const csLeft = results.contrastSensitivity?.left
    const csRight = results.contrastSensitivity?.right
    const amslerLeft = results.amslerGrid?.left
    const amslerRight = results.amslerGrid?.right
    
    // Create a styled container for the PDF
    const element = document.createElement('div')
    element.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 40px; max-width: 600px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #0ea5e9; margin: 0;">👁️ VisionCheck AI</h1>
          <p style="color: #64748b;">Mobile Eye Health Pre-Screening</p>
          <p style="color: #94a3b8; font-size: 14px;">${new Date().toLocaleDateString()}</p>
        </div>
        
        ${(vaLeft || vaRight) ? `
          <div style="background: #f0f9ff; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0;">📖 Visual Acuity</h3>
            <div style="display: flex; gap: 20px;">
              <div style="flex: 1; text-align: center;">
                <p style="color: #64748b; margin: 0 0 5px 0; font-size: 12px;">Left Eye</p>
                <p style="font-size: 24px; font-weight: bold; color: #0ea5e9; margin: 0;">
                  ${vaLeft ? vaLeft.snellen : '—'}
                </p>
              </div>
              <div style="flex: 1; text-align: center;">
                <p style="color: #64748b; margin: 0 0 5px 0; font-size: 12px;">Right Eye</p>
                <p style="font-size: 24px; font-weight: bold; color: #0ea5e9; margin: 0;">
                  ${vaRight ? vaRight.snellen : '—'}
                </p>
              </div>
            </div>
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
        
        ${(csLeft || csRight) ? `
          <div style="background: #fffbeb; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0;">🔆 Contrast Sensitivity</h3>
            <div style="display: flex; gap: 20px;">
              <div style="flex: 1; text-align: center;">
                <p style="color: #64748b; margin: 0 0 5px 0; font-size: 12px;">Left Eye</p>
                <p style="font-size: 24px; font-weight: bold; color: #f59e0b; margin: 0;">
                  ${csLeft ? csLeft.logCS.toFixed(2) : '—'}
                </p>
              </div>
              <div style="flex: 1; text-align: center;">
                <p style="color: #64748b; margin: 0 0 5px 0; font-size: 12px;">Right Eye</p>
                <p style="font-size: 24px; font-weight: bold; color: #f59e0b; margin: 0;">
                  ${csRight ? csRight.logCS.toFixed(2) : '—'}
                </p>
              </div>
            </div>
          </div>
        ` : ''}
        
        ${(amslerLeft || amslerRight) ? `
          <div style="background: #faf5ff; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0;"># Amsler Grid</h3>
            <div style="display: flex; gap: 20px;">
              <div style="flex: 1; text-align: center;">
                <p style="color: #64748b; margin: 0 0 5px 0; font-size: 12px;">Left Eye</p>
                <p style="font-size: 20px; font-weight: bold; color: ${amslerLeft?.hasIssues ? '#f59e0b' : '#a855f7'}; margin: 0;">
                  ${amslerLeft ? (amslerLeft.hasIssues ? 'Concerns' : 'Normal') : '—'}
                </p>
              </div>
              <div style="flex: 1; text-align: center;">
                <p style="color: #64748b; margin: 0 0 5px 0; font-size: 12px;">Right Eye</p>
                <p style="font-size: 20px; font-weight: bold; color: ${amslerRight?.hasIssues ? '#f59e0b' : '#a855f7'}; margin: 0;">
                  ${amslerRight ? (amslerRight.hasIssues ? 'Concerns' : 'Normal') : '—'}
                </p>
              </div>
            </div>
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
      <div className="min-h-screen bg-white dark:bg-slate-900">
        <header className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-4 flex items-center gap-4">
          <Link to="/" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            ← {t('nav.back')}
          </Link>
          <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t('results:title')}</h1>
        </header>

        <div className="p-6 text-center max-w-md mx-auto">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">{t('results:noResults.title')}</h2>
          <p className="text-slate-500 mb-6">
            {t('results:noResults.description')}
          </p>
          <Link 
            to="/"
            className="inline-block px-6 py-3 bg-sky-500 text-white font-medium rounded-xl hover:bg-sky-600 transition-colors"
          >
            {t('results:noResults.startTesting')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Trigger celebration for new achievements */}
      {showCelebration && <Celebration type="confetti" />}
      
      <header className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-4 flex items-center gap-4 z-10">
        <Link to="/" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
          ← {t('nav.back')}
        </Link>
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t('results:title')}</h1>
      </header>

      <div className="p-6 max-w-2xl mx-auto" ref={reportRef}>
        {/* Header Card */}
        <div className="bg-linear-to-br from-sky-500 to-violet-500 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-4xl">👁️</div>
            <div>
              <h2 className="text-xl font-bold">VisionCheck AI</h2>
              <p className="text-white/80 text-sm">{t('app.subtitle')}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">{t('results:header.status')}</p>
              <p className="font-semibold">{overallStatus.message}</p>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm">{t('results:header.date')}</p>
              <p className="font-semibold">{new Date().toLocaleDateString(i18n.language === 'de' ? 'de-DE' : 'en-US')}</p>
            </div>
          </div>
        </div>

        {/* History Chart */}
        <HistoryChart history={history} t={t} i18n={i18n} />

        {/* Test Results */}
        <div className="space-y-4 mb-6">
          <ResultCard
            title={t('results:cards.visualAcuity')}
            icon="📖"
            color="sky"
            t={t}
            status={(() => {
              const hasAny = results.visualAcuity?.left || results.visualAcuity?.right
              if (!hasAny) return 'pending'
              const leftLevel = results.visualAcuity?.left?.level ?? 10
              const rightLevel = results.visualAcuity?.right?.level ?? 10
              const worstLevel = Math.min(leftLevel, rightLevel)
              const hasAsymmetry = results.visualAcuity?.left && results.visualAcuity?.right && 
                Math.abs(leftLevel - rightLevel) >= 2
              return worstLevel >= 8 && !hasAsymmetry ? 'complete' : 'warning'
            })()}
          >
            <VisualAcuityResult data={results.visualAcuity} t={t} />
          </ResultCard>

          <ResultCard
            title={t('results:cards.colorVision')}
            icon="🎨"
            color="emerald"
            t={t}
            status={results.colorVision ? 
              (results.colorVision.status === 'normal' ? 'complete' : 'warning') : 
              'pending'
            }
          >
            <ColorVisionResult data={results.colorVision} t={t} />
          </ResultCard>

          <ResultCard
            title={t('results:cards.contrastSensitivity')}
            icon="🔆"
            color="amber"
            t={t}
            status={(() => {
              const hasAny = results.contrastSensitivity?.left || results.contrastSensitivity?.right
              if (!hasAny) return 'pending'
              const leftLogCS = results.contrastSensitivity?.left?.logCS ?? 1.5
              const rightLogCS = results.contrastSensitivity?.right?.logCS ?? 1.5
              const worstLogCS = Math.min(leftLogCS, rightLogCS)
              const hasAsymmetry = results.contrastSensitivity?.left && results.contrastSensitivity?.right && 
                Math.abs(leftLogCS - rightLogCS) >= 0.3
              return worstLogCS >= 0.9 && !hasAsymmetry ? 'complete' : 'warning'
            })()}
          >
            <ContrastSensitivityResult data={results.contrastSensitivity} t={t} />
          </ResultCard>

          <ResultCard
            title={t('results:cards.amslerGrid')}
            icon="#"
            color="purple"
            t={t}
            status={(() => {
              const hasAny = results.amslerGrid?.left || results.amslerGrid?.right
              if (!hasAny) return 'pending'
              const anyIssues = results.amslerGrid?.left?.hasIssues || results.amslerGrid?.right?.hasIssues
              return anyIssues ? 'warning' : 'complete'
            })()}
          >
            <AmslerGridResult data={results.amslerGrid} t={t} />
          </ResultCard>

          <ResultCard
            title={t('results:cards.eyePhoto')}
            icon="📸"
            color="violet"
            t={t}
            status={results.eyePhoto ? 'complete' : 'pending'}
          >
            <EyePhotoResult data={results.eyePhoto} t={t} />
          </ResultCard>
        </div>

        {/* Achievements Section */}
        {unlockedAchievementIds.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <span>🏆</span> {t('results:achievements.title')}
              {hasNewAchievements && (
                <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse">
                  {t('status.new')}
                </span>
              )}
            </h3>
            <div className="space-y-2">
              {unlockedAchievementIds.map(id => (
                <AchievementBadge 
                  key={id} 
                  achievementId={id} 
                  isNew={isAchievementNew(id)} 
                />
              ))}
            </div>
          </div>
        )}

        {/* Recommendation */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <h3 className="font-semibold text-slate-800 mb-2">📋 {t('results:recommendations.title')}</h3>
          <p className="text-slate-600">{getRecommendation()}</p>
        </div>

        {/* Find Eye Doctor Button - shown when concerning results detected */}
        {(() => {
          // Check for concerning results that warrant professional evaluation
          const vaLeft = results.visualAcuity?.left
          const vaRight = results.visualAcuity?.right
          const hasVAConcern = (vaLeft && vaLeft.level < 8) || (vaRight && vaRight.level < 8)
          
          const hasColorConcern = results.colorVision && results.colorVision.status !== 'normal'
          
          const csLeft = results.contrastSensitivity?.left
          const csRight = results.contrastSensitivity?.right
          const hasCSConcern = (csLeft && csLeft.logCS < 0.9) || (csRight && csRight.logCS < 0.9)
          
          const amslerLeft = results.amslerGrid?.left
          const amslerRight = results.amslerGrid?.right
          const hasAmslerConcern = amslerLeft?.hasIssues || amslerRight?.hasIssues
          
          const showFindDoctor = hasVAConcern || hasColorConcern || hasCSConcern || hasAmslerConcern
          
          return showFindDoctor ? (
            <div className="mb-6">
              <FindDoctorButton />
            </div>
          ) : null
        })()}

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-amber-800">
            <strong>{t('disclaimer.title')}:</strong> {t('disclaimer.text')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleShare}
            className="w-full py-4 bg-sky-500 text-white font-semibold rounded-xl hover:bg-sky-600 transition-colors flex items-center justify-center gap-2"
          >
            <span>📤</span> {t('results:actions.shareResults')}
          </button>
          
          <button
            onClick={handleDownloadPDF}
            className="w-full py-4 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
          >
            <span>📄</span> {t('results:actions.downloadPDF')}
          </button>

          <button
            onClick={() => {
              saveToHistory()
              alert(t('results:actions.saveToHistory'))
            }}
            disabled={!(results.visualAcuity?.left || results.visualAcuity?.right) && 
                      !results.colorVision && 
                      !(results.contrastSensitivity?.left || results.contrastSensitivity?.right) && 
                      !(results.amslerGrid?.left || results.amslerGrid?.right)}
            className="w-full py-4 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>📊</span> {t('results:actions.saveToHistory')}
          </button>
          
          <Link
            to="/"
            className="block w-full py-4 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors text-center"
          >
            {t('nav.backToHome')}
          </Link>

          <button
            onClick={() => {
              if (confirm(t('results:actions.clearResults') + '?')) {
                clearResults()
              }
            }}
            className="w-full py-3 text-red-500 font-medium hover:text-red-600 transition-colors text-center"
          >
            {t('results:actions.clearResults')}
          </button>

          {history.length > 0 && (
            <button
              onClick={() => {
                if (confirm(t('results:history.clearHistory') + '?')) {
                  clearHistory()
                }
              }}
              className="w-full py-3 text-slate-400 font-medium hover:text-slate-500 transition-colors text-center"
            >
              {t('results:history.clearHistory')} ({history.length})
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
