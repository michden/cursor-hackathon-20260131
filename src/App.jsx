import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TestResultsProvider } from './context/TestResultsContext'
import ErrorBoundary from './components/ErrorBoundary'
import Home from './pages/Home'
import VisualAcuityTest from './pages/VisualAcuityTest'
import ColorVisionTest from './pages/ColorVisionTest'
import EyePhotoAnalysis from './pages/EyePhotoAnalysis'
import HealthSnapshot from './pages/HealthSnapshot'
import ContrastSensitivityTest from './pages/ContrastSensitivityTest'

function App() {
  return (
    <ErrorBoundary>
      <TestResultsProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/visual-acuity" element={<VisualAcuityTest />} />
            <Route path="/color-vision" element={<ColorVisionTest />} />
            <Route path="/eye-photo" element={<EyePhotoAnalysis />} />
            <Route path="/contrast-sensitivity" element={<ContrastSensitivityTest />} />
            <Route path="/results" element={<HealthSnapshot />} />
          </Routes>
        </BrowserRouter>
      </TestResultsProvider>
    </ErrorBoundary>
  )
}

export default App
