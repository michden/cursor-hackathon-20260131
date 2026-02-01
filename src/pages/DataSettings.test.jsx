import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import DataSettings from './DataSettings'
import { ConsentProvider } from '../context/ConsentContext'
import i18n from '../i18n'

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url')
global.URL.revokeObjectURL = vi.fn()

// Wrapper to provide all required contexts
function renderWithProviders(ui, { consentGiven = true } = {}) {
  localStorage.setItem('visioncheck-consent', JSON.stringify({
    hasConsented: true,
    consentGiven
  }))
  
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

describe('DataSettings', () => {
  beforeEach(() => {
    localStorage.clear()
    i18n.changeLanguage('en')
    vi.clearAllMocks()
  })

  it('should render the page title', () => {
    renderWithProviders(<DataSettings />)
    
    expect(screen.getByText(/Data & Privacy Settings/i)).toBeInTheDocument()
  })

  it('should show consent granted status when consent is given', () => {
    renderWithProviders(<DataSettings />, { consentGiven: true })
    
    expect(screen.getByText(/You have consented to data storage/i)).toBeInTheDocument()
  })

  it('should show session-only mode status when consent is denied', () => {
    renderWithProviders(<DataSettings />, { consentGiven: false })
    
    expect(screen.getByText(/You are using session-only mode/i)).toBeInTheDocument()
  })

  it('should show "Enable Data Storage" button when consent is denied', () => {
    renderWithProviders(<DataSettings />, { consentGiven: false })
    
    expect(screen.getByRole('button', { name: /Enable Data Storage/i })).toBeInTheDocument()
  })

  it('should show "Revoke Consent" button when consent is given', () => {
    renderWithProviders(<DataSettings />, { consentGiven: true })
    
    expect(screen.getByRole('button', { name: /Revoke Consent/i })).toBeInTheDocument()
  })

  it('should display stored data section', () => {
    localStorage.setItem('visioncheck-results', JSON.stringify({ test: 'data' }))
    localStorage.setItem('visioncheck-consent', JSON.stringify({ hasConsented: true, consentGiven: true }))
    
    renderWithProviders(<DataSettings />)
    
    // Check for the h2 heading specifically
    expect(screen.getByRole('heading', { name: /Your Stored Data/i })).toBeInTheDocument()
    expect(screen.getByText(/Current Test Results/i)).toBeInTheDocument()
  })

  it('should show "No data stored" when only consent is stored', () => {
    // The render sets up consent data, but no other data
    renderWithProviders(<DataSettings />)
    
    // The preferences section should still appear (since consent is stored)
    // but results/history/achievements sections should not appear
    expect(screen.queryByText(/Current Test Results/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Test History/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Achievements/i)).not.toBeInTheDocument()
  })

  it('should have export data button', () => {
    renderWithProviders(<DataSettings />)
    
    expect(screen.getByRole('button', { name: /Export Data/i })).toBeInTheDocument()
  })

  it('should have delete all data button', () => {
    renderWithProviders(<DataSettings />)
    
    expect(screen.getByRole('button', { name: /Delete All Data/i })).toBeInTheDocument()
  })

  it('should expand data section when clicked', async () => {
    const user = userEvent.setup()
    localStorage.setItem('visioncheck-results', JSON.stringify({ visualAcuity: { left: { snellen: '20/20' } } }))
    localStorage.setItem('visioncheck-consent', JSON.stringify({ hasConsented: true, consentGiven: true }))
    
    renderWithProviders(<DataSettings />)
    
    await user.click(screen.getByText(/Current Test Results/i))
    
    // Should show the JSON data
    expect(screen.getByText(/visualAcuity/i)).toBeInTheDocument()
  })

  it('should delete all data when confirmed', async () => {
    const user = userEvent.setup()
    localStorage.setItem('visioncheck-results', JSON.stringify({ test: 'data' }))
    localStorage.setItem('visioncheck-history', JSON.stringify([]))
    localStorage.setItem('visioncheck-consent', JSON.stringify({ hasConsented: true, consentGiven: true }))
    
    // Mock confirm
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    
    renderWithProviders(<DataSettings />)
    
    await user.click(screen.getByRole('button', { name: /Delete All Data/i }))
    
    expect(localStorage.getItem('visioncheck-results')).toBeNull()
    expect(localStorage.getItem('visioncheck-history')).toBeNull()
  })

  it('should not delete data when cancelled', async () => {
    const user = userEvent.setup()
    localStorage.setItem('visioncheck-results', JSON.stringify({ test: 'data' }))
    localStorage.setItem('visioncheck-consent', JSON.stringify({ hasConsented: true, consentGiven: true }))
    
    // Mock confirm to return false
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    
    renderWithProviders(<DataSettings />)
    
    await user.click(screen.getByRole('button', { name: /Delete All Data/i }))
    
    expect(localStorage.getItem('visioncheck-results')).not.toBeNull()
  })

  it('should have back to home link', () => {
    renderWithProviders(<DataSettings />)
    
    expect(screen.getByRole('link', { name: /Back to Home/i })).toBeInTheDocument()
  })

  it('should have links to privacy and terms pages', () => {
    renderWithProviders(<DataSettings />)
    
    expect(screen.getByRole('link', { name: /Privacy/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Terms/i })).toBeInTheDocument()
  })
})
