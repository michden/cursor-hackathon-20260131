import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTestResults } from '../context/TestResultsContext'
import EyeSelector from '../components/EyeSelector'
import Celebration from '../components/Celebration'
import AchievementBadge from '../components/AchievementBadge'
import AudioInstructions from '../components/AudioInstructions'

const GRID_SIZE = 20 // 20x20 grid
const QUESTIONS = [
  { id: 'missing', question: 'Do any areas of the grid appear to be missing or blank?' },
  { id: 'wavy', question: 'Do any of the lines appear wavy or bent?' },
  { id: 'blurry', question: 'Are any areas blurry or unclear?' },
  { id: 'distorted', question: 'Do the squares appear distorted or different sizes?' },
]

function AmslerGrid() {
  return (
    <div className="relative bg-black p-2 rounded-lg" style={{ width: 280, height: 280 }}>
      {/* Grid lines */}
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Vertical lines */}
        {Array.from({ length: GRID_SIZE + 1 }).map((_, i) => (
          <line
            key={`v-${i}`}
            x1={i * (200 / GRID_SIZE)}
            y1={0}
            x2={i * (200 / GRID_SIZE)}
            y2={200}
            stroke="white"
            strokeWidth="0.5"
          />
        ))}
        {/* Horizontal lines */}
        {Array.from({ length: GRID_SIZE + 1 }).map((_, i) => (
          <line
            key={`h-${i}`}
            x1={0}
            y1={i * (200 / GRID_SIZE)}
            x2={200}
            y2={i * (200 / GRID_SIZE)}
            stroke="white"
            strokeWidth="0.5"
          />
        ))}
        {/* Center dot */}
        <circle cx={100} cy={100} r={3} fill="#ef4444" />
      </svg>
    </div>
  )
}

