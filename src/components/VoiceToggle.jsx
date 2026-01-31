import { useTranslation } from 'react-i18next'
import { useVoiceCommandSettings } from '../context/VoiceCommandContext'

/**
 * VoiceToggle - Toggle button for voice commands
 * 
 * Features:
 * - Microphone icon with visual feedback
 * - Shows enabled/disabled state
 * - Accessible with proper aria labels
 * - Hidden when browser doesn't support Web Speech API
 */
export default function VoiceToggle() {
  const { t } = useTranslation('common')
  const { voiceEnabled, toggleVoice, isSupported } = useVoiceCommandSettings()

  // Don't render if browser doesn't support voice commands
  if (!isSupported) {
    return null
  }

  return (
    <button
      onClick={toggleVoice}
      className={`
        p-2 rounded-lg transition-colors
        focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900
        ${voiceEnabled 
          ? 'bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400' 
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }
      `}
      aria-label={voiceEnabled ? t('voice.disable') : t('voice.enable')}
      aria-pressed={voiceEnabled}
      title={voiceEnabled ? t('voice.disable') : t('voice.enable')}
    >
      <MicrophoneIcon className="w-5 h-5" filled={voiceEnabled} />
    </button>
  )
}

function MicrophoneIcon({ className, filled }) {
  if (filled) {
    // Filled microphone when active
    return (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
      </svg>
    )
  }
  
  // Outline microphone when inactive
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
      />
    </svg>
  )
}
