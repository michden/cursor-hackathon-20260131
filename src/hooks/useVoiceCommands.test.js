import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useVoiceCommands, COMMANDS } from './useVoiceCommands'

// Track instances globally
let mockInstances = []

// Mock SpeechRecognition
class MockSpeechRecognition {
  constructor() {
    this.continuous = false
    this.interimResults = false
    this.lang = ''
    this.onresult = null
    this.onerror = null
    this.onend = null
    // Track this instance when constructed
    mockInstances.push(this)
  }

  start() {
    // no-op
  }

  stop() {
    // no-op
  }
}

describe('useVoiceCommands', () => {
  beforeEach(() => {
    mockInstances = []
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete window.SpeechRecognition
    delete window.webkitSpeechRecognition
  })

  describe('browser support detection', () => {
    it('should detect when SpeechRecognition is supported', () => {
      window.SpeechRecognition = MockSpeechRecognition

      const { result } = renderHook(() =>
        useVoiceCommands({ onCommand: vi.fn(), enabled: true })
      )

      expect(result.current.isSupported).toBe(true)
    })

    it('should detect when webkitSpeechRecognition is supported', () => {
      window.webkitSpeechRecognition = MockSpeechRecognition

      const { result } = renderHook(() =>
        useVoiceCommands({ onCommand: vi.fn(), enabled: true })
      )

      expect(result.current.isSupported).toBe(true)
    })

    it('should detect when SpeechRecognition is not supported', () => {
      // Neither API is defined
      const { result } = renderHook(() =>
        useVoiceCommands({ onCommand: vi.fn(), enabled: true })
      )

      expect(result.current.isSupported).toBe(false)
    })
  })

  describe('listening state', () => {
    beforeEach(() => {
      window.SpeechRecognition = MockSpeechRecognition
    })

    it('should not be listening initially', () => {
      const { result } = renderHook(() =>
        useVoiceCommands({ onCommand: vi.fn(), enabled: true })
      )

      expect(result.current.isListening).toBe(false)
    })

    it('should start listening when startListening is called', () => {
      const { result } = renderHook(() =>
        useVoiceCommands({ onCommand: vi.fn(), enabled: true })
      )

      act(() => {
        result.current.startListening()
      })

      expect(result.current.isListening).toBe(true)
    })

    it('should stop listening when stopListening is called', () => {
      const { result } = renderHook(() =>
        useVoiceCommands({ onCommand: vi.fn(), enabled: true })
      )

      act(() => {
        result.current.startListening()
      })

      expect(result.current.isListening).toBe(true)

      act(() => {
        result.current.stopListening()
      })

      expect(result.current.isListening).toBe(false)
    })

    it('should not start listening when disabled', () => {
      const { result } = renderHook(() =>
        useVoiceCommands({ onCommand: vi.fn(), enabled: false })
      )

      act(() => {
        result.current.startListening()
      })

      expect(result.current.isListening).toBe(false)
    })
  })

  describe('command matching', () => {
    it('should have expected command mappings', () => {
      expect(COMMANDS['left']).toBe('left')
      expect(COMMANDS['right']).toBe('right')
      expect(COMMANDS['up']).toBe('up')
      expect(COMMANDS['down']).toBe('down')
      expect(COMMANDS['yes']).toBe('yes')
      expect(COMMANDS['no']).toBe('no')
      expect(COMMANDS['next']).toBe('next')
      expect(COMMANDS['back']).toBe('back')
      expect(COMMANDS['start']).toBe('start')
      expect(COMMANDS['stop']).toBe('stop')
      expect(COMMANDS["can't see"]).toBe('cantSee')
      expect(COMMANDS['cannot see']).toBe('cantSee')
    })

    it('should call onCommand when a matching phrase is recognized', () => {
      window.SpeechRecognition = MockSpeechRecognition
      const onCommand = vi.fn()

      renderHook(() =>
        useVoiceCommands({ onCommand, enabled: true })
      )

      // Simulate speech recognition result
      const instance = mockInstances[0]
      expect(instance).toBeDefined()

      act(() => {
        instance.onresult({
          results: [
            {
              isFinal: true,
              0: { transcript: 'left' },
              length: 1,
            },
          ],
        })
      })

      expect(onCommand).toHaveBeenCalledWith('left')
    })

    it('should match commands case-insensitively', () => {
      window.SpeechRecognition = MockSpeechRecognition
      const onCommand = vi.fn()

      renderHook(() =>
        useVoiceCommands({ onCommand, enabled: true })
      )

      const instance = mockInstances[0]

      act(() => {
        instance.onresult({
          results: [
            {
              isFinal: true,
              0: { transcript: 'LEFT' },
              length: 1,
            },
          ],
        })
      })

      expect(onCommand).toHaveBeenCalledWith('left')
    })

    it('should match commands within longer phrases', () => {
      window.SpeechRecognition = MockSpeechRecognition
      const onCommand = vi.fn()

      renderHook(() =>
        useVoiceCommands({ onCommand, enabled: true })
      )

      const instance = mockInstances[0]

      act(() => {
        instance.onresult({
          results: [
            {
              isFinal: true,
              0: { transcript: 'go right please' },
              length: 1,
            },
          ],
        })
      })

      expect(onCommand).toHaveBeenCalledWith('right')
    })

    it('should update transcript when speech is recognized', () => {
      window.SpeechRecognition = MockSpeechRecognition
      const onCommand = vi.fn()

      const { result } = renderHook(() =>
        useVoiceCommands({ onCommand, enabled: true })
      )

      const instance = mockInstances[0]

      act(() => {
        instance.onresult({
          results: [
            {
              isFinal: true,
              0: { transcript: 'up' },
              length: 1,
            },
          ],
        })
      })

      expect(result.current.transcript).toBe('up')
    })

    it('should match longer phrases before shorter substrings (cannot see vs no)', () => {
      window.SpeechRecognition = MockSpeechRecognition
      const onCommand = vi.fn()

      renderHook(() =>
        useVoiceCommands({ onCommand, enabled: true })
      )

      const instance = mockInstances[0]

      act(() => {
        instance.onresult({
          results: [
            {
              isFinal: true,
              0: { transcript: 'cannot see' },
              length: 1,
            },
          ],
        })
      })

      // Should match "cannot see" -> cantSee, NOT "no" (which is a substring of "cannot")
      expect(onCommand).toHaveBeenCalledWith('cantSee')
      expect(onCommand).not.toHaveBeenCalledWith('no')
    })

    it('should match longer phrases before shorter substrings (can\'t see vs no)', () => {
      window.SpeechRecognition = MockSpeechRecognition
      const onCommand = vi.fn()

      renderHook(() =>
        useVoiceCommands({ onCommand, enabled: true })
      )

      const instance = mockInstances[0]

      act(() => {
        instance.onresult({
          results: [
            {
              isFinal: true,
              0: { transcript: "I can't see it" },
              length: 1,
            },
          ],
        })
      })

      // Should match "can't see" -> cantSee
      expect(onCommand).toHaveBeenCalledWith('cantSee')
    })

    it('should still match "no" when said alone', () => {
      window.SpeechRecognition = MockSpeechRecognition
      const onCommand = vi.fn()

      renderHook(() =>
        useVoiceCommands({ onCommand, enabled: true })
      )

      const instance = mockInstances[0]

      act(() => {
        instance.onresult({
          results: [
            {
              isFinal: true,
              0: { transcript: 'no' },
              length: 1,
            },
          ],
        })
      })

      expect(onCommand).toHaveBeenCalledWith('no')
    })
  })

  describe('error handling', () => {
    beforeEach(() => {
      window.SpeechRecognition = MockSpeechRecognition
    })

    it('should handle speech recognition errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      window.SpeechRecognition = MockSpeechRecognition
      const onCommand = vi.fn()

      renderHook(() =>
        useVoiceCommands({ onCommand, enabled: true })
      )

      const instance = mockInstances[0]

      // Should not throw
      act(() => {
        instance.onerror({ error: 'network' })
      })

      expect(consoleSpy).toHaveBeenCalledWith('Speech recognition error:', 'network')
      consoleSpy.mockRestore()
    })

    it('should not log no-speech errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      window.SpeechRecognition = MockSpeechRecognition
      const onCommand = vi.fn()

      renderHook(() =>
        useVoiceCommands({ onCommand, enabled: true })
      )

      const instance = mockInstances[0]

      act(() => {
        instance.onerror({ error: 'no-speech' })
      })

      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should set isListening to false on not-allowed error (permission denied)', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const onCommand = vi.fn()

      const { result } = renderHook(() =>
        useVoiceCommands({ onCommand, enabled: true })
      )

      const instance = mockInstances[0]

      // Start listening first
      act(() => {
        result.current.startListening()
      })

      expect(result.current.isListening).toBe(true)

      // Simulate permission denied error
      act(() => {
        instance.onerror({ error: 'not-allowed' })
      })

      expect(result.current.isListening).toBe(false)
      consoleSpy.mockRestore()
    })

    it('should set isListening to false on audio-capture error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const onCommand = vi.fn()

      const { result } = renderHook(() =>
        useVoiceCommands({ onCommand, enabled: true })
      )

      const instance = mockInstances[0]

      act(() => {
        result.current.startListening()
      })

      expect(result.current.isListening).toBe(true)

      act(() => {
        instance.onerror({ error: 'audio-capture' })
      })

      expect(result.current.isListening).toBe(false)
      consoleSpy.mockRestore()
    })

    it('should set isListening to false on service-not-allowed error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const onCommand = vi.fn()

      const { result } = renderHook(() =>
        useVoiceCommands({ onCommand, enabled: true })
      )

      const instance = mockInstances[0]

      act(() => {
        result.current.startListening()
      })

      expect(result.current.isListening).toBe(true)

      act(() => {
        instance.onerror({ error: 'service-not-allowed' })
      })

      expect(result.current.isListening).toBe(false)
      consoleSpy.mockRestore()
    })

    it('should not auto-restart after fatal errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const onCommand = vi.fn()

      const { result } = renderHook(() =>
        useVoiceCommands({ onCommand, enabled: true })
      )

      const instance = mockInstances[0]
      const startSpy = vi.spyOn(instance, 'start')

      act(() => {
        result.current.startListening()
      })

      // Clear the call from startListening
      startSpy.mockClear()

      // Simulate permission denied error
      act(() => {
        instance.onerror({ error: 'not-allowed' })
      })

      // Simulate onend being called after error
      act(() => {
        instance.onend()
      })

      // Should NOT have tried to restart
      expect(startSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })
})