export default function AmslerGridTest() {
  const navigate = useNavigate()
  const { results, updateAmslerGrid, checkAndUnlockAchievements } = useTestResults()
  
  const [phase, setPhase] = useState('eye-select') // eye-select, instructions, testing, complete
  const [currentEye, setCurrentEye] = useState(null) // 'left' | 'right' | null
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [newAchievements, setNewAchievements] = useState([])

  const resetTestState = () => {
    setCurrentQuestion(0)
    setAnswers({})
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

  const handleAnswer = (answer) => {
    const question = QUESTIONS[currentQuestion]
    setAnswers(prev => ({ ...prev, [question.id]: answer }))
    
    if (currentQuestion + 1 >= QUESTIONS.length) {
      finishTest({ ...answers, [question.id]: answer })
    } else {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const finishTest = (finalAnswers) => {
    const hasIssues = Object.values(finalAnswers).some(a => a === true)
    
    const newResult = {
      answers: finalAnswers,
      hasIssues,
      status: hasIssues ? 'concerns_noted' : 'normal',
      message: hasIssues 
        ? 'Some visual distortions were noted. Please consult an eye care professional.'
        : 'No obvious distortions detected. Continue with regular eye care.',
      testedAt: new Date().toISOString()
    }
    
    // Save result for the current eye
    updateAmslerGrid(currentEye, newResult)
    
    // Check for newly unlocked achievements
    const updatedResults = {
      ...results,
      amslerGrid: {
        ...results.amslerGrid,
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
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-100 px-4 py-4 sticky top-0">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <Link to="/" className="text-slate-600 hover:text-slate-800 transition-colors">
              ← Back
            </Link>
            <h1 className="font-semibold text-slate-800">Amsler Grid Test</h1>
            <div className="w-12" />
          </div>
        </header>
        <EyeSelector 
          onSelect={handleEyeSelect}
          completedEyes={results.amslerGrid}
          testName="Amsler Grid"
        />
      </div>
    )
  }

  // Instructions phase
  if (phase === 'instructions') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-100 px-4 py-4 sticky top-0">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <button 
              onClick={() => setPhase('eye-select')} 
              className="text-slate-600 hover:text-slate-800 transition-colors"
            >
              ← Back
            </button>
            <h1 className="font-semibold text-slate-800">Amsler Grid Test</h1>
            <div className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {currentEye === 'left' ? '👁️ L' : '👁️ R'}
            </div>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-purple-100 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4">
              #
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Amsler Grid Test</h2>
            <p className="text-slate-600">
              Testing your {currentEye} eye for visual distortions
            </p>
          </div>

          <AudioInstructions 
            audioSrc="/audio/amsler-grid-instructions.mp3" 
            label="Test Instructions" 
          />

          <div className="bg-slate-50 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-slate-700 mb-4">Instructions:</h3>
            <ol className="space-y-3 text-slate-600">
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">1</span>
                <span>Hold your phone at arm&apos;s length (~40cm)</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">2</span>
                <span>If you wear reading glasses, put them on</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">3</span>
                <span>Cover one eye and focus on the red dot in the center</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">4</span>
                <span>Answer questions about what you see while looking at the dot</span>
              </li>
            </ol>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
            <p className="text-amber-800 text-sm">
              <strong>Important:</strong> Keep your focus on the center red dot throughout the test.
              Use your peripheral vision to observe the grid lines.
            </p>
          </div>

          <button
            onClick={() => setPhase('testing')}
            className="w-full py-4 bg-purple-500 text-white font-semibold rounded-xl hover:bg-purple-600 transition-colors"
          >
            Start Test
          </button>
        </main>
      </div>
    )
  }

  // Testing phase
  if (phase === 'testing') {
    const question = QUESTIONS[currentQuestion]
    
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        <header className="bg-slate-800 px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => setPhase('eye-select')} 
            className="text-white/70 hover:text-white transition-colors"
          >
            ← Exit
          </button>
          <div className="text-sm text-white/70 bg-slate-700 px-2 py-1 rounded-full">
            {currentEye === 'left' ? '👁️ L' : '👁️ R'}
          </div>
          <span className="text-white/70 text-sm">
            {currentQuestion + 1}/{QUESTIONS.length}
          </span>
        </header>

        {/* Progress bar */}
        <div className="h-1 bg-slate-700">
          <div 
            className="h-full bg-purple-500 transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / QUESTIONS.length) * 100}%` }}
          />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <p className="text-white/80 text-sm mb-4 text-center">
            Focus on the red dot in the center
          </p>
          
          <AmslerGrid />
          
          <p className="text-white text-lg font-medium mt-8 text-center px-4">
            {question.question}
          </p>
        </div>

        <div className="p-6 flex gap-4">
          <button
            onClick={() => handleAnswer(false)}
            className="flex-1 py-4 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors"
          >
            No
          </button>
          <button
            onClick={() => handleAnswer(true)}
            className="flex-1 py-4 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 transition-colors"
          >
            Yes
          </button>
        </div>
      </div>
    )
  }

  // Complete phase
  if (phase === 'complete') {
    const hasIssues = Object.values(answers).some(a => a === true)
    const issuesList = QUESTIONS.filter(q => answers[q.id])
    const otherEye = currentEye === 'left' ? 'right' : 'left'
    const otherEyeComplete = results.amslerGrid?.[otherEye]
    const bothComplete = results.amslerGrid?.left && results.amslerGrid?.right
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* Trigger celebration for normal results */}
        {!hasIssues && <Celebration type="confetti" />}
        
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-100 px-4 py-4 sticky top-0">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <Link to="/" className="text-slate-600 hover:text-slate-800 transition-colors">
              ← Back
            </Link>
            <h1 className="font-semibold text-slate-800">Test Complete</h1>
            <div className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {currentEye === 'left' ? '👁️ L' : '👁️ R'}
            </div>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className={`text-6xl mb-4 ${!hasIssues ? 'animate-bounce' : ''}`}>
              {hasIssues ? '⚠️' : '✅'}
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              {currentEye === 'left' ? 'Left' : 'Right'} Eye Complete!
            </h2>
          </div>

          {/* Result Card */}
          <div className={`${hasIssues ? 'bg-amber-50' : 'bg-emerald-50'} rounded-2xl p-6 mb-6`}>
            <div className="text-center">
              <div className={`text-3xl font-bold ${hasIssues ? 'text-amber-600' : 'text-emerald-600'} mb-2`}>
                {hasIssues ? 'Concerns Noted' : 'Normal'}
              </div>
              <p className="text-slate-600 text-sm">
                {hasIssues 
                  ? 'Some visual distortions were reported'
                  : 'No distortions detected'}
              </p>
            </div>
          </div>

          {/* Issues List */}
          {hasIssues && issuesList.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
              <h3 className="font-semibold text-slate-800 mb-3">Reported Issues:</h3>
              <ul className="space-y-2">
                {issuesList.map(q => (
                  <li key={q.id} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-amber-500">•</span>
                    {q.question.replace('Do any', 'Some').replace('?', '').replace('Are any', 'Some')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Explanation */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
            <h3 className="font-semibold text-slate-800 mb-3">What does this mean?</h3>
            <p className="text-sm text-slate-600 mb-4">
              {hasIssues 
                ? 'Visual distortions in the Amsler grid can be an early sign of macular degeneration or other retinal conditions. While this screening is not diagnostic, the reported issues warrant a professional eye examination.'
                : 'Your responses indicate no obvious visual distortions. This is a good sign, but regular eye exams are still recommended, especially if you\'re over 50 or have risk factors for macular degeneration.'}
            </p>
            <div className={`${hasIssues ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'} border rounded-lg p-3`}>
              <p className={`text-sm ${hasIssues ? 'text-amber-800' : 'text-emerald-800'}`}>
                {hasIssues 
                  ? '⚠️ Recommendation: Schedule an appointment with an eye care professional'
                  : '✓ Continue with regular annual eye exams'}
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
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
            <p className="text-amber-800 text-sm">
              <strong>Disclaimer:</strong> This is a screening tool for educational purposes only.
              It is NOT a medical diagnosis. Please consult an eye care professional for accurate assessment.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {!otherEyeComplete && (
              <button
                onClick={handleTestAnotherEye}
                className="w-full py-4 bg-purple-500 text-white font-semibold rounded-xl hover:bg-purple-600 transition-colors"
              >
                Test {otherEye === 'left' ? 'Left' : 'Right'} Eye →
              </button>
            )}
            {bothComplete && (
              <button
                onClick={() => navigate('/results')}
                className="w-full py-4 bg-purple-500 text-white font-semibold rounded-xl hover:bg-purple-600 transition-colors"
              >
                View All Results
              </button>
            )}
            {!bothComplete && otherEyeComplete && (
              <button
                onClick={() => navigate('/results')}
                className="w-full py-4 bg-purple-500 text-white font-semibold rounded-xl hover:bg-purple-600 transition-colors"
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
              className="w-full py-4 text-slate-500 font-medium flex items-center justify-center hover:text-slate-700 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return null
}
