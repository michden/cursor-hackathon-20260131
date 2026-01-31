import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

const LanguageContext = createContext(null)

const STORAGE_KEY = 'visioncheck-language'
const SUPPORTED_LANGUAGES = ['en', 'de']

/**
 * LanguageProvider - Manages language selection with i18next sync
 * 
 * Features:
 * - Syncs with i18next for translations
 * - localStorage persistence
 * - Provides current language for audio path construction
 */
export function LanguageProvider({ children }) {
  const { i18n } = useTranslation()
  
  // Get initial language from i18n (which handles detection)
  const [language, setLanguageState] = useState(() => {
    const detected = i18n.language?.split('-')[0] // 'en-US' -> 'en'
    return SUPPORTED_LANGUAGES.includes(detected) ? detected : 'en'
  })

  // Sync with i18next when language changes
  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language)
    }
  }, [language, i18n])

  // Listen for external i18n changes (e.g., from language detector)
  useEffect(() => {
    const handleLanguageChanged = (lng) => {
      const lang = lng.split('-')[0]
      if (SUPPORTED_LANGUAGES.includes(lang) && lang !== language) {
        setLanguageState(lang)
      }
    }
    
    i18n.on('languageChanged', handleLanguageChanged)
    return () => i18n.off('languageChanged', handleLanguageChanged)
  }, [i18n, language])

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language)
    } catch (e) {
      console.warn('Failed to save language to localStorage:', e)
    }
  }, [language])

  const setLanguage = useCallback((newLanguage) => {
    if (SUPPORTED_LANGUAGES.includes(newLanguage)) {
      setLanguageState(newLanguage)
    }
  }, [])

  const value = {
    language,           // Current language code: 'en' | 'de'
    setLanguage,        // Function to change language
    supportedLanguages: SUPPORTED_LANGUAGES,
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
