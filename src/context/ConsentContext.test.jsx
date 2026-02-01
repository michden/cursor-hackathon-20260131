import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConsentProvider, useConsent } from './ConsentContext'

// Test component to access context
function TestComponent() {
  const { hasConsented, consentGiven, giveConsent, denyConsent, revokeConsent, resetConsent } = useConsent()
  
  return (
    <div>
      <span data-testid="hasConsented">{String(hasConsented)}</span>
      <span data-testid="consentGiven">{String(consentGiven)}</span>
      <button onClick={giveConsent}>Give Consent</button>
      <button onClick={denyConsent}>Deny Consent</button>
      <button onClick={revokeConsent}>Revoke Consent</button>
      <button onClick={resetConsent}>Reset Consent</button>
    </div>
  )
}

describe('ConsentContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should start with no consent when localStorage is empty', () => {
    render(
      <ConsentProvider>
        <TestComponent />
      </ConsentProvider>
    )
    
    expect(screen.getByTestId('hasConsented').textContent).toBe('false')
    expect(screen.getByTestId('consentGiven').textContent).toBe('false')
  })

  it('should set hasConsented and consentGiven to true when consent is given', async () => {
    const user = userEvent.setup()
    
    render(
      <ConsentProvider>
        <TestComponent />
      </ConsentProvider>
    )
    
    await user.click(screen.getByText('Give Consent'))
    
    expect(screen.getByTestId('hasConsented').textContent).toBe('true')
    expect(screen.getByTestId('consentGiven').textContent).toBe('true')
  })

  it('should set hasConsented to true and consentGiven to false when consent is denied', async () => {
    const user = userEvent.setup()
    
    render(
      <ConsentProvider>
        <TestComponent />
      </ConsentProvider>
    )
    
    await user.click(screen.getByText('Deny Consent'))
    
    expect(screen.getByTestId('hasConsented').textContent).toBe('true')
    expect(screen.getByTestId('consentGiven').textContent).toBe('false')
  })

  it('should persist consent to localStorage', async () => {
    const user = userEvent.setup()
    
    render(
      <ConsentProvider>
        <TestComponent />
      </ConsentProvider>
    )
    
    await user.click(screen.getByText('Give Consent'))
    
    const stored = JSON.parse(localStorage.getItem('visioncheck-consent'))
    expect(stored.hasConsented).toBe(true)
    expect(stored.consentGiven).toBe(true)
  })

  it('should load consent state from localStorage on mount', () => {
    localStorage.setItem('visioncheck-consent', JSON.stringify({
      hasConsented: true,
      consentGiven: true
    }))
    
    render(
      <ConsentProvider>
        <TestComponent />
      </ConsentProvider>
    )
    
    expect(screen.getByTestId('hasConsented').textContent).toBe('true')
    expect(screen.getByTestId('consentGiven').textContent).toBe('true')
  })

  it('should clear visioncheck data when consent is revoked', async () => {
    const user = userEvent.setup()
    
    // Set up some mock data
    localStorage.setItem('visioncheck-results', JSON.stringify({ test: 'data' }))
    localStorage.setItem('visioncheck-history', JSON.stringify([]))
    localStorage.setItem('visioncheck-consent', JSON.stringify({ hasConsented: true, consentGiven: true }))
    
    render(
      <ConsentProvider>
        <TestComponent />
      </ConsentProvider>
    )
    
    await user.click(screen.getByText('Revoke Consent'))
    
    expect(localStorage.getItem('visioncheck-results')).toBeNull()
    expect(localStorage.getItem('visioncheck-history')).toBeNull()
    expect(screen.getByTestId('consentGiven').textContent).toBe('false')
  })

  it('should reset consent to show banner again', async () => {
    const user = userEvent.setup()
    
    localStorage.setItem('visioncheck-consent', JSON.stringify({
      hasConsented: true,
      consentGiven: true
    }))
    
    render(
      <ConsentProvider>
        <TestComponent />
      </ConsentProvider>
    )
    
    await user.click(screen.getByText('Reset Consent'))
    
    // hasConsented should be false so banner will show again
    expect(screen.getByTestId('hasConsented').textContent).toBe('false')
    expect(screen.getByTestId('consentGiven').textContent).toBe('false')
  })

  it('should throw error when useConsent is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useConsent must be used within a ConsentProvider')
    
    consoleSpy.mockRestore()
  })
})
