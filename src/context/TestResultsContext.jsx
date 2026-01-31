import { createContext, useContext, useState, useEffect } from 'react'

const TestResultsContext = createContext(null)

const STORAGE_KEY = 'visioncheck-results'
const HISTORY_KEY = 'visioncheck-history'

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
    contrastSensitivity: null,
    amslerGrid: null,
    eyePhoto: null,
    completedAt: null
  }
}

// Load history from localStorage
const loadPersistedHistory = () => {
  try {
    const saved = localStorage.getItem(HISTORY_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.warn('Failed to load persisted history:', e)
  }
  return []
}

export function TestResultsProvider({ children }) {
  const [results, setResults] = useState(loadPersistedResults)
  const [history, setHistory] = useState(loadPersistedHistory)

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

  const updateContrastSensitivity = (data) => {
    setResults(prev => ({
      ...prev,
      contrastSensitivity: data,
      completedAt: new Date().toISOString()
    }))
  }

  const updateAmslerGrid = (data) => {
    setResults(prev => ({
      ...prev,
      amslerGrid: data,
      completedAt: new Date().toISOString()
    }))
  }

  const clearResults = () => {
    setResults({
      visualAcuity: null,
      colorVision: null,
      contrastSensitivity: null,
      amslerGrid: null,
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
    return results.visualAcuity || results.colorVision || results.contrastSensitivity || results.amslerGrid || results.eyePhoto
  }

  // Save current session to history
  const saveToHistory = () => {
    if (!results.visualAcuity && !results.colorVision && !results.contrastSensitivity && !results.amslerGrid) return

    const session = {
      id: Date.now(),
      date: new Date().toISOString(),
      visualAcuity: results.visualAcuity ? {
        snellen: results.visualAcuity.snellen,
        level: results.visualAcuity.level
      } : null,
      colorVision: results.colorVision ? {
        correctCount: results.colorVision.correctCount,
        totalPlates: results.colorVision.totalPlates,
        status: results.colorVision.status
      } : null,
      contrastSensitivity: results.contrastSensitivity ? {
        logCS: results.contrastSensitivity.logCS,
        level: results.contrastSensitivity.level,
        maxLevel: results.contrastSensitivity.maxLevel
      } : null,
      amslerGrid: results.amslerGrid ? {
        hasIssues: results.amslerGrid.hasIssues,
        status: results.amslerGrid.status
      } : null
    }

    const newHistory = [session, ...history].slice(0, 20) // Keep last 20
    setHistory(newHistory)
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory))
    } catch (e) {
      console.warn('Failed to persist history:', e)
    }
  }

  // Clear all history
  const clearHistory = () => {
    setHistory([])
    try {
      localStorage.removeItem(HISTORY_KEY)
    } catch (e) {
      console.warn('Failed to clear history:', e)
    }
  }

  return (
    <TestResultsContext.Provider value={{
      results,
      updateVisualAcuity,
      updateColorVision,
      updateContrastSensitivity,
      updateAmslerGrid,
      updateEyePhoto,
      clearResults,
      hasAnyResults,
      history,
      saveToHistory,
      clearHistory
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
