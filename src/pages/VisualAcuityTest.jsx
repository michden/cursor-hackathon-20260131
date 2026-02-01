import { useState, useCallback, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTestResults } from '../context/TestResultsContext'
import { useVoiceCommandSettings } from '../context/VoiceCommandContext'
import { useVoiceCommands } from '../hooks/useVoiceCommands'
import EyeSelector from '../components/EyeSelector'
import Celebration from '../components/Celebration'
import AchievementBadge from '../components/AchievementBadge'
import AudioInstructions from '../components/AudioInstructions'
import VoiceCommandIndicator from '../components/VoiceCommandIndicator'

// Tumbling E test - the E points in 4 directions
const DIRECTIONS = ['right', 'down', 'left', 'up']

// Visual acuity levels (approximate Snellen equivalents)
// Size in pixels at each level, with corresponding Snellen fraction
const ACUITY_LEVELS = [
  { size: 120, snellen: '20/200', level: 1 },
  { size: 96, snellen: '20/100', level: 2 },
  { size: 72, snellen: '20/70', level: 3 },
  { size: 60, snellen: '20/50', level: 4 },
  { size: 48, snellen: '20/40', level: 5 },
  { size: 36, snellen: '20/30', level: 6 },
  { size: 28, snellen: '20/25', level: 7 },
  { size: 24, snellen: '20/20', level: 8 },
  { size: 18, snellen: '20/15', level: 9 },
  { size: 14, snellen: '20/10', level: 10 },
]

// Explanations for each Snellen score
const ACUITY_EXPLANATIONS = {
  '20/10': { label: 'Exceptional vision', description: 'Significantly better than average' },
  '20/15': { label: 'Excellent vision', description: 'Better than average' },
  '20/20': { label: 'Normal vision', description: 'Standard visual acuity' },
  '20/25': { label: 'Near normal', description: 'Slight reduction, usually fine' },
  '20/30': { label: 'Mild reduction', description: 'May benefit from correction' },
  '20/40': { label: 'Moderate reduction', description: 'May need glasses for driving' },
  '20/50': { label: 'Below average', description: 'Consider an eye exam' },
  '20/70': { label: 'Poor vision', description: 'Eye exam recommended' },
  '20/100': { label: 'Low vision', description: 'Professional assessment needed' },
  '20/200': { label: 'Very low vision', description: 'Significant impairment' },
}

// Number of trials per level
const TRIALS_PER_LEVEL = 3
// Minimum correct to pass a level
const MIN_CORRECT_TO_PASS = 2

function TumblingE({ direction, size }) {
  // Rotation degrees for each direction
  const rotations = {
    right: 0,
    down: 90,
    left: 180,
    up: 270
  }

  return (
    <div 
      className="flex items-center justify-center"
      style={{ 
        fontSize: `${size}px`,
        transform: `rotate(${rotations[direction]}deg)`,
        transition: 'transform 0.2s ease-out'
      }}
    >
      <span className="font-bold select-none" style={{ fontFamily: 'Arial, sans-serif' }}>
        E
      </span>
    </div>
  )
}

function DirectionButton({ direction, onClick, disabled }) {
  const arrows = {
    up: '↑',
    down: '↓',
    left: '←',
    right: '→'
  }

  const positions = {
    up: 'col-start-2 row-start-1',
    down: 'col-start-2 row-start-3',
    left: 'col-start-1 row-start-2',
    right: 'col-start-3 row-start-2'
  }

  return (
    <button
      onClick={() => onClick(direction)}
      disabled={disabled}
      className={`
        ${positions[direction]}
        w-16 h-16 rounded-full text-2xl font-bold
        bg-sky-500 text-white
        hover:bg-sky-600 active:bg-sky-700
        disabled:bg-slate-200 disabled:text-slate-400
        transition-colors
        flex items-center justify-center
      `}
    >
      {arrows[direction]}
    </button>
  )
}

