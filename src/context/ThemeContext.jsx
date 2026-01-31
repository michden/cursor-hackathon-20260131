import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const ThemeContext = createContext(null)

const STORAGE_KEY = 'visioncheck-theme'

/**
 * ThemeProvider - Manages dark/light mode with system preference detection
 * 
 * Features:
 * - Three modes: 'light', 'dark', 'system'
 * - System preference detection via matchMedia
 * - localStorage persistence
 * - Applies 'dark' class to document.documentElement
 */
export function ThemeProvider({ children }) {
  // Initialize theme from localStorage or default to 'system'
  const [theme, setThemeState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        return stored
      }
    } catch (e) {
      console.warn('Failed to load theme from localStorage:', e)
    }
    return 'system'
  })

  // Track the actual resolved theme (what's currently applied)
  const [resolvedTheme, setResolvedTheme] = useState(() => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return theme
  })

  // Apply theme to document and update resolved theme
  useEffect(() => {
    const applyTheme = (isDark) => {
      if (isDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      setResolvedTheme(isDark ? 'dark' : 'light')
    }

    if (theme === 'system') {
      // Use system preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      applyTheme(mediaQuery.matches)

      // Listen for system preference changes
      const handler = (e) => applyTheme(e.matches)
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    } else {
      // Use explicit theme
      applyTheme(theme === 'dark')
    }
  }, [theme])

  // Persist theme to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch (e) {
      console.warn('Failed to save theme to localStorage:', e)
    }
  }, [theme])

  const setTheme = useCallback((newTheme) => {
    if (['light', 'dark', 'system'].includes(newTheme)) {
      setThemeState(newTheme)
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      if (prev === 'light') return 'dark'
      if (prev === 'dark') return 'light'
      // If system, toggle to opposite of current resolved
      return resolvedTheme === 'dark' ? 'light' : 'dark'
    })
  }, [resolvedTheme])

  const value = {
    theme,           // User's preference: 'light' | 'dark' | 'system'
    resolvedTheme,   // Actual applied theme: 'light' | 'dark'
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
