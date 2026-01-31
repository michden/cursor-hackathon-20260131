import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HealthSnapshot from './HealthSnapshot'
import { TestResultsProvider } from '../context/TestResultsContext'

// Mock html2pdf to avoid issues in test environment
vi.mock('html2pdf.js', () => ({
  default: () => ({
    set: () => ({ from: () => ({ save: () => Promise.resolve() }) })
  })
}))

// Clear localStorage before each test
beforeEach(() => {
  localStorage.clear()
})

function renderWithProviders(ui) {
  return render(
    <MemoryRouter>
      <TestResultsProvider>
        {ui}
      </TestResultsProvider>
    </MemoryRouter>
  )
}

// Helper to set up localStorage with test results
function setTestResults(results) {
  localStorage.setItem('visioncheck-results', JSON.stringify(results))
}

describe('HealthSnapshot', () => {
  describe('getRecommendation', () => {
    it('shows good results message when contrast sensitivity is good (>= 0.9)', () => {
      setTestResults({
        contrastSensitivity: { logCS: 1.2, level: 8, maxLevel: 10 }
      })
      
      renderWithProviders(<HealthSnapshot />)
      
      expect(screen.getByText(/Your screening results look good!/)).toBeInTheDocument()
    })

    it('recommends discussing with doctor for mild contrast reduction (0.6 - 0.9)', () => {
      setTestResults({
        contrastSensitivity: { logCS: 0.7, level: 5, maxLevel: 10 }
      })
      
      renderWithProviders(<HealthSnapshot />)
      
      expect(screen.getByText(/Discuss contrast sensitivity with your eye doctor/)).toBeInTheDocument()
    })

    it('recommends professional evaluation for moderate contrast reduction (< 0.6)', () => {
      setTestResults({
        contrastSensitivity: { logCS: 0.4, level: 3, maxLevel: 10 }
      })
      
      renderWithProviders(<HealthSnapshot />)
      
      expect(screen.getByText(/Get a professional evaluation for contrast sensitivity/)).toBeInTheDocument()
    })

    it('recommends professional evaluation for severe contrast reduction (< 0.3)', () => {
      setTestResults({
        contrastSensitivity: { logCS: 0.2, level: 1, maxLevel: 10 }
      })
      
      renderWithProviders(<HealthSnapshot />)
      
      expect(screen.getByText(/Get a professional evaluation for contrast sensitivity/)).toBeInTheDocument()
    })

    it('combines contrast sensitivity recommendation with other test recommendations', () => {
      setTestResults({
        visualAcuity: { snellen: '20/100', level: 3, maxLevel: 10 },
        contrastSensitivity: { logCS: 0.5, level: 4, maxLevel: 10 }
      })
      
      renderWithProviders(<HealthSnapshot />)
      
      const recommendation = screen.getByText(/Schedule an eye exam for vision assessment/)
      expect(recommendation).toBeInTheDocument()
      expect(recommendation.textContent).toContain('Get a professional evaluation for contrast sensitivity')
    })

    it('shows warning status on card when contrast sensitivity is reduced', () => {
      setTestResults({
        contrastSensitivity: { logCS: 0.5, level: 4, maxLevel: 10 }
      })
      
      renderWithProviders(<HealthSnapshot />)
      
      // The card should show "Review" status (warning)
      expect(screen.getByText('Review')).toBeInTheDocument()
    })
  })
})
