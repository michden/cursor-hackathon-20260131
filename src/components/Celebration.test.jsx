import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import Celebration, { triggerConfetti, triggerFireworks } from './Celebration'

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn()
}))

import confetti from 'canvas-confetti'

describe('Celebration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('triggerConfetti', () => {
    it('calls confetti with default options', () => {
      triggerConfetti()
      
      expect(confetti).toHaveBeenCalledWith(expect.objectContaining({
        particleCount: 80,
        spread: 60,
        origin: { x: 0.5, y: 0.6 }
      }))
    })

    it('merges custom options', () => {
      triggerConfetti({ spread: 90 })
      
      expect(confetti).toHaveBeenCalledWith(expect.objectContaining({
        spread: 90,
        particleCount: 80
      }))
    })

    it('uses theme colors', () => {
      triggerConfetti()
      
      expect(confetti).toHaveBeenCalledWith(expect.objectContaining({
        colors: ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444']
      }))
    })
  })

  describe('triggerFireworks', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('calls confetti multiple times', () => {
      triggerFireworks()
      
      // First frame should fire immediately
      expect(confetti).toHaveBeenCalled()
    })

    it('fires from both sides', () => {
      triggerFireworks()
      
      // Check for left side (origin.x = 0)
      expect(confetti).toHaveBeenCalledWith(expect.objectContaining({
        origin: { x: 0 },
        angle: 60
      }))
      
      // Check for right side (origin.x = 1)
      expect(confetti).toHaveBeenCalledWith(expect.objectContaining({
        origin: { x: 1 },
        angle: 120
      }))
    })
  })

  describe('Celebration component', () => {
    it('triggers confetti on mount by default', () => {
      render(<Celebration />)
      
      expect(confetti).toHaveBeenCalled()
    })

    it('triggers confetti when type is "confetti"', () => {
      render(<Celebration type="confetti" />)
      
      expect(confetti).toHaveBeenCalledWith(expect.objectContaining({
        particleCount: 80
      }))
    })

    it('triggers fireworks when type is "fireworks"', () => {
      render(<Celebration type="fireworks" />)
      
      // Fireworks call confetti with particleCount: 3
      expect(confetti).toHaveBeenCalledWith(expect.objectContaining({
        particleCount: 3
      }))
    })

    it('renders null (no visible content)', () => {
      const { container } = render(<Celebration />)
      
      expect(container.firstChild).toBeNull()
    })
  })
})
