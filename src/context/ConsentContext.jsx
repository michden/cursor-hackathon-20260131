import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const ConsentContext = createContext(null)

const CONSENT_KEY = 'visioncheck-consent'

/**
 * Load consent state from localStorage
 */
const loadConsentState = () => {
  try {
    const saved = localStorage.getItem(CONSENT_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.warn('Failed to load consent state:', e)
  }
  return null
}

/**
 * Provides consent management state and actions to descendant components.
 * 
 * State:
 * - hasConsented: boolean - whether user has made a consent choice
 * - consentGiven: boolean - whether user accepted data storage
 * 
 * Actions:
 * - giveConsent(): grant consent for data storage
 * - denyConsent(): deny consent (session-only mode)
 * - revokeConsent(): revoke previously given consent
 * 
 * @param {{ children: import('react').ReactNode }} props
 * @returns {JSX.Element}
 */
export function ConsentProvider({ children }) {
  const [consentState, setConsentState] = useState(() => {
    const saved = loadConsentState()
    return saved || { hasConsented: false, consentGiven: false }
  })

  // Persist consent state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(consentState))
    } catch (e) {
      console.warn('Failed to persist consent state:', e)
    }
  }, [consentState])

  const giveConsent = useCallback(() => {
    setConsentState({ hasConsented: true, consentGiven: true })
  }, [])

  const denyConsent = useCallback(() => {
    setConsentState({ hasConsented: true, consentGiven: false })
  }, [])

  const revokeConsent = useCallback(() => {
    // Clear all visioncheck data when consent is revoked
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('visioncheck-') && key !== CONSENT_KEY) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
    
    setConsentState({ hasConsented: true, consentGiven: false })
  }, [])

  const resetConsent = useCallback(() => {
    // Reset to show the consent banner again
    setConsentState({ hasConsented: false, consentGiven: false })
    try {
      localStorage.removeItem(CONSENT_KEY)
    } catch (e) {
      console.warn('Failed to remove consent state:', e)
    }
  }, [])

  return (
    <ConsentContext.Provider value={{
      hasConsented: consentState.hasConsented,
      consentGiven: consentState.consentGiven,
      giveConsent,
      denyConsent,
      revokeConsent,
      resetConsent
    }}>
      {children}
    </ConsentContext.Provider>
  )
}

/**
 * Hook to access consent context
 * @returns {{ hasConsented: boolean, consentGiven: boolean, giveConsent: () => void, denyConsent: () => void, revokeConsent: () => void, resetConsent: () => void }}
 */
export function useConsent() {
  const context = useContext(ConsentContext)
  if (!context) {
    throw new Error('useConsent must be used within a ConsentProvider')
  }
  return context
}
