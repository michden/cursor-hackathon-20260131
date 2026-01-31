import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTestResults } from '../context/TestResultsContext'
import EyeSelector from '../components/EyeSelector'
import Celebration from '../components/Celebration'
import AchievementBadge from '../components/AchievementBadge'
import AudioInstructions from '../components/AudioInstructions'

// Clock dial with 12 lines at 15-degree intervals (0°, 15°, 30°, ... 165°)
const LINES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  angle: i * 15,
  label: `${i * 15}°`
}))

function ClockDial({ selectedLines, onLineClick }) {
  const size = 280
  const center = size / 2
  const radius = center - 20

  return (
    <div className="relative bg-white rounded-lg p-2" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
        {/* Background circle */}
        <circle cx={center} cy={center} r={radius + 10} fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
        
        {/* Lines */}
        {LINES.map((line) => {
          const isSelected = selectedLines.includes(line.id)
          const radians = (line.angle * Math.PI) / 180
          const x1 = center + Math.cos(radians) * 20
          const y1 = center + Math.sin(radians) * 20
          const x2 = center + Math.cos(radians) * radius
          const y2 = center + Math.sin(radians) * radius
          
          // Opposite side
          const x1b = center - Math.cos(radians) * 20
          const y1b = center - Math.sin(radians) * 20
          const x2b = center - Math.cos(radians) * radius
          const y2b = center - Math.sin(radians) * radius

          return (
            <g key={line.id}>
              {/* Clickable line with hit area */}
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isSelected ? '#0ea5e9' : '#1e293b'}
                strokeWidth={isSelected ? 4 : 2}
                className="cursor-pointer"
                onClick={() => onLineClick(line.id)}
              />
              <line
                x1={x1b}
                y1={y1b}
                x2={x2b}
                y2={y2b}
                stroke={isSelected ? '#0ea5e9' : '#1e293b'}
                strokeWidth={isSelected ? 4 : 2}
                className="cursor-pointer"
                onClick={() => onLineClick(line.id)}
              />
              {/* Invisible hit area for easier tapping */}
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="transparent"
                strokeWidth="20"
                className="cursor-pointer"
                onClick={() => onLineClick(line.id)}
              />
              <line
                x1={x1b}
                y1={y1b}
                x2={x2b}
                y2={y2b}
                stroke="transparent"
                strokeWidth="20"
                className="cursor-pointer"
                onClick={() => onLineClick(line.id)}
              />
            </g>
          )
        })}
        
        {/* Center dot */}
        <circle cx={center} cy={center} r={6} fill="#ef4444" />
      </svg>
    </div>
  )
}

