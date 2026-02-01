import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TestResultsProvider } from './context/TestResultsContext'
import { TTSSettingsProvider } from './context/TTSSettingsContext'
import { ThemeProvider } from './context/ThemeContext'
import { ChatProvider } from './context/ChatContext'
import { LanguageProvider } from './context/LanguageContext'
import { VoiceCommandProvider } from './context/VoiceCommandContext'
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
import AstigmatismTest from './pages/AstigmatismTest'
import PeripheralVisionTest from './pages/PeripheralVisionTest'

/**
 * Root application component that mounts providers, routing, and UI chrome.
 *
 * Renders an onboarding flow on first launch by checking localStorage key "visioncheck-onboarded"; otherwise renders the main app wrapped with theme, language, TTS, test-results, error boundary, and chat providers and the configured routes.
 *
 * @returns {JSX.Element} The application's root React element.
 */
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
        <LanguageProvider>
          <TTSSettingsProvider>
            <VoiceCommandProvider>
              <Onboarding onComplete={() => setShowOnboarding(false)} />
            </VoiceCommandProvider>
          </TTSSettingsProvider>
        </LanguageProvider>
      </ThemeProvider>
    )
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <TTSSettingsProvider>
            <VoiceCommandProvider>
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
                    <Route path="/astigmatism" element={<AstigmatismTest />} />
                    <Route path="/peripheral-vision" element={<PeripheralVisionTest />} />
                    <Route path="/results" element={<HealthSnapshot />} />
                  </Routes>
                  <ChatFAB />
                    <ChatDrawer />
                  </ChatProvider>
                </BrowserRouter>
              </TestResultsProvider>
            </VoiceCommandProvider>
          </TTSSettingsProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App