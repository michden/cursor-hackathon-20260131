import { useTranslation } from 'react-i18next'
import MicrophoneIcon from './MicrophoneIcon'

/**
 * VoiceCommandIndicator - Floating indicator showing voice is listening
 * 
 * Features:
 * - Pulsing microphone icon
 * - Shows "Listening..." text
 * - Fixed position in bottom-left corner
 * - Only visible when listening
 */
export default function VoiceCommandIndicator({ isListening, transcript }) {
  const { t } = useTranslation('common')

  if (!isListening) {
    return null
  }

  return (
    <div 
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-2 bg-sky-500 text-white rounded-full shadow-lg animate-pulse"
      role="status"
      aria-live="polite"
    >
      <div className="relative">
        <MicrophoneIcon className="w-5 h-5" filled />
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full bg-white opacity-25 animate-ping" />
      </div>
      <span className="text-sm font-medium">{t('voice.listening')}</span>
      {transcript && (
        <span className="text-xs opacity-75 max-w-[100px] truncate">
          "{transcript}"
        </span>
      )}
    </div>
  )
}
