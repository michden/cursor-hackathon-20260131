import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function EyeSelector({ onSelect, completedEyes = {}, testName = 'Test' }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  const bothComplete = completedEyes.left && completedEyes.right

  const handleViewResults = () => {
    navigate('/results')
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 text-center mb-6">
        {t('eye.selectPrompt')}
      </h2>
      
      <div className="flex gap-4 mb-6">
        {/* Left Eye */}
        <button
          onClick={() => onSelect('left')}
          className={`
            flex-1 p-6 rounded-2xl border-2 transition-all
            ${completedEyes.left 
              ? 'border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50' 
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-sky-300 dark:hover:border-sky-600'
            }
          `}
        >
          <div className="text-4xl mb-2">👁️</div>
          <div className="font-semibold text-slate-800 dark:text-slate-100">{t('eye.left')}</div>
          {completedEyes.left && (
            <div className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
              ✓ {t('status.complete')}
            </div>
          )}
        </button>

        {/* Right Eye */}
        <button
          onClick={() => onSelect('right')}
          className={`
            flex-1 p-6 rounded-2xl border-2 transition-all
            ${completedEyes.right 
              ? 'border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50' 
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-sky-300 dark:hover:border-sky-600'
            }
          `}
        >
          <div className="text-4xl mb-2">👁️</div>
          <div className="font-semibold text-slate-800 dark:text-slate-100">{t('eye.right')}</div>
          {completedEyes.right && (
            <div className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
              ✓ {t('status.complete')}
            </div>
          )}
        </button>
      </div>

      {/* Cover instruction */}
      <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
        <p className="text-sm text-amber-800 dark:text-amber-200 text-center">
          <strong>Tip:</strong> {t('eye.coverTip')}
        </p>
      </div>

      {/* View Results button if both done */}
      {bothComplete && (
        <button
          onClick={handleViewResults}
          className="w-full py-4 bg-sky-500 text-white font-semibold rounded-xl hover:bg-sky-600 transition-colors"
        >
          {t('actions.viewResults')} →
        </button>
      )}
    </div>
  )
}
