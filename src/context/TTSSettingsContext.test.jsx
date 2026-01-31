import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TTSSettingsProvider, useTTSSettings } from './TTSSettingsContext'

// Test component that exposes the context values
function TestComponent() {
  const { autoPlayEnabled, setAutoPlayEnabled } = useTTSSettings()
  return (
    <div>
      <span data-testid="auto-play-status">{autoPlayEnabled ? 'enabled' : 'disabled'}</span>
      <button onClick={() => setAutoPlayEnabled(true)}>Enable</button>
      <button onClick={() => setAutoPlayEnabled(false)}>Disable</button>
    </div>
  )
}

describe('TTSSettingsContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  it('should provide default autoPlayEnabled as true', () => {
    render(
      <TTSSettingsProvider>
        <TestComponent />
      </TTSSettingsProvider>
    )

    expect(screen.getByTestId('auto-play-status')).toHaveTextContent('enabled')
  })

  it('should allow toggling autoPlayEnabled to false', async () => {
    const user = userEvent.setup()
    
    render(
      <TTSSettingsProvider>
        <TestComponent />
      </TTSSettingsProvider>
    )

    expect(screen.getByTestId('auto-play-status')).toHaveTextContent('enabled')
    
    await user.click(screen.getByText('Disable'))
    
    expect(screen.getByTestId('auto-play-status')).toHaveTextContent('disabled')
  })

  it('should allow toggling autoPlayEnabled to true', async () => {
    const user = userEvent.setup()
    
    // Start with disabled state
    localStorage.setItem('visioncheck-tts-settings', JSON.stringify({ autoPlayEnabled: false }))
    
    render(
      <TTSSettingsProvider>
        <TestComponent />
      </TTSSettingsProvider>
    )

    expect(screen.getByTestId('auto-play-status')).toHaveTextContent('disabled')
    
    await user.click(screen.getByText('Enable'))
    
    expect(screen.getByTestId('auto-play-status')).toHaveTextContent('enabled')
  })

  it('should persist settings to localStorage', async () => {
    const user = userEvent.setup()
    
    render(
      <TTSSettingsProvider>
        <TestComponent />
      </TTSSettingsProvider>
    )

    await user.click(screen.getByText('Disable'))
    
    const stored = JSON.parse(localStorage.getItem('visioncheck-tts-settings'))
    expect(stored.autoPlayEnabled).toBe(false)
  })

  it('should load settings from localStorage on mount', () => {
    localStorage.setItem('visioncheck-tts-settings', JSON.stringify({ autoPlayEnabled: false }))
    
    render(
      <TTSSettingsProvider>
        <TestComponent />
      </TTSSettingsProvider>
    )

    expect(screen.getByTestId('auto-play-status')).toHaveTextContent('disabled')
  })

  it('should throw error when useTTSSettings is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useTTSSettings must be used within a TTSSettingsProvider')
    
    consoleSpy.mockRestore()
  })
})
