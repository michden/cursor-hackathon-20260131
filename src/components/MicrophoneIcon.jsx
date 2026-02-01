/**
 * MicrophoneIcon - Shared microphone icon component
 * 
 * Supports both filled and outline variants for use in:
 * - VoiceToggle (filled when enabled, outline when disabled)
 * - VoiceCommandIndicator (always filled when listening)
 * 
 * @param {Object} props
 * @param {string} props.className - CSS classes for sizing/styling
 * @param {boolean} props.filled - Whether to render filled (true) or outline (false) variant
 */
export default function MicrophoneIcon({ className, filled = true }) {
  if (filled) {
    return (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
      </svg>
    )
  }

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
