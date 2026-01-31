import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const TTSSettingsContext = createContext(null)

const STORAGE_KEY = 'visioncheck-tts-settings'

const defaultSettings = {
  autoPlayEnabled: true,
}

export function TTSSettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    // Load from localStorage on initial render
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) }
      }
    } catch (e) {
      console.warn('Failed to load TTS settings from localStorage:', e)
    }
    return defaultSettings
  })

  // Persist to localStorage when settings change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch (e) {
      console.warn('Failed to save TTS settings to localStorage:', e)
    }
  }, [settings])

  const setAutoPlayEnabled = useCallback((enabled) => {
    setSettings(prev => ({ ...prev, autoPlayEnabled: enabled }))
  }, [])

  const value = {
    autoPlayEnabled: settings.autoPlayEnabled,
    setAutoPlayEnabled,
  }

  return (
    <TTSSettingsContext.Provider value={value}>
      {children}
    </TTSSettingsContext.Provider>
  )
}

export function useTTSSettings() {
  const context = useContext(TTSSettingsContext)
  if (!context) {
    throw new Error('useTTSSettings must be used within a TTSSettingsProvider')
  }
  return context
}
