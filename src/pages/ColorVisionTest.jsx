import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTestResults } from '../context/TestResultsContext'
import ColorPlate from '../components/ColorPlate'
import Celebration from '../components/Celebration'
import AchievementBadge from '../components/AchievementBadge'
import AudioInstructions from '../components/AudioInstructions'

// Test plates configuration
// Each plate has a number, type, and what people with different conditions see
const TEST_PLATES = [
  { id: 1, digit: '12', type: 'control', description: 'Control plate - everyone should see 12' },
  { id: 2, digit: '8', type: 'redGreen', description: 'Red-green test - normal vision sees 8' },
  { id: 3, digit: '6', type: 'redGreen', description: 'Red-green test - normal vision sees 6' },
  { id: 4, digit: '29', type: 'redGreen', description: 'Red-green test - normal vision sees 29' },
  { id: 5, digit: '45', type: 'redGreen', description: 'Red-green test - normal vision sees 45' },
  { id: 6, digit: '5', type: 'redGreen', description: 'Red-green test - normal vision sees 5' },
  { id: 7, digit: '3', type: 'redGreen', description: 'Red-green test - normal vision sees 3' },
  { id: 8, digit: '74', type: 'control', description: 'Control plate - everyone should see 74' },
]

// Number pad for input
const NUMBER_PAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['clear', '0', 'submit'],
]

function NumberPad({ value, onChange, onSubmit, disabled }) {
  const handlePress = (key) => {
    if (disabled) return
    
    if (key === 'clear') {
      onChange('')
    } else if (key === 'submit') {
      onSubmit()
    } else {
      // Max 2 digits
      if (value.length < 2) {
        onChange(value + key)
      }
    }
  }

  return (
    <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
      {NUMBER_PAD.flat().map((key) => (
        <button
          key={key}
          onClick={() => handlePress(key)}
          disabled={disabled || (key === 'submit' && value.length === 0)}
          className={`
            h-14 rounded-xl text-lg font-semibold transition-colors
            ${key === 'submit' 
              ? 'bg-sky-500 text-white hover:bg-sky-600 disabled:bg-slate-200 disabled:text-slate-400'
              : key === 'clear'
              ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              : 'bg-white border border-slate-200 text-slate-800 hover:bg-slate-50'
            }
            disabled:opacity-50
          `}
        >
          {key === 'submit' ? '→' : key === 'clear' ? '⌫' : key}
        </button>
      ))}
    </div>
  )
}

