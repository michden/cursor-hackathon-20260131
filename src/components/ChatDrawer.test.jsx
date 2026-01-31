import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatDrawer from './ChatDrawer'
import { ChatProvider, useChat } from '../context/ChatContext'
import { TestResultsProvider } from '../context/TestResultsContext'

// Mock the sendChatMessage API
vi.mock('../api/openai', () => ({
  sendChatMessage: vi.fn()
}))

import { sendChatMessage } from '../api/openai'

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

// Simpler approach - test components directly with mocked context
function renderWithProviders(ui) {
  return render(
    <TestResultsProvider>
      <ChatProvider>
        {ui}
      </ChatProvider>
    </TestResultsProvider>
  )
}

// Component to control drawer state
function ChatDrawerController() {
  const { openChat, closeChat } = useChat()
  
  return (
    <div>
      <button onClick={openChat}>Open Drawer</button>
      <button onClick={closeChat}>Close Drawer</button>
      <ChatDrawer />
    </div>
  )
}

describe('ChatDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should not render when closed', () => {
    renderWithProviders(<ChatDrawer />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should render when opened', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ChatDrawerController />)

    await user.click(screen.getByText('Open Drawer'))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('AI Assistant')).toBeInTheDocument()
  })

  it('should show API key input when no key is set', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ChatDrawerController />)

    await user.click(screen.getByText('Open Drawer'))

    expect(screen.getByPlaceholderText('sk-...')).toBeInTheDocument()
    expect(screen.getByText(/Your key is only used locally/)).toBeInTheDocument()
  })

  it('should show welcome message when no messages', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ChatDrawerController />)

    await user.click(screen.getByText('Open Drawer'))

    expect(screen.getByText('VisionCheck AI Assistant')).toBeInTheDocument()
    expect(screen.getByText(/Ask me about your test results/)).toBeInTheDocument()
  })

  it('should close when close button is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ChatDrawerController />)

    await user.click(screen.getByText('Open Drawer'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Close chat'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should close when Escape key is pressed', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ChatDrawerController />)

    await user.click(screen.getByText('Open Drawer'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should disable send button when no API key', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ChatDrawerController />)

    await user.click(screen.getByText('Open Drawer'))

    const sendButton = screen.getByLabelText('Send message')
    expect(sendButton).toBeDisabled()
  })

  it('should save API key when submitted', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ChatDrawerController />)

    await user.click(screen.getByText('Open Drawer'))

    const keyInput = screen.getByPlaceholderText('sk-...')
    await user.type(keyInput, 'sk-test123')
    await user.click(screen.getByText('Save'))

    // API key input should be hidden after saving
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('sk-...')).not.toBeInTheDocument()
    })
  })

  it('should send message when form is submitted', async () => {
    const user = userEvent.setup()
    sendChatMessage.mockResolvedValueOnce('Hello! I can help with that.')
    
    renderWithProviders(<ChatDrawerController />)

    await user.click(screen.getByText('Open Drawer'))

    // Set API key
    await user.type(screen.getByPlaceholderText('sk-...'), 'sk-test')
    await user.click(screen.getByText('Save'))

    // Type and send message
    const input = screen.getByPlaceholderText('Ask about your eye health...')
    await user.type(input, 'What is visual acuity?')
    await user.click(screen.getByLabelText('Send message'))

    // Should show user message
    await waitFor(() => {
      expect(screen.getByText('What is visual acuity?')).toBeInTheDocument()
    })

    // Should show loading indicator briefly, then response
    await waitFor(() => {
      expect(screen.getByText('Hello! I can help with that.')).toBeInTheDocument()
    })
  })

  it('should show disclaimer at bottom', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ChatDrawerController />)

    await user.click(screen.getByText('Open Drawer'))

    expect(screen.getByText(/AI responses are for educational purposes only/)).toBeInTheDocument()
  })

  it('should clear messages when clear button is clicked', async () => {
    const user = userEvent.setup()
    sendChatMessage.mockResolvedValueOnce('Response')
    
    renderWithProviders(<ChatDrawerController />)

    await user.click(screen.getByText('Open Drawer'))

    // Set key and send message
    await user.type(screen.getByPlaceholderText('sk-...'), 'sk-test')
    await user.click(screen.getByText('Save'))
    
    const input = screen.getByPlaceholderText('Ask about your eye health...')
    await user.type(input, 'Hello')
    await user.click(screen.getByLabelText('Send message'))

    await waitFor(() => {
      expect(screen.getByText('Response')).toBeInTheDocument()
    })

    // Clear messages
    await user.click(screen.getByLabelText('Clear chat'))

    // Should show welcome message again
    expect(screen.getByText('VisionCheck AI Assistant')).toBeInTheDocument()
  })
})
