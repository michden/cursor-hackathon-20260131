import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { sendChatMessage, checkApiHealth } from '../api/openai'
import { useTestResults } from './TestResultsContext'

const ChatContext = createContext(null)

export function ChatProvider({ children }) {
  const { i18n } = useTranslation()
  const [messages, setMessages] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [apiAvailable, setApiAvailable] = useState(null) // null = checking, true = available, false = unavailable
  
  // Get test results for context-aware responses
  const { results } = useTestResults()

  // Check API health on mount
  useEffect(() => {
    checkApiHealth().then(health => {
      setApiAvailable(health.status === 'ok' && health.apiKeyConfigured)
    })
  }, [])

  const openChat = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closeChat = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const sendMessage = useCallback(async (content) => {
    if (!content.trim()) return

    // Add user message
    const userMessage = { role: 'user', content: content.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setError(null)
    setIsLoading(true)

    try {
      const response = await sendChatMessage(newMessages, results, i18n.language)
      const assistantMessage = { role: 'assistant', content: response }
      setMessages(prev => [...prev, assistantMessage])
      // Mark API as available if call succeeds
      setApiAvailable(true)
    } catch (err) {
      console.error('Chat error:', err)
      setError(err.message || 'Failed to send message')
      // Remove the user message on error so they can retry
      setMessages(messages)
      // Check if API is unavailable
      if (err.message?.includes('API key not configured') || err.message?.includes('unavailable')) {
        setApiAvailable(false)
      }
    } finally {
      setIsLoading(false)
    }
  }, [messages, results, i18n.language])

  const value = {
    messages,
    isOpen,
    isLoading,
    error,
    apiAvailable,
    openChat,
    closeChat,
    toggleChat,
    sendMessage,
    clearMessages,
    clearError,
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}
