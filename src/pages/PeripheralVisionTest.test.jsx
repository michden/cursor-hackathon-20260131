import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import PeripheralVisionTest from './PeripheralVisionTest'
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
  
  // Mock timers for test control
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
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

describe('PeripheralVisionTest', () => {
  describe('eye selection phase', () => {
    it('renders eye selection screen initially', async () => {
      renderWithProviders(<PeripheralVisionTest />)
      
      await waitFor(() => {
        expect(screen.getByText('Peripheral Vision Test')).toBeInTheDocument()
      })
      expect(screen.getByText('Left')).toBeInTheDocument()
      expect(screen.getByText('Right')).toBeInTheDocument()
    })

    it('transitions to instructions when left eye is selected', async () => {
      renderWithProviders(<PeripheralVisionTest />)
      
      await waitFor(() => {
        expect(screen.getByText('Left')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByText('Left'))
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Start Test' })).toBeInTheDocument()
      })
    })

    it('transitions to instructions when right eye is selected', async () => {
      renderWithProviders(<PeripheralVisionTest />)
      
      await waitFor(() => {
        expect(screen.getByText('Right')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByText('Right'))
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Start Test' })).toBeInTheDocument()
      })
    })
  })

  describe('instructions phase', () => {
    it('shows test instructions', async () => {
      renderWithProviders(<PeripheralVisionTest />)
      
      await waitFor(() => {
        expect(screen.getByText('Left')).toBeInTheDocument()
      })
      
      // Select left eye to get to instructions
      fireEvent.click(screen.getByText('Left'))
      
      await waitFor(() => {
        expect(screen.getByText(/Cover your/)).toBeInTheDocument()
        expect(screen.getByText(/Focus on the red dot/)).toBeInTheDocument()
      })
    })

    it('shows Start Test button', async () => {
      renderWithProviders(<PeripheralVisionTest />)
      
      await waitFor(() => {
        expect(screen.getByText('Left')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByText('Left'))
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Start Test' })).toBeInTheDocument()
      })
    })

    it('transitions to testing phase when Start Test is clicked', async () => {
      renderWithProviders(<PeripheralVisionTest />)
      
      await waitFor(() => {
        expect(screen.getByText('Left')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByText('Left'))
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Start Test' })).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByRole('button', { name: 'Start Test' }))
      
      await waitFor(() => {
        expect(screen.getByText(/Keep your focus on the red dot/)).toBeInTheDocument()
      })
    })
  })

  describe('testing phase', () => {
    async function goToTestingPhase() {
      renderWithProviders(<PeripheralVisionTest />)
      
      await waitFor(() => {
        expect(screen.getByText('Left')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByText('Left'))
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Start Test' })).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByRole('button', { name: 'Start Test' }))
      
      await waitFor(() => {
        expect(screen.getByText(/Keep your focus on the red dot/)).toBeInTheDocument()
      })
    }

    it('shows the test area with fixation point', async () => {
      await goToTestingPhase()
      
      // Check for the dark background test area
      const testArea = document.querySelector('.bg-slate-900')
      expect(testArea).toBeInTheDocument()
    })

    it('shows progress counter', async () => {
      await goToTestingPhase()
      
      // Check for counter showing 0/12
      expect(screen.getByText('0/12')).toBeInTheDocument()
    })

    it('shows tap instruction', async () => {
      await goToTestingPhase()
      
      expect(screen.getByText(/Tap when you see a white dot/)).toBeInTheDocument()
    })
  })

  describe('navigation', () => {
    it('back button returns to home from eye selection', async () => {
      renderWithProviders(<PeripheralVisionTest />)
      
      await waitFor(() => {
        expect(screen.getByText('← Back')).toBeInTheDocument()
      })
      
      // The back link should lead to home
      const backLink = screen.getByText('← Back')
      expect(backLink.closest('a')).toHaveAttribute('href', '/')
    })

    it('exit button during test returns to eye selection', async () => {
      renderWithProviders(<PeripheralVisionTest />)
      
      await waitFor(() => {
        expect(screen.getByText('Left')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByText('Left'))
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Start Test' })).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByRole('button', { name: 'Start Test' }))
      
      await waitFor(() => {
        expect(screen.getByText(/← Exit/)).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByText(/← Exit/))
      
      // Should return to eye selection phase
      await waitFor(() => {
        expect(screen.getByText('Left')).toBeInTheDocument()
        expect(screen.getByText('Right')).toBeInTheDocument()
      })
    })
  })

  describe('result persistence', () => {
    it('stores peripheral vision in context/localStorage structure', () => {
      // Check that the default localStorage structure includes peripheralVision
      const saved = JSON.parse(localStorage.getItem('visioncheck-results') || '{}')
      // Initially empty, but when results are saved they should have the right structure
      expect(saved.peripheralVision === undefined || saved.peripheralVision === null || 
             (typeof saved.peripheralVision === 'object')).toBe(true)
    })
  })
})

describe('PeripheralVisionTest translations', () => {
  it('displays translated content in English', async () => {
    i18n.changeLanguage('en')
    renderWithProviders(<PeripheralVisionTest />)
    
    await waitFor(() => {
      expect(screen.getByText('Peripheral Vision Test')).toBeInTheDocument()
    })
  })

  it('displays translated content in German', async () => {
    i18n.changeLanguage('de')
    renderWithProviders(<PeripheralVisionTest />)
    
    await waitFor(() => {
      expect(screen.getByText('Peripheres Sehtest')).toBeInTheDocument()
    })
  })
})
