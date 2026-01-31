import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import Onboarding from './Onboarding'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('Onboarding', () => {
  const mockOnComplete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // Helper to navigate through steps
  const goToStep = async (stepCount) => {
    for (let i = 0; i < stepCount; i++) {
      fireEvent.click(screen.getByText('Next'))
      await act(async () => {
        vi.advanceTimersByTime(250)
      })
    }
  }

  describe('Initial render', () => {
    it('renders the welcome step first', () => {
      render(<Onboarding onComplete={mockOnComplete} />)
      
      expect(screen.getByText('Welcome to VisionCheck AI')).toBeInTheDocument()
      expect(screen.getByText('A quick way to screen your eye health from your phone.')).toBeInTheDocument()
    })

    it('renders the welcome icon', () => {
      render(<Onboarding onComplete={mockOnComplete} />)
      
      expect(screen.getByText('👁️')).toBeInTheDocument()
    })

    it('renders Skip button', () => {
      render(<Onboarding onComplete={mockOnComplete} />)
      
      expect(screen.getByText('Skip')).toBeInTheDocument()
    })

    it('renders Next button on first step', () => {
      render(<Onboarding onComplete={mockOnComplete} />)
      
      expect(screen.getByText('Next')).toBeInTheDocument()
    })

    it('renders progress dots for all steps', () => {
      const { container } = render(<Onboarding onComplete={mockOnComplete} />)
      
      // 6 steps = 6 progress dots
      const dots = container.querySelectorAll('.rounded-full')
      expect(dots.length).toBe(6)
    })

    it('highlights the first progress dot', () => {
      const { container } = render(<Onboarding onComplete={mockOnComplete} />)
      
      const dots = container.querySelectorAll('.rounded-full')
      expect(dots[0].className).toContain('bg-white')
      expect(dots[0].className).toContain('w-6')
    })
  })

  describe('Step navigation', () => {
    it('advances to next step when Next is clicked', async () => {
      render(<Onboarding onComplete={mockOnComplete} />)
      
      await goToStep(1)
      
      expect(screen.getByText('Visual Acuity Test')).toBeInTheDocument()
    })

    it('progresses through all steps', async () => {
      render(<Onboarding onComplete={mockOnComplete} />)
      
      // Step 1: Welcome -> Visual Acuity
      await goToStep(1)
      expect(screen.getByText('Visual Acuity Test')).toBeInTheDocument()

      // Step 2: Visual Acuity -> Color Vision
      await goToStep(1)
      expect(screen.getByText('Color Vision Test')).toBeInTheDocument()

      // Step 3: Color Vision -> Contrast Sensitivity
      await goToStep(1)
      expect(screen.getByText('Contrast Sensitivity')).toBeInTheDocument()

      // Step 4: Contrast Sensitivity -> Amsler Grid
      await goToStep(1)
      expect(screen.getByText('Amsler Grid Test')).toBeInTheDocument()

      // Step 5: Amsler Grid -> Disclaimer
      await goToStep(1)
      expect(screen.getByText('Important Note')).toBeInTheDocument()
    })

    it('shows Get Started button on last step', async () => {
      render(<Onboarding onComplete={mockOnComplete} />)
      
      // Navigate to last step (5 clicks)
      await goToStep(5)
      
      expect(screen.getByText('Get Started')).toBeInTheDocument()
    })
  })

  describe('Skip functionality', () => {
    it('calls onComplete when Skip is clicked', () => {
      render(<Onboarding onComplete={mockOnComplete} />)
      
      fireEvent.click(screen.getByText('Skip'))
      
      expect(mockOnComplete).toHaveBeenCalled()
    })

    it('sets localStorage when Skip is clicked', () => {
      render(<Onboarding onComplete={mockOnComplete} />)
      
      fireEvent.click(screen.getByText('Skip'))
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('visioncheck-onboarded', 'true')
    })
  })

  describe('Completion', () => {
    it('calls onComplete when Get Started is clicked on last step', async () => {
      render(<Onboarding onComplete={mockOnComplete} />)
      
      // Navigate to last step
      await goToStep(5)
      
      expect(screen.getByText('Get Started')).toBeInTheDocument()
      
      fireEvent.click(screen.getByText('Get Started'))
      
      expect(mockOnComplete).toHaveBeenCalled()
    })

    it('sets localStorage when completing onboarding', async () => {
      render(<Onboarding onComplete={mockOnComplete} />)
      
      // Navigate to last step
      await goToStep(5)
      
      fireEvent.click(screen.getByText('Get Started'))
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('visioncheck-onboarded', 'true')
    })
  })

  describe('Step content', () => {
    it('displays Visual Acuity step correctly', async () => {
      render(<Onboarding onComplete={mockOnComplete} />)
      
      await goToStep(1)
      
      expect(screen.getByText('Visual Acuity Test')).toBeInTheDocument()
      expect(screen.getByText('Test how clearly you can see at different sizes using the Tumbling E chart.')).toBeInTheDocument()
      expect(screen.getByText('📖')).toBeInTheDocument()
    })

    it('displays Color Vision step correctly', async () => {
      render(<Onboarding onComplete={mockOnComplete} />)
      
      await goToStep(2)
      
      expect(screen.getByText('Color Vision Test')).toBeInTheDocument()
      expect(screen.getByText('Screen for color blindness using Ishihara-style plates.')).toBeInTheDocument()
      expect(screen.getByText('🎨')).toBeInTheDocument()
    })

    it('displays Contrast Sensitivity step correctly', async () => {
      render(<Onboarding onComplete={mockOnComplete} />)
      
      await goToStep(3)
      
      expect(screen.getByText('Contrast Sensitivity')).toBeInTheDocument()
      expect(screen.getByText('Test your ability to distinguish faint letters from their background.')).toBeInTheDocument()
      expect(screen.getByText('🔆')).toBeInTheDocument()
    })

    it('displays Amsler Grid step correctly', async () => {
      render(<Onboarding onComplete={mockOnComplete} />)
      
      await goToStep(4)
      
      expect(screen.getByText('Amsler Grid Test')).toBeInTheDocument()
      expect(screen.getByText('Screen for macular degeneration by checking for visual distortions.')).toBeInTheDocument()
      expect(screen.getByText('#')).toBeInTheDocument()
    })

    it('displays Disclaimer step correctly', async () => {
      render(<Onboarding onComplete={mockOnComplete} />)
      
      await goToStep(5)
      
      expect(screen.getByText('Important Note')).toBeInTheDocument()
      expect(screen.getByText('This app is for screening only—not a medical diagnosis. Always consult an eye care professional.')).toBeInTheDocument()
      expect(screen.getByText('⚠️')).toBeInTheDocument()
    })
  })

  describe('Animations', () => {
    it('renders Tumbling E animation on Visual Acuity step', async () => {
      render(<Onboarding onComplete={mockOnComplete} />)
      
      await goToStep(1)
      
      // The Tumbling E animation renders an "E"
      const animatedElements = screen.getAllByText('E')
      expect(animatedElements.length).toBeGreaterThan(0)
    })

    it('renders color dots animation on Color Vision step', async () => {
      const { container } = render(<Onboarding onComplete={mockOnComplete} />)
      
      await goToStep(2)
      
      // Color dots are rendered as colored circles with animate-pulse
      const colorDots = container.querySelectorAll('.rounded-full.animate-pulse')
      expect(colorDots.length).toBeGreaterThanOrEqual(4)
    })

    it('renders contrast letters animation on Contrast Sensitivity step', async () => {
      render(<Onboarding onComplete={mockOnComplete} />)
      
      await goToStep(3)
      
      expect(screen.getByText('H')).toBeInTheDocument()
      expect(screen.getByText('K')).toBeInTheDocument()
      expect(screen.getByText('D')).toBeInTheDocument()
    })

    it('renders Amsler grid animation on Amsler Grid step', async () => {
      const { container } = render(<Onboarding onComplete={mockOnComplete} />)
      
      await goToStep(4)
      
      // The Amsler grid animation has a bordered div with grid pattern
      const gridElement = container.querySelector('.border-2.border-white\\/80')
      expect(gridElement).toBeInTheDocument()
    })
  })

  describe('Visual styling', () => {
    it('applies gradient background based on step color', () => {
      const { container } = render(<Onboarding onComplete={mockOnComplete} />)
      
      const mainDiv = container.firstChild
      expect(mainDiv.className).toContain('from-sky-400')
      expect(mainDiv.className).toContain('to-sky-600')
    })

    it('changes background color for emerald step (Color Vision)', async () => {
      const { container } = render(<Onboarding onComplete={mockOnComplete} />)
      
      await goToStep(2)
      
      const mainDiv = container.firstChild
      expect(mainDiv.className).toContain('from-emerald-400')
      expect(mainDiv.className).toContain('to-emerald-600')
    })

    it('changes background color for amber step (Contrast Sensitivity)', async () => {
      const { container } = render(<Onboarding onComplete={mockOnComplete} />)
      
      await goToStep(3)
      
      const mainDiv = container.firstChild
      expect(mainDiv.className).toContain('from-amber-400')
      expect(mainDiv.className).toContain('to-amber-600')
    })

    it('changes background color for purple step (Amsler Grid)', async () => {
      const { container } = render(<Onboarding onComplete={mockOnComplete} />)
      
      await goToStep(4)
      
      const mainDiv = container.firstChild
      expect(mainDiv.className).toContain('from-purple-400')
      expect(mainDiv.className).toContain('to-purple-600')
    })
  })
})
