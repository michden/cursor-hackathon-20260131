import { useState, useCallback, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTestResults } from '../context/TestResultsContext'
import EyeSelector from '../components/EyeSelector'
import Celebration from '../components/Celebration'
import AchievementBadge from '../components/AchievementBadge'

// Letters used in Pelli-Robson test
const LETTERS = ['C', 'D', 'H', 'K', 'N', 'O', 'R', 'S', 'V', 'Z']

// Contrast levels (percentage opacity, roughly following Pelli-Robson)
const CONTRAST_LEVELS = [
  { level: 1, opacity: 1.0, logCS: 0.0 },
  { level: 2, opacity: 0.7, logCS: 0.15 },
  { level: 3, opacity: 0.5, logCS: 0.3 },
  { level: 4, opacity: 0.35, logCS: 0.45 },
  { level: 5, opacity: 0.25, logCS: 0.6 },
  { level: 6, opacity: 0.18, logCS: 0.75 },
  { level: 7, opacity: 0.12, logCS: 0.9 },
  { level: 8, opacity: 0.08, logCS: 1.05 },
  { level: 9, opacity: 0.05, logCS: 1.2 },
  { level: 10, opacity: 0.03, logCS: 1.35 },
]

// Explanations for contrast sensitivity scores
const CS_EXPLANATIONS = {
  excellent: { label: 'Excellent sensitivity', description: 'You can detect very low contrast differences' },
  good: { label: 'Good sensitivity', description: 'Normal range for most adults' },
  mild: { label: 'Mild reduction', description: 'Some difficulty with low contrast - consider an eye exam' },
  moderate: { label: 'Moderate reduction', description: 'May affect daily activities - eye exam recommended' },
  low: { label: 'Reduced sensitivity', description: 'Professional evaluation recommended' },
}

const TRIALS_PER_LEVEL = 3
const MIN_CORRECT = 2

