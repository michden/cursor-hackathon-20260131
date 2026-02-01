import { useState, useEffect, useCallback, useRef } from 'react'

const COMMANDS = {
  'left': 'left',
  'right': 'right',
  'up': 'up',
  'down': 'down',
  'yes': 'yes',
  'no': 'no',
  'next': 'next',
  'back': 'back',
  'start': 'start',
  'stop': 'stop',
  "can't see": 'cantSee',
  'cannot see': 'cantSee',
}

/**
 * useVoiceCommands - Hook for voice command recognition
 * 
 * Uses the Web Speech API to listen for voice commands.
 * Supports commands like "left", "right", "up", "down", "yes", "no", etc.
 * 
 * @param {Object} options - Configuration options
 * @param {Function} options.onCommand - Callback when a command is recognized
 * @param {boolean} options.enabled - Whether voice commands are enabled
 * @param {string} options.language - Language for speech recognition (default: 'en-US')
 * @returns {Object} - { isListening, isSupported, transcript, startListening, stopListening }
 */
export function useVoiceCommands({ onCommand, enabled = true, language = 'en-US' }) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef(null)
  const onCommandRef = useRef(onCommand)
  const shouldListenRef = useRef(false)

  // Keep onCommand ref updated
  useEffect(() => {
    onCommandRef.current = onCommand
  }, [onCommand])

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    setIsSupported(!!SpeechRecognition)

    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = language

    recognition.onresult = (event) => {
      const last = event.results[event.results.length - 1]
      if (last.isFinal) {
        const text = last[0].transcript.toLowerCase().trim()
        setTranscript(text)

        // Sort by phrase length (longest first) to match specific phrases before substrings
        // e.g., "cannot see" should match before "no" (which is a substring of "cannot")
        const sortedEntries = Object.entries(COMMANDS).sort((a, b) => b[0].length - a[0].length)
        for (const [phrase, command] of sortedEntries) {
          if (text.includes(phrase)) {
            onCommandRef.current?.(command)
            break
          }
        }
      }
    }

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        console.error('Speech recognition error:', event.error)
      }
      // Auto-restart on certain errors if still supposed to be listening
      if (event.error === 'aborted' || event.error === 'network') {
        setIsListening(false)
      }
    }

    recognition.onend = () => {
      // Only restart if this recognition instance is still the current one
      // This prevents zombie listeners when the effect re-runs and creates
      // a new recognition instance before the old one's onend fires
      if (recognitionRef.current === recognition && shouldListenRef.current) {
        try {
          recognition.start()
        } catch {
          // Ignore errors from trying to restart
        }
      }
    }

    recognitionRef.current = recognition

    return () => {
      shouldListenRef.current = false
      recognition.stop()
      recognitionRef.current = null
    }
  }, [language, enabled])

  const startListening = useCallback(() => {
    if (recognitionRef.current && enabled) {
      try {
        shouldListenRef.current = true
        recognitionRef.current.start()
        setIsListening(true)
      } catch {
        // Already started - ignore
      }
    }
  }, [enabled])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      shouldListenRef.current = false
      setIsListening(false)
      recognitionRef.current.stop()
    }
  }, [])

  // Auto-stop when disabled
  useEffect(() => {
    if (!enabled && isListening) {
      stopListening()
    }
  }, [enabled, isListening, stopListening])

  return { isListening, isSupported, transcript, startListening, stopListening }
}

export { COMMANDS }
