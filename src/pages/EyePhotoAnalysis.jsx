import { useState, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { useTranslation } from 'react-i18next'
import { useTestResults } from '../context/TestResultsContext'
import { analyzeEyePhotoAllLanguages } from '../api/openai'
import AudioInstructions from '../components/AudioInstructions'

// Camera states
const CAMERA_STATES = {
  IDLE: 'idle',
  REQUESTING: 'requesting',
  ACTIVE: 'active',
  ERROR: 'error',
}

function CameraGuideOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Eye positioning guide */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-40 h-40 border-4 border-white/70 rounded-full shadow-lg" />
      </div>
      
      {/* Corner guides */}
      <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-white/70 rounded-tl-lg" />
      <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-white/70 rounded-tr-lg" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-white/70 rounded-bl-lg" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-white/70 rounded-br-lg" />
      
      {/* Instructions */}
      <div className="absolute bottom-20 left-0 right-0 text-center">
        <p className="text-white text-sm font-medium drop-shadow-lg">
          Position your eye within the circle
        </p>
      </div>
    </div>
  )
}

function ApiKeyInput({ apiKey, setApiKey }) {
  const [showKey, setShowKey] = useState(false)
  
  return (
    <div className="bg-slate-50 rounded-xl p-4 mb-6">
      <label className="block text-sm font-medium text-slate-700 mb-2">
        OpenAI API Key
      </label>
      <div className="relative">
        <input
          type={showKey ? 'text' : 'password'}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
          className="w-full px-4 py-3 pr-20 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />
        <button
          type="button"
          onClick={() => setShowKey(!showKey)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm"
        >
          {showKey ? 'Hide' : 'Show'}
        </button>
      </div>
      <p className="text-xs text-slate-500 mt-2">
        Your API key is only used locally and never stored on any server.
      </p>
    </div>
  )
}

export default function EyePhotoAnalysis() {
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  const { updateEyePhoto } = useTestResults()
  
  const [phase, setPhase] = useState('instructions') // instructions, capture, analyzing, results
  const [cameraState, setCameraState] = useState(CAMERA_STATES.IDLE)
  const [capturedImage, setCapturedImage] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState(null)
  const [apiKey, setApiKey] = useState('')
  
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const canvasRef = useRef(null)

  const startCamera = useCallback(async () => {
    setCameraState(CAMERA_STATES.REQUESTING)
    setError(null)
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      
      setCameraState(CAMERA_STATES.ACTIVE)
      setPhase('capture')
    } catch (err) {
      console.error('Camera error:', err)
      setCameraState(CAMERA_STATES.ERROR)
      setError('Could not access camera. Please check permissions.')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraState(CAMERA_STATES.IDLE)
  }, [])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // Set canvas size to video size
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0)
    
    // Get base64 image
    const imageData = canvas.toDataURL('image/jpeg', 0.9)
    setCapturedImage(imageData)
    
    // Stop camera
    stopCamera()
  }, [stopCamera])

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      setCapturedImage(e.target.result)
      setPhase('capture')
    }
    reader.readAsDataURL(file)
  }, [])

  const analyzeImage = useCallback(async () => {
    if (!capturedImage || !apiKey) return
    
    setPhase('analyzing')
    setError(null)
    
    try {
      // Analyze in both languages in parallel
      const result = await analyzeEyePhotoAllLanguages(capturedImage, apiKey)
      setAnalysis(result) // Stores { en: "...", de: "..." }
      
      // Save to context with both language versions
      updateEyePhoto({
        imageData: capturedImage,
        analysis: result,
        status: 'analyzed',
        analyzedAt: new Date().toISOString()
      })
      
      setPhase('results')
    } catch (err) {
      console.error('Analysis error:', err)
      setError(err.message || 'Failed to analyze image')
      setPhase('capture')
    }
  }, [capturedImage, apiKey, updateEyePhoto])

  const retakePhoto = useCallback(() => {
    setCapturedImage(null)
    setAnalysis(null)
    setError(null)
    startCamera()
  }, [startCamera])

  const goToResults = () => {
    navigate('/results')
  }

  // Instructions phase
  if (phase === 'instructions') {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900">
        <header className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-4 flex items-center gap-4">
          <Link to="/" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            ← Back
          </Link>
          <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Eye Photo Analysis</h1>
        </header>

        <div className="p-6 max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">📸</div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">AI Eye Analysis</h2>
            <p className="text-slate-600">Analyze your eye photo with AI</p>
          </div>

          <AudioInstructions 
            audioKey="eye-photo-instructions" 
            label="Instructions" 
          />

          <div className="bg-slate-50 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-slate-800 mb-4">For best results:</h3>
            <ol className="space-y-3 text-slate-600">
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center text-sm font-medium">1</span>
                <span>Find good lighting (natural light is best)</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center text-sm font-medium">2</span>
                <span>Hold phone steady at arm's length</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center text-sm font-medium">3</span>
                <span>Open your eye wide and look at the camera</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center text-sm font-medium">4</span>
                <span>Center your eye in the guide circle</span>
              </li>
            </ol>
          </div>

          <ApiKeyInput apiKey={apiKey} setApiKey={setApiKey} />

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-800">
              <strong>Important:</strong> This AI analysis is for educational purposes only 
              and is NOT a medical diagnosis. Always consult an eye care professional for 
              health concerns.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={startCamera}
              disabled={!apiKey}
              className="w-full py-4 bg-violet-500 text-white font-semibold rounded-xl hover:bg-violet-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <span>📷</span> Take Photo
            </button>
            
            <label className="block w-full py-4 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors text-center cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={!apiKey}
              />
              📁 Upload Photo
            </label>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Capture phase
  if (phase === 'capture') {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <header className="sticky top-0 bg-black/80 backdrop-blur px-4 py-4 flex items-center gap-4 z-10">
          <button 
            onClick={() => { stopCamera(); setPhase('instructions'); setCapturedImage(null); }}
            className="text-white/80 hover:text-white"
          >
            ← Back
          </button>
          <h1 className="text-lg font-semibold text-white">
            {capturedImage ? 'Review Photo' : 'Capture Eye'}
          </h1>
        </header>

        <div className="flex-1 relative flex items-center justify-center bg-black">
          {!capturedImage ? (
            <>
              <video
                ref={(el) => {
                  videoRef.current = el;
                  // Assign stream when video element mounts if stream exists but srcObject is not set
                  if (el && streamRef.current && !el.srcObject) {
                    el.srcObject = streamRef.current;
                    el.play().catch(console.error);
                  }
                }}
                autoPlay
                playsInline
                muted
                className="max-w-full max-h-full object-contain"
              />
              {cameraState === CAMERA_STATES.ACTIVE && <CameraGuideOverlay />}
              
              {cameraState === CAMERA_STATES.REQUESTING && (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <div className="text-white text-center">
                    <div className="animate-spin text-4xl mb-4">⏳</div>
                    <p>Accessing camera...</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <img
              src={capturedImage}
              alt="Captured eye"
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="p-6 bg-black/80 backdrop-blur">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm text-center">
              {error}
            </div>
          )}
          
          {!capturedImage ? (
            <button
              onClick={capturePhoto}
              disabled={cameraState !== CAMERA_STATES.ACTIVE}
              className="w-full py-4 bg-white text-black font-semibold rounded-xl hover:bg-slate-100 disabled:bg-slate-600 disabled:text-slate-400 transition-colors"
            >
              📷 Capture
            </button>
          ) : (
            <div className="space-y-3">
              <button
                onClick={analyzeImage}
                className="w-full py-4 bg-violet-500 text-white font-semibold rounded-xl hover:bg-violet-600 transition-colors"
              >
                ✨ Analyze with AI
              </button>
              <button
                onClick={retakePhoto}
                className="w-full py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors"
              >
                🔄 Retake Photo
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Analyzing phase
  if (phase === 'analyzing') {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-pulse text-6xl mb-6">🔍</div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Analyzing your eye photo...</h2>
          <p className="text-slate-500">This may take a few seconds</p>
          
          <div className="mt-8 w-48 h-1 bg-slate-200 rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-violet-500 rounded-full animate-[loading_1.5s_ease-in-out_infinite]" 
                 style={{ width: '30%', animation: 'loading 1.5s ease-in-out infinite' }} />
          </div>
        </div>
        
        <style>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(200%); }
            100% { transform: translateX(-100%); }
          }
        `}</style>
      </div>
    )
  }

  // Results phase
  if (phase === 'results') {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900">
        <header className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-4 flex items-center gap-4">
          <Link to="/" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            ← Home
          </Link>
          <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Analysis Results</h1>
        </header>

        <div className="p-6 max-w-2xl mx-auto">
          {/* Captured image thumbnail */}
          {capturedImage && (
            <div className="mb-6 flex justify-center">
              <img
                src={capturedImage}
                alt="Analyzed eye"
                className="w-32 h-32 object-cover rounded-full border-4 border-violet-100"
              />
            </div>
          )}

          <div className="text-center mb-6">
            <div className="text-4xl mb-2">✅</div>
            <h2 className="text-xl font-bold text-slate-800">Analysis Complete</h2>
          </div>

          {/* Analysis results */}
          <div className="bg-slate-50 rounded-xl p-6 mb-6">
            <div className="text-slate-700 text-sm leading-relaxed space-y-3 [&>h2]:text-base [&>h2]:font-semibold [&>h2]:mt-4 [&>h2]:mb-2 [&>h3]:text-sm [&>h3]:font-semibold [&>h3]:mt-3 [&>h3]:mb-1 [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-4 [&>ul]:space-y-1 [&>ol]:list-decimal [&>ol]:pl-4 [&>ol]:space-y-1 [&>hr]:my-3 [&>hr]:border-slate-200">
              <ReactMarkdown>
                {typeof analysis === 'string' 
                  ? analysis 
                  : (analysis[i18n.language] || analysis.en)}
              </ReactMarkdown>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-800">
              <strong>Reminder:</strong> This AI analysis is for educational purposes only 
              and is NOT a medical diagnosis. Please consult an eye care professional for 
              any health concerns or for a proper eye examination.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={goToResults}
              className="w-full py-4 bg-violet-500 text-white font-semibold rounded-xl hover:bg-violet-600 transition-colors"
            >
              View All Results
            </button>
            <button
              onClick={retakePhoto}
              className="w-full py-4 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Analyze Another Photo
            </button>
            <Link
              to="/"
              className="block w-full py-4 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors text-center"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return null
}
