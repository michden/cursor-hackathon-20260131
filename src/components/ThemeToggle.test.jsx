import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ThemeToggle from './ThemeToggle'
import { ThemeProvider } from '../context/ThemeContext'

// Mock matchMedia
const createMatchMedia = (matches) => {
  return (query) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })
}

function renderWithProvider(ui) {
  return render(
    <ThemeProvider>
      {ui}
    </ThemeProvider>
  )
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    window.matchMedia = createMatchMedia(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render toggle button', () => {
    renderWithProvider(<ThemeToggle />)

    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
  })

  it('should show sun icon in light mode', () => {
    localStorage.setItem('visioncheck-theme', 'light')
    
    renderWithProvider(<ThemeToggle />)

    // The button should contain an SVG (sun icon)
    const button = screen.getByRole('button', { name: /toggle theme/i })
    expect(button.querySelector('svg')).toBeInTheDocument()
  })

  it('should show moon icon in dark mode', () => {
    localStorage.setItem('visioncheck-theme', 'dark')
    
    renderWithProvider(<ThemeToggle />)

    // The button should contain an SVG (moon icon)
    const button = screen.getByRole('button', { name: /toggle theme/i })
    expect(button.querySelector('svg')).toBeInTheDocument()
  })

  it('should open dropdown when clicked', async () => {
    const user = userEvent.setup()
    
    renderWithProvider(<ThemeToggle />)

    await user.click(screen.getByRole('button', { name: /toggle theme/i }))

    expect(screen.getByText('Light')).toBeInTheDocument()
    expect(screen.getByText('Dark')).toBeInTheDocument()
    expect(screen.getByText('System')).toBeInTheDocument()
  })

  it('should close dropdown when clicking outside', async () => {
    const user = userEvent.setup()
    
    renderWithProvider(
      <div>
        <ThemeToggle />
        <div data-testid="outside">Outside</div>
      </div>
    )

    // Open dropdown
    await user.click(screen.getByRole('button', { name: /toggle theme/i }))
    expect(screen.getByText('Light')).toBeInTheDocument()

    // Click outside
    await user.click(screen.getByTestId('outside'))

    // Dropdown should be closed
    await waitFor(() => {
      expect(screen.queryByText('Light')).not.toBeInTheDocument()
    })
  })

  it('should select light theme when clicking Light option', async () => {
    const user = userEvent.setup()
    
    renderWithProvider(<ThemeToggle />)

    await user.click(screen.getByRole('button', { name: /toggle theme/i }))
    await user.click(screen.getByText('Light'))

    expect(localStorage.getItem('visioncheck-theme')).toBe('light')
  })

  it('should select dark theme when clicking Dark option', async () => {
    const user = userEvent.setup()
    
    renderWithProvider(<ThemeToggle />)

    await user.click(screen.getByRole('button', { name: /toggle theme/i }))
    await user.click(screen.getByText('Dark'))

    expect(localStorage.getItem('visioncheck-theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('should select system theme when clicking System option', async () => {
    const user = userEvent.setup()
    localStorage.setItem('visioncheck-theme', 'dark')
    
    renderWithProvider(<ThemeToggle />)

    await user.click(screen.getByRole('button', { name: /toggle theme/i }))
    await user.click(screen.getByText('System'))

    expect(localStorage.getItem('visioncheck-theme')).toBe('system')
  })

  it('should close dropdown after selecting an option', async () => {
    const user = userEvent.setup()
    
    renderWithProvider(<ThemeToggle />)

    await user.click(screen.getByRole('button', { name: /toggle theme/i }))
    await user.click(screen.getByText('Dark'))

    // Dropdown should be closed
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('should close dropdown on escape key', async () => {
    const user = userEvent.setup()
    
    renderWithProvider(<ThemeToggle />)

    await user.click(screen.getByRole('button', { name: /toggle theme/i }))
    expect(screen.getByText('Light')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByText('Light')).not.toBeInTheDocument()
    })
  })

  it('should show checkmark next to selected option', async () => {
    const user = userEvent.setup()
    localStorage.setItem('visioncheck-theme', 'dark')
    
    renderWithProvider(<ThemeToggle />)

    await user.click(screen.getByRole('button', { name: /toggle theme/i }))

    // The Dark option should have a checkmark (an svg inside it)
    const darkButton = screen.getByText('Dark').closest('button')
    const checkmarks = darkButton.querySelectorAll('svg')
    // Should have 2 SVGs: the moon icon and the checkmark
    expect(checkmarks.length).toBe(2)
  })

  it('should have proper accessibility attributes', async () => {
    const user = userEvent.setup()
    
    renderWithProvider(<ThemeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })
    expect(button).toHaveAttribute('aria-expanded', 'false')

    await user.click(button)

    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })
})
