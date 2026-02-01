import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import AchievementBadge, { ACHIEVEMENTS } from './AchievementBadge'
import i18n from '../i18n'

// Wrapper to provide i18n context
const renderWithProvider = (ui) => {
  i18n.changeLanguage('en')
  return render(
    <I18nextProvider i18n={i18n}>
      {ui}
    </I18nextProvider>
  )
}

describe('AchievementBadge', () => {
  beforeEach(() => {
    i18n.changeLanguage('en')
  })

  describe('ACHIEVEMENTS constant', () => {
    it('exports all achievement definitions', () => {
      expect(ACHIEVEMENTS).toHaveProperty('first-test')
      expect(ACHIEVEMENTS).toHaveProperty('perfect-acuity')
      expect(ACHIEVEMENTS).toHaveProperty('all-tests')
      expect(ACHIEVEMENTS).toHaveProperty('color-perfect')
      expect(ACHIEVEMENTS).toHaveProperty('streak-3')
    })

    it('each achievement has icon, titleKey, and descriptionKey', () => {
      Object.values(ACHIEVEMENTS).forEach(achievement => {
        expect(achievement).toHaveProperty('icon')
        expect(achievement).toHaveProperty('titleKey')
        expect(achievement).toHaveProperty('descriptionKey')
      })
    })
  })

  describe('AchievementBadge component', () => {
    it('renders nothing for invalid achievement id', () => {
      const { container } = renderWithProvider(<AchievementBadge achievementId="invalid" />)
      
      expect(container.firstChild).toBeNull()
    })

    it('renders first-test achievement', () => {
      renderWithProvider(<AchievementBadge achievementId="first-test" />)
      
      expect(screen.getByText('First Test')).toBeInTheDocument()
      expect(screen.getByText('Completed your first eye test')).toBeInTheDocument()
      expect(screen.getByText('🎯')).toBeInTheDocument()
    })

    it('renders perfect-acuity achievement (Eagle Eye)', () => {
      renderWithProvider(<AchievementBadge achievementId="perfect-acuity" />)
      
      expect(screen.getByText('Eagle Eye')).toBeInTheDocument()
      expect(screen.getByText('Achieved 20/20 vision or better')).toBeInTheDocument()
      expect(screen.getByText('🦅')).toBeInTheDocument()
    })

    it('renders all-tests achievement', () => {
      renderWithProvider(<AchievementBadge achievementId="all-tests" />)
      
      expect(screen.getByText('Thorough Checker')).toBeInTheDocument()
      expect(screen.getByText('Completed all available tests')).toBeInTheDocument()
      expect(screen.getByText('🏆')).toBeInTheDocument()
    })

    it('renders color-perfect achievement', () => {
      renderWithProvider(<AchievementBadge achievementId="color-perfect" />)
      
      expect(screen.getByText('Color Master')).toBeInTheDocument()
      expect(screen.getByText('Perfect score on color vision test')).toBeInTheDocument()
      expect(screen.getByText('🌈')).toBeInTheDocument()
    })

    it('renders streak-3 achievement', () => {
      renderWithProvider(<AchievementBadge achievementId="streak-3" />)
      
      expect(screen.getByText('Consistent')).toBeInTheDocument()
      expect(screen.getByText('Tested 3 days in a row')).toBeInTheDocument()
      expect(screen.getByText('🔥')).toBeInTheDocument()
    })

    it('shows NEW indicator when isNew is true', () => {
      renderWithProvider(<AchievementBadge achievementId="first-test" isNew />)
      
      expect(screen.getByText('NEW')).toBeInTheDocument()
    })

    it('does not show NEW indicator when isNew is false', () => {
      renderWithProvider(<AchievementBadge achievementId="first-test" isNew={false} />)
      
      expect(screen.queryByText('NEW')).not.toBeInTheDocument()
    })

    it('applies amber styling when isNew is true', () => {
      const { container } = renderWithProvider(<AchievementBadge achievementId="first-test" isNew />)
      
      const badge = container.firstChild
      expect(badge.className).toContain('bg-amber-50')
      expect(badge.className).toContain('border-amber-200')
    })

    it('applies default styling when isNew is false', () => {
      const { container } = renderWithProvider(<AchievementBadge achievementId="first-test" isNew={false} />)
      
      const badge = container.firstChild
      expect(badge.className).toContain('bg-slate-50')
      expect(badge.className).toContain('border-slate-200')
    })
  })
})
