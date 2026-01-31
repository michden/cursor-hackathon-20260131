import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TestResultsProvider } from './context/TestResultsContext'
import { TTSSettingsProvider } from './context/TTSSettingsContext'
import { ThemeProvider } from './context/ThemeContext'
import { ChatProvider } from './context/ChatContext'
import ErrorBoundary from './components/ErrorBoundary'
import Onboarding from './components/Onboarding'
import ChatFAB from './components/ChatFAB'
import ChatDrawer from './components/ChatDrawer'
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
      <ThemeProvider>
        <TTSSettingsProvider>
          <Onboarding onComplete={() => setShowOnboarding(false)} />
        </TTSSettingsProvider>
      </ThemeProvider>
    )
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <TTSSettingsProvider>
          <TestResultsProvider>
            <BrowserRouter>
              <ChatProvider>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/visual-acuity" element={<VisualAcuityTest />} />
                  <Route path="/color-vision" element={<ColorVisionTest />} />
                  <Route path="/eye-photo" element={<EyePhotoAnalysis />} />
                  <Route path="/contrast-sensitivity" element={<ContrastSensitivityTest />} />
                  <Route path="/amsler-grid" element={<AmslerGridTest />} />
                  <Route path="/results" element={<HealthSnapshot />} />
                </Routes>
                <ChatFAB />
                <ChatDrawer />
              </ChatProvider>
            </BrowserRouter>
          </TestResultsProvider>
        </TTSSettingsProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
