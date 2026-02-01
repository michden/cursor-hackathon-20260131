import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ChatFAB from './ChatFAB'
import { ChatProvider, useChat } from '../context/ChatContext'
import { TestResultsProvider } from '../context/TestResultsContext'
import { ConsentProvider } from '../context/ConsentContext'

// Mock the sendChatMessage API
vi.mock('../api/openai', () => ({
  sendChatMessage: vi.fn(),
  checkApiHealth: vi.fn().mockResolvedValue({ status: 'ok', apiKeyConfigured: true })
}))

function renderWithProviders(ui, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ConsentProvider>
        <TestResultsProvider>
          <ChatProvider>
            {ui}
          </ChatProvider>
        </TestResultsProvider>
      </ConsentProvider>
    </MemoryRouter>
  )
}

// Component to test FAB with chat state control
function ChatFABWithState() {
  const chat = useChat()

  return (
    <div>
      <span data-testid="chat-open">{chat.isOpen ? 'open' : 'closed'}</span>
      <ChatFAB />
    </div>
  )
}

describe('ChatFAB', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('visioncheck-consent', JSON.stringify({ hasConsented: true, consentGiven: true }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render on home page', () => {
    renderWithProviders(<ChatFAB />, { route: '/' })

    expect(screen.getByRole('button', { name: /open ai chat/i })).toBeInTheDocument()
  })

  it('should render on results page', () => {
    renderWithProviders(<ChatFAB />, { route: '/results' })

    expect(screen.getByRole('button', { name: /open ai chat/i })).toBeInTheDocument()
  })

  it('should NOT render on visual acuity test page', () => {
    renderWithProviders(<ChatFAB />, { route: '/visual-acuity' })

    expect(screen.queryByRole('button', { name: /open ai chat/i })).not.toBeInTheDocument()
  })

  it('should NOT render on color vision test page', () => {
    renderWithProviders(<ChatFAB />, { route: '/color-vision' })

    expect(screen.queryByRole('button', { name: /open ai chat/i })).not.toBeInTheDocument()
  })

  it('should NOT render on contrast sensitivity test page', () => {
    renderWithProviders(<ChatFAB />, { route: '/contrast-sensitivity' })

    expect(screen.queryByRole('button', { name: /open ai chat/i })).not.toBeInTheDocument()
  })

  it('should NOT render on amsler grid test page', () => {
    renderWithProviders(<ChatFAB />, { route: '/amsler-grid' })

    expect(screen.queryByRole('button', { name: /open ai chat/i })).not.toBeInTheDocument()
  })

  it('should NOT render on eye photo page', () => {
    renderWithProviders(<ChatFAB />, { route: '/eye-photo' })

    expect(screen.queryByRole('button', { name: /open ai chat/i })).not.toBeInTheDocument()
  })

  it('should toggle chat when clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ChatFABWithState />)

    expect(screen.getByTestId('chat-open')).toHaveTextContent('closed')

    await user.click(screen.getByRole('button', { name: /open ai chat/i }))

    expect(screen.getByTestId('chat-open')).toHaveTextContent('open')
  })

  it('should hide when chat is open', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ChatFABWithState />)

    const fabButton = screen.getByRole('button', { name: /open ai chat/i })
    await user.click(fabButton)

    // FAB should be hidden when chat is open
    expect(screen.queryByRole('button', { name: /open ai chat/i })).not.toBeInTheDocument()
  })

  it('should have proper accessibility attributes', () => {
    renderWithProviders(<ChatFAB />)

    const button = screen.getByRole('button', { name: /open ai chat/i })
    expect(button).toHaveAttribute('aria-label', 'Open AI chat assistant')
  })
})