export default function ContrastSensitivityTest() {
  const navigate = useNavigate()
  const { results, updateContrastSensitivity, checkAndUnlockAchievements } = useTestResults()
  const [newAchievements, setNewAchievements] = useState([])
  
  const [phase, setPhase] = useState('eye-select') // eye-select, instructions, testing, complete
  const [currentEye, setCurrentEye] = useState(null) // 'left' | 'right' | null
  const [currentLevel, setCurrentLevel] = useState(0)
  const [trialInLevel, setTrialInLevel] = useState(0)
  const [correctInLevel, setCorrectInLevel] = useState(0)
  const [currentLetter, setCurrentLetter] = useState(() => 
    LETTERS[Math.floor(Math.random() * LETTERS.length)]
  )
  const [inputValue, setInputValue] = useState('')
  const [bestLevel, setBestLevel] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [testHistory, setTestHistory] = useState([])

  const inputRef = useRef(null)
  const feedbackRef = useRef(feedback)

  const generateNewLetter = useCallback(() => {
    setCurrentLetter(LETTERS[Math.floor(Math.random() * LETTERS.length)])
  }, [])

  const resetTestState = useCallback(() => {
    setCurrentLevel(0)
    setTrialInLevel(0)
    setCorrectInLevel(0)
    setBestLevel(0)
    setTestHistory([])
    setInputValue('')
    generateNewLetter()
  }, [generateNewLetter])

  const finishTest = useCallback((finalLevel, updatedHistory) => {
    const levelResult = finalLevel > 0 ? CONTRAST_LEVELS[finalLevel - 1] : null
    const newResult = {
      level: finalLevel,
      logCS: levelResult?.logCS || 0,
      maxLevel: CONTRAST_LEVELS.length,
      history: updatedHistory,
      testedAt: new Date().toISOString()
    }
    
    // Save result for the current eye
    updateContrastSensitivity(currentEye, newResult)
    
    // Check for newly unlocked achievements
    const updatedResults = {
      ...results,
      contrastSensitivity: {
        ...results.contrastSensitivity,
        [currentEye]: newResult
      }
    }
    const unlocked = checkAndUnlockAchievements(updatedResults)
    setNewAchievements(unlocked)
    
    setPhase('complete')
  }, [updateContrastSensitivity, currentEye, results, checkAndUnlockAchievements])

  const handleEyeSelect = (eye) => {
    setCurrentEye(eye)
    resetTestState()
    setPhase('instructions')
  }

  const handleTestAnotherEye = () => {
    resetTestState()
    setPhase('eye-select')
  }

  const handleSubmit = useCallback(() => {
    if (!inputValue) return
    
    const isCorrect = inputValue.toUpperCase() === currentLetter
    
    // Build the new trial entry
    const newTrial = {
      level: currentLevel,
      expected: currentLetter,
      answered: inputValue.toUpperCase(),
      correct: isCorrect
    }
    
    // Compute the updated history to pass to finishTest (avoids stale closure)
    const updatedHistory = [...testHistory, newTrial]
    
    // Record this trial in state
    setTestHistory(updatedHistory)
    
    // Show feedback briefly
    const newFeedback = isCorrect ? 'correct' : 'incorrect'
    feedbackRef.current = newFeedback
    setFeedback(newFeedback)
    
    const newCorrect = isCorrect ? correctInLevel + 1 : correctInLevel
    const newTrialCount = trialInLevel + 1
    
    setTimeout(() => {
      feedbackRef.current = null
      setFeedback(null)
      
      if (newTrialCount >= TRIALS_PER_LEVEL) {
        if (newCorrect >= MIN_CORRECT) {
          // Passed this level
          const newBest = Math.max(bestLevel, currentLevel + 1)
          setBestLevel(newBest)
          
          if (currentLevel + 1 >= CONTRAST_LEVELS.length) {
            finishTest(newBest, updatedHistory)
          } else {
            setCurrentLevel(currentLevel + 1)
            setTrialInLevel(0)
            setCorrectInLevel(0)
            generateNewLetter()
          }
        } else {
          finishTest(bestLevel, updatedHistory)
        }
      } else {
        setTrialInLevel(newTrialCount)
        setCorrectInLevel(newCorrect)
        generateNewLetter()
      }
      
      setInputValue('')
    }, 300)
  }, [inputValue, currentLetter, currentLevel, trialInLevel, correctInLevel, bestLevel, testHistory, generateNewLetter, finishTest])

  // Keyboard support - Enter to submit
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (phase !== 'testing' || feedbackRef.current !== null) return
      
      if (event.key === 'Enter' && inputValue) {
        event.preventDefault()
        handleSubmit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phase, inputValue, handleSubmit])

  // Auto-focus input when entering testing phase
  useEffect(() => {
    if (phase === 'testing' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [phase, currentLetter])

  const startTest = () => {
    setPhase('testing')
    generateNewLetter()
  }

  const getExplanation = (logCS) => {
    if (logCS >= 1.2) return CS_EXPLANATIONS.excellent
    if (logCS >= 0.9) return CS_EXPLANATIONS.good
    if (logCS >= 0.6) return CS_EXPLANATIONS.mild
    if (logCS >= 0.3) return CS_EXPLANATIONS.moderate
    return CS_EXPLANATIONS.low
  }

  if (phase === 'eye-select') {
    return (
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 bg-white border-b border-slate-100 px-4 py-4 flex items-center gap-4">
          <Link to="/" className="text-slate-400 hover:text-slate-600">
            ← Back
          </Link>
          <h1 className="text-lg font-semibold text-slate-800">Contrast Sensitivity Test</h1>
        </header>
        <EyeSelector 
          onSelect={handleEyeSelect}
          completedEyes={results.contrastSensitivity}
          testName="Contrast Sensitivity"
        />
      </div>
    )
  }

  if (phase === 'instructions') {
    return (
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 bg-white border-b border-slate-100 px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setPhase('eye-select')} 
              className="text-slate-400 hover:text-slate-600"
            >
              ← Back
            </button>
            <h1 className="text-lg font-semibold text-slate-800">Contrast Sensitivity Test</h1>
          </div>
          <div className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {currentEye === 'left' ? '👁️ Left Eye' : '👁️ Right Eye'}
          </div>
        </header>

        <div className="p-6 max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🔆</div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Pelli-Robson Test</h2>
            <p className="text-slate-600">Testing your {currentEye} eye</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-slate-800 mb-4">Instructions:</h3>
            <ol className="space-y-3 text-slate-600">
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-sm font-medium">1</span>
                <span>Hold your phone at arm's length (~40cm)</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-sm font-medium">2</span>
                <span>A letter will appear on a gray background</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-sm font-medium">3</span>
                <span>Type the letter you see (C, D, H, K, N, O, R, S, V, or Z)</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-sm font-medium">4</span>
                <span>Letters will fade as you progress</span>
              </li>
            </ol>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Make sure your screen brightness is at maximum for accurate results. 
              This is a screening tool only, not a medical diagnosis.
            </p>
          </div>

          <button
            onClick={startTest}
            className="w-full py-4 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 active:bg-amber-700 transition-colors"
          >
            Start Test
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'complete') {
    const result = bestLevel > 0 ? CONTRAST_LEVELS[bestLevel - 1] : null
    const explanation = result ? getExplanation(result.logCS) : CS_EXPLANATIONS.low
    const otherEye = currentEye === 'left' ? 'right' : 'left'
    const otherEyeComplete = results.contrastSensitivity?.[otherEye]
    const bothComplete = results.contrastSensitivity?.left && results.contrastSensitivity?.right
    
    return (
      <div className="min-h-screen bg-white">
        {/* Trigger celebration */}
        <Celebration type="confetti" />
        
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
          <div className="text-6xl mb-4 animate-bounce">✅</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            {currentEye === 'left' ? 'Left' : 'Right'} Eye Complete!
          </h2>
          
          <div className="bg-amber-50 rounded-xl p-6 my-6">
            <p className="text-slate-600 mb-2">Contrast sensitivity:</p>
            <p className="text-4xl font-bold text-amber-600">
              {result ? result.logCS.toFixed(2) : '0.00'} logCS
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Level {bestLevel} of {CONTRAST_LEVELS.length}
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-semibold text-slate-800 mb-3">What does this mean?</h3>
            
            {/* Personalized result explanation */}
            <div className="bg-white border-2 border-amber-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-amber-600 uppercase tracking-wide">Your Result</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-slate-800">{result ? result.logCS.toFixed(2) : '0.00'}</span>
                <span className="text-sm font-medium text-amber-600">{explanation.label}</span>
              </div>
              <p className="text-sm text-slate-600 mt-1">{explanation.description}</p>
            </div>

            {/* Visual reference scale */}
            <div className="mt-3">
              <p className="text-xs text-slate-500 mb-2">Reference Scale:</p>
              <div className="relative">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>0.0</span>
                  <span>0.75</span>
                  <span>1.35</span>
                </div>
                <div className="h-2 bg-linear-to-r from-red-400 via-amber-400 to-emerald-400 rounded-full relative">
                  {/* Marker for user's score */}
                  {result && (
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-slate-700 rounded-full shadow"
                      style={{ 
                        // Piecewise linear interpolation to match label positions:
                        // - 0.0 at 0%, 0.75 at 50%, 1.35 at 100%
                        left: `${result.logCS <= 0.75 
                          ? (result.logCS / 0.75) * 50 
                          : 50 + ((result.logCS - 0.75) / 0.60) * 50}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    />
                  )}
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>Lower</span>
                  <span>Average</span>
                  <span>Better</span>
                </div>
              </div>
            </div>
          </div>

          {/* Show achievement if earned */}
          {newAchievements.includes('first-test') && (
            <div className="mb-6 animate-slide-up">
              <AchievementBadge achievementId="first-test" isNew />
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-800">
              This is a screening estimate only. Contrast sensitivity can be affected by 
              screen brightness, ambient lighting, and other factors. Please see an eye care 
              professional for an accurate assessment.
            </p>
          </div>

          <div className="space-y-3">
            {!otherEyeComplete && (
              <button
                onClick={handleTestAnotherEye}
                className="w-full py-4 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 transition-colors"
              >
                Test {otherEye === 'left' ? 'Left' : 'Right'} Eye →
              </button>
            )}
            {bothComplete && (
              <button
                onClick={() => navigate('/results')}
                className="w-full py-4 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 transition-colors"
              >
                View All Results
              </button>
            )}
            {!bothComplete && otherEyeComplete && (
              <button
                onClick={() => navigate('/results')}
                className="w-full py-4 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 transition-colors"
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
  const contrast = CONTRAST_LEVELS[currentLevel]
  
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
          Lvl {currentLevel + 1}/{CONTRAST_LEVELS.length}
        </div>
        <div className="text-sm text-slate-500">
          {trialInLevel + 1}/{TRIALS_PER_LEVEL}
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-slate-100">
        <div 
          className="h-full bg-amber-500 transition-all duration-300"
          style={{ width: `${((currentLevel * TRIALS_PER_LEVEL + trialInLevel) / (CONTRAST_LEVELS.length * TRIALS_PER_LEVEL)) * 100}%` }}
        />
      </div>

      {/* Letter Display */}
      <div className={`
        flex-1 flex items-center justify-center bg-slate-100
        ${feedback === 'correct' ? 'bg-green-50' : ''}
        ${feedback === 'incorrect' ? 'bg-red-50' : ''}
        transition-colors duration-150
      `}>
        <span 
          className="text-8xl font-bold select-none"
          style={{ 
            color: `rgba(0, 0, 0, ${contrast.opacity})`,
            fontFamily: 'Arial, sans-serif'
          }}
        >
          {currentLetter}
        </span>
      </div>

      {/* Current contrast level indicator */}
      <div className="text-center py-2 text-sm text-slate-400">
        Contrast: {Math.round(contrast.opacity * 100)}%
      </div>

      {/* Letter input */}
      <div className="p-6 pb-12 bg-white">
        <input
          ref={inputRef}
          type="text"
          maxLength={1}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value.toUpperCase())}
          disabled={feedback !== null}
          className="w-full text-center text-3xl py-4 border-2 border-slate-200 rounded-xl mb-4 focus:border-amber-500 focus:outline-none uppercase disabled:bg-slate-50"
          placeholder="?"
          autoFocus
          autoComplete="off"
          autoCapitalize="characters"
        />
        <button 
          onClick={handleSubmit}
          disabled={!inputValue || feedback !== null}
          className="w-full py-4 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 active:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit
        </button>
        <p className="text-xs text-slate-400 text-center mt-3">
          Valid letters: C, D, H, K, N, O, R, S, V, Z
        </p>
      </div>
    </div>
  )
}
