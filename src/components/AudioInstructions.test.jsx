import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AudioInstructions from './AudioInstructions'
import { TTSSettingsProvider } from '../context/TTSSettingsContext'

// Mock HTMLMediaElement methods
beforeEach(() => {
  // Mock Audio element methods
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
  window.HTMLMediaElement.prototype.pause = vi.fn()
  window.HTMLMediaElement.prototype.load = vi.fn()
  
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

function renderWithProvider(ui) {
  return render(
    <TTSSettingsProvider>
      {ui}
    </TTSSettingsProvider>
  )
}

describe('AudioInstructions', () => {
  it('should render with play button', () => {
    renderWithProvider(
      <AudioInstructions audioSrc="/audio/test.mp3" label="Test Audio" />
    )

    expect(screen.getByRole('button', { name: /play instructions/i })).toBeInTheDocument()
    expect(screen.getByText(/listen: test audio/i)).toBeInTheDocument()
  })

  it('should render with custom label', () => {
    renderWithProvider(
      <AudioInstructions audioSrc="/audio/test.mp3" label="Custom Label" />
    )

    expect(screen.getByText(/listen: custom label/i)).toBeInTheDocument()
  })

  it('should toggle to pause button when playing', async () => {
    const user = userEvent.setup()
    
    renderWithProvider(
      <AudioInstructions audioSrc="/audio/test.mp3" label="Test Audio" />
    )

    const playButton = screen.getByRole('button', { name: /play instructions/i })
    await user.click(playButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pause instructions/i })).toBeInTheDocument()
    })
  })

  it('should show settings button', () => {
    renderWithProvider(
      <AudioInstructions audioSrc="/audio/test.mp3" label="Test Audio" />
    )

    expect(screen.getByRole('button', { name: /audio settings/i })).toBeInTheDocument()
  })

  it('should open settings dropdown when settings button clicked', async () => {
    const user = userEvent.setup()
    
    renderWithProvider(
      <AudioInstructions audioSrc="/audio/test.mp3" label="Test Audio" />
    )

    const settingsButton = screen.getByRole('button', { name: /audio settings/i })
    await user.click(settingsButton)

    expect(screen.getByText(/auto-play audio/i)).toBeInTheDocument()
  })

  it('should auto-play when autoPlayEnabled is true', async () => {
    // Set autoPlayEnabled to true (default)
    localStorage.setItem('visioncheck-tts-settings', JSON.stringify({ autoPlayEnabled: true }))
    
    renderWithProvider(
      <AudioInstructions audioSrc="/audio/test.mp3" label="Test Audio" />
    )

    // Wait for auto-play to trigger
    await waitFor(() => {
      expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled()
    }, { timeout: 500 })
  })

  it('should not auto-play when autoPlayEnabled is false', async () => {
    // Set autoPlayEnabled to false
    localStorage.setItem('visioncheck-tts-settings', JSON.stringify({ autoPlayEnabled: false }))
    
    renderWithProvider(
      <AudioInstructions audioSrc="/audio/test.mp3" label="Test Audio" />
    )

    // Wait a bit to ensure auto-play would have triggered
    await new Promise(resolve => setTimeout(resolve, 500))
    
    expect(window.HTMLMediaElement.prototype.play).not.toHaveBeenCalled()
  })

  it('should toggle auto-play setting in dropdown', async () => {
    const user = userEvent.setup()
    
    renderWithProvider(
      <AudioInstructions audioSrc="/audio/test.mp3" label="Test Audio" />
    )

    // Open settings
    await user.click(screen.getByRole('button', { name: /audio settings/i }))
    
    // Find and click the toggle switch
    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    
    await user.click(toggle)
    
    expect(toggle).toHaveAttribute('aria-checked', 'false')
  })

  it('should render audio element with correct src', () => {
    renderWithProvider(
      <AudioInstructions audioSrc="/audio/custom-audio.mp3" label="Test" />
    )

    const audioElement = document.querySelector('audio')
    expect(audioElement).toHaveAttribute('src', '/audio/custom-audio.mp3')
  })
})
