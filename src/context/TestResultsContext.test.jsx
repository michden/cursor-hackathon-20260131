import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { TestResultsProvider, useTestResults } from './TestResultsContext'

// Clear localStorage before each test to prevent state bleeding
beforeEach(() => {
  localStorage.clear()
})

// Test component that exposes context values (updated for per-eye structure)
function TestConsumer({ onMount }) {
  const context = useTestResults()
  onMount?.(context)
  
  // Get first available eye for display
  const vaSnellen = context.results.visualAcuity?.left?.snellen || 
                    context.results.visualAcuity?.right?.snellen || 'none'
  const csLogCS = context.results.contrastSensitivity?.left?.logCS?.toString() || 
                  context.results.contrastSensitivity?.right?.logCS?.toString() || 'none'
  const amslerStatus = context.results.amslerGrid?.left?.status || 
                       context.results.amslerGrid?.right?.status || 'none'
  
  return (
    <div>
      <span data-testid="has-results">{context.hasAnyResults() ? 'yes' : 'no'}</span>
      <span data-testid="visual-acuity">{vaSnellen}</span>
      <span data-testid="color-vision">{context.results.colorVision?.score || 'none'}</span>
      <span data-testid="contrast-sensitivity">{csLogCS}</span>
      <span data-testid="amsler-grid">{amslerStatus}</span>
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

  it('updates visual acuity results for left eye', () => {
    let contextRef
    
    render(
      <TestResultsProvider>
        <TestConsumer onMount={(ctx) => { contextRef = ctx }} />
      </TestResultsProvider>
    )

    act(() => {
      contextRef.updateVisualAcuity('left', { snellen: '20/20', level: 8 })
    })

    expect(screen.getByTestId('has-results')).toHaveTextContent('yes')
    expect(screen.getByTestId('visual-acuity')).toHaveTextContent('20/20')
  })

  it('updates visual acuity results for right eye', () => {
    let contextRef
    
    render(
      <TestResultsProvider>
        <TestConsumer onMount={(ctx) => { contextRef = ctx }} />
      </TestResultsProvider>
    )

    act(() => {
      contextRef.updateVisualAcuity('right', { snellen: '20/40', level: 5 })
    })

    expect(screen.getByTestId('has-results')).toHaveTextContent('yes')
    expect(contextRef.results.visualAcuity.right.snellen).toBe('20/40')
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
      contextRef.updateVisualAcuity('left', { snellen: '20/20', level: 8 })
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

  it('updates contrast sensitivity results for left eye', () => {
    let contextRef
    
    render(
      <TestResultsProvider>
        <TestConsumer onMount={(ctx) => { contextRef = ctx }} />
      </TestResultsProvider>
    )

    act(() => {
      contextRef.updateContrastSensitivity('left', { logCS: 1.5, level: 8, maxLevel: 10 })
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
      contextRef.updateContrastSensitivity('left', { logCS: 1.2, level: 7, maxLevel: 10 })
    })

    act(() => {
      contextRef.saveToHistory()
    })

    expect(screen.getByTestId('history-count')).toHaveTextContent('1')
    expect(contextRef.history[0].contrastSensitivity.left).toEqual({
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
      contextRef.updateVisualAcuity('left', { snellen: '20/20', level: 8 })
      contextRef.updateContrastSensitivity('right', { logCS: 1.5, level: 9, maxLevel: 10 })
    })

    act(() => {
      contextRef.saveToHistory()
    })

    expect(screen.getByTestId('history-count')).toHaveTextContent('1')
    expect(contextRef.history[0].visualAcuity.left).toBeDefined()
    expect(contextRef.history[0].contrastSensitivity.right).toEqual({
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

  it('updates Amsler grid results for left eye', () => {
    let contextRef
    
    render(
      <TestResultsProvider>
        <TestConsumer onMount={(ctx) => { contextRef = ctx }} />
      </TestResultsProvider>
    )

    act(() => {
      contextRef.updateAmslerGrid('left', { 
        hasIssues: false, 
        status: 'normal',
        answers: { missing: false, wavy: false, blurry: false, distorted: false }
      })
    })

    expect(screen.getByTestId('has-results')).toHaveTextContent('yes')
    expect(screen.getByTestId('amsler-grid')).toHaveTextContent('normal')
  })

  it('updates Amsler grid with concerns for right eye', () => {
    let contextRef
    
    render(
      <TestResultsProvider>
        <TestConsumer onMount={(ctx) => { contextRef = ctx }} />
      </TestResultsProvider>
    )

    act(() => {
      contextRef.updateAmslerGrid('right', { 
        hasIssues: true, 
        status: 'concerns_noted',
        answers: { missing: true, wavy: false, blurry: false, distorted: false }
      })
    })

    expect(screen.getByTestId('has-results')).toHaveTextContent('yes')
    expect(contextRef.results.amslerGrid.right.status).toBe('concerns_noted')
  })

  it('saves Amsler grid only session to history', () => {
    let contextRef
    
    render(
      <TestResultsProvider>
        <TestConsumer onMount={(ctx) => { contextRef = ctx }} />
      </TestResultsProvider>
    )

    // Only set amsler grid (no visual acuity, color vision, or contrast sensitivity)
    act(() => {
      contextRef.updateAmslerGrid('left', { 
        hasIssues: false, 
        status: 'normal',
        answers: { missing: false, wavy: false, blurry: false, distorted: false }
      })
    })

    act(() => {
      contextRef.saveToHistory()
    })

    expect(screen.getByTestId('history-count')).toHaveTextContent('1')
    expect(contextRef.history[0].amslerGrid.left).toEqual({
      hasIssues: false,
      status: 'normal'
    })
  })

  it('includes Amsler grid data in history session with other tests', () => {
    let contextRef
    
    render(
      <TestResultsProvider>
        <TestConsumer onMount={(ctx) => { contextRef = ctx }} />
      </TestResultsProvider>
    )

    act(() => {
      contextRef.updateVisualAcuity('left', { snellen: '20/20', level: 8 })
      contextRef.updateAmslerGrid('right', { 
        hasIssues: true, 
        status: 'concerns_noted',
        answers: { missing: true, wavy: true, blurry: false, distorted: false }
      })
    })

    act(() => {
      contextRef.saveToHistory()
    })

    expect(screen.getByTestId('history-count')).toHaveTextContent('1')
    expect(contextRef.history[0].visualAcuity.left).toBeDefined()
    expect(contextRef.history[0].amslerGrid.right).toEqual({
      hasIssues: true,
      status: 'concerns_noted'
    })
  })

  it('clears Amsler grid results', () => {
    let contextRef
    
    render(
      <TestResultsProvider>
        <TestConsumer onMount={(ctx) => { contextRef = ctx }} />
      </TestResultsProvider>
    )

    act(() => {
      contextRef.updateAmslerGrid('left', { 
        hasIssues: false, 
        status: 'normal',
        answers: { missing: false, wavy: false, blurry: false, distorted: false }
      })
    })

    expect(screen.getByTestId('has-results')).toHaveTextContent('yes')

    act(() => {
      contextRef.clearResults()
    })

    expect(screen.getByTestId('has-results')).toHaveTextContent('no')
    expect(screen.getByTestId('amsler-grid')).toHaveTextContent('none')
  })

  it('updates both eyes independently', () => {
    let contextRef
    
    render(
      <TestResultsProvider>
        <TestConsumer onMount={(ctx) => { contextRef = ctx }} />
      </TestResultsProvider>
    )

    act(() => {
      contextRef.updateVisualAcuity('left', { snellen: '20/20', level: 8 })
      contextRef.updateVisualAcuity('right', { snellen: '20/40', level: 5 })
    })

    expect(contextRef.results.visualAcuity.left.snellen).toBe('20/20')
    expect(contextRef.results.visualAcuity.right.snellen).toBe('20/40')
  })

  it('saves eye-photo-only session to history', () => {
    let contextRef
    
    render(
      <TestResultsProvider>
        <TestConsumer onMount={(ctx) => { contextRef = ctx }} />
      </TestResultsProvider>
    )

    // Only set eye photo (no other test results)
    act(() => {
      contextRef.updateEyePhoto({ 
        status: 'analyzed', 
        findings: ['mild redness'],
        confidence: 0.85,
        imageData: 'base64-image-data-should-be-excluded'
      })
    })

    act(() => {
      contextRef.saveToHistory()
    })

    expect(screen.getByTestId('history-count')).toHaveTextContent('1')
    expect(contextRef.history[0].eyePhoto).toEqual({
      status: 'analyzed',
      findings: ['mild redness'],
      confidence: 0.85
    })
    // Verify imageData is excluded
    expect(contextRef.history[0].eyePhoto.imageData).toBeUndefined()
  })

  it('includes eye photo data in history session with other tests', () => {
    let contextRef
    
    render(
      <TestResultsProvider>
        <TestConsumer onMount={(ctx) => { contextRef = ctx }} />
      </TestResultsProvider>
    )

    act(() => {
      contextRef.updateVisualAcuity('left', { snellen: '20/20', level: 8 })
      contextRef.updateEyePhoto({ 
        status: 'analyzed', 
        findings: [],
        confidence: 0.92
      })
    })

    act(() => {
      contextRef.saveToHistory()
    })

    expect(screen.getByTestId('history-count')).toHaveTextContent('1')
    expect(contextRef.history[0].visualAcuity.left).toBeDefined()
    expect(contextRef.history[0].eyePhoto).toEqual({
      status: 'analyzed',
      findings: [],
      confidence: 0.92
    })
  })
})
