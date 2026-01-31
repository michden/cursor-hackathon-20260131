import { createContext, useContext, useState, useEffect } from 'react'

const TestResultsContext = createContext(null)

const STORAGE_KEY = 'visioncheck-results'
const HISTORY_KEY = 'visioncheck-history'

// Default empty state with per-eye structure
const getDefaultResults = () => ({
  visualAcuity: {
    left: null,
    right: null
  },
  colorVision: null, // Stays binocular
  contrastSensitivity: {
    left: null,
    right: null
  },
  amslerGrid: {
    left: null,
    right: null
  },
  eyePhoto: null,
  completedAt: null
})

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

// Check if data is in old format (single object instead of per-eye)
const isOldFormat = (data) => {
  if (!data) return false
  // Old format has properties like snellen/level directly, not left/right
  return data.snellen !== undefined || data.level !== undefined || data.logCS !== undefined || data.hasIssues !== undefined
}

// Migrate old format to new per-eye structure
const migrateResults = (saved) => {
  const defaults = getDefaultResults()
  
  // If visualAcuity is in old format, reset it
  if (isOldFormat(saved.visualAcuity)) {
    saved.visualAcuity = defaults.visualAcuity
  } else if (!saved.visualAcuity) {
    saved.visualAcuity = defaults.visualAcuity
  }
  
  // If contrastSensitivity is in old format, reset it
  if (isOldFormat(saved.contrastSensitivity)) {
    saved.contrastSensitivity = defaults.contrastSensitivity
  } else if (!saved.contrastSensitivity) {
    saved.contrastSensitivity = defaults.contrastSensitivity
  }
  
  // If amslerGrid is in old format, reset it
  if (isOldFormat(saved.amslerGrid)) {
    saved.amslerGrid = defaults.amslerGrid
  } else if (!saved.amslerGrid) {
    saved.amslerGrid = defaults.amslerGrid
  }
  
  return saved
}

// Load initial state from localStorage
const loadPersistedResults = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return migrateResults(parsed)
    }
  } catch (e) {
    console.warn('Failed to load persisted results:', e)
  }
  return getDefaultResults()
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

  // Update visual acuity for a specific eye
  const updateVisualAcuity = (eye, data) => {
    setResults(prev => ({
      ...prev,
      visualAcuity: {
        ...prev.visualAcuity,
        [eye]: data
      },
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

  // Update contrast sensitivity for a specific eye
  const updateContrastSensitivity = (eye, data) => {
    setResults(prev => ({
      ...prev,
      contrastSensitivity: {
        ...prev.contrastSensitivity,
        [eye]: data
      },
      completedAt: new Date().toISOString()
    }))
  }

  // Update amsler grid for a specific eye
  const updateAmslerGrid = (eye, data) => {
    setResults(prev => ({
      ...prev,
      amslerGrid: {
        ...prev.amslerGrid,
        [eye]: data
      },
      completedAt: new Date().toISOString()
    }))
  }

  const clearResults = () => {
    setResults(getDefaultResults())
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      console.warn('Failed to clear persisted results:', e)
    }
  }

  const hasAnyResults = () => {
    const hasVisualAcuity = results.visualAcuity?.left || results.visualAcuity?.right
    const hasContrastSensitivity = results.contrastSensitivity?.left || results.contrastSensitivity?.right
    const hasAmslerGrid = results.amslerGrid?.left || results.amslerGrid?.right
    return hasVisualAcuity || results.colorVision || hasContrastSensitivity || hasAmslerGrid || results.eyePhoto
  }

  // Save current session to history
  const saveToHistory = () => {
    const hasVisualAcuity = results.visualAcuity?.left || results.visualAcuity?.right
    const hasContrastSensitivity = results.contrastSensitivity?.left || results.contrastSensitivity?.right
    const hasAmslerGrid = results.amslerGrid?.left || results.amslerGrid?.right
    
    if (!hasVisualAcuity && !results.colorVision && !hasContrastSensitivity && !hasAmslerGrid) return

    // Helper to get summary for an eye
    const getEyeSummary = (eyeData, fields) => {
      if (!eyeData) return null
      const summary = {}
      fields.forEach(field => {
        if (eyeData[field] !== undefined) summary[field] = eyeData[field]
      })
      return summary
    }

    const session = {
      id: Date.now(),
      date: new Date().toISOString(),
      visualAcuity: hasVisualAcuity ? {
        left: getEyeSummary(results.visualAcuity.left, ['snellen', 'level']),
        right: getEyeSummary(results.visualAcuity.right, ['snellen', 'level'])
      } : null,
      colorVision: results.colorVision ? {
        correctCount: results.colorVision.correctCount,
        totalPlates: results.colorVision.totalPlates,
        status: results.colorVision.status
      } : null,
      contrastSensitivity: hasContrastSensitivity ? {
        left: getEyeSummary(results.contrastSensitivity.left, ['logCS', 'level', 'maxLevel']),
        right: getEyeSummary(results.contrastSensitivity.right, ['logCS', 'level', 'maxLevel'])
      } : null,
      amslerGrid: hasAmslerGrid ? {
        left: getEyeSummary(results.amslerGrid.left, ['hasIssues', 'status']),
        right: getEyeSummary(results.amslerGrid.right, ['hasIssues', 'status'])
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