export default function VisualAcuityTest() {
  const navigate = useNavigate()
  const { results, updateVisualAcuity, checkAndUnlockAchievements, hasAchievement, isAchievementNew } = useTestResults()
  const { voiceEnabled } = useVoiceCommandSettings()
  const [newAchievements, setNewAchievements] = useState([])
  
  const [phase, setPhase] = useState('eye-select') // eye-select, instructions, testing, complete
  const [currentEye, setCurrentEye] = useState(null) // 'left' | 'right' | null
  const [currentLevel, setCurrentLevel] = useState(0)
  const [trialInLevel, setTrialInLevel] = useState(0)
  const [correctInLevel, setCorrectInLevel] = useState(0)
  const [currentDirection, setCurrentDirection] = useState(() => 
    DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]
  )
  const [feedback, setFeedback] = useState(null) // 'correct' | 'incorrect' | null
  const [bestLevel, setBestLevel] = useState(0)
  const [testHistory, setTestHistory] = useState([])

  const generateNewDirection = useCallback(() => {
    const newDir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]
    setCurrentDirection(newDir)
  }, [])

  // Use a ref to track feedback synchronously for keyboard handler
  // This prevents race conditions where rapid keypresses bypass the feedback check
  // before React re-renders and re-runs the effect with the new feedback value
  const feedbackRef = useRef(feedback)

  const handleAnswer = useCallback((answer) => {
    const isCorrect = answer === currentDirection
    
    // Record this trial
    setTestHistory(prev => [...prev, {
      level: currentLevel,
      expected: currentDirection,
      answered: answer,
      correct: isCorrect
    }])

    // Show feedback briefly - update ref synchronously to block rapid keypresses
    const newFeedback = isCorrect ? 'correct' : 'incorrect'
    feedbackRef.current = newFeedback
    setFeedback(newFeedback)
    setTimeout(() => {
      feedbackRef.current = null
      setFeedback(null)
    }, 300)

    const newCorrectInLevel = isCorrect ? correctInLevel + 1 : correctInLevel
    const newTrialInLevel = trialInLevel + 1

    if (newTrialInLevel >= TRIALS_PER_LEVEL) {
      // Finished this level
      if (newCorrectInLevel >= MIN_CORRECT_TO_PASS) {
        // Passed this level
        const newBestLevel = Math.max(bestLevel, currentLevel + 1)
        setBestLevel(newBestLevel)

        if (currentLevel + 1 >= ACUITY_LEVELS.length) {
          // Completed all levels!
          finishTest(newBestLevel)
        } else {
          // Move to next level
          setCurrentLevel(currentLevel + 1)
          setTrialInLevel(0)
          setCorrectInLevel(0)
          generateNewDirection()
        }
      } else {
        // Failed this level - test complete
        finishTest(bestLevel)
      }
    } else {
      // Continue with this level
      setTrialInLevel(newTrialInLevel)
      setCorrectInLevel(newCorrectInLevel)
      generateNewDirection()
    }
  }, [currentDirection, currentLevel, trialInLevel, correctInLevel, bestLevel, generateNewDirection])

  // Keep handleAnswer in a ref to avoid re-attaching event listener on every state change
  const handleAnswerRef = useRef(handleAnswer)
  useEffect(() => {
    handleAnswerRef.current = handleAnswer
  })

  // Keyboard arrow key support
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Use ref to get current feedback value synchronously
      // This avoids the closure capturing a stale feedback value
      if (phase !== 'testing' || feedbackRef.current !== null) return

      const keyToDirection = {
        'ArrowUp': 'up',
        'ArrowDown': 'down',
        'ArrowLeft': 'left',
        'ArrowRight': 'right'
      }

      const direction = keyToDirection[event.key]
      if (direction) {
        event.preventDefault()
        handleAnswerRef.current(direction)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phase])

  // Voice command handler
  const handleVoiceCommand = useCallback((command) => {
    // Only process direction commands during testing phase
    if (phase !== 'testing' || feedbackRef.current !== null) return

    const validDirections = ['up', 'down', 'left', 'right']
    if (validDirections.includes(command)) {
      handleAnswerRef.current(command)
    }
  }, [phase])

  // Voice commands hook
  const { isListening, transcript, startListening, stopListening } = useVoiceCommands({
    onCommand: handleVoiceCommand,
    enabled: voiceEnabled && phase === 'testing',
  })

  // Auto-start/stop listening based on phase and voice enabled state
  useEffect(() => {
    if (voiceEnabled && phase === 'testing') {
      startListening()
    } else {
      stopListening()
    }
  }, [voiceEnabled, phase, startListening, stopListening])

  const resetTestState = () => {
    setCurrentLevel(0)
    setTrialInLevel(0)
    setCorrectInLevel(0)
    setBestLevel(0)
    setTestHistory([])
    generateNewDirection()
  }

  const finishTest = (finalLevel) => {
    const acuityData = finalLevel > 0 
      ? ACUITY_LEVELS[finalLevel - 1]
      : { snellen: 'Unable to determine', level: 0 }
    
    const newResult = {
      snellen: acuityData.snellen,
      level: acuityData.level,
      maxLevel: ACUITY_LEVELS.length,
      history: testHistory,
      testedAt: new Date().toISOString()
    }
    
    // Save result for the current eye
    updateVisualAcuity(currentEye, newResult)
    
    // Check for newly unlocked achievements with the updated result
    const updatedResults = {
      ...results,
      visualAcuity: {
        ...results.visualAcuity,
        [currentEye]: newResult
      }
    }
    const unlocked = checkAndUnlockAchievements(updatedResults)
    setNewAchievements(unlocked)
    
    setPhase('complete')
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

  const startTest = () => {
    setPhase('testing')
    generateNewDirection()
  }

  const currentAcuity = ACUITY_LEVELS[currentLevel]

  if (phase === 'eye-select') {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900">
        <header className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-4 flex items-center gap-4">
          <Link to="/" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            ← Back
          </Link>
          <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Visual Acuity Test</h1>
        </header>
        <EyeSelector 
          onSelect={handleEyeSelect}
          completedEyes={results.visualAcuity}
          testName="Visual Acuity"
        />
      </div>
    )
  }

  if (phase === 'instructions') {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900">
        <header className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setPhase('eye-select')} 
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              ← Back
            </button>
            <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Visual Acuity Test</h1>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            {currentEye === 'left' ? '👁️ Left Eye' : '👁️ Right Eye'}
          </div>
        </header>

        <div className="p-6 max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">👁️</div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Tumbling E Test</h2>
            <p className="text-slate-600 dark:text-slate-400">Testing your {currentEye} eye</p>
          </div>

          <AudioInstructions 
            audioKey="visual-acuity-instructions" 
            label="Test Instructions" 
          />

          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Instructions:</h3>
            <ol className="space-y-3 text-slate-600 dark:text-slate-300">
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 rounded-full flex items-center justify-center text-sm font-medium">1</span>
                <span>Hold your phone at arm's length (~40cm)</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 rounded-full flex items-center justify-center text-sm font-medium">2</span>
                <span>Look at the letter "E" on screen</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 rounded-full flex items-center justify-center text-sm font-medium">3</span>
                <span>Tap the arrow showing which way the "E" is pointing</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 rounded-full flex items-center justify-center text-sm font-medium">4</span>
                <span>The E will get smaller as you progress</span>
              </li>
            </ol>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-8">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Note:</strong> Test each eye separately by covering the other eye. 
              This is a screening tool only, not a medical diagnosis.
            </p>
          </div>

          <button
            onClick={startTest}
            className="w-full py-4 bg-sky-500 text-white font-semibold rounded-xl hover:bg-sky-600 active:bg-sky-700 transition-colors"
          >
            Start Test
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'complete') {
    const result = bestLevel > 0 ? ACUITY_LEVELS[bestLevel - 1] : null
    const otherEye = currentEye === 'left' ? 'right' : 'left'
    const otherEyeComplete = results.visualAcuity?.[otherEye]
    const bothComplete = results.visualAcuity?.left && results.visualAcuity?.right
    const isPerfect = result?.level >= 8 // 20/20 or better
    
    return (
      <div className="min-h-screen bg-white">
        {/* Trigger celebration */}
        <Celebration type={isPerfect ? 'fireworks' : 'confetti'} />
        
        <header className="sticky top-0 bg-white border-b border-slate-100 px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-slate-400 hover:text-slate-600">
              ← Back
            </Link>
            <h1 className="text-lg font-semibold text-slate-800">Test Complete</h1>
          </div>
          <div className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {currentEye === 'left' ? '👁️ Left Eye' : '👁️ Right Eye'}
          </div>
        </header>

        <div className="p-6 max-w-md mx-auto text-center">
          <div className="text-6xl mb-4 animate-bounce">
            {isPerfect ? '🎉' : '✅'}
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            {isPerfect ? 'Perfect Vision!' : `${currentEye === 'left' ? 'Left' : 'Right'} Eye Complete!`}
          </h2>
          
          <div className="bg-sky-50 rounded-xl p-6 my-6">
            <p className="text-slate-600 mb-2">Estimated visual acuity:</p>
            <p className="text-4xl font-bold text-sky-600">
              {result ? result.snellen : 'N/A'}
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Level {bestLevel} of {ACUITY_LEVELS.length}
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-semibold text-slate-800 mb-3">What does this mean?</h3>
            
            {/* Personalized result explanation */}
            {result && ACUITY_EXPLANATIONS[result.snellen] && (
              <div className="bg-white border-2 border-sky-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-sky-600 uppercase tracking-wide">Your Result</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-slate-800">{result.snellen}</span>
                  <span className="text-sm font-medium text-sky-600">{ACUITY_EXPLANATIONS[result.snellen].label}</span>
                </div>
                <p className="text-sm text-slate-600 mt-1">{ACUITY_EXPLANATIONS[result.snellen].description}</p>
              </div>
            )}

            {/* Visual reference scale */}
            <div className="mt-3">
              <p className="text-xs text-slate-500 mb-2">Reference Scale:</p>
              <div className="relative">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>20/10</span>
                  <span>20/20</span>
                  <span>20/200</span>
                </div>
                <div className="h-2 bg-linear-to-r from-emerald-400 via-sky-400 to-red-400 rounded-full relative">
                  {/* Marker for user's score */}
                  {result && (
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-slate-700 rounded-full shadow"
                      style={{ 
                        // Piecewise linear interpolation to match label positions:
                        // - Level 10 (20/10) at 0%, Level 8 (20/20) at 50%, Level 1 (20/200) at 100%
                        left: `${result.level >= 8 
                          ? ((10 - result.level) / 2) * 50 
                          : 50 + ((8 - result.level) / 7) * 50}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    />
                  )}
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>Better</span>
                  <span>Normal</span>
                  <span>Lower</span>
                </div>
              </div>
            </div>
          </div>

          {/* Show achievement if earned */}
          {newAchievements.includes('perfect-acuity') && (
            <div className="mb-6 animate-slide-up">
              <AchievementBadge achievementId="perfect-acuity" isNew />
            </div>
          )}
          {newAchievements.includes('first-test') && !newAchievements.includes('perfect-acuity') && (
            <div className="mb-6 animate-slide-up">
              <AchievementBadge achievementId="first-test" isNew />
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-800">
              This is a screening estimate only. Please see an eye care professional 
              for an accurate assessment.
            </p>
          </div>

          <div className="space-y-3">
            {!otherEyeComplete && (
              <button
                onClick={handleTestAnotherEye}
                className="w-full py-4 bg-sky-500 text-white font-semibold rounded-xl hover:bg-sky-600 transition-colors"
              >
                Test {otherEye === 'left' ? 'Left' : 'Right'} Eye →
              </button>
            )}
            {bothComplete && (
              <button
                onClick={() => navigate('/results')}
                className="w-full py-4 bg-sky-500 text-white font-semibold rounded-xl hover:bg-sky-600 transition-colors"
              >
                View All Results
              </button>
            )}
            {!bothComplete && otherEyeComplete && (
              <button
                onClick={() => navigate('/results')}
                className="w-full py-4 bg-sky-500 text-white font-semibold rounded-xl hover:bg-sky-600 transition-colors"
              >
                View All Results
              </button>
            )}
            <button
              onClick={handleTestAnotherEye}
              className="w-full py-4 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
            >
              {otherEyeComplete ? 'Retest an Eye' : 'Back to Eye Selection'}
            </button>
            <Link
              to="/"
              className="block w-full py-4 text-slate-500 font-medium text-center hover:text-slate-700 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Testing phase
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="sticky top-0 bg-white border-b border-slate-100 px-4 py-4 flex items-center justify-between">
        <button 
          onClick={() => setPhase('eye-select')} 
          className="text-slate-400 hover:text-slate-600"
        >
          ← Exit
        </button>
        <div className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
          {currentEye === 'left' ? '👁️ L' : '👁️ R'}
        </div>
        <div className="text-sm text-slate-500">
          Lvl {currentLevel + 1}/{ACUITY_LEVELS.length}
        </div>
        <div className="text-sm text-slate-500">
          {trialInLevel + 1}/{TRIALS_PER_LEVEL}
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-slate-100">
        <div 
          className="h-full bg-sky-500 transition-all duration-300"
          style={{ width: `${((currentLevel * TRIALS_PER_LEVEL + trialInLevel) / (ACUITY_LEVELS.length * TRIALS_PER_LEVEL)) * 100}%` }}
        />
      </div>

      {/* E Display */}
      <div className={`
        flex-1 flex items-center justify-center
        ${feedback === 'correct' ? 'bg-green-50' : ''}
        ${feedback === 'incorrect' ? 'bg-red-50' : ''}
        transition-colors duration-150
      `}>
        <TumblingE direction={currentDirection} size={currentAcuity.size} />
      </div>

      {/* Current acuity level indicator */}
      <div className="text-center py-2 text-sm text-slate-400">
        Testing: {currentAcuity.snellen}
      </div>

      {/* Direction buttons */}
      <div className="p-6 pb-12">
        <div className="grid grid-cols-3 grid-rows-3 gap-2 max-w-[220px] mx-auto">
          {DIRECTIONS.map(dir => (
            <DirectionButton
              key={dir}
              direction={dir}
              onClick={handleAnswer}
              disabled={feedback !== null}
            />
          ))}
        </div>
      </div>

      {/* Voice command indicator */}
      {voiceEnabled && (
        <VoiceCommandIndicator isListening={isListening} transcript={transcript} />
      )}
    </div>
  )
}
