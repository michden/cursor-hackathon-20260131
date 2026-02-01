import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import ChatDrawer from './ChatDrawer'
import { ChatProvider, useChat } from '../context/ChatContext'
import { TestResultsProvider } from '../context/TestResultsContext'
import { ConsentProvider } from '../context/ConsentContext'
import i18n from '../i18n'

// Mock the API functions
vi.mock('../api/openai', () => ({
  sendChatMessage: vi.fn(),
  checkApiHealth: vi.fn().mockResolvedValue({ status: 'ok', apiKeyConfigured: true })
}))

import { sendChatMessage, checkApiHealth } from '../api/openai'

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

function renderWithProviders(ui) {
  return render(
    <I18nextProvider i18n={i18n}>
      <ConsentProvider>
        <TestResultsProvider>
          <ChatProvider>
            {ui}
          </ChatProvider>
        </TestResultsProvider>
      </ConsentProvider>
    </I18nextProvider>
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
    localStorage.setItem('visioncheck-consent', JSON.stringify({ hasConsented: true, consentGiven: true }))
    i18n.changeLanguage('en')
    checkApiHealth.mockResolvedValue({ status: 'ok', apiKeyConfigured: true })
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

  it('should show API unavailable notice when API not configured', async () => {
    const user = userEvent.setup()
    checkApiHealth.mockResolvedValue({ status: 'ok', apiKeyConfigured: false })
    
    renderWithProviders(<ChatDrawerController />)

    await user.click(screen.getByText('Open Drawer'))

    await waitFor(() => {
      expect(screen.getByText(/AI chat is currently unavailable/i)).toBeInTheDocument()
    })
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

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should show disclaimer at bottom', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ChatDrawerController />)

    await user.click(screen.getByText('Open Drawer'))

    expect(screen.getByText(/AI responses are for educational purposes only/)).toBeInTheDocument()
  })

  it('should clear messages when clear button is clicked', async () => {
    const user = userEvent.setup()
    sendChatMessage.mockResolvedValueOnce('Hello!')
    
    renderWithProviders(<ChatDrawerController />)

    await user.click(screen.getByText('Open Drawer'))

    // Wait for API to be ready
    await waitFor(() => {
      expect(checkApiHealth).toHaveBeenCalled()
    })

    // Type and send a message
    const input = screen.getByPlaceholderText(/Ask about your eye health/i)
    await user.type(input, 'Test message')
    await user.click(screen.getByLabelText('Send message'))

    // Wait for response
    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument()
    })

    // Clear messages
    await user.click(screen.getByLabelText('Clear chat'))

    // Should show welcome message again
    expect(screen.getByText('VisionCheck AI Assistant')).toBeInTheDocument()
  })
})
