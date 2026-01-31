import { createContext, useContext, useState, useEffect } from 'react'

const TestResultsContext = createContext(null)

const STORAGE_KEY = 'visioncheck-results'
const HISTORY_KEY = 'visioncheck-history'
const ACHIEVEMENTS_KEY = 'visioncheck-achievements'

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
  astigmatism: {
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
  
  // If astigmatism doesn't exist, add it
  if (!saved.astigmatism) {
    saved.astigmatism = defaults.astigmatism
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

// Load achievements from localStorage
const loadPersistedAchievements = () => {
  try {
    const saved = localStorage.getItem(ACHIEVEMENTS_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.warn('Failed to load persisted achievements:', e)
  }
  return {}
}

// Check for 3-day streak in history
const hasThreeDayStreak = (historyData) => {
  if (historyData.length < 3) return false
  
  // Get unique dates (YYYY-MM-DD format)
  const uniqueDates = [...new Set(
    historyData.map(session => session.date.split('T')[0])
  )].sort().reverse() // Most recent first
  
  if (uniqueDates.length < 3) return false
  
  // Check for 3 consecutive days
  for (let i = 0; i < uniqueDates.length - 2; i++) {
    const date1 = new Date(uniqueDates[i])
    const date2 = new Date(uniqueDates[i + 1])
    const date3 = new Date(uniqueDates[i + 2])
    
    const diff1 = (date1 - date2) / (1000 * 60 * 60 * 24)
    const diff2 = (date2 - date3) / (1000 * 60 * 60 * 24)
    
    if (diff1 === 1 && diff2 === 1) {
      return true
    }
  }
  
  return false
}

export function TestResultsProvider({ children }) {
  const [results, setResults] = useState(loadPersistedResults)
  const [history, setHistory] = useState(loadPersistedHistory)
  const [achievements, setAchievements] = useState(loadPersistedAchievements)

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

  // Update astigmatism for a specific eye
  const updateAstigmatism = (eye, data) => {
    setResults(prev => ({
      ...prev,
      astigmatism: {
        ...prev.astigmatism,
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
    const hasAstigmatism = results.astigmatism?.left || results.astigmatism?.right
    return hasVisualAcuity || results.colorVision || hasContrastSensitivity || hasAmslerGrid || hasAstigmatism || results.eyePhoto
  }

  // Save current session to history
  const saveToHistory = () => {
    const hasVisualAcuity = results.visualAcuity?.left || results.visualAcuity?.right
    const hasContrastSensitivity = results.contrastSensitivity?.left || results.contrastSensitivity?.right
    const hasAmslerGrid = results.amslerGrid?.left || results.amslerGrid?.right
    const hasAstigmatism = results.astigmatism?.left || results.astigmatism?.right
    
    if (!hasVisualAcuity && !results.colorVision && !hasContrastSensitivity && !hasAmslerGrid && !hasAstigmatism) return

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
      } : null,
      astigmatism: hasAstigmatism ? {
        left: getEyeSummary(results.astigmatism.left, ['allLinesEqual', 'severity', 'estimatedAxis']),
        right: getEyeSummary(results.astigmatism.right, ['allLinesEqual', 'severity', 'estimatedAxis'])
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

  // Unlock a specific achievement
  const unlockAchievement = (achievementId) => {
    if (achievements[achievementId]) return false // Already unlocked
    
    const newAchievements = {
      ...achievements,
      [achievementId]: {
        unlockedAt: new Date().toISOString(),
        isNew: true
      }
    }
    setAchievements(newAchievements)
    try {
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(newAchievements))
    } catch (e) {
      console.warn('Failed to persist achievements:', e)
    }
    return true
  }

  // Mark achievement as seen (no longer new)
  const markAchievementSeen = (achievementId) => {
    if (!achievements[achievementId]) return
    
    const newAchievements = {
      ...achievements,
      [achievementId]: {
        ...achievements[achievementId],
        isNew: false
      }
    }
    setAchievements(newAchievements)
    try {
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(newAchievements))
    } catch (e) {
      console.warn('Failed to persist achievements:', e)
    }
  }

  // Check and unlock achievements based on current state
  // Returns array of newly unlocked achievement IDs
  const checkAndUnlockAchievements = (currentResults = results, currentHistory = history) => {
    const newlyUnlocked = []
    
    const hasVisualAcuity = currentResults.visualAcuity?.left || currentResults.visualAcuity?.right
    const hasContrastSensitivity = currentResults.contrastSensitivity?.left || currentResults.contrastSensitivity?.right
    const hasAmslerGrid = currentResults.amslerGrid?.left || currentResults.amslerGrid?.right
    const hasAstigmatism = currentResults.astigmatism?.left || currentResults.astigmatism?.right
    const hasColorVision = currentResults.colorVision
    
    // First test achievement
    if (!achievements['first-test'] && (hasVisualAcuity || hasColorVision || hasContrastSensitivity || hasAmslerGrid || hasAstigmatism)) {
      if (unlockAchievement('first-test')) {
        newlyUnlocked.push('first-test')
      }
    }
    
    // Perfect acuity (20/20 or better, level >= 8)
    if (!achievements['perfect-acuity']) {
      const leftPerfect = currentResults.visualAcuity?.left?.level >= 8
      const rightPerfect = currentResults.visualAcuity?.right?.level >= 8
      if (leftPerfect || rightPerfect) {
        if (unlockAchievement('perfect-acuity')) {
          newlyUnlocked.push('perfect-acuity')
        }
      }
    }
    
    // Color perfect (8/8)
    if (!achievements['color-perfect'] && currentResults.colorVision?.correctCount === 8) {
      if (unlockAchievement('color-perfect')) {
        newlyUnlocked.push('color-perfect')
      }
    }
    
    // All tests completed (now includes astigmatism - 5 tests total)
    if (!achievements['all-tests'] && hasVisualAcuity && hasColorVision && hasContrastSensitivity && hasAmslerGrid && hasAstigmatism) {
      if (unlockAchievement('all-tests')) {
        newlyUnlocked.push('all-tests')
      }
    }
    
    // 3-day streak
    if (!achievements['streak-3'] && hasThreeDayStreak(currentHistory)) {
      if (unlockAchievement('streak-3')) {
        newlyUnlocked.push('streak-3')
      }
    }
    
    return newlyUnlocked
  }

  // Get list of unlocked achievement IDs
  const getUnlockedAchievements = () => {
    return Object.keys(achievements)
  }

  // Check if a specific achievement is unlocked
  const hasAchievement = (achievementId) => {
    return !!achievements[achievementId]
  }

  // Check if achievement is new (unseen)
  const isAchievementNew = (achievementId) => {
    return achievements[achievementId]?.isNew === true
  }

  return (
    <TestResultsContext.Provider value={{
      results,
      updateVisualAcuity,
      updateColorVision,
      updateContrastSensitivity,
      updateAmslerGrid,
      updateAstigmatism,
      updateEyePhoto,
      clearResults,
      hasAnyResults,
      history,
      saveToHistory,
      clearHistory,
      achievements,
      unlockAchievement,
      markAchievementSeen,
      checkAndUnlockAchievements,
      getUnlockedAchievements,
      hasAchievement,
      isAchievementNew
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
