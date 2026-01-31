import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatProvider, useChat } from './ChatContext'
import { TestResultsProvider } from './TestResultsContext'

// Mock the sendChatMessage API
vi.mock('../api/openai', () => ({
  sendChatMessage: vi.fn()
}))

import { sendChatMessage } from '../api/openai'

// Test component that exposes the context values
function TestComponent() {
  const {
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
    clearError
  } = useChat()

  return (
    <div>
      <span data-testid="is-open">{isOpen ? 'open' : 'closed'}</span>
      <span data-testid="api-key">{apiKey || 'no-key'}</span>
      <span data-testid="is-loading">{isLoading ? 'loading' : 'idle'}</span>
      <span data-testid="error">{error || 'no-error'}</span>
      <span data-testid="message-count">{messages.length}</span>
      <ul data-testid="messages">
        {messages.map((msg, i) => (
          <li key={i} data-testid={`message-${i}`}>
            {msg.role}: {msg.content}
          </li>
        ))}
      </ul>
      <button onClick={openChat}>Open</button>
      <button onClick={closeChat}>Close</button>
      <button onClick={toggleChat}>Toggle</button>
      <button onClick={() => setApiKey('test-key')}>Set Key</button>
      <button onClick={() => sendMessage('Hello')}>Send</button>
      <button onClick={clearMessages}>Clear</button>
      <button onClick={clearError}>Clear Error</button>
    </div>
  )
}

function renderWithProviders(ui) {
  return render(
    <TestResultsProvider>
      <ChatProvider>
        {ui}
      </ChatProvider>
    </TestResultsProvider>
  )
}

describe('ChatContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should provide default values', () => {
    renderWithProviders(<TestComponent />)

    expect(screen.getByTestId('is-open')).toHaveTextContent('closed')
    expect(screen.getByTestId('api-key')).toHaveTextContent('no-key')
    expect(screen.getByTestId('is-loading')).toHaveTextContent('idle')
    expect(screen.getByTestId('error')).toHaveTextContent('no-error')
    expect(screen.getByTestId('message-count')).toHaveTextContent('0')
  })

  it('should open and close chat', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TestComponent />)

    expect(screen.getByTestId('is-open')).toHaveTextContent('closed')

    await user.click(screen.getByText('Open'))
    expect(screen.getByTestId('is-open')).toHaveTextContent('open')

    await user.click(screen.getByText('Close'))
    expect(screen.getByTestId('is-open')).toHaveTextContent('closed')
  })

  it('should toggle chat', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TestComponent />)

    expect(screen.getByTestId('is-open')).toHaveTextContent('closed')

    await user.click(screen.getByText('Toggle'))
    expect(screen.getByTestId('is-open')).toHaveTextContent('open')

    await user.click(screen.getByText('Toggle'))
    expect(screen.getByTestId('is-open')).toHaveTextContent('closed')
  })

  it('should set API key', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TestComponent />)

    expect(screen.getByTestId('api-key')).toHaveTextContent('no-key')

    await user.click(screen.getByText('Set Key'))
    expect(screen.getByTestId('api-key')).toHaveTextContent('test-key')
  })

  it('should show error when sending without API key', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TestComponent />)

    await user.click(screen.getByText('Send'))

    expect(screen.getByTestId('error')).toHaveTextContent('Please enter your OpenAI API key')
  })

  it('should send message and receive response', async () => {
    const user = userEvent.setup()
    sendChatMessage.mockResolvedValueOnce('Hello! How can I help?')

    renderWithProviders(<TestComponent />)

    // Set API key first
    await user.click(screen.getByText('Set Key'))

    // Send message
    await user.click(screen.getByText('Send'))

    // Wait for response (loading state may be too fast to catch reliably)
    await waitFor(() => {
      expect(screen.getByTestId('is-loading')).toHaveTextContent('idle')
    })

    // Should have 2 messages (user + assistant)
    expect(screen.getByTestId('message-count')).toHaveTextContent('2')
    expect(screen.getByTestId('message-0')).toHaveTextContent('user: Hello')
    expect(screen.getByTestId('message-1')).toHaveTextContent('assistant: Hello! How can I help?')
  })

  it('should handle API error', async () => {
    const user = userEvent.setup()
    sendChatMessage.mockRejectedValueOnce(new Error('API rate limit exceeded'))

    renderWithProviders(<TestComponent />)

    await user.click(screen.getByText('Set Key'))
    await user.click(screen.getByText('Send'))

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('API rate limit exceeded')
    })

    // Message should be removed on error
    expect(screen.getByTestId('message-count')).toHaveTextContent('0')
  })

  it('should clear messages', async () => {
    const user = userEvent.setup()
    sendChatMessage.mockResolvedValueOnce('Response')

    renderWithProviders(<TestComponent />)

    await user.click(screen.getByText('Set Key'))
    await user.click(screen.getByText('Send'))

    await waitFor(() => {
      expect(screen.getByTestId('message-count')).toHaveTextContent('2')
    })

    await user.click(screen.getByText('Clear'))
    expect(screen.getByTestId('message-count')).toHaveTextContent('0')
  })

  it('should clear error', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TestComponent />)

    // Trigger error
    await user.click(screen.getByText('Send'))
    expect(screen.getByTestId('error')).toHaveTextContent('Please enter your OpenAI API key')

    // Clear error
    await user.click(screen.getByText('Clear Error'))
    expect(screen.getByTestId('error')).toHaveTextContent('no-error')
  })

  it('should throw error when useChat is used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useChat must be used within a ChatProvider')

    consoleSpy.mockRestore()
  })
})