export default function ColorVisionTest() {
  const navigate = useNavigate()
  const { results, updateColorVision, checkAndUnlockAchievements } = useTestResults()
  
  const [phase, setPhase] = useState('instructions') // instructions, testing, complete
  const [currentPlate, setCurrentPlate] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [answers, setAnswers] = useState([])
  const [feedback, setFeedback] = useState(null)
  const [newAchievements, setNewAchievements] = useState([])

  const handleSubmit = useCallback(() => {
    if (!inputValue) return
    
    const plate = TEST_PLATES[currentPlate]
    const isCorrect = inputValue === plate.digit
    
    // Record answer
    const newAnswer = {
      plateId: plate.id,
      expected: plate.digit,
      answered: inputValue,
      correct: isCorrect,
      type: plate.type
    }
    setAnswers(prev => [...prev, newAnswer])
    
    // Show feedback
    setFeedback(isCorrect ? 'correct' : 'incorrect')
    
    setTimeout(() => {
      setFeedback(null)
      setInputValue('')
      
      if (currentPlate + 1 >= TEST_PLATES.length) {
        // Test complete
        finishTest([...answers, newAnswer])
      } else {
        setCurrentPlate(currentPlate + 1)
      }
    }, 500)
  }, [inputValue, currentPlate, answers])

  const finishTest = (finalAnswers) => {
    const correctCount = finalAnswers.filter(a => a.correct).length
    const redGreenPlates = finalAnswers.filter(a => a.type === 'redGreen')
    const redGreenCorrect = redGreenPlates.filter(a => a.correct).length
    const controlPlates = finalAnswers.filter(a => a.type === 'control')
    const controlCorrect = controlPlates.filter(a => a.correct).length
    
    // Determine result
    let status = 'normal'
    let message = 'Your color vision appears normal.'
    
    if (controlCorrect < controlPlates.length) {
      status = 'inconclusive'
      message = 'Test may be inconclusive. Ensure good lighting and try again.'
    } else if (redGreenCorrect < redGreenPlates.length * 0.5) {
      status = 'possible_deficiency'
      message = 'You may have a red-green color vision deficiency. Please consult an eye care professional for a proper evaluation.'
    } else if (redGreenCorrect < redGreenPlates.length) {
      status = 'mild_difficulty'
      message = 'You may have mild difficulty with some red-green colors. Consider a professional evaluation.'
    }
    
    const newResult = {
      totalPlates: TEST_PLATES.length,
      correctCount,
      redGreenCorrect,
      redGreenTotal: redGreenPlates.length,
      controlCorrect,
      controlTotal: controlPlates.length,
      status,
      message,
      answers: finalAnswers,
      testedAt: new Date().toISOString()
    }
    
    updateColorVision(newResult)
    
    // Check for newly unlocked achievements
    const updatedResults = {
      ...results,
      colorVision: newResult
    }
    const unlocked = checkAndUnlockAchievements(updatedResults)
    setNewAchievements(unlocked)
    
    setPhase('complete')
  }

  const startTest = () => {
    setPhase('testing')
    setCurrentPlate(0)
    setAnswers([])
    setInputValue('')
  }

  if (phase === 'instructions') {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900">
        <header className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-4 flex items-center gap-4">
          <Link to="/" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            ← Back
          </Link>
          <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Color Vision Test</h1>
        </header>

        <div className="p-6 max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎨</div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Ishihara Color Test</h2>
            <p className="text-slate-600">Screen for color vision deficiencies</p>
          </div>

          <AudioInstructions 
            audioKey="color-vision-instructions" 
            label="Test Instructions" 
          />

          <div className="bg-slate-50 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-slate-800 mb-4">Instructions:</h3>
            <ol className="space-y-3 text-slate-600">
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-medium">1</span>
                <span>Ensure you're in a well-lit environment</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-medium">2</span>
                <span>Set your screen brightness to maximum</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-medium">3</span>
                <span>Look at each plate and identify the number</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-medium">4</span>
                <span>Enter the number you see using the keypad</span>
              </li>
            </ol>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Screen-based color tests are less accurate than printed 
              plates. This is a screening tool only, not a medical diagnosis.
            </p>
          </div>

          <button
            onClick={startTest}
            className="w-full py-4 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 active:bg-emerald-700 transition-colors"
          >
            Start Test
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'complete') {
    const correctCount = answers.filter(a => a.correct).length
    const redGreenCorrect = answers.filter(a => a.type === 'redGreen' && a.correct).length
    const redGreenTotal = answers.filter(a => a.type === 'redGreen').length
    const isPerfect = correctCount === TEST_PLATES.length
    
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900">
        {/* Trigger celebration */}
        <Celebration type={isPerfect ? 'fireworks' : 'confetti'} />
        
        <header className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-4 flex items-center gap-4">
          <Link to="/" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            ← Back
          </Link>
          <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Test Complete</h1>
        </header>

        <div className="p-6 max-w-md mx-auto text-center">
          <div className="text-6xl mb-4 animate-bounce">
            {isPerfect ? '🎉' : '✅'}
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            {isPerfect ? 'Perfect Score!' : 'Test Complete!'}
          </h2>
          
          <div className="bg-emerald-50 rounded-xl p-6 my-6">
            <p className="text-slate-600 mb-2">Your score:</p>
            <p className="text-4xl font-bold text-emerald-600">
              {correctCount}/{TEST_PLATES.length}
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Red-green plates: {redGreenCorrect}/{redGreenTotal}
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-semibold text-slate-800 mb-2">What does this mean?</h3>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• <strong>All correct</strong> - Normal color vision likely</li>
              <li>• <strong>1-2 missed</strong> - Mild difficulty possible</li>
              <li>• <strong>3+ missed</strong> - May indicate color vision deficiency</li>
            </ul>
          </div>

          {/* Show achievement if earned */}
          {newAchievements.includes('color-perfect') && (
            <div className="mb-6 animate-slide-up">
              <AchievementBadge achievementId="color-perfect" isNew />
            </div>
          )}
          {newAchievements.includes('first-test') && !newAchievements.includes('color-perfect') && (
            <div className="mb-6 animate-slide-up">
              <AchievementBadge achievementId="first-test" isNew />
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-800">
              This is a screening tool only. Screen-based tests are less accurate than 
              clinical tests. Please see an eye care professional for a definitive evaluation.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/results')}
              className="w-full py-4 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors"
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
  const plate = TEST_PLATES[currentPlate]

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col">
      <header className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
          ← Exit
        </Link>
        <div className="text-sm text-slate-500">
          Plate {currentPlate + 1}/{TEST_PLATES.length}
        </div>
        <div className="w-10" /> {/* Spacer for centering */}
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-slate-100">
        <div 
          className="h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${((currentPlate) / TEST_PLATES.length) * 100}%` }}
        />
      </div>

      {/* Plate display */}
      <div className={`
        flex-1 flex flex-col items-center justify-center p-6
        ${feedback === 'correct' ? 'bg-green-50' : ''}
        ${feedback === 'incorrect' ? 'bg-red-50' : ''}
        transition-colors duration-150
      `}>
        <p className="text-slate-600 mb-4">What number do you see?</p>
        
        <ColorPlate 
          digit={plate.digit} 
          paletteType={plate.type} 
          size={280}
          seed={plate.id * 1000}
        />
        
        {/* Input display */}
        <div className="mt-6 mb-2 h-12 w-24 bg-slate-100 rounded-xl flex items-center justify-center">
          <span className="text-2xl font-bold text-slate-800">
            {inputValue || '?'}
          </span>
        </div>
      </div>

      {/* Number pad */}
      <div className="p-6 pb-10 bg-slate-50">
        <NumberPad 
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSubmit}
          disabled={feedback !== null}
        />
        
        <p className="text-center text-sm text-slate-400 mt-4">
          Enter the number and tap → to continue
        </p>
      </div>
    </div>
  )
}
