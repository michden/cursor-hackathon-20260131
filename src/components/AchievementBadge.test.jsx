import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AchievementBadge, { ACHIEVEMENTS } from './AchievementBadge'

describe('AchievementBadge', () => {
  describe('ACHIEVEMENTS constant', () => {
    it('exports all achievement definitions', () => {
      expect(ACHIEVEMENTS).toHaveProperty('first-test')
      expect(ACHIEVEMENTS).toHaveProperty('perfect-acuity')
      expect(ACHIEVEMENTS).toHaveProperty('all-tests')
      expect(ACHIEVEMENTS).toHaveProperty('color-perfect')
      expect(ACHIEVEMENTS).toHaveProperty('streak-3')
    })

    it('each achievement has icon, title, and description', () => {
      Object.values(ACHIEVEMENTS).forEach(achievement => {
        expect(achievement).toHaveProperty('icon')
        expect(achievement).toHaveProperty('title')
        expect(achievement).toHaveProperty('description')
      })
    })
  })

  describe('AchievementBadge component', () => {
    it('renders nothing for invalid achievement id', () => {
      const { container } = render(<AchievementBadge achievementId="invalid" />)
      
      expect(container.firstChild).toBeNull()
    })

    it('renders first-test achievement', () => {
      render(<AchievementBadge achievementId="first-test" />)
      
      expect(screen.getByText('First Steps')).toBeInTheDocument()
      expect(screen.getByText('Completed your first eye test')).toBeInTheDocument()
      expect(screen.getByText('🎯')).toBeInTheDocument()
    })

    it('renders perfect-acuity achievement (Eagle Eye)', () => {
      render(<AchievementBadge achievementId="perfect-acuity" />)
      
      expect(screen.getByText('Eagle Eye')).toBeInTheDocument()
      expect(screen.getByText('Achieved 20/20 vision or better')).toBeInTheDocument()
      expect(screen.getByText('🦅')).toBeInTheDocument()
    })

    it('renders all-tests achievement', () => {
      render(<AchievementBadge achievementId="all-tests" />)
      
      expect(screen.getByText('Complete Checkup')).toBeInTheDocument()
      expect(screen.getByText('Completed all six screening tests')).toBeInTheDocument()
      expect(screen.getByText('🏆')).toBeInTheDocument()
    })

    it('renders color-perfect achievement', () => {
      render(<AchievementBadge achievementId="color-perfect" />)
      
      expect(screen.getByText('Color Master')).toBeInTheDocument()
      expect(screen.getByText('Perfect score on color vision test')).toBeInTheDocument()
      expect(screen.getByText('🌈')).toBeInTheDocument()
    })

    it('renders streak-3 achievement', () => {
      render(<AchievementBadge achievementId="streak-3" />)
      
      expect(screen.getByText('On a Roll')).toBeInTheDocument()
      expect(screen.getByText('Tested 3 days in a row')).toBeInTheDocument()
      expect(screen.getByText('🔥')).toBeInTheDocument()
    })

    it('shows NEW indicator when isNew is true', () => {
      render(<AchievementBadge achievementId="first-test" isNew />)
      
      expect(screen.getByText('NEW')).toBeInTheDocument()
    })

    it('does not show NEW indicator when isNew is false', () => {
      render(<AchievementBadge achievementId="first-test" isNew={false} />)
      
      expect(screen.queryByText('NEW')).not.toBeInTheDocument()
    })

    it('applies amber styling when isNew is true', () => {
      const { container } = render(<AchievementBadge achievementId="first-test" isNew />)
      
      const badge = container.firstChild
      expect(badge.className).toContain('bg-amber-50')
      expect(badge.className).toContain('border-amber-200')
    })

    it('applies default styling when isNew is false', () => {
      const { container } = render(<AchievementBadge achievementId="first-test" isNew={false} />)
      
      const badge = container.firstChild
      expect(badge.className).toContain('bg-slate-50')
      expect(badge.className).toContain('border-slate-200')
    })
  })
})
