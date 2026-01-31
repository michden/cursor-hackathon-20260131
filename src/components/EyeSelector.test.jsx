import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import EyeSelector from './EyeSelector'
import { LanguageProvider } from '../context/LanguageContext'
import i18n from '../i18n'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

function renderWithProviders(ui) {
  return render(
    <I18nextProvider i18n={i18n}>
      <LanguageProvider>
        <MemoryRouter>
          {ui}
        </MemoryRouter>
      </LanguageProvider>
    </I18nextProvider>
  )
}

describe('EyeSelector', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    localStorage.clear()
    i18n.changeLanguage('en')
  })

  it('renders left and right eye buttons', () => {
    const onSelect = vi.fn()
    renderWithProviders(<EyeSelector onSelect={onSelect} />)
    
    expect(screen.getByText('Left')).toBeInTheDocument()
    expect(screen.getByText('Right')).toBeInTheDocument()
  })

  it('calls onSelect with "left" when left eye button is clicked', () => {
    const onSelect = vi.fn()
    renderWithProviders(<EyeSelector onSelect={onSelect} />)
    
    fireEvent.click(screen.getByText('Left'))
    
    expect(onSelect).toHaveBeenCalledWith('left')
  })

  it('calls onSelect with "right" when right eye button is clicked', () => {
    const onSelect = vi.fn()
    renderWithProviders(<EyeSelector onSelect={onSelect} />)
    
    fireEvent.click(screen.getByText('Right'))
    
    expect(onSelect).toHaveBeenCalledWith('right')
  })

  it('shows completion status for left eye when completed', () => {
    const onSelect = vi.fn()
    const completedEyes = {
      left: { snellen: '20/20', level: 8 },
      right: null
    }
    
    renderWithProviders(<EyeSelector onSelect={onSelect} completedEyes={completedEyes} />)
    
    // Look for the checkmark and status
    expect(screen.getByText(/Complete/)).toBeInTheDocument()
  })

  it('shows completion status for both eyes when both completed', () => {
    const onSelect = vi.fn()
    const completedEyes = {
      left: { snellen: '20/20', level: 8 },
      right: { snellen: '20/40', level: 5 }
    }
    
    renderWithProviders(<EyeSelector onSelect={onSelect} completedEyes={completedEyes} />)
    
    const completeMarkers = screen.getAllByText(/Complete/)
    expect(completeMarkers).toHaveLength(2)
  })

  it('shows View Results button when both eyes are complete', () => {
    const onSelect = vi.fn()
    const completedEyes = {
      left: { snellen: '20/20', level: 8 },
      right: { snellen: '20/40', level: 5 }
    }
    
    renderWithProviders(<EyeSelector onSelect={onSelect} completedEyes={completedEyes} />)
    
    expect(screen.getByText(/View Results/)).toBeInTheDocument()
  })

  it('does not show View Results button when only one eye is complete', () => {
    const onSelect = vi.fn()
    const completedEyes = {
      left: { snellen: '20/20', level: 8 },
      right: null
    }
    
    renderWithProviders(<EyeSelector onSelect={onSelect} completedEyes={completedEyes} />)
    
    expect(screen.queryByText(/View Results →/)).not.toBeInTheDocument()
  })

  it('navigates to results when View Results is clicked', () => {
    const onSelect = vi.fn()
    const completedEyes = {
      left: { snellen: '20/20', level: 8 },
      right: { snellen: '20/40', level: 5 }
    }
    
    renderWithProviders(<EyeSelector onSelect={onSelect} completedEyes={completedEyes} />)
    
    fireEvent.click(screen.getByText(/View Results/))
    
    expect(mockNavigate).toHaveBeenCalledWith('/results')
  })

  it('shows cover-your-eye instruction tip', () => {
    const onSelect = vi.fn()
    renderWithProviders(<EyeSelector onSelect={onSelect} />)
    
    expect(screen.getByText(/Cover your other eye/)).toBeInTheDocument()
  })

  it('asks which eye to test', () => {
    const onSelect = vi.fn()
    renderWithProviders(<EyeSelector onSelect={onSelect} />)
    
    expect(screen.getByText('Which eye would you like to test?')).toBeInTheDocument()
  })
})
