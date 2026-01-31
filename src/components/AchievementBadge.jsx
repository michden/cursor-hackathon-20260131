const ACHIEVEMENTS = {
  'first-test': {
    icon: '🎯',
    title: 'First Steps',
    description: 'Completed your first eye test'
  },
  'perfect-acuity': {
    icon: '🦅',
    title: 'Eagle Eye',
    description: 'Achieved 20/20 vision or better'
  },
  'all-tests': {
    icon: '🏆',
    title: 'Complete Checkup',
    description: 'Completed all four tests'
  },
  'color-perfect': {
    icon: '🌈',
    title: 'Color Master',
    description: 'Perfect score on color vision test'
  },
  'streak-3': {
    icon: '🔥',
    title: 'On a Roll',
    description: 'Tested 3 days in a row'
  }
}

export { ACHIEVEMENTS }

export default function AchievementBadge({ achievementId, isNew = false }) {
  const achievement = ACHIEVEMENTS[achievementId]
  if (!achievement) return null

  return (
    <div className={`
      flex items-center gap-3 p-3 rounded-xl border
      ${isNew ? 'bg-amber-50 border-amber-200 animate-pulse' : 'bg-slate-50 border-slate-200'}
    `}>
      <div className="text-3xl">{achievement.icon}</div>
      <div>
        <div className="font-semibold text-slate-800">{achievement.title}</div>
        <div className="text-sm text-slate-500">{achievement.description}</div>
      </div>
      {isNew && (
        <div className="ml-auto text-xs font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
          NEW
        </div>
      )}
    </div>
  )
}
