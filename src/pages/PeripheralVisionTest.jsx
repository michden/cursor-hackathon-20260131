import { useState, useCallback, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTestResults } from '../context/TestResultsContext'
import EyeSelector from '../components/EyeSelector'
import Celebration from '../components/Celebration'
import AchievementBadge from '../components/AchievementBadge'
import AudioInstructions from '../components/AudioInstructions'

// Test configuration
const TEST_CONFIG = {
  totalDots: 12,           // Number of dots to show during test
  dotDuration: 2000,       // How long each dot is visible (ms)
  minDelay: 1000,          // Minimum delay between dots (ms)
  maxDelay: 3000,          // Maximum delay between dots (ms)
  dotSize: 20,             // Size of the peripheral dot in pixels
  responseWindow: 2500,    // Time allowed to respond (ms)
}

// Peripheral zones (edges of the visible area)
// Angles in degrees (0 = right, 90 = top, 180 = left, 270 = bottom)
const PERIPHERAL_ZONES = [
  { angle: 0, distance: 0.85 },     // Right
  { angle: 45, distance: 0.80 },    // Top-right
  { angle: 90, distance: 0.85 },    // Top
  { angle: 135, distance: 0.80 },   // Top-left
  { angle: 180, distance: 0.85 },   // Left
  { angle: 225, distance: 0.80 },   // Bottom-left
  { angle: 270, distance: 0.85 },   // Bottom
  { angle: 315, distance: 0.80 },   // Bottom-right
]

// Calculate severity based on detection rate and average reaction time
const calculateSeverity = (detectionRate, avgReactionTime) => {
  if (detectionRate >= 0.9 && avgReactionTime < 800) return 'excellent'
  if (detectionRate >= 0.75 && avgReactionTime < 1200) return 'normal'
  if (detectionRate >= 0.6) return 'mild'
  if (detectionRate >= 0.4) return 'moderate'
  return 'significant'
}

// Get a random position in the peripheral area
const getRandomPeripheralPosition = (containerWidth, containerHeight) => {
  const zone = PERIPHERAL_ZONES[Math.floor(Math.random() * PERIPHERAL_ZONES.length)]
  
  // Add some randomness to the position
  const distanceVariation = zone.distance + (Math.random() - 0.5) * 0.1
  const angleVariation = zone.angle + (Math.random() - 0.5) * 30
  const finalAngle = (angleVariation * Math.PI) / 180
  
  const maxRadius = Math.min(containerWidth, containerHeight) / 2
  const radius = maxRadius * distanceVariation
  
  const x = containerWidth / 2 + Math.cos(finalAngle) * radius
  const y = containerHeight / 2 + Math.sin(finalAngle) * radius
  
  // Clamp to container bounds with padding
  const padding = TEST_CONFIG.dotSize
  return {
    x: Math.max(padding, Math.min(containerWidth - padding, x)),
    y: Math.max(padding, Math.min(containerHeight - padding, y)),
    zone: zone.angle,
  }
}

