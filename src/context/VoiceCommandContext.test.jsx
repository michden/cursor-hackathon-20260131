import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VoiceCommandProvider, useVoiceCommandSettings } from './VoiceCommandContext'

// Test component that exposes the context values
function TestComponent() {
  const { voiceEnabled, toggleVoice, setVoiceEnabled, isSupported } = useVoiceCommandSettings()
  return (
    <div>
      <span data-testid="voice-enabled">{voiceEnabled ? 'enabled' : 'disabled'}</span>
      <span data-testid="is-supported">{isSupported ? 'supported' : 'not-supported'}</span>
      <button onClick={toggleVoice}>Toggle</button>
      <button onClick={() => setVoiceEnabled(true)}>Enable</button>
      <button onClick={() => setVoiceEnabled(false)}>Disable</button>
    </div>
  )
}

// Mock SpeechRecognition
class MockSpeechRecognition {}

describe('VoiceCommandContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete window.SpeechRecognition
    delete window.webkitSpeechRecognition
  })

  describe('provider', () => {
    it('should default to voice disabled', () => {
      render(
        <VoiceCommandProvider>
          <TestComponent />
        </VoiceCommandProvider>
      )

      expect(screen.getByTestId('voice-enabled')).toHaveTextContent('disabled')
    })

    it('should load voice enabled state from localStorage', () => {
      localStorage.setItem('visioncheck-voice-enabled', 'true')

      render(
        <VoiceCommandProvider>
          <TestComponent />
        </VoiceCommandProvider>
      )

      expect(screen.getByTestId('voice-enabled')).toHaveTextContent('enabled')
    })

    it('should detect browser support for SpeechRecognition', () => {
      window.SpeechRecognition = MockSpeechRecognition

      render(
        <VoiceCommandProvider>
          <TestComponent />
        </VoiceCommandProvider>
      )

      expect(screen.getByTestId('is-supported')).toHaveTextContent('supported')
    })

    it('should detect browser support for webkitSpeechRecognition', () => {
      window.webkitSpeechRecognition = MockSpeechRecognition

      render(
        <VoiceCommandProvider>
          <TestComponent />
        </VoiceCommandProvider>
      )

      expect(screen.getByTestId('is-supported')).toHaveTextContent('supported')
    })

    it('should detect when speech recognition is not supported', () => {
      // Neither API is defined
      render(
        <VoiceCommandProvider>
          <TestComponent />
        </VoiceCommandProvider>
      )

      expect(screen.getByTestId('is-supported')).toHaveTextContent('not-supported')
    })
  })

  describe('toggleVoice', () => {
    it('should toggle voice from disabled to enabled', async () => {
      const user = userEvent.setup()

      render(
        <VoiceCommandProvider>
          <TestComponent />
        </VoiceCommandProvider>
      )

      expect(screen.getByTestId('voice-enabled')).toHaveTextContent('disabled')

      await user.click(screen.getByText('Toggle'))

      expect(screen.getByTestId('voice-enabled')).toHaveTextContent('enabled')
    })

    it('should toggle voice from enabled to disabled', async () => {
      localStorage.setItem('visioncheck-voice-enabled', 'true')
      const user = userEvent.setup()

      render(
        <VoiceCommandProvider>
          <TestComponent />
        </VoiceCommandProvider>
      )

      expect(screen.getByTestId('voice-enabled')).toHaveTextContent('enabled')

      await user.click(screen.getByText('Toggle'))

      expect(screen.getByTestId('voice-enabled')).toHaveTextContent('disabled')
    })
  })

  describe('setVoiceEnabled', () => {
    it('should enable voice commands', async () => {
      const user = userEvent.setup()

      render(
        <VoiceCommandProvider>
          <TestComponent />
        </VoiceCommandProvider>
      )

      await user.click(screen.getByText('Enable'))

      expect(screen.getByTestId('voice-enabled')).toHaveTextContent('enabled')
    })

    it('should disable voice commands', async () => {
      localStorage.setItem('visioncheck-voice-enabled', 'true')
      const user = userEvent.setup()

      render(
        <VoiceCommandProvider>
          <TestComponent />
        </VoiceCommandProvider>
      )

      await user.click(screen.getByText('Disable'))

      expect(screen.getByTestId('voice-enabled')).toHaveTextContent('disabled')
    })
  })

  describe('persistence', () => {
    it('should persist voice enabled state to localStorage', async () => {
      const user = userEvent.setup()

      render(
        <VoiceCommandProvider>
          <TestComponent />
        </VoiceCommandProvider>
      )

      await user.click(screen.getByText('Toggle'))

      expect(localStorage.getItem('visioncheck-voice-enabled')).toBe('true')
    })

    it('should persist disabled state to localStorage', async () => {
      localStorage.setItem('visioncheck-voice-enabled', 'true')
      const user = userEvent.setup()

      render(
        <VoiceCommandProvider>
          <TestComponent />
        </VoiceCommandProvider>
      )

      await user.click(screen.getByText('Toggle'))

      expect(localStorage.getItem('visioncheck-voice-enabled')).toBe('false')
    })
  })

  describe('error handling', () => {
    it('should throw error when useVoiceCommandSettings is used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<TestComponent />)
      }).toThrow('useVoiceCommandSettings must be used within VoiceCommandProvider')

      consoleSpy.mockRestore()
    })
  })
})
