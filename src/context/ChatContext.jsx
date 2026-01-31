import { createContext, useContext, useState, useCallback } from 'react'
import { sendChatMessage } from '../api/openai'
import { useTestResults } from './TestResultsContext'

const ChatContext = createContext(null)

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Get test results for context-aware responses
  const { results } = useTestResults()

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
    if (!apiKey) {
      setError('Please enter your OpenAI API key')
      return
    }

    // Add user message
    const userMessage = { role: 'user', content: content.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setError(null)
    setIsLoading(true)

    try {
      const response = await sendChatMessage(newMessages, results, apiKey)
      const assistantMessage = { role: 'assistant', content: response }
      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      console.error('Chat error:', err)
      setError(err.message || 'Failed to send message')
      // Remove the user message on error so they can retry
      setMessages(messages)
    } finally {
      setIsLoading(false)
    }
  }, [messages, apiKey, results])

  const value = {
    messages,
    isOpen,
    apiKey,
    isLoading,
    error,
    setApiKey,
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
