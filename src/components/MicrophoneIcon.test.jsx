import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MicrophoneIcon from './MicrophoneIcon'

describe('MicrophoneIcon', () => {
  describe('filled variant', () => {
    it('should render filled icon by default', () => {
      render(<MicrophoneIcon className="w-5 h-5" />)
      
      const svg = document.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('fill', 'currentColor')
      expect(svg).not.toHaveAttribute('stroke')
    })

    it('should render filled icon when filled prop is true', () => {
      render(<MicrophoneIcon className="w-5 h-5" filled={true} />)
      
      const svg = document.querySelector('svg')
      expect(svg).toHaveAttribute('fill', 'currentColor')
    })

    it('should apply className to filled variant', () => {
      render(<MicrophoneIcon className="w-6 h-6 text-blue-500" filled />)
      
      const svg = document.querySelector('svg')
      expect(svg).toHaveClass('w-6', 'h-6', 'text-blue-500')
    })
  })

  describe('outline variant', () => {
    it('should render outline icon when filled is false', () => {
      render(<MicrophoneIcon className="w-5 h-5" filled={false} />)
      
      const svg = document.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('fill', 'none')
      expect(svg).toHaveAttribute('stroke', 'currentColor')
    })

    it('should apply className to outline variant', () => {
      render(<MicrophoneIcon className="w-6 h-6 text-gray-500" filled={false} />)
      
      const svg = document.querySelector('svg')
      expect(svg).toHaveClass('w-6', 'h-6', 'text-gray-500')
    })
  })

  describe('accessibility', () => {
    it('should have proper viewBox for consistent sizing', () => {
      const { rerender } = render(<MicrophoneIcon filled />)
      
      let svg = document.querySelector('svg')
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24')

      rerender(<MicrophoneIcon filled={false} />)
      
      svg = document.querySelector('svg')
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
    })
  })
})
