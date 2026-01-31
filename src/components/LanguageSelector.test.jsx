import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import LanguageSelector from './LanguageSelector'
import { LanguageProvider } from '../context/LanguageContext'
import i18n from '../i18n'

function renderWithProviders(ui) {
  return render(
    <I18nextProvider i18n={i18n}>
      <LanguageProvider>
        {ui}
      </LanguageProvider>
    </I18nextProvider>
  )
}

describe('LanguageSelector', () => {
  beforeEach(() => {
    localStorage.clear()
    i18n.changeLanguage('en')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render with current language flag', async () => {
    renderWithProviders(<LanguageSelector />)

    // Should show the English flag by default
    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('🇬🇧')
  })

  it('should open dropdown when clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LanguageSelector />)

    await user.click(screen.getByRole('button'))
    
    // Should show both language options
    expect(screen.getByText('English')).toBeInTheDocument()
    expect(screen.getByText('Deutsch')).toBeInTheDocument()
  })

  it('should change language when option is selected', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LanguageSelector />)

    // Open dropdown
    await user.click(screen.getByRole('button'))
    
    // Click German option
    await user.click(screen.getByText('Deutsch'))
    
    // Should update to German flag
    await waitFor(() => {
      const button = screen.getByRole('button')
      expect(button).toHaveTextContent('🇩🇪')
    })
  })

  it('should close dropdown after selection', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LanguageSelector />)

    // Open dropdown
    await user.click(screen.getByRole('button'))
    
    // Verify dropdown is open
    expect(screen.getByText('English')).toBeInTheDocument()
    
    // Click an option
    await user.click(screen.getByText('English'))
    
    // Dropdown should close
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
  })

  it('should close dropdown on escape key', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LanguageSelector />)

    // Open dropdown
    await user.click(screen.getByRole('button'))
    
    // Press escape
    await user.keyboard('{Escape}')
    
    // Dropdown should close
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
  })

  it('should show checkmark on selected language', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LanguageSelector />)

    // Open dropdown
    await user.click(screen.getByRole('button'))
    
    // The English option should have a checkmark (it's the selected one)
    const englishOption = screen.getByText('English').closest('button')
    expect(englishOption).toContainHTML('svg')
  })

  it('should have proper accessibility attributes', () => {
    renderWithProviders(<LanguageSelector />)

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(button).toHaveAttribute('aria-haspopup', 'true')
  })

  it('should update aria-expanded when opened', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LanguageSelector />)

    const button = screen.getByRole('button')
    
    await user.click(button)
    
    expect(button).toHaveAttribute('aria-expanded', 'true')
  })
})
