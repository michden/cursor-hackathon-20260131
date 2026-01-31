import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageProvider, useLanguage } from './LanguageContext'
import { I18nextProvider } from 'react-i18next'
import i18n from '../i18n'

// Test component that exposes the context values
function TestComponent() {
  const { language, setLanguage, supportedLanguages } = useLanguage()
  return (
    <div>
      <span data-testid="current-language">{language}</span>
      <span data-testid="supported-languages">{supportedLanguages.join(',')}</span>
      <button onClick={() => setLanguage('en')}>Set English</button>
      <button onClick={() => setLanguage('de')}>Set German</button>
    </div>
  )
}

function renderWithProviders(ui) {
  return render(
    <I18nextProvider i18n={i18n}>
      <LanguageProvider>
        {ui}
      </LanguageProvider>
    </I18nextProvider>
  )
}

describe('LanguageContext', () => {
  beforeEach(() => {
    localStorage.clear()
    // Reset i18n language
    i18n.changeLanguage('en')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should provide default language as en', async () => {
    renderWithProviders(<TestComponent />)

    await waitFor(() => {
      expect(screen.getByTestId('current-language')).toHaveTextContent('en')
    })
  })

  it('should provide supported languages', () => {
    renderWithProviders(<TestComponent />)

    expect(screen.getByTestId('supported-languages')).toHaveTextContent('en,de')
  })

  it('should allow changing language to German', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(<TestComponent />)

    await user.click(screen.getByText('Set German'))
    
    await waitFor(() => {
      expect(screen.getByTestId('current-language')).toHaveTextContent('de')
    })
  })

  it('should allow changing language back to English', async () => {
    const user = userEvent.setup()
    
    // Start with German
    localStorage.setItem('visioncheck-language', 'de')
    i18n.changeLanguage('de')
    
    renderWithProviders(<TestComponent />)

    await waitFor(() => {
      expect(screen.getByTestId('current-language')).toHaveTextContent('de')
    })
    
    await user.click(screen.getByText('Set English'))
    
    await waitFor(() => {
      expect(screen.getByTestId('current-language')).toHaveTextContent('en')
    })
  })

  it('should persist language to localStorage', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(<TestComponent />)

    await user.click(screen.getByText('Set German'))
    
    await waitFor(() => {
      const stored = localStorage.getItem('visioncheck-language')
      expect(stored).toBe('de')
    })
  })

  it('should load language from localStorage on mount', async () => {
    localStorage.setItem('visioncheck-language', 'de')
    i18n.changeLanguage('de')
    
    renderWithProviders(<TestComponent />)

    await waitFor(() => {
      expect(screen.getByTestId('current-language')).toHaveTextContent('de')
    })
  })

  it('should throw error when useLanguage is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(
        <I18nextProvider i18n={i18n}>
          <TestComponent />
        </I18nextProvider>
      )
    }).toThrow('useLanguage must be used within a LanguageProvider')
    
    consoleSpy.mockRestore()
  })

  it('should not allow setting unsupported language', async () => {
    const user = userEvent.setup()
    
    function TestInvalidLanguage() {
      const { language, setLanguage } = useLanguage()
      return (
        <div>
          <span data-testid="language">{language}</span>
          <button onClick={() => setLanguage('fr')}>Set French</button>
        </div>
      )
    }
    
    renderWithProviders(<TestInvalidLanguage />)
    
    await user.click(screen.getByText('Set French'))
    
    // Should remain unchanged
    await waitFor(() => {
      expect(screen.getByTestId('language')).toHaveTextContent('en')
    })
  })
})
