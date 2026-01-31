import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { TestResultsProvider, useTestResults } from './TestResultsContext'

// Clear localStorage before each test to prevent state bleeding
beforeEach(() => {
  localStorage.clear()
})

// Test component that exposes context values
function TestConsumer({ onMount }) {
  const context = useTestResults()
  onMount?.(context)
  return (
    <div>
      <span data-testid="has-results">{context.hasAnyResults() ? 'yes' : 'no'}</span>
      <span data-testid="visual-acuity">{context.results.visualAcuity?.snellen || 'none'}</span>
      <span data-testid="color-vision">{context.results.colorVision?.score || 'none'}</span>
      <span data-testid="contrast-sensitivity">{context.results.contrastSensitivity?.logCS?.toString() || 'none'}</span>
      <span data-testid="eye-photo">{context.results.eyePhoto?.status || 'none'}</span>
      <span data-testid="history-count">{context.history.length}</span>
    </div>
  )
}

describe('TestResultsContext', () => {
  it('provides initial empty state', () => {
    render(
      <TestResultsProvider>
        <TestConsumer />
      </TestResultsProvider>
    )

    expect(screen.getByTestId('has-results')).toHaveTextContent('no')
    expect(screen.getByTestId('visual-acuity')).toHaveTextContent('none')
    expect(screen.getByTestId('color-vision')).toHaveTextContent('none')
    expect(screen.getByTestId('eye-photo')).toHaveTextContent('none')
  })

  it('updates visual acuity results', () => {
    let contextRef
    
    render(
      <TestResultsProvider>
        <TestConsumer onMount={(ctx) => { contextRef = ctx }} />
      </TestResultsProvider>
    )

    act(() => {
      contextRef.updateVisualAcuity({ snellen: '20/20', level: 8 })
    })

    expect(screen.getByTestId('has-results')).toHaveTextContent('yes')
    expect(screen.getByTestId('visual-acuity')).toHaveTextContent('20/20')
  })

  it('updates color vision results', () => {
    let contextRef
    
    render(
      <TestResultsProvider>
        <TestConsumer onMount={(ctx) => { contextRef = ctx }} />
      </TestResultsProvider>
    )

    act(() => {
      contextRef.updateColorVision({ score: 8, total: 10 })
    })

    expect(screen.getByTestId('has-results')).toHaveTextContent('yes')
    expect(screen.getByTestId('color-vision')).toHaveTextContent('8')
  })

  it('updates eye photo results', () => {
    let contextRef
    
    render(
      <TestResultsProvider>
        <TestConsumer onMount={(ctx) => { contextRef = ctx }} />
      </TestResultsProvider>
    )

    act(() => {
      contextRef.updateEyePhoto({ status: 'analyzed', findings: [] })
    })

    expect(screen.getByTestId('has-results')).toHaveTextContent('yes')
    expect(screen.getByTestId('eye-photo')).toHaveTextContent('analyzed')
  })

  it('clears all results', () => {
    let contextRef
    
    render(
      <TestResultsProvider>
        <TestConsumer onMount={(ctx) => { contextRef = ctx }} />
      </TestResultsProvider>
    )

    act(() => {
      contextRef.updateVisualAcuity({ snellen: '20/20', level: 8 })
      contextRef.updateColorVision({ score: 8, total: 10 })
    })

    expect(screen.getByTestId('has-results')).toHaveTextContent('yes')

    act(() => {
      contextRef.clearResults()
    })

    expect(screen.getByTestId('has-results')).toHaveTextContent('no')
    expect(screen.getByTestId('visual-acuity')).toHaveTextContent('none')
    expect(screen.getByTestId('color-vision')).toHaveTextContent('none')
  })

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestConsumer />)
    }).toThrow('useTestResults must be used within a TestResultsProvider')

    consoleSpy.mockRestore()
  })

  it('updates contrast sensitivity results', () => {
    let contextRef
    
    render(
      <TestResultsProvider>
        <TestConsumer onMount={(ctx) => { contextRef = ctx }} />
      </TestResultsProvider>
    )

    act(() => {
      contextRef.updateContrastSensitivity({ logCS: 1.5, level: 8, maxLevel: 10 })
    })

    expect(screen.getByTestId('has-results')).toHaveTextContent('yes')
    expect(screen.getByTestId('contrast-sensitivity')).toHaveTextContent('1.5')
  })

  it('saves contrast sensitivity only session to history', () => {
    let contextRef
    
    render(
      <TestResultsProvider>
        <TestConsumer onMount={(ctx) => { contextRef = ctx }} />
      </TestResultsProvider>
    )

    // Only set contrast sensitivity (no visual acuity or color vision)
    act(() => {
      contextRef.updateContrastSensitivity({ logCS: 1.2, level: 7, maxLevel: 10 })
    })

    act(() => {
      contextRef.saveToHistory()
    })

    expect(screen.getByTestId('history-count')).toHaveTextContent('1')
    expect(contextRef.history[0].contrastSensitivity).toEqual({
      logCS: 1.2,
      level: 7,
      maxLevel: 10
    })
  })

  it('includes contrast sensitivity data in history session', () => {
    let contextRef
    
    render(
      <TestResultsProvider>
        <TestConsumer onMount={(ctx) => { contextRef = ctx }} />
      </TestResultsProvider>
    )

    act(() => {
      contextRef.updateVisualAcuity({ snellen: '20/20', level: 8 })
      contextRef.updateContrastSensitivity({ logCS: 1.5, level: 9, maxLevel: 10 })
    })

    act(() => {
      contextRef.saveToHistory()
    })

    expect(screen.getByTestId('history-count')).toHaveTextContent('1')
    expect(contextRef.history[0].visualAcuity).toBeDefined()
    expect(contextRef.history[0].contrastSensitivity).toEqual({
      logCS: 1.5,
      level: 9,
      maxLevel: 10
    })
  })

  it('does not save to history when no results exist', () => {
    let contextRef
    
    render(
      <TestResultsProvider>
        <TestConsumer onMount={(ctx) => { contextRef = ctx }} />
      </TestResultsProvider>
    )

    act(() => {
      contextRef.saveToHistory()
    })

    expect(screen.getByTestId('history-count')).toHaveTextContent('0')
  })
})
