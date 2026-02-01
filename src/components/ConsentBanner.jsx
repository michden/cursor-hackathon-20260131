import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useConsent } from '../context/ConsentContext'

/**
 * Consent banner component that appears on first visit.
 * Allows users to accept or decline data storage.
 * 
 * @returns {JSX.Element | null}
 */
export default function ConsentBanner() {
  const { t } = useTranslation('legal')
  const { hasConsented, giveConsent, denyConsent } = useConsent()

  // Don't show if user has already made a choice
  if (hasConsented) {
    return null
  }

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 shadow-lg"
      role="dialog"
      aria-labelledby="consent-title"
      aria-describedby="consent-description"
    >
      <div className="max-w-2xl mx-auto">
        <h2 id="consent-title" className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
          {t('consent.title')}
        </h2>
        <p id="consent-description" className="text-sm text-slate-600 dark:text-slate-300 mb-4">
          {t('consent.description')}
        </p>
        
        <ul className="text-sm text-slate-500 dark:text-slate-400 mb-4 space-y-1">
          <li>• {t('consent.dataStored.results')}</li>
          <li>• {t('consent.dataStored.preferences')}</li>
          <li>• {t('consent.dataStored.history')}</li>
        </ul>

        <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
          {t('consent.note')}{' '}
          <Link to="/privacy" className="text-sky-500 hover:text-sky-600 underline">
            {t('consent.privacyLink')}
          </Link>
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={giveConsent}
            className="flex-1 py-3 px-6 bg-sky-500 text-white font-semibold rounded-xl hover:bg-sky-600 transition-colors"
          >
            {t('consent.accept')}
          </button>
          <button
            onClick={denyConsent}
            className="flex-1 py-3 px-6 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {t('consent.decline')}
          </button>
        </div>
      </div>
    </div>
  )
}
