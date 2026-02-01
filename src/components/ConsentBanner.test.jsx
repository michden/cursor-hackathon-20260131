import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import ConsentBanner from './ConsentBanner'
import { ConsentProvider } from '../context/ConsentContext'
import i18n from '../i18n'

// Wrapper to provide all required contexts
function renderWithProviders(ui, { hasConsented = false } = {}) {
  // Set up consent state
  if (hasConsented) {
    localStorage.setItem('visioncheck-consent', JSON.stringify({
      hasConsented: true,
      consentGiven: true
    }))
  } else {
    localStorage.removeItem('visioncheck-consent')
  }
  
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <ConsentProvider>
          {ui}
        </ConsentProvider>
      </MemoryRouter>
    </I18nextProvider>
  )
}

describe('ConsentBanner', () => {
  beforeEach(() => {
    localStorage.clear()
    i18n.changeLanguage('en')
  })

  it('should render when user has not consented', () => {
    renderWithProviders(<ConsentBanner />)
    
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/Your Privacy Matters/i)).toBeInTheDocument()
  })

  it('should not render when user has already consented', () => {
    renderWithProviders(<ConsentBanner />, { hasConsented: true })
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should display data storage information', () => {
    renderWithProviders(<ConsentBanner />)
    
    expect(screen.getByText(/Test results and history/i)).toBeInTheDocument()
    expect(screen.getByText(/Theme, language, and accessibility preferences/i)).toBeInTheDocument()
  })

  it('should have accept button', () => {
    renderWithProviders(<ConsentBanner />)
    
    expect(screen.getByRole('button', { name: /Accept & Save Data/i })).toBeInTheDocument()
  })

  it('should have decline button', () => {
    renderWithProviders(<ConsentBanner />)
    
    expect(screen.getByRole('button', { name: /Continue Without Saving/i })).toBeInTheDocument()
  })

  it('should hide banner when accept is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ConsentBanner />)
    
    await user.click(screen.getByRole('button', { name: /Accept & Save Data/i }))
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should hide banner when decline is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ConsentBanner />)
    
    await user.click(screen.getByRole('button', { name: /Continue Without Saving/i }))
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should save consent state to localStorage when accepted', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ConsentBanner />)
    
    await user.click(screen.getByRole('button', { name: /Accept & Save Data/i }))
    
    const stored = JSON.parse(localStorage.getItem('visioncheck-consent'))
    expect(stored.hasConsented).toBe(true)
    expect(stored.consentGiven).toBe(true)
  })

  it('should save consent state to localStorage when declined', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ConsentBanner />)
    
    await user.click(screen.getByRole('button', { name: /Continue Without Saving/i }))
    
    const stored = JSON.parse(localStorage.getItem('visioncheck-consent'))
    expect(stored.hasConsented).toBe(true)
    expect(stored.consentGiven).toBe(false)
  })

  it('should have a link to privacy policy', () => {
    renderWithProviders(<ConsentBanner />)
    
    const link = screen.getByRole('link', { name: /Read our Privacy Policy/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/privacy')
  })
})
