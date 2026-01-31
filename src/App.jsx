import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import VisualAcuityTest from './pages/VisualAcuityTest'
import ColorVisionTest from './pages/ColorVisionTest'
import EyePhotoAnalysis from './pages/EyePhotoAnalysis'
import HealthSnapshot from './pages/HealthSnapshot'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/visual-acuity" element={<VisualAcuityTest />} />
        <Route path="/color-vision" element={<ColorVisionTest />} />
        <Route path="/eye-photo" element={<EyePhotoAnalysis />} />
        <Route path="/results" element={<HealthSnapshot />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
