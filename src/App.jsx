import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TestResultsProvider } from './context/TestResultsContext'
import { TTSSettingsProvider } from './context/TTSSettingsContext'
import ErrorBoundary from './components/ErrorBoundary'
import Onboarding from './components/Onboarding'
import Home from './pages/Home'
import VisualAcuityTest from './pages/VisualAcuityTest'
import ColorVisionTest from './pages/ColorVisionTest'
import EyePhotoAnalysis from './pages/EyePhotoAnalysis'
import HealthSnapshot from './pages/HealthSnapshot'
import ContrastSensitivityTest from './pages/ContrastSensitivityTest'
import AmslerGridTest from './pages/AmslerGridTest'

function App() {
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    const hasOnboarded = localStorage.getItem('visioncheck-onboarded')
    if (!hasOnboarded) {
      setShowOnboarding(true)
    }
  }, [])

  if (showOnboarding) {
    return (
      <TTSSettingsProvider>
        <Onboarding onComplete={() => setShowOnboarding(false)} />
      </TTSSettingsProvider>
    )
  }

  return (
    <ErrorBoundary>
      <TTSSettingsProvider>
        <TestResultsProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/visual-acuity" element={<VisualAcuityTest />} />
            <Route path="/color-vision" element={<ColorVisionTest />} />
            <Route path="/eye-photo" element={<EyePhotoAnalysis />} />
            <Route path="/contrast-sensitivity" element={<ContrastSensitivityTest />} />
            <Route path="/amsler-grid" element={<AmslerGridTest />} />
            <Route path="/results" element={<HealthSnapshot />} />
          </Routes>
        </BrowserRouter>
        </TestResultsProvider>
      </TTSSettingsProvider>
    </ErrorBoundary>
  )
}

export default App
