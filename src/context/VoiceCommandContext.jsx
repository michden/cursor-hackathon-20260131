import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const VoiceCommandContext = createContext(null)

const STORAGE_KEY = 'visioncheck-voice-enabled'

/**
 * VoiceCommandProvider - Manages global voice command settings
 * 
 * Features:
 * - Toggle voice commands on/off
 * - Persist preference to localStorage
 * - Check browser support for Web Speech API
 */
export function VoiceCommandProvider({ children }) {
  const [voiceEnabled, setVoiceEnabledState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored === 'true'
    } catch {
      return false
    }
  })

  const [isSupported, setIsSupported] = useState(false)

  // Check browser support on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    setIsSupported(!!SpeechRecognition)
  }, [])

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, voiceEnabled.toString())
    } catch {
      // Ignore storage errors
    }
  }, [voiceEnabled])

  const setVoiceEnabled = useCallback((enabled) => {
    setVoiceEnabledState(enabled)
  }, [])

  const toggleVoice = useCallback(() => {
    setVoiceEnabledState(prev => !prev)
  }, [])

  const value = {
    voiceEnabled,
    setVoiceEnabled,
    toggleVoice,
    isSupported,
  }

  return (
    <VoiceCommandContext.Provider value={value}>
      {children}
    </VoiceCommandContext.Provider>
  )
}

export function useVoiceCommandSettings() {
  const context = useContext(VoiceCommandContext)
  if (!context) {
    throw new Error('useVoiceCommandSettings must be used within VoiceCommandProvider')
  }
  return context
}
