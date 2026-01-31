import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, useTheme } from './ThemeContext'

// Test component that exposes the context values
function TestComponent() {
  const { theme, resolvedTheme, isDark, setTheme, toggleTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved-theme">{resolvedTheme}</span>
      <span data-testid="is-dark">{isDark ? 'dark' : 'light'}</span>
      <button onClick={() => setTheme('light')}>Light</button>
      <button onClick={() => setTheme('dark')}>Dark</button>
      <button onClick={() => setTheme('system')}>System</button>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  )
}

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

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    // Default to light system preference
    window.matchMedia = createMatchMedia(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should default to system theme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('system')
  })

  it('should resolve to light when system prefers light', () => {
    window.matchMedia = createMatchMedia(false) // Light mode

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light')
    expect(screen.getByTestId('is-dark')).toHaveTextContent('light')
  })

  it('should resolve to dark when system prefers dark', () => {
    window.matchMedia = createMatchMedia(true) // Dark mode

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark')
    expect(screen.getByTestId('is-dark')).toHaveTextContent('dark')
  })

  it('should allow setting theme to light', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await user.click(screen.getByText('Light'))

    expect(screen.getByTestId('theme')).toHaveTextContent('light')
    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light')
  })

  it('should allow setting theme to dark', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await user.click(screen.getByText('Dark'))

    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark')
  })

  it('should toggle theme from light to dark', async () => {
    const user = userEvent.setup()
    localStorage.setItem('visioncheck-theme', 'light')

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('light')

    await user.click(screen.getByText('Toggle'))

    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
  })

  it('should toggle theme from dark to light', async () => {
    const user = userEvent.setup()
    localStorage.setItem('visioncheck-theme', 'dark')

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('dark')

    await user.click(screen.getByText('Toggle'))

    expect(screen.getByTestId('theme')).toHaveTextContent('light')
  })

  it('should persist theme to localStorage', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await user.click(screen.getByText('Dark'))

    expect(localStorage.getItem('visioncheck-theme')).toBe('dark')
  })

  it('should load theme from localStorage', () => {
    localStorage.setItem('visioncheck-theme', 'dark')

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
  })

  it('should add dark class to document when dark theme', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await user.click(screen.getByText('Dark'))

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('should remove dark class when switching to light', async () => {
    const user = userEvent.setup()
    document.documentElement.classList.add('dark')

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await user.click(screen.getByText('Light'))

    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('should throw error when useTheme is used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useTheme must be used within a ThemeProvider')

    consoleSpy.mockRestore()
  })
})
