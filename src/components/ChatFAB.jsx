import { useLocation } from 'react-router-dom'
import { useChat } from '../context/ChatContext'

// Routes where the FAB should be hidden (during active tests)
const HIDDEN_ROUTES = [
  '/visual-acuity',
  '/color-vision',
  '/contrast-sensitivity',
  '/amsler-grid',
  '/eye-photo'
]

export default function ChatFAB() {
  const { toggleChat, isOpen, messages } = useChat()
  const location = useLocation()

  // Hide FAB during active tests to avoid distraction
  const shouldHide = HIDDEN_ROUTES.some(route => location.pathname.startsWith(route))
  
  // Also hide when chat drawer is open
  if (shouldHide || isOpen) {
    return null
  }

  // Check for unread messages (has messages but chat was closed)
  const hasUnread = messages.length > 0 && messages[messages.length - 1].role === 'assistant'

  return (
    <button
      onClick={toggleChat}
      className={`
        fixed bottom-24 right-6 z-30
        w-14 h-14 rounded-full
        bg-sky-500 text-white
        shadow-lg hover:shadow-xl
        hover:bg-sky-600 active:bg-sky-700
        transition-all duration-200
        flex items-center justify-center
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500
      `}
      aria-label="Open AI chat assistant"
    >
      {/* Chat bubble icon */}
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
        />
      </svg>

      {/* Unread indicator */}
      {hasUnread && (
        <span 
          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"
          aria-label="New messages"
        />
      )}
    </button>
  )
}
