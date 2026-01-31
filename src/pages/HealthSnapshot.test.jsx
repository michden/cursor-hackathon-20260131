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

// Helper to set up localStorage with test results (new per-eye format)
function setTestResults(results) {
  // Ensure per-eye structure for tests
  const formattedResults = {
    visualAcuity: results.visualAcuity || { left: null, right: null },
    colorVision: results.colorVision || null,
    contrastSensitivity: results.contrastSensitivity || { left: null, right: null },
    amslerGrid: results.amslerGrid || { left: null, right: null },
    eyePhoto: results.eyePhoto || null,
    completedAt: results.completedAt || null
  }
  localStorage.setItem('visioncheck-results', JSON.stringify(formattedResults))
}

describe('HealthSnapshot', () => {
  describe('getRecommendation with per-eye data', () => {
    it('shows good results message when contrast sensitivity is good (>= 0.9) for both eyes', () => {
      setTestResults({
        contrastSensitivity: { 
          left: { logCS: 1.2, level: 8, maxLevel: 10 },
          right: { logCS: 1.1, level: 7, maxLevel: 10 }
        }
      })
      
      renderWithProviders(<HealthSnapshot />)
      
      expect(screen.getByText(/Your screening results look good!/)).toBeInTheDocument()
    })

    it('recommends discussing with doctor for mild contrast reduction (0.6 - 0.9)', () => {
      setTestResults({
        contrastSensitivity: { 
          left: { logCS: 0.7, level: 5, maxLevel: 10 },
          right: { logCS: 0.8, level: 6, maxLevel: 10 }
        }
      })
      
      renderWithProviders(<HealthSnapshot />)
      
      expect(screen.getByText(/Discuss contrast sensitivity with your eye doctor/)).toBeInTheDocument()
    })

    it('recommends professional evaluation for moderate contrast reduction (< 0.6)', () => {
      setTestResults({
        contrastSensitivity: { 
          left: { logCS: 0.4, level: 3, maxLevel: 10 },
          right: { logCS: 0.9, level: 7, maxLevel: 10 }
        }
      })
      
      renderWithProviders(<HealthSnapshot />)
      
      expect(screen.getByText(/Get a professional evaluation for contrast sensitivity/)).toBeInTheDocument()
    })

    it('recommends professional evaluation for severe contrast reduction (< 0.3)', () => {
      setTestResults({
        contrastSensitivity: { 
          left: { logCS: 0.2, level: 1, maxLevel: 10 },
          right: null
        }
      })
      
      renderWithProviders(<HealthSnapshot />)
      
      expect(screen.getByText(/Get a professional evaluation for contrast sensitivity/)).toBeInTheDocument()
    })

    it('combines contrast sensitivity recommendation with other test recommendations', () => {
      setTestResults({
        visualAcuity: { 
          left: { snellen: '20/100', level: 3, maxLevel: 10 },
          right: { snellen: '20/70', level: 4, maxLevel: 10 }
        },
        contrastSensitivity: { 
          left: { logCS: 0.5, level: 4, maxLevel: 10 },
          right: null
        }
      })
      
      renderWithProviders(<HealthSnapshot />)
      
      const recommendation = screen.getByText(/Schedule an eye exam for vision assessment/)
      expect(recommendation).toBeInTheDocument()
      expect(recommendation.textContent).toContain('Get a professional evaluation for contrast sensitivity')
    })

    it('shows warning status on card when contrast sensitivity is reduced', () => {
      setTestResults({
        contrastSensitivity: { 
          left: { logCS: 0.5, level: 4, maxLevel: 10 },
          right: null
        }
      })
      
      renderWithProviders(<HealthSnapshot />)
      
      // The card should show "Review" status (warning)
      expect(screen.getByText('Review')).toBeInTheDocument()
    })
  })

  describe('asymmetry detection', () => {
    it('warns about visual acuity asymmetry when eyes differ by 2+ levels', () => {
      setTestResults({
        visualAcuity: { 
          left: { snellen: '20/20', level: 8, maxLevel: 10 },
          right: { snellen: '20/50', level: 4, maxLevel: 10 }
        }
      })
      
      renderWithProviders(<HealthSnapshot />)
      
      expect(screen.getByText(/Notable difference between eyes detected/)).toBeInTheDocument()
    })

    it('warns about contrast sensitivity asymmetry when eyes differ by 0.3+ logCS', () => {
      setTestResults({
        contrastSensitivity: { 
          left: { logCS: 1.2, level: 9, maxLevel: 10 },
          right: { logCS: 0.6, level: 5, maxLevel: 10 }
        }
      })
      
      renderWithProviders(<HealthSnapshot />)
      
      expect(screen.getByText(/Notable difference between eyes detected/)).toBeInTheDocument()
    })
  })

  describe('level 0 handling (very poor acuity)', () => {
    it('correctly displays level 0 visual acuity results', () => {
      setTestResults({
        visualAcuity: { 
          left: { snellen: '20/400', level: 0, maxLevel: 10 },
          right: { snellen: '20/200', level: 2, maxLevel: 10 }
        }
      })
      
      renderWithProviders(<HealthSnapshot />)
      
      // Level 0 should still be displayed, not filtered out
      expect(screen.getByText('20/400')).toBeInTheDocument()
      expect(screen.getByText('20/200')).toBeInTheDocument()
      expect(screen.getByText('Level 0/10')).toBeInTheDocument()
      expect(screen.getByText('Level 2/10')).toBeInTheDocument()
    })

    it('shows recommendation for level 0 results', () => {
      setTestResults({
        visualAcuity: { 
          left: { snellen: '20/400', level: 0, maxLevel: 10 },
          right: null
        }
      })
      
      renderWithProviders(<HealthSnapshot />)
      
      // Level 0 is < 5, so should recommend eye exam
      expect(screen.getByText(/Schedule an eye exam for vision assessment/)).toBeInTheDocument()
    })

    it('handles both eyes having level 0', () => {
      setTestResults({
        visualAcuity: { 
          left: { snellen: '20/400', level: 0, maxLevel: 10 },
          right: { snellen: '20/400', level: 0, maxLevel: 10 }
        }
      })
      
      renderWithProviders(<HealthSnapshot />)
      
      // Both should be displayed
      const snellenValues = screen.getAllByText('20/400')
      expect(snellenValues).toHaveLength(2)
    })
  })

  describe('per-eye display', () => {
    it('displays left and right eye visual acuity separately', () => {
      setTestResults({
        visualAcuity: { 
          left: { snellen: '20/20', level: 8, maxLevel: 10 },
          right: { snellen: '20/40', level: 5, maxLevel: 10 }
        }
      })
      
      renderWithProviders(<HealthSnapshot />)
      
      expect(screen.getByText('Left Eye')).toBeInTheDocument()
      expect(screen.getByText('Right Eye')).toBeInTheDocument()
      expect(screen.getByText('20/20')).toBeInTheDocument()
      expect(screen.getByText('20/40')).toBeInTheDocument()
    })

    it('displays left and right eye contrast sensitivity separately', () => {
      setTestResults({
        contrastSensitivity: { 
          left: { logCS: 1.2, level: 9, maxLevel: 10 },
          right: { logCS: 0.9, level: 7, maxLevel: 10 }
        }
      })
      
      renderWithProviders(<HealthSnapshot />)
      
      expect(screen.getByText('1.20')).toBeInTheDocument()
      expect(screen.getByText('0.90')).toBeInTheDocument()
    })

    it('shows dash for incomplete eye tests', () => {
      setTestResults({
        visualAcuity: { 
          left: { snellen: '20/20', level: 8, maxLevel: 10 },
          right: null
        }
      })
      
      renderWithProviders(<HealthSnapshot />)
      
      expect(screen.getByText('20/20')).toBeInTheDocument()
      // The right eye should show a dash
      const dashes = screen.getAllByText('—')
      expect(dashes.length).toBeGreaterThan(0)
    })
  })

  describe('HistoryChart level 0 handling', () => {
    // Helper to set up both results and history
    function setResultsAndHistory(results, history) {
      // Set results
      const formattedResults = {
        visualAcuity: results.visualAcuity || { left: null, right: null },
        colorVision: results.colorVision || null,
        contrastSensitivity: results.contrastSensitivity || { left: null, right: null },
        amslerGrid: results.amslerGrid || { left: null, right: null },
        eyePhoto: results.eyePhoto || null,
        completedAt: results.completedAt || null
      }
      localStorage.setItem('visioncheck-results', JSON.stringify(formattedResults))
      localStorage.setItem('visioncheck-history', JSON.stringify(history))
    }

    it('includes sessions with level 0 in history chart', () => {
      // History is stored newest-first, so put newer session first
      const history = [
        {
          id: 2,
          date: '2026-01-15T10:00:00Z',
          visualAcuity: { 
            left: { snellen: '20/200', level: 2 },
            right: null
          }
        },
        {
          id: 1,
          date: '2026-01-01T10:00:00Z',
          visualAcuity: { 
            left: { snellen: '20/400', level: 0 },
            right: null
          }
        }
      ]
      
      setResultsAndHistory({
        visualAcuity: { 
          left: { snellen: '20/200', level: 2, maxLevel: 10 },
          right: null
        }
      }, history)
      
      renderWithProviders(<HealthSnapshot />)
      
      // The history chart should show "Your Progress" heading
      expect(screen.getByText('Your Progress')).toBeInTheDocument()
      // Should show trend text since we have 2 sessions (including one with level 0)
      // After reverse, oldest (level 0) comes first, newest (level 2) comes last
      expect(screen.getByText(/Your visual acuity improved from 20\/400 to 20\/200/)).toBeInTheDocument()
    })

    it('shows correct trend when improving from level 0', () => {
      // History is stored newest-first
      const history = [
        {
          id: 2,
          date: '2026-01-15T10:00:00Z',
          visualAcuity: { 
            left: { snellen: '20/100', level: 3 },
            right: { snellen: '20/100', level: 3 }
          }
        },
        {
          id: 1,
          date: '2026-01-01T10:00:00Z',
          visualAcuity: { 
            left: { snellen: '20/400', level: 0 },
            right: { snellen: '20/400', level: 0 }
          }
        }
      ]
      
      setResultsAndHistory({
        visualAcuity: { 
          left: { snellen: '20/100', level: 3, maxLevel: 10 },
          right: { snellen: '20/100', level: 3, maxLevel: 10 }
        }
      }, history)
      
      renderWithProviders(<HealthSnapshot />)
      
      expect(screen.getByText(/Your visual acuity improved/)).toBeInTheDocument()
    })

    it('shows stable trend when both sessions have level 0', () => {
      // History is stored newest-first
      const history = [
        {
          id: 2,
          date: '2026-01-15T10:00:00Z',
          visualAcuity: { 
            left: { snellen: '20/400', level: 0 },
            right: null
          }
        },
        {
          id: 1,
          date: '2026-01-01T10:00:00Z',
          visualAcuity: { 
            left: { snellen: '20/400', level: 0 },
            right: null
          }
        }
      ]
      
      setResultsAndHistory({
        visualAcuity: { 
          left: { snellen: '20/400', level: 0, maxLevel: 10 },
          right: null
        }
      }, history)
      
      renderWithProviders(<HealthSnapshot />)
      
      expect(screen.getByText(/Your visual acuity has remained stable/)).toBeInTheDocument()
    })
  })

  describe('FindDoctorButton visibility', () => {
    it('shows Find Doctor button when visual acuity is below normal', () => {
      setTestResults({
        visualAcuity: { 
          left: { snellen: '20/50', level: 5, maxLevel: 10 },
          right: null
        }
      })
      
      renderWithProviders(<HealthSnapshot />)
      
      expect(screen.getByRole('button', { name: /find eye doctors near me/i })).toBeInTheDocument()
    })

    it('shows Find Doctor button when color vision is not normal', () => {
      setTestResults({
        colorVision: { 
          correctCount: 5, 
          totalPlates: 10, 
          redGreenCorrect: 3, 
          redGreenTotal: 6,
          status: 'mild_difficulty' 
        }
      })
      
      renderWithProviders(<HealthSnapshot />)
      
      expect(screen.getByRole('button', { name: /find eye doctors near me/i })).toBeInTheDocument()
    })

    it('shows Find Doctor button when contrast sensitivity is below 0.9', () => {
      setTestResults({
        contrastSensitivity: { 
          left: { logCS: 0.7, level: 5, maxLevel: 10 },
          right: null
        }
      })
      
      renderWithProviders(<HealthSnapshot />)
      
      expect(screen.getByRole('button', { name: /find eye doctors near me/i })).toBeInTheDocument()
    })

    it('shows Find Doctor button when Amsler grid shows issues', () => {
      setTestResults({
        amslerGrid: { 
          left: { hasIssues: true },
          right: null
        }
      })
      
      renderWithProviders(<HealthSnapshot />)
      
      expect(screen.getByRole('button', { name: /find eye doctors near me/i })).toBeInTheDocument()
    })

    it('does NOT show Find Doctor button when all results are normal', () => {
      setTestResults({
        visualAcuity: { 
          left: { snellen: '20/20', level: 10, maxLevel: 10 },
          right: { snellen: '20/20', level: 10, maxLevel: 10 }
        },
        colorVision: { 
          correctCount: 10, 
          totalPlates: 10, 
          redGreenCorrect: 6, 
          redGreenTotal: 6,
          status: 'normal' 
        },
        contrastSensitivity: { 
          left: { logCS: 1.2, level: 9, maxLevel: 10 },
          right: { logCS: 1.2, level: 9, maxLevel: 10 }
        },
        amslerGrid: { 
          left: { hasIssues: false },
          right: { hasIssues: false }
        }
      })
      
      renderWithProviders(<HealthSnapshot />)
      
      expect(screen.queryByRole('button', { name: /find eye doctors near me/i })).not.toBeInTheDocument()
    })

    it('does NOT show Find Doctor button when visual acuity is exactly 8', () => {
      setTestResults({
        visualAcuity: { 
          left: { snellen: '20/25', level: 8, maxLevel: 10 },
          right: { snellen: '20/25', level: 8, maxLevel: 10 }
        }
      })
      
      renderWithProviders(<HealthSnapshot />)
      
      expect(screen.queryByRole('button', { name: /find eye doctors near me/i })).not.toBeInTheDocument()
    })

    it('does NOT show Find Doctor button when contrast sensitivity is exactly 0.9', () => {
      setTestResults({
        contrastSensitivity: { 
          left: { logCS: 0.9, level: 7, maxLevel: 10 },
          right: { logCS: 0.9, level: 7, maxLevel: 10 }
        }
      })
      
      renderWithProviders(<HealthSnapshot />)
      
      expect(screen.queryByRole('button', { name: /find eye doctors near me/i })).not.toBeInTheDocument()
    })
  })
})
