import { describe, it, expect } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { TestResultsProvider, useTestResults } from './TestResultsContext'

// Test component that exposes context values
function TestConsumer({ onMount }) {
  const context = useTestResults()
  onMount?.(context)
  return (
    <div>
      <span data-testid="has-results">{context.hasAnyResults() ? 'yes' : 'no'}</span>
      <span data-testid="visual-acuity">{context.results.visualAcuity?.snellen || 'none'}</span>
      <span data-testid="color-vision">{context.results.colorVision?.score || 'none'}</span>
      <span data-testid="eye-photo">{context.results.eyePhoto?.status || 'none'}</span>
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
})