function PeripheralTestArea({ onDotDetected, isActive, onTestComplete }) {
  const { t } = useTranslation('tests')
  const containerRef = useRef(null)
  const [dotPosition, setDotPosition] = useState(null)
  const [dotVisible, setDotVisible] = useState(false)
  const [currentDotIndex, setCurrentDotIndex] = useState(0)
  const [results, setResults] = useState([])
  const dotTimeoutRef = useRef(null)
  const nextDotTimeoutRef = useRef(null)
  const dotAppearTimeRef = useRef(null)

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (dotTimeoutRef.current) clearTimeout(dotTimeoutRef.current)
      if (nextDotTimeoutRef.current) clearTimeout(nextDotTimeoutRef.current)
    }
  }, [])

  // Show next dot
  const showNextDot = useCallback(() => {
    if (!containerRef.current || currentDotIndex >= TEST_CONFIG.totalDots) {
      onTestComplete(results)
      return
    }

    const rect = containerRef.current.getBoundingClientRect()
    const position = getRandomPeripheralPosition(rect.width, rect.height)
    
    setDotPosition(position)
    setDotVisible(true)
    dotAppearTimeRef.current = Date.now()

    // Hide dot after duration (missed if not clicked)
    dotTimeoutRef.current = setTimeout(() => {
      if (dotVisible) {
        // Dot was missed
        setResults(prev => [...prev, { 
          dotIndex: currentDotIndex,
          detected: false, 
          reactionTime: null,
          zone: position.zone 
        }])
        setDotVisible(false)
        setCurrentDotIndex(prev => prev + 1)
      }
    }, TEST_CONFIG.responseWindow)
  }, [currentDotIndex, results, onTestComplete, dotVisible])

  // Start the test
  useEffect(() => {
    if (isActive && currentDotIndex === 0) {
      // Initial delay before first dot
      nextDotTimeoutRef.current = setTimeout(showNextDot, 1500)
    }
  }, [isActive, currentDotIndex, showNextDot])

  // Schedule next dot after current one is processed
  useEffect(() => {
    if (isActive && !dotVisible && currentDotIndex > 0 && currentDotIndex < TEST_CONFIG.totalDots) {
      const delay = TEST_CONFIG.minDelay + Math.random() * (TEST_CONFIG.maxDelay - TEST_CONFIG.minDelay)
      nextDotTimeoutRef.current = setTimeout(showNextDot, delay)
    }
  }, [isActive, dotVisible, currentDotIndex, showNextDot])

  // Handle tap/click anywhere in the test area
  const handleAreaClick = useCallback(() => {
    if (!dotVisible || !isActive) return

    const reactionTime = Date.now() - dotAppearTimeRef.current
    
    // Clear the timeout since we detected the dot
    if (dotTimeoutRef.current) {
      clearTimeout(dotTimeoutRef.current)
    }

    setResults(prev => [...prev, {
      dotIndex: currentDotIndex,
      detected: true,
      reactionTime,
      zone: dotPosition?.zone
    }])
    
    setDotVisible(false)
    setCurrentDotIndex(prev => prev + 1)
    onDotDetected(reactionTime)
  }, [dotVisible, isActive, currentDotIndex, dotPosition, onDotDetected])

  const progress = (currentDotIndex / TEST_CONFIG.totalDots) * 100

  return (
    <div className="flex-1 flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-slate-200 dark:bg-slate-700">
        <div 
          className="h-full bg-fuchsia-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Test area */}
      <div 
        ref={containerRef}
        className="flex-1 relative bg-slate-900 cursor-pointer select-none overflow-hidden"
        onClick={handleAreaClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') handleAreaClick() }}
        aria-label={t('peripheralVision.tapPrompt')}
      >
        {/* Central fixation point */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
        </div>

        {/* Peripheral dot */}
        {dotVisible && dotPosition && (
          <div
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: TEST_CONFIG.dotSize,
              height: TEST_CONFIG.dotSize,
              left: dotPosition.x - TEST_CONFIG.dotSize / 2,
              top: dotPosition.y - TEST_CONFIG.dotSize / 2,
            }}
          />
        )}

        {/* Instructions overlay */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-white/60 text-sm">
            {t('peripheralVision.focusPrompt')}
          </p>
          <p className="text-white/40 text-xs mt-1">
            {t('peripheralVision.tapInstruction')}
          </p>
        </div>

        {/* Counter */}
        <div className="absolute top-4 right-4 text-white/50 text-sm">
          {currentDotIndex}/{TEST_CONFIG.totalDots}
        </div>
      </div>
    </div>
  )
}