export default function AstigmatismTest() {
  const { t } = useTranslation(['tests', 'common'])
  const navigate = useNavigate()
  const { results, updateAstigmatism, checkAndUnlockAchievements } = useTestResults()
  
  const [phase, setPhase] = useState('eye-select') // eye-select, instructions, testing, complete
  const [currentEye, setCurrentEye] = useState(null) // 'left' | 'right' | null
  const [selectedLines, setSelectedLines] = useState([])
  const [allLinesEqual, setAllLinesEqual] = useState(false)
  const [newAchievements, setNewAchievements] = useState([])

  const resetTestState = () => {
    setSelectedLines([])
    setAllLinesEqual(false)
  }

  const handleEyeSelect = (eye) => {
    setCurrentEye(eye)
    resetTestState()
    setPhase('instructions')
  }

  const handleTestAnotherEye = () => {
    resetTestState()
    setPhase('eye-select')
  }

  const handleLineClick = (lineId) => {
    if (allLinesEqual) {
      setAllLinesEqual(false)
    }
    setSelectedLines(prev => 
      prev.includes(lineId) 
        ? prev.filter(id => id !== lineId)
        : [...prev, lineId]
    )
  }

  const handleAllEqual = () => {
    setAllLinesEqual(true)
    setSelectedLines([])
  }

  const calculateAxis = (lines) => {
    if (lines.length === 0) return null
    // Average the angles of selected lines
    const avgAngle = lines.reduce((sum, id) => sum + id * 15, 0) / lines.length
    return Math.round(avgAngle)
  }

  const getSeverity = (lineCount) => {
    if (lineCount === 0) return 'none'
    if (lineCount <= 2) return 'mild'
    if (lineCount <= 4) return 'moderate'
    return 'significant'
  }

  const finishTest = () => {
    const hasAstigmatism = !allLinesEqual && selectedLines.length > 0
    const severity = hasAstigmatism ? getSeverity(selectedLines.length) : 'none'
    const estimatedAxis = hasAstigmatism ? calculateAxis(selectedLines) : null

    const newResult = {
      allLinesEqual,
      selectedLines: [...selectedLines],
      hasAstigmatism,
      severity,
      estimatedAxis,
      status: hasAstigmatism ? 'possible_astigmatism' : 'normal',
      message: hasAstigmatism
        ? t('tests:astigmatism.results.possibleAstigmatismDesc')
        : t('tests:astigmatism.results.noAstigmatismDesc'),
      testedAt: new Date().toISOString()
    }

    // Save result for the current eye
    updateAstigmatism(currentEye, newResult)

    // Check for newly unlocked achievements
    const updatedResults = {
      ...results,
      astigmatism: {
        ...results.astigmatism,
        [currentEye]: newResult
      }
    }
    const unlocked = checkAndUnlockAchievements(updatedResults)
    setNewAchievements(unlocked)

    setPhase('complete')
  }

  // Eye selection phase
  if (phase === 'eye-select') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-100 dark:border-slate-700 px-4 py-4 sticky top-0">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <Link to="/" className="text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors">
              ← {t('common:nav.back')}
            </Link>
            <h1 className="font-semibold text-slate-800 dark:text-slate-100">{t('tests:astigmatism.title')}</h1>
            <div className="w-12" />
          </div>
        </header>
        <EyeSelector 
          onSelect={handleEyeSelect}
          completedEyes={results.astigmatism}
          testName={t('tests:astigmatism.title')}
        />
      </div>
    )
  }

  // Instructions phase
  if (phase === 'instructions') {
    const otherEye = currentEye === 'left' ? t('common:eye.right') : t('common:eye.left')
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-100 dark:border-slate-700 px-4 py-4 sticky top-0">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <button 
              onClick={() => setPhase('eye-select')} 
              className="text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              ← {t('common:nav.back')}
            </button>
            <h1 className="font-semibold text-slate-800 dark:text-slate-100">{t('tests:astigmatism.title')}</h1>
            <div className="text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
              {currentEye === 'left' ? '👁️ L' : '👁️ R'}
            </div>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-teal-100 dark:bg-teal-900/50 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4">
              ⊕
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t('tests:astigmatism.title')}</h2>
            <p className="text-slate-600 dark:text-slate-400">
              {t('tests:astigmatism.subtitle', { eye: currentEye === 'left' ? t('common:eye.left') : t('common:eye.right') })}
            </p>
          </div>

          <AudioInstructions 
            audioKey="astigmatism-instructions" 
            label={t('common:audio.testInstructions')} 
          />

          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">{t('tests:astigmatism.instructions.title')}</h3>
            <ol className="space-y-3 text-slate-600 dark:text-slate-300">
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center text-sm font-medium">1</span>
                <span>{t('tests:astigmatism.instructions.step1', { otherEye })}</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center text-sm font-medium">2</span>
                <span>{t('tests:astigmatism.instructions.step2')}</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center text-sm font-medium">3</span>
                <span>{t('tests:astigmatism.instructions.step3')}</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center text-sm font-medium">4</span>
                <span>{t('tests:astigmatism.instructions.step4')}</span>
              </li>
            </ol>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-8">
            <p className="text-amber-800 dark:text-amber-200 text-sm">
              <strong>{t('common:note')}:</strong> {t('tests:astigmatism.instructions.note')}
            </p>
          </div>

          <button
            onClick={() => setPhase('testing')}
            className="w-full py-4 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-colors"
          >
            {t('common:actions.startTest')}
          </button>
        </main>
      </div>
    )
  }

  // Testing phase
  if (phase === 'testing') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        <header className="bg-slate-800 px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => setPhase('instructions')} 
            className="text-white/70 hover:text-white transition-colors"
          >
            ← Exit
          </button>
          <div className="text-sm text-white/70 bg-slate-700 px-2 py-1 rounded-full">
            {currentEye === 'left' ? '👁️ L' : '👁️ R'}
          </div>
          <div className="w-12" />
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <p className="text-white/80 text-sm mb-4 text-center">
            {t('tests:astigmatism.focusPrompt')}
          </p>
          
          <ClockDial 
            selectedLines={selectedLines} 
            onLineClick={handleLineClick} 
          />
          
          <p className="text-white text-lg font-medium mt-6 text-center px-4">
            {t('tests:astigmatism.question')}
          </p>
          
          {selectedLines.length > 0 && (
            <p className="text-sky-400 text-sm mt-2">
              {t('tests:astigmatism.linesSelected', { count: selectedLines.length })}
            </p>
          )}
        </div>

        <div className="p-6 space-y-3">
          <button
            onClick={handleAllEqual}
            className={`w-full py-4 font-semibold rounded-xl transition-colors ${
              allLinesEqual 
                ? 'bg-emerald-500 text-white' 
                : 'bg-slate-700 text-white hover:bg-slate-600'
            }`}
          >
            {t('tests:astigmatism.allEqual')}
          </button>
          
          {(allLinesEqual || selectedLines.length > 0) && (
            <button
              onClick={finishTest}
              className="w-full py-4 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-colors"
            >
              {t('tests:astigmatism.confirm')}
            </button>
          )}
        </div>
      </div>
    )
  }

  // Complete phase
  if (phase === 'complete') {
    const hasAstigmatism = !allLinesEqual && selectedLines.length > 0
    const severity = hasAstigmatism ? getSeverity(selectedLines.length) : 'none'
    const estimatedAxis = hasAstigmatism ? calculateAxis(selectedLines) : null
    const otherEye = currentEye === 'left' ? 'right' : 'left'
    const otherEyeComplete = results.astigmatism?.[otherEye]
    const bothComplete = results.astigmatism?.left && results.astigmatism?.right

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* Trigger celebration for normal results */}
        {!hasAstigmatism && <Celebration type="confetti" />}
        
        <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-100 dark:border-slate-700 px-4 py-4 sticky top-0">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <Link to="/" className="text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors">
              ← {t('common:nav.back')}
            </Link>
            <h1 className="font-semibold text-slate-800 dark:text-slate-100">{t('tests:astigmatism.results.title')}</h1>
            <div className="text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
              {currentEye === 'left' ? '👁️ L' : '👁️ R'}
            </div>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className={`text-6xl mb-4 ${!hasAstigmatism ? 'animate-bounce' : ''}`}>
              {hasAstigmatism ? '⚠️' : '✅'}
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              {t('common:eye.eyeComplete')}
            </h2>
          </div>

          {/* Result Card */}
          <div className={`${hasAstigmatism ? 'bg-amber-50 dark:bg-amber-950/50' : 'bg-emerald-50 dark:bg-emerald-950/50'} rounded-2xl p-6 mb-6`}>
            <div className="text-center">
              <div className={`text-3xl font-bold ${hasAstigmatism ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'} mb-2`}>
                {hasAstigmatism 
                  ? t('tests:astigmatism.results.possibleAstigmatism')
                  : t('tests:astigmatism.results.noAstigmatism')}
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                {hasAstigmatism 
                  ? t('tests:astigmatism.results.possibleAstigmatismDesc')
                  : t('tests:astigmatism.results.noAstigmatismDesc')}
              </p>
              {hasAstigmatism && (
                <div className="mt-4 space-y-1">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {t('tests:astigmatism.results.axis', { degrees: estimatedAxis })}
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    {t(`tests:astigmatism.results.severity.${severity}`)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Explanation */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">{t('common:results.whatThisMeans')}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              {hasAstigmatism 
                ? t('tests:astigmatism.explanation.detected')
                : t('tests:astigmatism.explanation.normal')}
            </p>
            <div className={`${hasAstigmatism ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800' : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800'} border rounded-lg p-3`}>
              <p className={`text-sm ${hasAstigmatism ? 'text-amber-800 dark:text-amber-200' : 'text-emerald-800 dark:text-emerald-200'}`}>
                {hasAstigmatism 
                  ? `⚠️ ${t('tests:astigmatism.recommendation.detected')}`
                  : `✓ ${t('tests:astigmatism.recommendation.normal')}`}
              </p>
            </div>
          </div>

          {/* Show achievement if earned */}
          {newAchievements.includes('all-tests') && (
            <div className="mb-6 animate-slide-up">
              <AchievementBadge achievementId="all-tests" isNew />
            </div>
          )}
          {newAchievements.includes('first-test') && !newAchievements.includes('all-tests') && (
            <div className="mb-6 animate-slide-up">
              <AchievementBadge achievementId="first-test" isNew />
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-8">
            <p className="text-amber-800 dark:text-amber-200 text-sm">
              <strong>{t('common:disclaimer.title')}:</strong> {t('common:disclaimer.short')}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {!otherEyeComplete && (
              <button
                onClick={handleTestAnotherEye}
                className="w-full py-4 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-colors"
              >
                {t('common:actions.testOtherEye', { eye: otherEye === 'left' ? t('common:eye.left') : t('common:eye.right') })} →
              </button>
            )}
            {bothComplete && (
              <button
                onClick={() => navigate('/results')}
                className="w-full py-4 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-colors"
              >
                {t('common:actions.viewAllResults')}
              </button>
            )}
            {!bothComplete && otherEyeComplete && (
              <button
                onClick={() => navigate('/results')}
                className="w-full py-4 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-colors"
              >
                {t('common:actions.viewAllResults')}
              </button>
            )}
            <button
              onClick={handleTestAnotherEye}
              className="w-full py-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              {otherEyeComplete ? t('common:actions.retestEye') : t('common:nav.backToEyeSelection')}
            </button>
            <Link
              to="/"
              className="w-full py-4 text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              {t('common:nav.backToHome')}
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return null
}
