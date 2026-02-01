import { useRef, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import html2pdf from 'html2pdf.js'
import ReactMarkdown from 'react-markdown'
import { useTranslation } from 'react-i18next'
import { useTestResults } from '../context/TestResultsContext'
import AchievementBadge, { ACHIEVEMENTS } from '../components/AchievementBadge'
import Celebration from '../components/Celebration'
import FindDoctorButton from '../components/FindDoctorButton'

/**
 * Render a styled result card containing an icon, title, status pill, and arbitrary content.
 *
 * @param {{title: string, icon: import('react').ReactNode, status: 'complete'|'pending'|'warning', children?: import('react').ReactNode, color?: 'sky'|'emerald'|'violet'|'amber'|'purple'|'teal'|'fuchsia', t: (key: string) => string}} props - Component props.
 * @param {string} props.title - Visible card title.
 * @param {React.ReactNode} props.icon - Icon displayed to the left of the title.
 * @param {'complete'|'pending'|'warning'} props.status - Status key used to derive the status label and its styling.
 * @param {React.ReactNode} [props.children] - Card body content.
 * @param {'sky'|'emerald'|'violet'|'amber'|'purple'|'teal'|'fuchsia'} [props.color='sky'] - Color theme for the card background/border.
 * @param {(key: string) => string} props.t - Translation function used to localize the status text.
 * @returns {JSX.Element} The rendered result card element.
 */
function ResultCard({ title, icon, status, children, color = 'sky', t }) {
  const colorClasses = {
    sky: 'bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-800',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800',
    violet: 'bg-violet-50 dark:bg-violet-900/30 border-violet-200 dark:border-violet-800',
    amber: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
    purple: 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800',
    teal: 'bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-800',
    fuchsia: 'bg-fuchsia-50 dark:bg-fuchsia-900/30 border-fuchsia-200 dark:border-fuchsia-800',
  }

  const statusColors = {
    complete: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50',
    pending: 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700',
    warning: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50',
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
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[status]}`}>
          {statusText[status]}
        </span>
      </div>
      {children}
    </div>
  )
}

/**
 * Render visual acuity results for left and right eyes, showing Snellen values, level info, and an asymmetry warning when applicable.
 *
 * @param {Object} data - Results container for visual acuity.
 * @param {Object} [data.left] - Left eye result, if available.
 * @param {string} data.left.snellen - Snellen notation for the left eye (e.g., "20/20").
 * @param {number} data.left.level - Numeric acuity level for the left eye.
 * @param {number} data.left.maxLevel - Maximum possible level for the left eye test.
 * @param {Object} [data.right] - Right eye result, if available.
 * @param {string} data.right.snellen - Snellen notation for the right eye.
 * @param {number} data.right.level - Numeric acuity level for the right eye.
 * @param {number} data.right.maxLevel - Maximum possible level for the right eye test.
 *
 * @returns {JSX.Element} A React element that displays per-eye Snellen and level information when present; if neither eye has results, renders a localized no-results message. If both eyes are present and their level difference is 2 or greater, includes a follow-up/asymmetry warning.
 */
function VisualAcuityResult({ data, t }) {
  const hasLeft = data?.left
  const hasRight = data?.right
  const hasAny = hasLeft || hasRight

  if (!hasAny) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
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
        <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('results:eyeLabels.leftEye')}</div>
          <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">
            {hasLeft ? data.left.snellen : '—'}
          </div>
          {hasLeft && (
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Level {data.left.level}/{data.left.maxLevel}
            </div>
          )}
        </div>
        
        {/* Right Eye */}
        <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('results:eyeLabels.rightEye')}</div>
          <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">
            {hasRight ? data.right.snellen : '—'}
          </div>
          {hasRight && (
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Level {data.right.level}/{data.right.maxLevel}
            </div>
          )}
        </div>
      </div>

      {/* Asymmetry warning */}
      {hasAsymmetry && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-200">
          ⚠️ {t('results:recommendations.followUp')}
        </div>
      )}
    </div>
  )
}

/**
 * Render color vision test results including the score and a localized status line.
 *
 * @param {{correctCount: number, totalPlates: number, status: 'normal' | 'mild_difficulty' | 'possible_deficiency'} | null | undefined} data - The color vision result data; when falsy a localized "no results" description is displayed.
 * @returns {JSX.Element} A React element showing the correct/total plate score and a colored status message reflecting the test outcome.
 */
function ColorVisionResult({ data, t }) {
  if (!data) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {t('results:noResults.description')}
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
          {data.correctCount}/{data.totalPlates}
        </span>
        <span className="text-sm text-slate-500 dark:text-slate-400">{t('tests:colorVision.results.score', { correct: '', total: '' }).replace('/', '').trim()}</span>
      </div>
      {data.status === 'normal' && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">✓ {t('tests:colorVision.results.status.normal')}</p>
      )}
      {data.status === 'mild_difficulty' && (
        <p className="text-sm text-amber-600 dark:text-amber-400">{t('tests:colorVision.results.status.mild')}</p>
      )}
      {data.status === 'possible_deficiency' && (
        <p className="text-sm text-red-600 dark:text-red-400">{t('tests:colorVision.results.status.significant')}</p>
      )}
    </div>
  )
}

/**
 * Convert a Markdown string to plain text by removing common formatting and collapsing whitespace.
 *
 * Removes bold and italic markers, header hashes, list markers, and collapses multiple newlines into single spaces.
 * @param {string} text - The Markdown input.
 * @returns {string} Plain-text string with Markdown formatting removed.
 */
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

/**
 * Extract a concise human-readable summary or recommendation from an AI analysis text while ignoring boilerplate disclaimers.
 *
 * Attempts to locate a "Summary" or "Recommendation(s)" section, then common reassuring recommendation phrases, and finally falls back to the first meaningful non-disclaimer line. Result is stripped of simple Markdown and truncated to 150 characters when applicable.
 *
 * @param {string} analysis - AI-generated analysis text to extract a summary from.
 * @returns {string|null} The extracted summary or recommendation (trimmed and up to 150 characters), or `null` if no suitable content is found.
 */
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

/**
 * Show a compact eye-photo result card with a brief extracted summary and an accessible modal displaying the full analysis and image.
 * @param {{analysis?: string, imageData?: string}|null} data - Eye photo result data; null renders a "no results" description.
 * @param {function} t - Translation function for localized strings.
 * @returns {JSX.Element} A React element containing the eye photo card and, when opened, a modal with the full analysis and image.
 */
function EyePhotoResult({ data, t }) {
  const { i18n } = useTranslation()
  const [showFullAnalysis, setShowFullAnalysis] = useState(false)

  if (!data) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {t('results:noResults.description')}
      </p>
    )
  }

  // Handle both legacy (string) and new (object with language keys) analysis format
  const analysisText = typeof data.analysis === 'string' 
    ? data.analysis 
    : (data.analysis?.[i18n.language] || data.analysis?.en || '')

  const summary = extractSummary(analysisText)

  const handleCardClick = () => {
    setShowFullAnalysis(true)
  }

  return (
    <>
      <div 
        className="space-y-3 cursor-pointer hover:bg-violet-100/50 dark:hover:bg-violet-900/30 -m-2 p-2 rounded-lg transition-colors" 
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
              className="w-16 h-16 object-cover rounded-full border-2 border-violet-200 dark:border-violet-700"
            />
          </div>
        )}
        
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{t('tests:eyePhoto.status.complete')}</span>
        </div>
        
        {/* Summary text */}
        {summary && (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {summary}{summary.length >= 150 ? '...' : ''}
          </p>
        )}
        
        {/* View details hint */}
        <p className="text-xs text-violet-600 dark:text-violet-400 flex items-center gap-1">
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
                <ReactMarkdown>{analysisText}</ReactMarkdown>
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

/**
 * Render contrast sensitivity results for left and right eyes.
 *
 * Displays each eye's log contrast sensitivity (logCS) value and a localized interpretation
 * label (excellent/normal/mild/moderate/significant). If both eyes are present and the
 * logCS difference is 0.3 or greater, shows a follow-up/asymmetry warning.
 *
 * @param {Object} props
 * @param {{left?: {logCS: number}, right?: {logCS: number}}} props.data - Result data with optional `left` and `right` objects containing `logCS` numeric values.
 * @param {Function} props.t - Translation function for localized strings.
 * @returns {JSX.Element} A rendered block showing per-eye logCS, interpretation text, and an optional asymmetry warning.
 */
function ContrastSensitivityResult({ data, t }) {
  const hasLeft = data?.left
  const hasRight = data?.right
  const hasAny = hasLeft || hasRight

  if (!hasAny) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {t('results:noResults.description')}
      </p>
    )
  }

  // Use static class strings to ensure Tailwind JIT includes them in the bundle
  const interpretationColorClasses = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    red: 'text-red-600 dark:text-red-400',
  }

  const getInterpretation = (logCS) => {
    if (logCS >= 1.2) return { text: t('tests:contrastSensitivity.results.interpretations.excellent.label'), colorClass: interpretationColorClasses.emerald }
    if (logCS >= 0.9) return { text: t('tests:contrastSensitivity.results.interpretations.normal.label'), colorClass: interpretationColorClasses.emerald }
    if (logCS >= 0.6) return { text: t('tests:contrastSensitivity.results.interpretations.mild.label'), colorClass: interpretationColorClasses.amber }
    if (logCS >= 0.3) return { text: t('tests:contrastSensitivity.results.interpretations.moderate.label'), colorClass: interpretationColorClasses.amber }
    return { text: t('tests:contrastSensitivity.results.interpretations.significant.label'), colorClass: interpretationColorClasses.red }
  }

  // Check for asymmetry
  const hasAsymmetry = hasLeft && hasRight && Math.abs(data.left.logCS - data.right.logCS) >= 0.3

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        {/* Left Eye */}
        <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('results:eyeLabels.leftEye')}</div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {hasLeft ? data.left.logCS.toFixed(2) : '—'}
          </div>
          {hasLeft && (
            <div className={`text-xs mt-1 ${getInterpretation(data.left.logCS).colorClass}`}>
              {getInterpretation(data.left.logCS).text}
            </div>
          )}
        </div>
        
        {/* Right Eye */}
        <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('results:eyeLabels.rightEye')}</div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {hasRight ? data.right.logCS.toFixed(2) : '—'}
          </div>
          {hasRight && (
            <div className={`text-xs mt-1 ${getInterpretation(data.right.logCS).colorClass}`}>
              {getInterpretation(data.right.logCS).text}
            </div>
          )}
        </div>
      </div>

      {/* Asymmetry warning */}
      {hasAsymmetry && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-200">
          ⚠️ {t('results:recommendations.followUp')}
        </div>
      )}
    </div>
  )
}

/**
 * Render Amsler Grid results for left and right eyes.
 *
 * Displays per-eye status ("Concerns" or "Normal") using localized labels and colors based on each eye's `hasIssues` flag.
 * If any eye reports issues, a localized "see doctor" recommendation is shown; otherwise a localized normal confirmation is shown.
 * If neither left nor right data is present, renders the translated no-results description.
 *
 * @param {Object} data - Result object containing optional `left` and `right` eye entries.
 * @param {{ hasIssues?: boolean }} [data.left] - Left eye result (presence indicates a result).
 * @param {{ hasIssues?: boolean }} [data.right] - Right eye result (presence indicates a result).
 * @param {Function} t - Translation function used for localized strings.
 * @returns {JSX.Element} A React element that displays the Amsler Grid per-eye statuses and a recommendation line.
 */
function AmslerGridResult({ data, t }) {
  const hasLeft = data?.left
  const hasRight = data?.right
  const hasAny = hasLeft || hasRight

  if (!hasAny) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {t('results:noResults.description')}
      </p>
    )
  }

  const getEyeStatus = (eyeData) => {
    if (!eyeData) return null
    return eyeData.hasIssues ? t('results:status.concerns') : t('results:status.normal')
  }

  // Use static class strings to ensure Tailwind JIT includes them in the bundle
  const eyeColorClasses = {
    slate: 'text-slate-600 dark:text-slate-400',
    amber: 'text-amber-600 dark:text-amber-400',
    purple: 'text-purple-600 dark:text-purple-400',
  }

  const getEyeColorClass = (eyeData) => {
    if (!eyeData) return eyeColorClasses.slate
    return eyeData.hasIssues ? eyeColorClasses.amber : eyeColorClasses.purple
  }

  const anyIssues = (hasLeft && data.left.hasIssues) || (hasRight && data.right.hasIssues)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        {/* Left Eye */}
        <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('results:eyeLabels.leftEye')}</div>
          <div className={`text-xl font-bold ${getEyeColorClass(data.left)}`}>
            {hasLeft ? getEyeStatus(data.left) : '—'}
          </div>
        </div>
        
        {/* Right Eye */}
        <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('results:eyeLabels.rightEye')}</div>
          <div className={`text-xl font-bold ${getEyeColorClass(data.right)}`}>
            {hasRight ? getEyeStatus(data.right) : '—'}
          </div>
        </div>
      </div>

      {anyIssues ? (
        <p className="text-sm text-amber-600 dark:text-amber-400">⚠️ {t('results:recommendations.seeDoctor')}</p>
      ) : (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">✓ {t('tests:amslerGrid.results.normal')}</p>
      )}
    </div>
  )
}

/**
 * Render astigmatism results for left and right eyes, including status icons, severity/axis details, asymmetry warning, and recommendations.
 *
 * @param {{ left?: { allLinesEqual: boolean, severity?: string, estimatedAxis?: number | null }, right?: { allLinesEqual: boolean, severity?: string, estimatedAxis?: number | null }}} data - Astigmatism result data for each eye; missing eye keys indicate no result for that eye.
 * @param {Function} t - Translation function (i18n) used to localize labels and messages.
 * @returns {JSX.Element} A React element showing per-eye astigmatism summaries, any asymmetry warning, and a recommendation line (see doctor or no astigmatism).
 */
function AstigmatismResult({ data, t }) {
  const hasLeft = data?.left
  const hasRight = data?.right
  const hasAny = hasLeft || hasRight

  if (!hasAny) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {t('results:noResults.description')}
      </p>
    )
  }

  const getEyeStatus = (eyeData) => {
    if (!eyeData) return null
    return eyeData.allLinesEqual 
      ? t('results:astigmatism.noAstigmatism') 
      : t('results:astigmatism.possibleAstigmatism')
  }

  // Use static class strings to ensure Tailwind JIT includes them in the bundle
  const eyeColorClasses = {
    slate: 'text-slate-600 dark:text-slate-400',
    teal: 'text-teal-600 dark:text-teal-400',
    amber: 'text-amber-600 dark:text-amber-400',
  }

  const getEyeColorClass = (eyeData) => {
    if (!eyeData) return eyeColorClasses.slate
    return eyeData.allLinesEqual ? eyeColorClasses.teal : eyeColorClasses.amber
  }

  const anyAstigmatism = (hasLeft && !data.left.allLinesEqual) || (hasRight && !data.right.allLinesEqual)

  // Check for asymmetry between eyes
  const hasAsymmetry = hasLeft && hasRight && 
    data.left.allLinesEqual !== data.right.allLinesEqual

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        {/* Left Eye */}
        <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('results:eyeLabels.leftEye')}</div>
          <div className={`text-lg font-bold ${getEyeColorClass(data.left)}`}>
            {hasLeft ? (data.left.allLinesEqual ? '✓' : '⚠️') : '—'}
          </div>
          {hasLeft && (
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              {data.left.allLinesEqual 
                ? t('results:astigmatism.allLinesEqual')
                : t(`results:astigmatism.severity.${data.left.severity ?? 'none'}`)}
            </div>
          )}
          {hasLeft && !data.left.allLinesEqual && data.left.estimatedAxis !== null && (
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('results:astigmatism.axis', { degrees: data.left.estimatedAxis })}
            </div>
          )}
        </div>
        
        {/* Right Eye */}
        <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('results:eyeLabels.rightEye')}</div>
          <div className={`text-lg font-bold ${getEyeColorClass(data.right)}`}>
            {hasRight ? (data.right.allLinesEqual ? '✓' : '⚠️') : '—'}
          </div>
          {hasRight && (
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              {data.right.allLinesEqual 
                ? t('results:astigmatism.allLinesEqual')
                : t(`results:astigmatism.severity.${data.right.severity ?? 'none'}`)}
            </div>
          )}
          {hasRight && !data.right.allLinesEqual && data.right.estimatedAxis !== null && (
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('results:astigmatism.axis', { degrees: data.right.estimatedAxis })}
            </div>
          )}
        </div>
      </div>

      {/* Asymmetry warning */}
      {hasAsymmetry && (
        <p className="text-sm text-orange-600 dark:text-orange-400">⚠️ {t('results:recommendations.followUp')}</p>
      )}

      {anyAstigmatism ? (
        <p className="text-sm text-amber-600 dark:text-amber-400">⚠️ {t('results:recommendations.seeDoctor')}</p>
      ) : (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">✓ {t('tests:astigmatism.results.noAstigmatism')}</p>
      )}
    </div>
  )
}

/**
 * Render the peripheral vision result UI showing left and right eye summaries and an overall recommendation.
 *
 * Displays detection rate, average reaction time, and a localized severity label for each eye when present.
 * If an eye is missing, a placeholder is shown. Eye colors and the final recommendation text reflect whether
 * any measured severity indicates concern.
 *
 * @param {Object} props.data - Peripheral vision measurements.
 * @param {Object} [props.data.left] - Left eye result (optional).
 * @param {number} props.data.left.detectionRate - Detection rate as a percentage (e.g., 85).
 * @param {number|string} [props.data.left.avgReactionTime] - Average reaction time in milliseconds.
 * @param {string} props.data.left.severity - Severity key used for localization (e.g., 'excellent', 'normal', 'mild', 'significant').
 * @param {Object} [props.data.right] - Right eye result (optional) with the same shape as `left`.
 * @returns {JSX.Element} A React element presenting the peripheral vision results and a localized recommendation.
 */
function PeripheralVisionResult({ data, t }) {
  const hasLeft = data?.left
  const hasRight = data?.right
  const hasAny = hasLeft || hasRight

  if (!hasAny) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {t('results:noResults.description')}
      </p>
    )
  }

  const isNormal = (eyeData) => {
    if (!eyeData) return true
    return eyeData.severity === 'excellent' || eyeData.severity === 'normal'
  }

  // Use static class strings to ensure Tailwind JIT includes them in the bundle
  const eyeColorClasses = {
    slate: 'text-slate-600 dark:text-slate-400',
    fuchsia: 'text-fuchsia-600 dark:text-fuchsia-400',
    amber: 'text-amber-600 dark:text-amber-400',
  }

  const getEyeColorClass = (eyeData) => {
    if (!eyeData) return eyeColorClasses.slate
    return isNormal(eyeData) ? eyeColorClasses.fuchsia : eyeColorClasses.amber
  }

  const anyConcerns = (hasLeft && !isNormal(data.left)) || (hasRight && !isNormal(data.right))

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        {/* Left Eye */}
        <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('results:eyeLabels.leftEye')}</div>
          <div className={`text-2xl font-bold ${getEyeColorClass(data.left)}`}>
            {hasLeft ? `${data.left.detectionRate}%` : '—'}
          </div>
          {hasLeft && (
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {data.left.avgReactionTime != null ? `${data.left.avgReactionTime}ms` : '—'}
            </div>
          )}
          {hasLeft && data.left.severity && (
            <div className={`text-xs mt-1 ${getEyeColorClass(data.left)}`}>
              {t(`results:peripheralVision.severity.${data.left.severity}`)}
            </div>
          )}
        </div>
        
        {/* Right Eye */}
        <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('results:eyeLabels.rightEye')}</div>
          <div className={`text-2xl font-bold ${getEyeColorClass(data.right)}`}>
            {hasRight ? `${data.right.detectionRate}%` : '—'}
          </div>
          {hasRight && (
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {data.right.avgReactionTime != null ? `${data.right.avgReactionTime}ms` : '—'}
            </div>
          )}
          {hasRight && data.right.severity && (
            <div className={`text-xs mt-1 ${getEyeColorClass(data.right)}`}>
              {t(`results:peripheralVision.severity.${data.right.severity}`)}
            </div>
          )}
        </div>
      </div>

      {anyConcerns ? (
        <p className="text-sm text-amber-600 dark:text-amber-400">⚠️ {t('results:recommendations.seeDoctor')}</p>
      ) : (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">✓ {t('results:peripheralVision.normal')}</p>
      )}
    </div>
  )
}

/**
 * Render a compact visual-acuity history chart for recent sessions.
 *
 * Displays up to five past sessions that include visual acuity data as a small
 * bar-style chart with date labels and a localized trend message (improved/changed/stable).
 *
 * @param {Object[]} history - Array of session objects, each expected to include `id`, `date`, and `visualAcuity`.
 *   visualAcuity may be in the old format (`{ level, snellen }`) or the new format
 *   (`{ left: { level, snellen }, right: { level, snellen } }`).
 * @param {Function} t - Translation function (i18n `t`) used to localize strings.
 * @param {Object} i18n - i18n instance providing locale information (uses `i18n.language`).
 * @returns {JSX.Element|null} A chart element when there are two or more visual-acuity sessions, otherwise `null`.
 */
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
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
      <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">{t('results:history.progress')}</h3>
      <div className="flex items-end justify-between h-24 gap-2">
        {sessions.map((session) => (
          <div key={session.id} className="flex-1 flex flex-col items-center">
            <div
              className="w-full bg-sky-400 dark:bg-sky-500 rounded-t"
              style={{ height: `${(getBestLevel(session.visualAcuity) / 10) * 100}%` }}
            />
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {new Date(session.date).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-2">{t('results:history.acuityOverTime')}</p>
      {trendText && (
        <p className="text-sm text-sky-600 dark:text-sky-400 text-center mt-2 font-medium">{trendText}</p>
      )}
    </div>
  )
}

/**
 * Display an aggregated eye health report comprising test results, history, achievements, recommendations, and actions.
 *
 * Renders a localized results page that presents per-test summary cards, a history chart (when available), unlocked achievements, a recommendations panel, and action controls for sharing, PDF export, saving, and clearing results. Handles achievement unlocking/marking and constructs share/export content.
 *
 * @returns {JSX.Element} The React element for the HealthSnapshot results page.
 */
export default function HealthSnapshot() {
  const { t, i18n } = useTranslation(['common', 'results', 'tests', 'legal'])
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
  const [showManageData, setShowManageData] = useState(false)
  
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
    const hasAstigmatism = results.astigmatism?.left || results.astigmatism?.right
    const hasPeripheralVision = results.peripheralVision?.left || results.peripheralVision?.right
    
    // Count only the 6 core screening tests (eye photo is optional/supplementary)
    // This aligns with the achievement logic for "all-tests" achievement
    const tests = [hasVisualAcuity, results.colorVision, hasContrastSensitivity, hasAmslerGrid, hasAstigmatism, hasPeripheralVision]
    const completed = tests.filter(Boolean).length
    
    if (completed === 0) return { status: 'none', message: t('results:header.noTests') }
    if (completed === 6) return { status: 'complete', message: t('results:header.allTests') }
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

    // Astigmatism - check both eyes
    const astigLeft = results.astigmatism?.left
    const astigRight = results.astigmatism?.right
    if (astigLeft || astigRight) {
      const anyAstigmatism = (astigLeft && !astigLeft.allLinesEqual) || (astigRight && !astigRight.allLinesEqual)
      if (anyAstigmatism) {
        recommendations.push(t('results:recommendations.followUp'))
      }
      // Check asymmetry
      if (astigLeft && astigRight && astigLeft.allLinesEqual !== astigRight.allLinesEqual) {
        recommendations.push(t('results:recommendations.followUp'))
      }
    }

    // Peripheral Vision - check both eyes
    const pvLeft = results.peripheralVision?.left
    const pvRight = results.peripheralVision?.right
    if (pvLeft || pvRight) {
      const isNormal = (eyeData) => eyeData?.severity === 'excellent' || eyeData?.severity === 'normal'
      const anyConcerns = (pvLeft && !isNormal(pvLeft)) || (pvRight && !isNormal(pvRight))
      if (anyConcerns) {
        recommendations.push(t('results:recommendations.seeDoctor'))
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
    const astigLeft = results.astigmatism?.left
    const astigRight = results.astigmatism?.right
    const pvLeft = results.peripheralVision?.left
    const pvRight = results.peripheralVision?.right

    // Check which sections have content
    const hasVisionClarity = vaLeft || vaRight || csLeft || csRight
    const hasColorShape = results.colorVision || astigLeft || astigRight
    const hasEyeHealth = amslerLeft || amslerRight || pvLeft || pvRight
    const hasAIAnalysis = results.eyePhoto
    
    // Create a styled container for the PDF
    const element = document.createElement('div')
    element.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 40px; max-width: 600px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #0ea5e9; margin: 0;">👁️ VisionCheck AI</h1>
          <p style="color: #64748b;">Mobile Eye Health Pre-Screening</p>
          <p style="color: #94a3b8; font-size: 14px;">${new Date().toLocaleDateString()}</p>
        </div>
        
        <!-- Section: Vision Clarity -->
        ${hasVisionClarity ? `
          <div style="margin-bottom: 25px; page-break-inside: avoid; break-inside: avoid;">
            <h2 style="color: #0f172a; font-size: 18px; margin: 0 0 5px 0; border-bottom: 2px solid #0ea5e9; padding-bottom: 5px;">
              👓 Vision Clarity
            </h2>
            <p style="color: #64748b; font-size: 12px; margin: 0 0 15px 0;">How clearly you see at various distances and contrast levels</p>
            
            ${(vaLeft || vaRight) ? `
              <div style="background: #f0f9ff; border-radius: 12px; padding: 20px; margin-bottom: 15px; page-break-inside: avoid; break-inside: avoid;">
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
            
            ${(csLeft || csRight) ? `
              <div style="background: #fffbeb; border-radius: 12px; padding: 20px; page-break-inside: avoid; break-inside: avoid;">
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
          </div>
        ` : ''}
        
        <!-- Section: Color & Shape Perception -->
        ${hasColorShape ? `
          <div style="margin-bottom: 25px; page-break-inside: avoid; break-inside: avoid;">
            <h2 style="color: #0f172a; font-size: 18px; margin: 0 0 5px 0; border-bottom: 2px solid #10b981; padding-bottom: 5px;">
              🎨 Color & Shape Perception
            </h2>
            <p style="color: #64748b; font-size: 12px; margin: 0 0 15px 0;">How well you perceive colors and detect astigmatism</p>
            
            ${results.colorVision ? `
              <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 15px; page-break-inside: avoid; break-inside: avoid;">
                <h3 style="margin: 0 0 10px 0;">🎨 Color Vision</h3>
                <p style="font-size: 32px; font-weight: bold; color: #10b981; margin: 0;">
                  ${results.colorVision.correctCount}/${results.colorVision.totalPlates}
                </p>
                <p style="color: #64748b; margin: 5px 0 0 0;">
                  ${results.colorVision.message || 'plates correct'}
                </p>
              </div>
            ` : ''}
            
            ${(astigLeft || astigRight) ? `
              <div style="background: #f0fdfa; border-radius: 12px; padding: 20px; page-break-inside: avoid; break-inside: avoid;">
                <h3 style="margin: 0 0 10px 0;">⊕ Astigmatism</h3>
                <div style="display: flex; gap: 20px;">
                  <div style="flex: 1; text-align: center;">
                    <p style="color: #64748b; margin: 0 0 5px 0; font-size: 12px;">Left Eye</p>
                    <p style="font-size: 20px; font-weight: bold; color: ${astigLeft && !astigLeft.allLinesEqual ? '#f59e0b' : '#14b8a6'}; margin: 0;">
                      ${astigLeft ? (astigLeft.allLinesEqual ? '✓ Normal' : '⚠️ Detected') : '—'}
                    </p>
                  </div>
                  <div style="flex: 1; text-align: center;">
                    <p style="color: #64748b; margin: 0 0 5px 0; font-size: 12px;">Right Eye</p>
                    <p style="font-size: 20px; font-weight: bold; color: ${astigRight && !astigRight.allLinesEqual ? '#f59e0b' : '#14b8a6'}; margin: 0;">
                      ${astigRight ? (astigRight.allLinesEqual ? '✓ Normal' : '⚠️ Detected') : '—'}
                    </p>
                  </div>
                </div>
              </div>
            ` : ''}
          </div>
        ` : ''}
        
        <!-- Section: Eye Health Screening -->
        ${hasEyeHealth ? `
          <div style="margin-bottom: 25px; page-break-inside: avoid; break-inside: avoid;">
            <h2 style="color: #0f172a; font-size: 18px; margin: 0 0 5px 0; border-bottom: 2px solid #a855f7; padding-bottom: 5px;">
              🏥 Eye Health Screening
            </h2>
            <p style="color: #64748b; font-size: 12px; margin: 0 0 15px 0;">Screening for macular and peripheral vision issues</p>
            
            ${(amslerLeft || amslerRight) ? `
              <div style="background: #faf5ff; border-radius: 12px; padding: 20px; margin-bottom: 15px; page-break-inside: avoid; break-inside: avoid;">
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
            
            ${(pvLeft || pvRight) ? `
              <div style="background: #fdf4ff; border-radius: 12px; padding: 20px; page-break-inside: avoid; break-inside: avoid;">
                <h3 style="margin: 0 0 10px 0;">👁️‍🗨️ Peripheral Vision</h3>
                <div style="display: flex; gap: 20px;">
                  <div style="flex: 1; text-align: center;">
                    <p style="color: #64748b; margin: 0 0 5px 0; font-size: 12px;">Left Eye</p>
                    <p style="font-size: 20px; font-weight: bold; color: ${pvLeft && (pvLeft.severity === 'excellent' || pvLeft.severity === 'normal') ? '#d946ef' : '#f59e0b'}; margin: 0;">
                      ${pvLeft ? `${pvLeft.detectionRate}%` : '—'}
                    </p>
                  </div>
                  <div style="flex: 1; text-align: center;">
                    <p style="color: #64748b; margin: 0 0 5px 0; font-size: 12px;">Right Eye</p>
                    <p style="font-size: 20px; font-weight: bold; color: ${pvRight && (pvRight.severity === 'excellent' || pvRight.severity === 'normal') ? '#d946ef' : '#f59e0b'}; margin: 0;">
                      ${pvRight ? `${pvRight.detectionRate}%` : '—'}
                    </p>
                  </div>
                </div>
              </div>
            ` : ''}
          </div>
        ` : ''}
        
        <!-- Section: AI Analysis -->
        ${hasAIAnalysis ? `
          <div style="margin-bottom: 25px; page-break-inside: avoid; break-inside: avoid;">
            <h2 style="color: #0f172a; font-size: 18px; margin: 0 0 5px 0; border-bottom: 2px solid #8b5cf6; padding-bottom: 5px;">
              🤖 AI Analysis
            </h2>
            <p style="color: #64748b; font-size: 12px; margin: 0 0 15px 0;">AI-powered analysis of your eye photo</p>
            
            <div style="background: #faf5ff; border-radius: 12px; padding: 20px; page-break-inside: avoid; break-inside: avoid;">
              <h3 style="margin: 0 0 10px 0;">📸 AI Eye Analysis</h3>
              <p style="color: #64748b; white-space: pre-wrap; font-size: 14px;">
                ${stripMarkdown(typeof results.eyePhoto.analysis === 'string' 
                  ? results.eyePhoto.analysis 
                  : (results.eyePhoto.analysis?.[i18n.language] || results.eyePhoto.analysis?.en || '')
                ).substring(0, 500)}${stripMarkdown(typeof results.eyePhoto.analysis === 'string' 
                  ? results.eyePhoto.analysis 
                  : (results.eyePhoto.analysis?.[i18n.language] || results.eyePhoto.analysis?.en || '')).length > 500 ? '...' : ''}
              </p>
            </div>
          </div>
        ` : ''}
        
        <!-- Section: Achievements -->
        ${unlockedAchievementIds.length > 0 ? `
          <div style="margin-bottom: 25px; page-break-inside: avoid; break-inside: avoid;">
            <h2 style="color: #0f172a; font-size: 18px; margin: 0 0 5px 0; border-bottom: 2px solid #f59e0b; padding-bottom: 5px;">
              🏆 Your Achievements
            </h2>
            <p style="color: #64748b; font-size: 12px; margin: 0 0 15px 0;">Badges earned during your eye health journey</p>
            
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
              ${unlockedAchievementIds.map(id => {
                const achievement = ACHIEVEMENTS[id]
                if (!achievement) return ''
                return `
                  <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 10px 15px; display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 20px;">${achievement.icon}</span>
                    <span style="font-size: 14px; font-weight: 500; color: #92400e;">${t(achievement.titleKey)}</span>
                  </div>
                `
              }).join('')}
            </div>
          </div>
        ` : ''}
        
        <!-- Section: Summary & Recommendations -->
        <div style="margin-bottom: 25px; page-break-inside: avoid; break-inside: avoid;">
          <h2 style="color: #0f172a; font-size: 18px; margin: 0 0 5px 0; border-bottom: 2px solid #0ea5e9; padding-bottom: 5px;">
            📋 Summary & Recommendations
          </h2>
          <p style="color: #64748b; font-size: 12px; margin: 0 0 15px 0;">Overall assessment based on your test results</p>
          
          <div style="background: #f0f9ff; border-radius: 12px; padding: 20px; page-break-inside: avoid; break-inside: avoid;">
            <p style="color: #0f172a; font-size: 14px; margin: 0; line-height: 1.6;">
              ${getRecommendation()}
            </p>
          </div>
        </div>
        
        <!-- Disclaimer - Always at the bottom -->
        <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 12px; padding: 20px; margin-top: 30px; page-break-inside: avoid; break-inside: avoid;">
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
  }, [results, i18n.language, unlockedAchievementIds, getRecommendation, t])

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

        {/* Test Results - Organized by Section */}
        <div className="space-y-6 mb-6">
          {/* Section: Vision Clarity */}
          <section aria-labelledby="vision-clarity-heading">
            <h2 id="vision-clarity-heading" className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
              <span>👓</span> {t('results:sections.visionClarity')}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              {t('results:sections.visionClarityDescription')}
            </p>
            <div className="space-y-4">
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
            </div>
          </section>

          {/* Section: Color & Shape Perception */}
          <section aria-labelledby="color-shape-heading">
            <h2 id="color-shape-heading" className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
              <span>🎨</span> {t('results:sections.colorAndShape')}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              {t('results:sections.colorAndShapeDescription')}
            </p>
            <div className="space-y-4">
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
                title={t('results:cards.astigmatism')}
                icon="⊕"
                color="teal"
                t={t}
                status={(() => {
                  const hasAny = results.astigmatism?.left || results.astigmatism?.right
                  if (!hasAny) return 'pending'
                  const anyAstigmatism = 
                    (results.astigmatism?.left && !results.astigmatism.left.allLinesEqual) || 
                    (results.astigmatism?.right && !results.astigmatism.right.allLinesEqual)
                  return anyAstigmatism ? 'warning' : 'complete'
                })()}
              >
                <AstigmatismResult data={results.astigmatism} t={t} />
              </ResultCard>
            </div>
          </section>

          {/* Section: Eye Health Screening */}
          <section aria-labelledby="eye-health-heading">
            <h2 id="eye-health-heading" className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
              <span>🏥</span> {t('results:sections.eyeHealth')}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              {t('results:sections.eyeHealthDescription')}
            </p>
            <div className="space-y-4">
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
                title={t('results:cards.peripheralVision')}
                icon="👁️‍🗨️"
                color="fuchsia"
                t={t}
                status={(() => {
                  const hasAny = results.peripheralVision?.left || results.peripheralVision?.right
                  if (!hasAny) return 'pending'
                  const isNormal = (eyeData) => eyeData?.severity === 'excellent' || eyeData?.severity === 'normal'
                  const anyConcerns = 
                    (results.peripheralVision?.left && !isNormal(results.peripheralVision.left)) || 
                    (results.peripheralVision?.right && !isNormal(results.peripheralVision.right))
                  return anyConcerns ? 'warning' : 'complete'
                })()}
              >
                <PeripheralVisionResult data={results.peripheralVision} t={t} />
              </ResultCard>
            </div>
          </section>

          {/* Section: AI Analysis */}
          <section aria-labelledby="ai-analysis-heading">
            <h2 id="ai-analysis-heading" className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
              <span>🤖</span> {t('results:sections.aiAnalysis')}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              {t('results:sections.aiAnalysisDescription')}
            </p>
            <div className="space-y-4">
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
          </section>
        </div>

        {/* Section: Achievements */}
        {unlockedAchievementIds.length > 0 && (
          <section aria-labelledby="achievements-heading" className="mb-6">
            <h2 id="achievements-heading" className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
              <span>🏆</span> {t('results:achievements.title')}
              {hasNewAchievements && (
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-full animate-pulse">
                  {t('status.new')}
                </span>
              )}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              {t('results:sections.achievementsDescription')}
            </p>
            <div className="space-y-2">
              {unlockedAchievementIds.map(id => (
                <AchievementBadge 
                  key={id} 
                  achievementId={id} 
                  isNew={isAchievementNew(id)} 
                />
              ))}
            </div>
          </section>
        )}

        {/* Section: Summary & Recommendations */}
        <section aria-labelledby="summary-heading" className="mb-6">
          <h2 id="summary-heading" className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
            <span>📋</span> {t('results:sections.summaryRecommendations')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
            {t('results:sections.summaryRecommendationsDescription')}
          </p>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-slate-600 dark:text-slate-300">{getRecommendation()}</p>
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
            
            const astigLeft = results.astigmatism?.left
            const astigRight = results.astigmatism?.right
            const hasAstigConcern = (astigLeft && !astigLeft.allLinesEqual) || (astigRight && !astigRight.allLinesEqual)
            
            const pvLeft = results.peripheralVision?.left
            const pvRight = results.peripheralVision?.right
            const isNormal = (eyeData) => eyeData?.severity === 'excellent' || eyeData?.severity === 'normal'
            const hasPVConcern = (pvLeft && !isNormal(pvLeft)) || (pvRight && !isNormal(pvRight))
            
            const showFindDoctor = hasVAConcern || hasColorConcern || hasCSConcern || hasAmslerConcern || hasAstigConcern || hasPVConcern
            
            return showFindDoctor ? (
              <div className="mt-4">
                <FindDoctorButton />
              </div>
            ) : null
          })()}
        </section>

        {/* Section: Your Actions */}
        <section aria-labelledby="actions-heading" className="mb-6">
          <h2 id="actions-heading" className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
            <span>⚡</span> {t('results:sections.yourActions')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
            {t('results:sections.yourActionsDescription')}
          </p>
          
          {/* Primary Actions - 2-column grid */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <button
              onClick={handleShare}
              className="py-3 bg-sky-500 text-white font-semibold rounded-xl hover:bg-sky-600 transition-colors flex items-center justify-center gap-2"
            >
              <span>📤</span> {t('results:actions.share')}
            </button>
            
            <button
              onClick={handleDownloadPDF}
              className="py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              <span>📄</span> {t('results:actions.pdf')}
            </button>
          </div>

          {/* Save to History - full width */}
          <button
            onClick={() => {
              saveToHistory()
              alert(t('results:actions.saveToHistory'))
            }}
            disabled={!(results.visualAcuity?.left || results.visualAcuity?.right) && 
                      !results.colorVision && 
                      !(results.contrastSensitivity?.left || results.contrastSensitivity?.right) && 
                      !(results.amslerGrid?.left || results.amslerGrid?.right) &&
                      !(results.astigmatism?.left || results.astigmatism?.right) &&
                      !(results.peripheralVision?.left || results.peripheralVision?.right) &&
                      !results.eyePhoto}
            className="w-full py-3 mb-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>📊</span> {t('results:actions.saveToHistory')}
          </button>

          {/* Manage Data - Collapsible */}
          <button
            onClick={() => setShowManageData(!showManageData)}
            className="w-full py-2 text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center justify-center gap-2"
            aria-expanded={showManageData}
            aria-controls="manage-data-panel"
          >
            {t('results:actions.manageData')} {showManageData ? '▲' : '▼'}
          </button>
          
          {showManageData && (
            <div id="manage-data-panel" className="mt-2 space-y-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <Link
                to="/settings/data"
                className="block w-full py-2 text-sky-500 dark:text-sky-400 text-sm font-medium hover:text-sky-600 dark:hover:text-sky-300 transition-colors text-center"
              >
                {t('legal:privacy.dataSettingsLink')}
              </Link>
              
              <button
                onClick={() => {
                  if (confirm(t('results:actions.clearResults') + '?')) {
                    clearResults()
                  }
                }}
                className="w-full py-2 text-red-500 dark:text-red-400 text-sm font-medium hover:text-red-600 dark:hover:text-red-300 transition-colors text-center"
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
                  className="w-full py-2 text-slate-400 dark:text-slate-500 text-sm font-medium hover:text-slate-500 dark:hover:text-slate-400 transition-colors text-center"
                >
                  {t('results:history.clearHistory')} ({history.length})
                </button>
              )}
            </div>
          )}
        </section>

        {/* Disclaimer - Always at the bottom */}
        <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>{t('disclaimer.title')}:</strong> {t('disclaimer.text')}
          </p>
        </div>
      </div>
    </div>
  )
}