export default function PeripheralVisionTest() {
  const { t } = useTranslation(['tests', 'common'])
  const navigate = useNavigate()
  const { results, updatePeripheralVision, checkAndUnlockAchievements } = useTestResults()
  
  const [phase, setPhase] = useState('eye-select') // eye-select, instructions, testing, complete
  const [currentEye, setCurrentEye] = useState(null)
  const [testResults, setTestResults] = useState(null)
  const [newAchievements, setNewAchievements] = useState([])

  const resetTestState = useCallback(() => {
    setTestResults(null)
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

  const handleDotDetected = useCallback(() => {
    // Dot detection is tracked internally in PeripheralTestArea
  }, [])

  const handleTestComplete = useCallback((allResults) => {
    const detected = allResults.filter(r => r.detected)
    const detectionRate = detected.length / TEST_CONFIG.totalDots
    const avgReactionTime = detected.length > 0 
      ? detected.reduce((sum, r) => sum + r.reactionTime, 0) / detected.length 
      : 0
    
    // Analyze which zones had issues
    const missedZones = allResults
      .filter(r => !r.detected)
      .map(r => r.zone)
    
    const severity = calculateSeverity(detectionRate, avgReactionTime)
    
    const newResult = {
      detectionRate: Math.round(detectionRate * 100),
      avgReactionTime: Math.round(avgReactionTime),
      totalDots: TEST_CONFIG.totalDots,
      detectedDots: detected.length,
      missedDots: TEST_CONFIG.totalDots - detected.length,
      missedZones,
      severity,
      testedAt: new Date().toISOString()
    }
    
    setTestResults(newResult)
    
    // Save result for the current eye
    updatePeripheralVision(currentEye, newResult)
    
    // Check for newly unlocked achievements
    const updatedResults = {
      ...results,
      peripheralVision: {
        ...results.peripheralVision,
        [currentEye]: newResult
      }
    }
    const unlocked = checkAndUnlockAchievements(updatedResults)
    setNewAchievements(unlocked)
    
    setPhase('complete')
  }, [currentEye, results, updatePeripheralVision, checkAndUnlockAchievements])

  // Eye selection phase
  if (phase === 'eye-select') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-100 dark:border-slate-700 px-4 py-4 sticky top-0">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <Link to="/" className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
              ← {t('common:nav.back')}
            </Link>
            <h1 className="font-semibold text-slate-800 dark:text-slate-100">{t('peripheralVision.title')}</h1>
            <div className="w-12" />
          </div>
        </header>
        <EyeSelector 
          onSelect={handleEyeSelect}
          completedEyes={results.peripheralVision}
          testName={t('peripheralVision.title')}
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
            <h1 className="font-semibold text-slate-800 dark:text-slate-100">{t('peripheralVision.title')}</h1>
            <div className="text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
              {currentEye === 'left' ? '👁️ L' : '👁️ R'}
            </div>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-fuchsia-100 dark:bg-fuchsia-900/50 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4">
              👁️‍🗨️
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t('peripheralVision.title')}</h2>
            <p className="text-slate-600 dark:text-slate-400">
              {t('peripheralVision.subtitle', { eye: currentEye === 'left' ? t('common:eye.left') : t('common:eye.right') })}
            </p>
          </div>

          <AudioInstructions 
            audioKey="peripheral-vision-instructions" 
            label={t('peripheralVision.instructions.title')} 
          />

          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">{t('peripheralVision.instructions.title')}</h3>
            <ol className="space-y-3 text-slate-600 dark:text-slate-400">
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-fuchsia-100 dark:bg-fuchsia-900/50 text-fuchsia-600 dark:text-fuchsia-400 rounded-full flex items-center justify-center text-sm font-medium">1</span>
                <span>{t('peripheralVision.instructions.step1', { otherEye: otherEye === 'left' ? t('common:eye.left') : t('common:eye.right') })}</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-fuchsia-100 dark:bg-fuchsia-900/50 text-fuchsia-600 dark:text-fuchsia-400 rounded-full flex items-center justify-center text-sm font-medium">2</span>
                <span>{t('peripheralVision.instructions.step2')}</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-fuchsia-100 dark:bg-fuchsia-900/50 text-fuchsia-600 dark:text-fuchsia-400 rounded-full flex items-center justify-center text-sm font-medium">3</span>
                <span>{t('peripheralVision.instructions.step3')}</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-fuchsia-100 dark:bg-fuchsia-900/50 text-fuchsia-600 dark:text-fuchsia-400 rounded-full flex items-center justify-center text-sm font-medium">4</span>
                <span>{t('peripheralVision.instructions.step4')}</span>
              </li>
            </ol>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-8">
            <p className="text-amber-800 dark:text-amber-200 text-sm">
              <strong>{t('common:note')}:</strong> {t('peripheralVision.instructions.note')}
            </p>
          </div>

          <button
            onClick={() => setPhase('testing')}
            className="w-full py-4 bg-fuchsia-500 text-white font-semibold rounded-xl hover:bg-fuchsia-600 transition-colors"
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
            onClick={() => setPhase('eye-select')} 
            className="text-white/70 hover:text-white transition-colors"
          >
            ← {t('common:actions.exit')}
          </button>
          <h1 className="font-semibold text-white">{t('peripheralVision.title')}</h1>
          <div className="text-sm text-white/70 bg-slate-700 px-2 py-1 rounded-full">
            {currentEye === 'left' ? '👁️ L' : '👁️ R'}
          </div>
        </header>

        <PeripheralTestArea 
          onDotDetected={handleDotDetected}
          isActive={phase === 'testing'}
          onTestComplete={handleTestComplete}
        />
      </div>
    )
  }

  // Complete phase
  if (phase === 'complete' && testResults) {
    const isNormal = testResults.severity === 'excellent' || testResults.severity === 'normal'
    const otherEyeComplete = results.peripheralVision?.[otherEye]
    const bothComplete = results.peripheralVision?.left && results.peripheralVision?.right
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* Trigger celebration for normal results */}
        {isNormal && <Celebration type="confetti" />}
        
        <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-100 dark:border-slate-700 px-4 py-4 sticky top-0">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <Link to="/" className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
              ← {t('common:nav.back')}
            </Link>
            <h1 className="font-semibold text-slate-800 dark:text-slate-100">{t('peripheralVision.results.title')}</h1>
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
                {testResults.detectionRate}%
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">
                {t('peripheralVision.results.detectionRate')}
              </p>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                  <div className="text-xl font-bold text-fuchsia-600 dark:text-fuchsia-400">
                    {testResults.detectedDots}/{testResults.totalDots}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {t('peripheralVision.results.dotsDetected')}
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                  <div className="text-xl font-bold text-fuchsia-600 dark:text-fuchsia-400">
                    {testResults.avgReactionTime}ms
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {t('peripheralVision.results.avgReactionTime')}
                  </div>
                </div>
              </div>

              <p className="text-slate-500 dark:text-slate-400 text-sm mt-4">
                {t(`peripheralVision.results.severity.${testResults.severity}`)}
              </p>
            </div>
          </div>

          {/* Explanation */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">{t('common:results.whatThisMeans')}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {isNormal 
                ? t('peripheralVision.explanation.normal')
                : t('peripheralVision.explanation.concerns')}
            </p>
            <div className={`${isNormal ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800'} border rounded-lg p-3`}>
              <p className={`text-sm ${isNormal ? 'text-emerald-800 dark:text-emerald-200' : 'text-amber-800 dark:text-amber-200'}`}>
                {isNormal 
                  ? t('peripheralVision.recommendation.normal')
                  : t('peripheralVision.recommendation.concerns')}
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
                className="w-full py-4 bg-fuchsia-500 text-white font-semibold rounded-xl hover:bg-fuchsia-600 transition-colors"
              >
                {t('common:actions.testOtherEye', { eye: otherEye === 'left' ? t('common:eye.left') : t('common:eye.right') })} →
              </button>
            )}
            {bothComplete && (
              <button
                onClick={() => navigate('/results')}
                className="w-full py-4 bg-fuchsia-500 text-white font-semibold rounded-xl hover:bg-fuchsia-600 transition-colors"
              >
                {t('common:actions.viewResults')}
              </button>
            )}
            {!bothComplete && otherEyeComplete && (
              <button
                onClick={() => navigate('/results')}
                className="w-full py-4 bg-fuchsia-500 text-white font-semibold rounded-xl hover:bg-fuchsia-600 transition-colors"
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
