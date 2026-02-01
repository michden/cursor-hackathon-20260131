import { useTranslation } from 'react-i18next'

const ACHIEVEMENTS = {
  'first-test': {
    icon: '🎯',
    titleKey: 'results:achievements.firstTest.title',
    descriptionKey: 'results:achievements.firstTest.description'
  },
  'perfect-acuity': {
    icon: '🦅',
    titleKey: 'results:achievements.perfectAcuity.title',
    descriptionKey: 'results:achievements.perfectAcuity.description'
  },
  'all-tests': {
    icon: '🏆',
    titleKey: 'results:achievements.allTests.title',
    descriptionKey: 'results:achievements.allTests.description'
  },
  'color-perfect': {
    icon: '🌈',
    titleKey: 'results:achievements.colorPerfect.title',
    descriptionKey: 'results:achievements.colorPerfect.description'
  },
  'streak-3': {
    icon: '🔥',
    titleKey: 'results:achievements.streak3.title',
    descriptionKey: 'results:achievements.streak3.description'
  }
}

export { ACHIEVEMENTS }

export default function AchievementBadge({ achievementId, isNew = false }) {
  const { t } = useTranslation(['results', 'common'])
  const achievement = ACHIEVEMENTS[achievementId]
  if (!achievement) return null

  return (
    <div className={`
      flex items-center gap-3 p-3 rounded-xl border
      ${isNew 
        ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 animate-pulse' 
        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}
    `}>
      <div className="text-3xl">{achievement.icon}</div>
      <div>
        <div className="font-semibold text-slate-800 dark:text-slate-100">{t(achievement.titleKey)}</div>
        <div className="text-sm text-slate-500 dark:text-slate-400">{t(achievement.descriptionKey)}</div>
      </div>
      {isNew && (
        <div className="ml-auto text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-1 rounded-full">
          {t('common:status.new')}
        </div>
      )}
    </div>
  )
}
