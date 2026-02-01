import { useTranslation } from 'react-i18next'

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
        <MicrophoneIcon className="w-5 h-5" />
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

function MicrophoneIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
    </svg>
  )
}
