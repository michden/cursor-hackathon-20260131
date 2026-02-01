import { useTranslation } from 'react-i18next'
import { useVoiceCommandSettings } from '../context/VoiceCommandContext'
import MicrophoneIcon from './MicrophoneIcon'

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
