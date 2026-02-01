import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTestResults } from '../context/TestResultsContext'
import EyeSelector from '../components/EyeSelector'
import Celebration from '../components/Celebration'
import AchievementBadge from '../components/AchievementBadge'
import AudioInstructions from '../components/AudioInstructions'

// Clock positions (1-12) mapped to degrees (0-180 for astigmatism axis)
// Clock position corresponds to the angle of the line
// 12 o'clock = 90°, 3 o'clock = 0°/180°, 6 o'clock = 90°, 9 o'clock = 0°/180°
const CLOCK_TO_AXIS = {
  12: 90,
  1: 75,
  2: 60,
  3: 45,
  4: 30,
  5: 15,
  6: 0, // or 180
  7: 165,
  8: 150,
  9: 135,
  10: 120,
  11: 105
}

// Calculate severity based on number of lines selected
const calculateSeverity = (selectedLines) => {
  if (selectedLines.length === 0) return 'none'
  if (selectedLines.length <= 2) return 'mild'
  if (selectedLines.length <= 4) return 'moderate'
  return 'significant'
}

// Estimate axis from selected lines (find the mode/most common direction)
const estimateAxis = (selectedLines) => {
  if (selectedLines.length === 0) return null
  
  // Get all axes for selected lines
  const axes = selectedLines.map(pos => CLOCK_TO_AXIS[pos])
  
  // Find average direction (handling the 0/180 wraparound)
  // For simplicity, just return the first selected line's axis
  return axes[0]
}

