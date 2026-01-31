import { createContext, useContext, useState } from 'react'

const TestResultsContext = createContext(null)

export function TestResultsProvider({ children }) {
  const [results, setResults] = useState({
    visualAcuity: null,
    colorVision: null,
    eyePhoto: null,
    completedAt: null
  })

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
