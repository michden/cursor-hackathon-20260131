import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTestResults } from '../context/TestResultsContext'

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
  const { updateVisualAcuity } = useTestResults()
  
  const [phase, setPhase] = useState('instructions') // instructions, testing, complete
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

  const handleAnswer = useCallback((answer) => {
    const isCorrect = answer === currentDirection
    
    // Record this trial
    setTestHistory(prev => [...prev, {
      level: currentLevel,
      expected: currentDirection,
      answered: answer,
      correct: isCorrect
    }])

    // Show feedback briefly
    setFeedback(isCorrect ? 'correct' : 'incorrect')
    setTimeout(() => setFeedback(null), 300)

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

  const finishTest = (finalLevel) => {
    const acuityData = finalLevel > 0 
      ? ACUITY_LEVELS[finalLevel - 1]
      : { snellen: 'Unable to determine', level: 0 }
    
    updateVisualAcuity({
      snellen: acuityData.snellen,
      level: acuityData.level,
      maxLevel: ACUITY_LEVELS.length,
      history: testHistory,
      testedAt: new Date().toISOString()
    })
    
    setPhase('complete')
  }

  const startTest = () => {
    setPhase('testing')
    generateNewDirection()
  }

  const currentAcuity = ACUITY_LEVELS[currentLevel]

  if (phase === 'instructions') {
    return (
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 bg-white border-b border-slate-100 px-4 py-4 flex items-center gap-4">
          <Link to="/" className="text-slate-400 hover:text-slate-600">
            ← Back
          </Link>
          <h1 className="text-lg font-semibold text-slate-800">Visual Acuity Test</h1>
        </header>

        <div className="p-6 max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">👁️</div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Tumbling E Test</h2>
            <p className="text-slate-600">Test your visual acuity</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-slate-800 mb-4">Instructions:</h3>
            <ol className="space-y-3 text-slate-600">
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center text-sm font-medium">1</span>
                <span>Hold your phone at arm's length (~40cm)</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center text-sm font-medium">2</span>
                <span>Look at the letter "E" on screen</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center text-sm font-medium">3</span>
                <span>Tap the arrow showing which way the "E" is pointing</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center text-sm font-medium">4</span>
                <span>The E will get smaller as you progress</span>
              </li>
            </ol>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
            <p className="text-sm text-amber-800">
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
    
    return (
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 bg-white border-b border-slate-100 px-4 py-4 flex items-center gap-4">
          <Link to="/" className="text-slate-400 hover:text-slate-600">
            ← Back
          </Link>
          <h1 className="text-lg font-semibold text-slate-800">Test Complete</h1>
        </header>

        <div className="p-6 max-w-md mx-auto text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Test Complete!</h2>
          
          <div className="bg-sky-50 rounded-xl p-6 my-6">
            <p className="text-slate-600 mb-2">Your estimated visual acuity:</p>
            <p className="text-4xl font-bold text-sky-600">
              {result ? result.snellen : 'N/A'}
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Level {bestLevel} of {ACUITY_LEVELS.length}
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-semibold text-slate-800 mb-2">What does this mean?</h3>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• <strong>20/20</strong> - Normal vision</li>
              <li>• <strong>20/40</strong> - May need glasses for driving</li>
              <li>• <strong>20/70</strong> - Consider an eye exam</li>
              <li>• <strong>20/200</strong> - Significant vision impairment</li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-800">
              This is a screening estimate only. Please see an eye care professional 
              for an accurate assessment.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/results')}
              className="w-full py-4 bg-sky-500 text-white font-semibold rounded-xl hover:bg-sky-600 transition-colors"
            >
              View All Results
            </button>
            <Link
              to="/"
              className="block w-full py-4 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
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
        <Link to="/" className="text-slate-400 hover:text-slate-600">
          ← Exit
        </Link>
        <div className="text-sm text-slate-500">
          Level {currentLevel + 1}/{ACUITY_LEVELS.length}
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
    </div>
  )
}
