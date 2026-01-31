import { createContext, useContext, useState, useEffect } from 'react'

const TestResultsContext = createContext(null)

const STORAGE_KEY = 'eyecheck-results'

// Prepare results for storage (exclude large image data)
const prepareForStorage = (results) => {
  if (results.eyePhoto?.imageData) {
    return {
      ...results,
      eyePhoto: {
        ...results.eyePhoto,
        imageData: null // Exclude large base64 image
      }
    }
  }
  return results
}

// Load initial state from localStorage
const loadPersistedResults = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.warn('Failed to load persisted results:', e)
  }
  return {
    visualAcuity: null,
    colorVision: null,
    eyePhoto: null,
    completedAt: null
  }
}

export function TestResultsProvider({ children }) {
  const [results, setResults] = useState(loadPersistedResults)

  // Persist to localStorage whenever results change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prepareForStorage(results)))
    } catch (e) {
      console.warn('Failed to persist results:', e)
    }
  }, [results])

  const updateVisualAcuity = (data) => {
    setResults(prev => ({
      ...prev,
      visualAcuity: data,
      completedAt: new Date().toISOString()
    }))
  }

  const updateColorVision = (data) => {
    setResults(prev => ({
      ...prev,
      colorVision: data,
      completedAt: new Date().toISOString()
    }))
  }

  const updateEyePhoto = (data) => {
    setResults(prev => ({
      ...prev,
      eyePhoto: data,
      completedAt: new Date().toISOString()
    }))
  }

  const clearResults = () => {
    setResults({
      visualAcuity: null,
      colorVision: null,
      eyePhoto: null,
      completedAt: null
    })
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      console.warn('Failed to clear persisted results:', e)
    }
  }

  const hasAnyResults = () => {
    return results.visualAcuity || results.colorVision || results.eyePhoto
  }

  return (
    <TestResultsContext.Provider value={{
      results,
      updateVisualAcuity,
      updateColorVision,
      updateEyePhoto,
      clearResults,
      hasAnyResults
    }}>
      {children}
    </TestResultsContext.Provider>
  )
}

export function useTestResults() {
  const context = useContext(TestResultsContext)
  if (!context) {
    throw new Error('useTestResults must be used within a TestResultsProvider')
  }
  return context
}