function ClockDial({ selectedLines, onLineToggle, disabled }) {
  const { t } = useTranslation('tests')
  const centerX = 150
  const centerY = 150
  const innerRadius = 20
  const outerRadius = 130

  // Generate lines for clock positions 1-12
  const lines = Array.from({ length: 12 }, (_, i) => {
    const position = i + 1 // 1-12
    // Calculate angle (12 o'clock is -90°, going clockwise)
    const angle = ((position - 3) * 30) * (Math.PI / 180)
    
    const x1 = centerX + Math.cos(angle) * innerRadius
    const y1 = centerY + Math.sin(angle) * innerRadius
    const x2 = centerX + Math.cos(angle) * outerRadius
    const y2 = centerY + Math.sin(angle) * outerRadius
    
    const isSelected = selectedLines.includes(position)
    
    return { position, x1, y1, x2, y2, isSelected }
  })

  return (
    <div className="relative" style={{ width: 300, height: 300 }}>
      <svg viewBox="0 0 300 300" className="w-full h-full">
        {/* Background circle */}
        <circle 
          cx={centerX} 
          cy={centerY} 
          r={outerRadius + 10} 
          fill="white" 
          className="dark:fill-slate-800"
          stroke="#e2e8f0"
          strokeWidth="2"
        />
        
        {/* Radial lines */}
        {lines.map(({ position, x1, y1, x2, y2, isSelected }) => (
          <g key={position}>
            {/* Clickable area (invisible wider line) */}
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="transparent"
              strokeWidth="20"
              strokeLinecap="round"
              className={disabled ? '' : 'cursor-pointer'}
              onClick={() => !disabled && onLineToggle(position)}
            />
            {/* Visible line */}
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isSelected ? '#f59e0b' : '#1e293b'}
              strokeWidth={isSelected ? 4 : 2}
              strokeLinecap="round"
              className={`transition-all duration-200 ${disabled ? '' : 'cursor-pointer'} dark:stroke-slate-300`}
              style={isSelected ? { filter: 'drop-shadow(0 0 4px #f59e0b)' } : {}}
              onClick={() => !disabled && onLineToggle(position)}
            />
            {/* Clock number label */}
            <text
              x={centerX + Math.cos(((position - 3) * 30) * (Math.PI / 180)) * (outerRadius + 20)}
              y={centerY + Math.sin(((position - 3) * 30) * (Math.PI / 180)) * (outerRadius + 20)}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs fill-slate-400 dark:fill-slate-500 select-none pointer-events-none"
            >
              {position}
            </text>
          </g>
        ))}
        
        {/* Center fixation point */}
        <circle 
          cx={centerX} 
          cy={centerY} 
          r={8} 
          fill="#ef4444" 
        />
        <circle 
          cx={centerX} 
          cy={centerY} 
          r={4} 
          fill="white" 
        />
      </svg>
      
      {/* Selection indicator */}
      {selectedLines.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 text-center">
          <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">
            {t('astigmatism.linesSelected', { count: selectedLines.length })}
          </span>
        </div>
      )}
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
  const [allLinesEqual, setAllLinesEqual] = useState(null)
  const [newAchievements, setNewAchievements] = useState([])

  const resetTestState = useCallback(() => {
    setSelectedLines([])
    setAllLinesEqual(null)
  }, [])

  const handleEyeSelect = useCallback((eye) => {
    setCurrentEye(eye)
    resetTestState()
    setPhase('instructions')
  }, [resetTestState])

  const handleTestAnotherEye = useCallback(() => {
    resetTestState()
    setPhase('eye-select')
  }, [resetTestState])

  const handleLineToggle = useCallback((position) => {
    setSelectedLines(prev => {
      if (prev.includes(position)) {
        return prev.filter(p => p !== position)
      }
      return [...prev, position]
    })
    // If user selects a line, they're not saying all lines are equal
    setAllLinesEqual(false)
  }, [])

  const handleAllLinesEqual = useCallback(() => {
    setAllLinesEqual(true)
    setSelectedLines([])
  }, [])

  const finishTest = useCallback(() => {
    const isEqual = allLinesEqual === true
    const severity = isEqual ? 'none' : calculateSeverity(selectedLines)
    const axis = isEqual ? null : estimateAxis(selectedLines)
    
    const newResult = {
      allLinesEqual: isEqual,
      selectedLines: isEqual ? [] : selectedLines,
      estimatedAxis: axis,
      severity,
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
  }, [allLinesEqual, selectedLines, currentEye, results, updateAstigmatism, checkAndUnlockAchievements])

  const canSubmit = allLinesEqual === true || selectedLines.length > 0

  // Eye selection phase
  if (phase === 'eye-select') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-100 dark:border-slate-700 px-4 py-4 sticky top-0">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <Link to="/" className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
              ← {t('common:nav.back')}
            </Link>
            <h1 className="font-semibold text-slate-800 dark:text-slate-100">{t('astigmatism.title')}</h1>
            <div className="w-12" />
          </div>
        </header>
        <EyeSelector 
          onSelect={handleEyeSelect}
          completedEyes={results.astigmatism}
          testName={t('astigmatism.title')}
        />
      </div>
    )
  }

  const otherEye = currentEye === 'left' ? 'right' : 'left'

  // Instructions phase
  if (phase === 'instructions') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-100 dark:border-slate-700 px-4 py-4 sticky top-0">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <button 
              onClick={() => setPhase('eye-select')} 
              className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              ← {t('common:nav.back')}
            </button>
            <h1 className="font-semibold text-slate-800 dark:text-slate-100">{t('astigmatism.title')}</h1>
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
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t('astigmatism.title')}</h2>
            <p className="text-slate-600 dark:text-slate-400">
              {t('astigmatism.subtitle', { eye: currentEye === 'left' ? t('common:eye.left') : t('common:eye.right') })}
            </p>
          </div>

          <AudioInstructions 
            audioKey="astigmatism-instructions" 
            label={t('astigmatism.instructions.title')} 
          />

          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">{t('astigmatism.instructions.title')}</h3>
            <ol className="space-y-3 text-slate-600 dark:text-slate-400">
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center text-sm font-medium">1</span>
                <span>{t('astigmatism.instructions.step1', { otherEye: otherEye === 'left' ? t('common:eye.left') : t('common:eye.right') })}</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center text-sm font-medium">2</span>
                <span>{t('astigmatism.instructions.step2')}</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center text-sm font-medium">3</span>
                <span>{t('astigmatism.instructions.step3')}</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center text-sm font-medium">4</span>
                <span>{t('astigmatism.instructions.step4')}</span>
              </li>
            </ol>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-8">
            <p className="text-amber-800 dark:text-amber-200 text-sm">
              <strong>{t('common:note')}:</strong> {t('astigmatism.instructions.note')}
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
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col">
        <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-100 dark:border-slate-700 px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => setPhase('eye-select')} 
            className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            ← {t('common:actions.exit')}
          </button>
          <h1 className="font-semibold text-slate-800 dark:text-slate-100">{t('astigmatism.title')}</h1>
          <div className="text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
            {currentEye === 'left' ? '👁️ L' : '👁️ R'}
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <p className="text-slate-600 dark:text-slate-300 text-center mb-2">
            {t('astigmatism.focusPrompt')}
          </p>
          <p className="text-slate-800 dark:text-slate-100 text-lg font-medium text-center mb-6">
            {t('astigmatism.question')}
          </p>
          
          <ClockDial 
            selectedLines={selectedLines} 
            onLineToggle={handleLineToggle}
            disabled={allLinesEqual === true}
          />
          
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-4 text-center">
            {t('astigmatism.selectDarker')}
          </p>
        </div>

        <div className="p-6 space-y-3">
          <button
            onClick={handleAllLinesEqual}
            className={`w-full py-4 font-semibold rounded-xl transition-colors ${
              allLinesEqual === true
                ? 'bg-emerald-500 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {allLinesEqual === true ? '✓ ' : ''}{t('astigmatism.allEqual')}
          </button>
          
          <button
            onClick={finishTest}
            disabled={!canSubmit}
            className="w-full py-4 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
          >
            {t('astigmatism.confirm')}
          </button>
        </div>
      </div>
    )
  }

  // Complete phase
  if (phase === 'complete') {
    const isNormal = allLinesEqual === true
    const severity = isNormal ? 'none' : calculateSeverity(selectedLines)
    const axis = isNormal ? null : estimateAxis(selectedLines)
    const otherEyeComplete = results.astigmatism?.[otherEye]
    const bothComplete = results.astigmatism?.left && results.astigmatism?.right
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* Trigger celebration for normal results */}
        {isNormal && <Celebration type="confetti" />}
        
        <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-100 dark:border-slate-700 px-4 py-4 sticky top-0">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <Link to="/" className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
              ← {t('common:nav.back')}
            </Link>
            <h1 className="font-semibold text-slate-800 dark:text-slate-100">{t('astigmatism.results.title')}</h1>
            <div className="text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
              {currentEye === 'left' ? '👁️ L' : '👁️ R'}
            </div>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className={`text-6xl mb-4 ${isNormal ? 'animate-bounce' : ''}`}>
              {isNormal ? '✅' : '⚠️'}
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              {currentEye === 'left' ? t('common:eye.left') : t('common:eye.right')} {t('common:eye.eyeComplete')}
            </h2>
          </div>

          {/* Result Card */}
          <div className={`${isNormal ? 'bg-emerald-50 dark:bg-emerald-950/50' : 'bg-amber-50 dark:bg-amber-950/50'} rounded-2xl p-6 mb-6`}>
            <div className="text-center">
              <div className={`text-3xl font-bold ${isNormal ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'} mb-2`}>
                {isNormal ? t('astigmatism.results.noAstigmatism') : t('astigmatism.results.possibleAstigmatism')}
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                {isNormal ? t('astigmatism.results.noAstigmatismDesc') : t('astigmatism.results.possibleAstigmatismDesc')}
              </p>
              {!isNormal && axis !== null && (
                <p className="text-slate-700 dark:text-slate-300 text-sm mt-2 font-medium">
                  {t('astigmatism.results.axis', { degrees: axis })}
                </p>
              )}
              {!isNormal && (
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  {t(`astigmatism.results.severity.${severity}`)}
                </p>
              )}
            </div>
          </div>

          {/* Explanation */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">{t('common:results.whatThisMeans')}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {isNormal 
                ? t('astigmatism.explanation.normal')
                : t('astigmatism.explanation.detected')}
            </p>
            <div className={`${isNormal ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800'} border rounded-lg p-3`}>
              <p className={`text-sm ${isNormal ? 'text-emerald-800 dark:text-emerald-200' : 'text-amber-800 dark:text-amber-200'}`}>
                {isNormal 
                  ? t('astigmatism.recommendation.normal')
                  : t('astigmatism.recommendation.detected')}
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
              <strong>{t('common:disclaimer.title')}:</strong> {t('common:disclaimer.text')}
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
                {t('common:actions.viewResults')}
              </button>
            )}
            {!bothComplete && otherEyeComplete && (
              <button
                onClick={() => navigate('/results')}
                className="w-full py-4 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-colors"
              >
                {t('common:actions.viewResults')}
              </button>
            )}
            <button
              onClick={handleTestAnotherEye}
              className="w-full py-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              {otherEyeComplete ? t('common:actions.retestEye') : t('common:actions.backToEyeSelection')}
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
