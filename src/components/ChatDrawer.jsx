import { useState, useRef, useEffect, useCallback } from 'react'
import { useChat } from '../context/ChatContext'

function ApiKeyInput() {
  const { apiKey, setApiKey } = useChat()
  const [showKey, setShowKey] = useState(false)
  const [localKey, setLocalKey] = useState(apiKey)

  const handleSubmit = (e) => {
    e.preventDefault()
    setApiKey(localKey)
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-b border-slate-200 bg-slate-50">
      <label className="block text-sm font-medium text-slate-700 mb-2">
        OpenAI API Key
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={showKey ? 'text' : 'password'}
            value={localKey}
            onChange={(e) => setLocalKey(e.target.value)}
            placeholder="sk-..."
            className="w-full px-3 py-2 pr-16 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
          >
            {showKey ? 'Hide' : 'Show'}
          </button>
        </div>
        <button
          type="submit"
          disabled={!localKey.trim()}
          className="px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
        >
          Save
        </button>
      </div>
      <p className="text-xs text-slate-500 mt-2">
        Your key is only used locally and never stored on any server.
      </p>
    </form>
  )
}

function ChatMessage({ message }) {
  const isUser = message.role === 'user'
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`
          max-w-[85%] px-4 py-2 rounded-2xl text-sm
          ${isUser 
            ? 'bg-sky-500 text-white rounded-br-md' 
            : 'bg-slate-100 text-slate-800 rounded-bl-md'
          }
        `}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  )
}

function MessageList() {
  const { messages, isLoading } = useChat()
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div>
          <div className="text-4xl mb-3">👁️</div>
          <h3 className="font-medium text-slate-700 mb-1">VisionCheck AI Assistant</h3>
          <p className="text-sm text-slate-500 max-w-xs">
            Ask me about your test results, eye health, or general vision questions.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((message, index) => (
        <ChatMessage key={index} message={message} />
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-slate-100 px-4 py-2 rounded-2xl rounded-bl-md">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  )
}

function ChatInput() {
  const { sendMessage, isLoading, apiKey } = useChat()
  const [input, setInput] = useState('')
  const inputRef = useRef(null)

  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage(input)
    setInput('')
  }, [input, isLoading, sendMessage])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }, [handleSubmit])

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200 bg-white">
      <div className="flex gap-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={apiKey ? "Ask about your eye health..." : "Enter API key above to chat"}
          disabled={!apiKey || isLoading}
          rows={1}
          className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading || !apiKey}
          className="px-4 py-2 bg-sky-500 text-white rounded-xl hover:bg-sky-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          aria-label="Send message"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </form>
  )
}

export default function ChatDrawer() {
  const { isOpen, closeChat, error, clearError, clearMessages, apiKey } = useChat()

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        closeChat()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, closeChat])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop - only on mobile */}
      <div 
        className="fixed inset-0 bg-black/40 z-40 sm:hidden animate-fade-in"
        onClick={closeChat}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <div
        role="dialog"
        aria-label="Chat with VisionCheck AI"
        className={`
          fixed z-50 bg-white flex flex-col shadow-2xl
          
          /* Mobile: full screen overlay */
          inset-0 animate-slide-up
          
          /* Desktop: right side panel */
          sm:inset-auto sm:top-0 sm:right-0 sm:bottom-0 sm:w-[400px]
          sm:animate-slide-in-right sm:border-l sm:border-slate-200
        `}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <h2 className="font-semibold text-slate-800">AI Assistant</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearMessages}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Clear chat"
              title="Clear chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button
              onClick={closeChat}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Close chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        {/* API Key Input - only show if no key set */}
        {!apiKey && <ApiKeyInput />}

        {/* Error banner */}
        {error && (
          <div className="px-4 py-2 bg-red-50 border-b border-red-200 flex items-center justify-between">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-600"
              aria-label="Dismiss error"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Messages */}
        <MessageList />

        {/* Input */}
        <ChatInput />

        {/* Disclaimer */}
        <div className="px-4 py-2 bg-amber-50 border-t border-amber-200">
          <p className="text-xs text-amber-700 text-center">
            AI responses are for educational purposes only, not medical advice.
          </p>
        </div>
      </div>
    </>
  )
}
