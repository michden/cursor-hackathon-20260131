import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import AudioInstructions from './AudioInstructions'

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    translationKey: 'welcome',
    icon: '👁️',
    color: 'sky',
    audioKey: 'onboarding-step-1'
  },
  {
    id: 'visual-acuity',
    translationKey: 'visualAcuity',
    icon: '📖',
    color: 'sky',
    animation: 'tumbling-e',
    audioKey: 'onboarding-step-2'
  },
  {
    id: 'color-vision',
    translationKey: 'colorVision',
    icon: '🎨',
    color: 'emerald',
    animation: 'color-dots',
    audioKey: 'onboarding-step-3'
  },
  {
    id: 'contrast-sensitivity',
    translationKey: 'contrastSensitivity',
    icon: '🔆',
    color: 'amber',
    animation: 'contrast-letters',
    audioKey: 'onboarding-step-4'
  },
  {
    id: 'amsler-grid',
    translationKey: 'amslerGrid',
    icon: '#',
    color: 'purple',
    animation: 'amsler-grid',
    audioKey: 'onboarding-step-5'
  },
  {
    id: 'disclaimer',
    translationKey: 'disclaimer',
    icon: '⚠️',
    color: 'amber',
    audioKey: 'onboarding-step-6'
  }
]

// Animated Tumbling E component
function TumblingEAnimation() {
  return (
    <div className="mb-6 text-6xl font-bold animate-pulse flex items-center justify-center">
      <div className="animate-spin" style={{ animationDuration: '3s' }}>
        E
      </div>
    </div>
  )
}

// Animated color dots component
function ColorDotsAnimation() {
  const colors = ['#ef4444', '#22c55e', '#3b82f6', '#eab308']
  return (
    <div className="mb-6 flex gap-3 justify-center">
      {colors.map((color, i) => (
        <div
          key={color}
          className="w-6 h-6 rounded-full animate-pulse"
          style={{ 
            backgroundColor: color,
            animationDelay: `${i * 0.15}s`
          }}
        />
      ))}
    </div>
  )
}

// Animated contrast letters component
function ContrastLettersAnimation() {
  return (
    <div className="mb-6 flex gap-2 justify-center items-baseline">
      {['H', 'K', 'D'].map((letter, i) => (
        <span
          key={letter}
          className="text-4xl font-bold animate-pulse"
          style={{ 
            opacity: 1 - (i * 0.3),
            animationDelay: `${i * 0.2}s`
          }}
        >
          {letter}
        </span>
      ))}
    </div>
  )
}

// Animated Amsler grid component
function AmslerGridAnimation() {
  return (
    <div className="mb-6 flex items-center justify-center">
      <div 
        className="w-16 h-16 border-2 border-white/80 relative animate-pulse"
        style={{ 
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '8px 8px'
        }}
      >
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2" />
      </div>
    </div>
  )
}

export default function Onboarding({ onComplete }) {
  const { t } = useTranslation(['common', 'tests'])
  const [currentStep, setCurrentStep] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const step = ONBOARDING_STEPS[currentStep]
  const isLast = currentStep === ONBOARDING_STEPS.length - 1
  
  // Get translated title and description
  const stepTitle = t(`tests:onboarding.steps.${step.translationKey}.title`)
  const stepDescription = t(`tests:onboarding.steps.${step.translationKey}.description`)

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem('visioncheck-onboarded', 'true')
      onComplete()
    } else {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentStep(currentStep + 1)
        setIsAnimating(false)
      }, 200)
    }
  }

  const handleSkip = () => {
    localStorage.setItem('visioncheck-onboarded', 'true')
    onComplete()
  }

  const colorClasses = {
    sky: 'from-sky-400 to-sky-600',
    emerald: 'from-emerald-400 to-emerald-600',
    violet: 'from-violet-400 to-violet-600',
    amber: 'from-amber-400 to-amber-600',
    purple: 'from-purple-400 to-purple-600'
  }

  const renderAnimation = () => {
    switch (step.animation) {
      case 'tumbling-e':
        return <TumblingEAnimation />
      case 'color-dots':
        return <ColorDotsAnimation />
      case 'contrast-letters':
        return <ContrastLettersAnimation />
      case 'amsler-grid':
        return <AmslerGridAnimation />
      default:
        return null
    }
  }

  return (
    <div className={`
      min-h-screen bg-gradient-to-b ${colorClasses[step.color]} 
      flex flex-col text-white
      transition-all duration-300
      ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
    `}>
      {/* Skip button */}
      <div className="p-4 flex justify-end">
        <button 
          onClick={handleSkip} 
          className="text-white/70 text-sm hover:text-white transition-colors"
        >
          {t('nav.skip')}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        {/* Animated icon */}
        <div className="text-8xl mb-8 animate-bounce">
          {step.icon}
        </div>

        {/* Demo animation for specific steps */}
        {renderAnimation()}

        <h1 className="text-3xl font-bold mb-4">{stepTitle}</h1>
        <p className="text-lg text-white/90 max-w-xs mb-6">{stepDescription}</p>
        
        {/* Audio Instructions - key forces remount on step change */}
        <div className="w-full max-w-xs">
          <AudioInstructions 
            key={step.id}
            audioKey={step.audioKey}
            label={stepTitle} 
          />
        </div>
      </div>

      {/* Progress dots & button */}
      <div className="p-8">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {ONBOARDING_STEPS.map((_, i) => (
            <div
              key={i}
              className={`
                h-2 rounded-full transition-all duration-300
                ${i === currentStep ? 'bg-white w-6' : 'bg-white/40 w-2'}
              `}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="w-full py-4 bg-white text-slate-800 font-semibold rounded-xl hover:bg-white/90 transition-colors"
        >
          {isLast ? t('actions.getStarted') : t('actions.next')}
        </button>
      </div>
    </div>
  )
}
