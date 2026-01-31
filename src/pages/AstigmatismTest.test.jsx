import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import AstigmatismTest from './AstigmatismTest'
import { TestResultsProvider } from '../context/TestResultsContext'
import { TTSSettingsProvider } from '../context/TTSSettingsContext'
import { LanguageProvider } from '../context/LanguageContext'
import i18n from '../i18n'

// Mock the navigate function
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Mock HTMLMediaElement methods
beforeEach(() => {
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
  window.HTMLMediaElement.prototype.pause = vi.fn()
  window.HTMLMediaElement.prototype.load = vi.fn()
  
  localStorage.clear()
  mockNavigate.mockClear()
  i18n.changeLanguage('en')
})

afterEach(() => {
  vi.restoreAllMocks()
})

function renderWithProviders(ui) {
  return render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <LanguageProvider>
          <TTSSettingsProvider>
            <TestResultsProvider>
              {ui}
            </TestResultsProvider>
          </TTSSettingsProvider>
        </LanguageProvider>
      </I18nextProvider>
    </MemoryRouter>
  )
}

describe('AstigmatismTest', () => {
  describe('eye selection phase', () => {
    it('renders eye selection screen initially', () => {
      renderWithProviders(<AstigmatismTest />)
      
      expect(screen.getByText('Astigmatism Screening')).toBeInTheDocument()
      expect(screen.getByText('Left')).toBeInTheDocument()
      expect(screen.getByText('Right')).toBeInTheDocument()
    })

    it('transitions to instructions when left eye is selected', async () => {
      renderWithProviders(<AstigmatismTest />)
      
      fireEvent.click(screen.getByText('Left'))
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Start Test' })).toBeInTheDocument()
      })
    })

    it('transitions to instructions when right eye is selected', async () => {
      renderWithProviders(<AstigmatismTest />)
      
      fireEvent.click(screen.getByText('Right'))
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Start Test' })).toBeInTheDocument()
      })
    })
  })

  describe('instructions phase', () => {
    it('shows test instructions', async () => {
      renderWithProviders(<AstigmatismTest />)
      
      // Select left eye to get to instructions
      fireEvent.click(screen.getByText('Left'))
      
      await waitFor(() => {
        expect(screen.getByText(/Cover your/)).toBeInTheDocument()
        expect(screen.getByText(/Focus on the red dot/)).toBeInTheDocument()
      })
    })

    it('shows Start Test button', async () => {
      renderWithProviders(<AstigmatismTest />)
      
      fireEvent.click(screen.getByText('Left'))
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Start Test' })).toBeInTheDocument()
      })
    })

    it('transitions to testing phase when Start Test is clicked', async () => {
      renderWithProviders(<AstigmatismTest />)
      
      fireEvent.click(screen.getByText('Left'))
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Start Test' })).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByRole('button', { name: 'Start Test' }))
      
      await waitFor(() => {
        expect(screen.getByText(/Do any lines appear darker/)).toBeInTheDocument()
      })
    })
  })

  describe('testing phase', () => {
    async function goToTestingPhase() {
      renderWithProviders(<AstigmatismTest />)
      fireEvent.click(screen.getByText('Left'))
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Start Test' })).toBeInTheDocument()
      })
      fireEvent.click(screen.getByRole('button', { name: 'Start Test' }))
      await waitFor(() => {
        expect(screen.getByText(/Do any lines appear darker/)).toBeInTheDocument()
      })
    }

    it('shows the clock dial with lines', async () => {
      await goToTestingPhase()
      
      // Check that SVG with clock dial is present
      const svg = document.querySelector('svg')
      expect(svg).toBeInTheDocument()
      
      // Check for line elements (12 clock positions)
      const lines = svg.querySelectorAll('line')
      expect(lines.length).toBeGreaterThan(0)
    })

    it('shows All lines appear equal button', async () => {
      await goToTestingPhase()
      
      expect(screen.getByText('All lines appear equal')).toBeInTheDocument()
    })

    it('shows Confirm Selection button (initially disabled)', async () => {
      await goToTestingPhase()
      
      const confirmButton = screen.getByText('Confirm Selection')
      expect(confirmButton).toBeInTheDocument()
      expect(confirmButton).toBeDisabled()
    })

    it('enables Confirm button when All lines equal is selected', async () => {
      await goToTestingPhase()
      
      fireEvent.click(screen.getByText('All lines appear equal'))
      
      const confirmButton = screen.getByText('Confirm Selection')
      expect(confirmButton).not.toBeDisabled()
    })
  })

  describe('result calculation', () => {
    it('shows no astigmatism when all lines equal is selected', async () => {
      renderWithProviders(<AstigmatismTest />)
      
      // Go through the flow
      fireEvent.click(screen.getByText('Left'))
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Start Test' })).toBeInTheDocument()
      })
      fireEvent.click(screen.getByRole('button', { name: 'Start Test' }))
      await waitFor(() => {
        expect(screen.getByText(/Do any lines appear darker/)).toBeInTheDocument()
      })
      
      // Select all lines equal
      fireEvent.click(screen.getByText('All lines appear equal'))
      
      // Confirm
      fireEvent.click(screen.getByText('Confirm Selection'))
      
      // Should show no astigmatism result
      await waitFor(() => {
        expect(screen.getByText('No astigmatism detected')).toBeInTheDocument()
      })
    })
  })

  describe('complete phase', () => {
    it('shows option to test other eye when only one eye is tested', async () => {
      renderWithProviders(<AstigmatismTest />)
      
      // Complete left eye test
      fireEvent.click(screen.getByText('Left'))
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Start Test' })).toBeInTheDocument()
      })
      fireEvent.click(screen.getByRole('button', { name: 'Start Test' }))
      await waitFor(() => {
        expect(screen.getByText(/Do any lines appear darker/)).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('All lines appear equal'))
      fireEvent.click(screen.getByText('Confirm Selection'))
      
      // Should show option to test other eye
      await waitFor(() => {
        expect(screen.getByText(/Test Right/)).toBeInTheDocument()
      })
    })

    it('shows disclaimer', async () => {
      renderWithProviders(<AstigmatismTest />)
      
      // Complete left eye test
      fireEvent.click(screen.getByText('Left'))
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Start Test' })).toBeInTheDocument()
      })
      fireEvent.click(screen.getByRole('button', { name: 'Start Test' }))
      await waitFor(() => {
        expect(screen.getByText(/Do any lines appear darker/)).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('All lines appear equal'))
      fireEvent.click(screen.getByText('Confirm Selection'))
      
      await waitFor(() => {
        expect(screen.getByText(/Medical Disclaimer/)).toBeInTheDocument()
      })
    })
  })

  describe('result persistence', () => {
    it('saves results to localStorage', async () => {
      renderWithProviders(<AstigmatismTest />)
      
      // Complete left eye test
      fireEvent.click(screen.getByText('Left'))
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Start Test' })).toBeInTheDocument()
      })
      fireEvent.click(screen.getByRole('button', { name: 'Start Test' }))
      await waitFor(() => {
        expect(screen.getByText(/Do any lines appear darker/)).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('All lines appear equal'))
      fireEvent.click(screen.getByText('Confirm Selection'))
      
      await waitFor(() => {
        expect(screen.getByText('No astigmatism detected')).toBeInTheDocument()
      })
      
      // Check localStorage
      const saved = JSON.parse(localStorage.getItem('visioncheck-results'))
      expect(saved.astigmatism).toBeDefined()
      expect(saved.astigmatism.left).toBeDefined()
      expect(saved.astigmatism.left.allLinesEqual).toBe(true)
      expect(saved.astigmatism.left.severity).toBe('none')
    })
  })
})
